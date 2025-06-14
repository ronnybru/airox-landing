"use server";

import { auth } from "@/lib/auth";
import { requireServerSession } from "@/lib/session";
import { headers } from "next/headers";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { account } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

// Schema for profile update
const profileUpdateSchema = z.object({
	name: z.string().min(1, "Name is required"),
	image: z
		.union([
			z.string().url("Invalid image URL"),
			z.string().max(0), // Empty string
			z.null(),
		])
		.optional(),
});

// Schema for email change
const emailChangeSchema = z.object({
	newEmail: z.string().email("Invalid email address"),
	callbackURL: z.string().optional(),
});

// Schema for password change
const passwordChangeSchema = z.object({
	currentPassword: z.string().min(1, "Current password is required"),
	newPassword: z.string().min(8, "Password must be at least 8 characters"),
	revokeOtherSessions: z.boolean().optional(),
});

// Schema for account deletion
const deleteAccountSchema = z.object({
	password: z.string().optional(),
	callbackURL: z.string().optional(),
});

// No social provider types or account linking schemas needed anymore

/**
 * Check if a user has a credential account (password set)
 * This is used to determine whether to show the password section in settings
 */
export async function checkUserHasCredentialAccount() {
	try {
		// Get the current user session
		const session = await requireServerSession();

		// Query the database to check if the user has a credential account
		const userAccount = await db.query.account.findFirst({
			where: and(
				eq(account.userId, session.user.id),
				eq(account.providerId, "credential")
			),
		});

		// Return true if the user has a credential account
		return { hasCredentialAccount: !!userAccount };
	} catch (error) {
		console.error("Error checking user credential account:", error);
		return { hasCredentialAccount: false };
	}
}

/**
 * Update user profile information
 */
export async function updateUserProfile(formData: FormData) {
	// Ensure user is authenticated
	await requireServerSession();

	// Parse and validate form data
	const name = formData.get("name") as string;
	const image = formData.get("image") as string;

	try {
		// Validate input
		const validatedData = profileUpdateSchema.parse({ name, image });

		// Transform null to undefined for auth API compatibility
		const transformedData = {
			name: validatedData.name,
			image: validatedData.image === null ? undefined : validatedData.image,
		};

		// Update user profile
		const headersList = await headers();
		await auth.api.updateUser({
			headers: Object.fromEntries(headersList.entries()),
			body: transformedData,
		});

		// Revalidate the settings page
		revalidatePath("/settings");

		return { success: true };
	} catch (error) {
		console.error("Error updating user profile:", error);
		return {
			success: false,
			error:
				error instanceof z.ZodError
					? error.errors.map((e) => e.message).join(", ")
					: "Failed to update profile",
		};
	}
}

/**
 * Change user email
 */
export async function changeUserEmail(formData: FormData) {
	// Ensure user is authenticated
	await requireServerSession();

	// Parse and validate form data
	const newEmail = formData.get("newEmail") as string;
	const callbackURL = (formData.get("callbackURL") as string) || "/settings";

	try {
		// Validate input
		const validatedData = emailChangeSchema.parse({ newEmail, callbackURL });

		// Change email
		const headersList = await headers();
		await auth.api.changeEmail({
			headers: Object.fromEntries(headersList.entries()),
			body: validatedData,
		});

		// Revalidate the settings page
		revalidatePath("/settings");

		return {
			success: true,
			message: "Verification email sent. Please check your inbox.",
		};
	} catch (error) {
		console.error("Error changing email:", error);
		return {
			success: false,
			error:
				error instanceof z.ZodError
					? error.errors.map((e) => e.message).join(", ")
					: "Failed to change email",
		};
	}
}

/**
 * Change user password
 */
export async function changeUserPassword(formData: FormData) {
	// Ensure user is authenticated
	await requireServerSession();

	// Parse and validate form data
	const currentPassword = formData.get("currentPassword") as string;
	const newPassword = formData.get("newPassword") as string;
	const revokeOtherSessions = formData.get("revokeOtherSessions") === "true";

	try {
		// Validate input
		const validatedData = passwordChangeSchema.parse({
			currentPassword,
			newPassword,
			revokeOtherSessions,
		});

		// Change password
		const headersList = await headers();
		await auth.api.changePassword({
			headers: Object.fromEntries(headersList.entries()),
			body: validatedData,
		});

		// Revalidate the settings page
		revalidatePath("/settings");

		return { success: true };
	} catch (error) {
		console.error("Error changing password:", error);
		return {
			success: false,
			error:
				error instanceof z.ZodError
					? error.errors.map((e) => e.message).join(", ")
					: "Failed to change password",
		};
	}
}

// setUserPassword function removed as it's no longer needed

/**
 * Delete user account
 */
export async function deleteUserAccount(formData: FormData) {
	// Ensure user is authenticated
	await requireServerSession();

	// Parse and validate form data
	const password = formData.get("password") as string;
	const callbackURL = (formData.get("callbackURL") as string) || "/";

	try {
		// Validate input
		const validatedData = deleteAccountSchema.parse({
			password,
			callbackURL,
		});

		// Delete account
		const headersList = await headers();
		await auth.api.deleteUser({
			headers: Object.fromEntries(headersList.entries()),
			body: validatedData,
		});

		return { success: true, redirect: callbackURL };
	} catch (error) {
		console.error("Error deleting account:", error);
		return {
			success: false,
			error: "Failed to delete account",
		};
	}
}

// Account linking functions removed as they're no longer needed
