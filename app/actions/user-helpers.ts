"use server";

import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";

// Check if user has admin role
export async function checkAdminAccess() {
	const session = await getServerSession();

	// If no session or user is not an admin, redirect to dashboard
	if (!session || session.user.role !== "admin") {
		redirect("/dashboard");
	}
}
