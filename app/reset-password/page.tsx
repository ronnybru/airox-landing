"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { H1, Paragraph } from "@/components/ui/typography";

// Component that uses useSearchParams
function ResetPasswordForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [status, setStatus] = useState<{
		type: "success" | "error" | "idle";
		message: string;
	}>({
		type: "idle",
		message: "",
	});

	useEffect(() => {
		if (!token) {
			setStatus({
				type: "error",
				message:
					"Invalid or missing reset token. Please request a new password reset link.",
			});
		}
	}, [token]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (newPassword !== confirmPassword) {
			setStatus({
				type: "error",
				message: "Passwords do not match",
			});
			return;
		}

		if (!token) {
			setStatus({
				type: "error",
				message: "Invalid or missing reset token",
			});
			return;
		}

		setIsSubmitting(true);
		setStatus({ type: "idle", message: "" });

		try {
			const { error } = await authClient.resetPassword({
				newPassword,
				token,
			});

			if (error) {
				setStatus({
					type: "error",
					message: error.message || "Failed to reset password",
				});
			} else {
				setStatus({
					type: "success",
					message:
						"Password reset successfully! You can now sign in with your new password.",
				});

				// Redirect to home page after 3 seconds
				setTimeout(() => {
					router.push("/");
				}, 3000);
			}
		} catch (error) {
			setStatus({
				type: "error",
				message: "An unexpected error occurred",
			});
			console.error("Error resetting password:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			{status.type === "error" ? (
				<div className='p-4 bg-red-50 text-red-700 rounded-md mb-4'>
					{status.message}
				</div>
			) : status.type === "success" ? (
				<div className='p-4 bg-green-50 text-green-700 rounded-md mb-4'>
					{status.message}
				</div>
			) : null}

			{!token ? (
				<Paragraph className='text-center'>
					Please request a new password reset link from the sign-in page.
				</Paragraph>
			) : (
				<form onSubmit={handleSubmit} className='space-y-4'>
					<div>
						<label
							htmlFor='new-password'
							className='block text-sm font-medium mb-1'>
							New Password
						</label>
						<input
							type='password'
							id='new-password'
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							required
							minLength={8}
							className='w-full px-3 py-2 border rounded-md'
							placeholder='••••••••'
						/>
						<p className='text-xs text-gray-500 mt-1'>
							Password must be at least 8 characters
						</p>
					</div>

					<div>
						<label
							htmlFor='confirm-password'
							className='block text-sm font-medium mb-1'>
							Confirm Password
						</label>
						<input
							type='password'
							id='confirm-password'
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
							className='w-full px-3 py-2 border rounded-md'
							placeholder='••••••••'
						/>
					</div>

					<button
						type='submit'
						disabled={isSubmitting || !newPassword || !confirmPassword}
						className='w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300'>
						{isSubmitting ? "Resetting..." : "Reset Password"}
					</button>
				</form>
			)}
		</>
	);
}

// Loading fallback component
function ResetPasswordLoading() {
	return (
		<div className='p-4 text-center'>
			<p>Loading reset password form...</p>
		</div>
	);
}

export default function ResetPasswordPage() {
	return (
		<div className='container mx-auto py-10 px-4 max-w-md'>
			<H1 className='text-center mb-6'>Reset Your Password</H1>

			<Suspense fallback={<ResetPasswordLoading />}>
				<ResetPasswordForm />
			</Suspense>
		</div>
	);
}
