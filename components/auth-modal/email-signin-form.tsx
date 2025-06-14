"use client";

import { useState } from "react";
import { signIn, authClient } from "@/lib/auth-client";

export default function EmailSigninForm() {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [status, setStatus] = useState<{
		type: "success" | "error" | "idle";
		message: string;
	}>({
		type: "idle",
		message: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showForgotPassword, setShowForgotPassword] = useState(false);
	const [resetEmail, setResetEmail] = useState("");
	const [resetStatus, setResetStatus] = useState<{
		type: "success" | "error" | "idle";
		message: string;
	}>({
		type: "idle",
		message: "",
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setStatus({ type: "idle", message: "" });

		try {
			const { error } = await signIn.email({
				email: formData.email,
				password: formData.password,
			});

			if (error) {
				setStatus({
					type: "error",
					message: error.message || "Failed to sign in",
				});
			} else {
				setStatus({
					type: "success",
					message: "Signed in successfully!",
				});
				// Refresh the page to update the UI
				window.location.reload();
			}
		} catch (error) {
			setStatus({
				type: "error",
				message: "An unexpected error occurred",
			});
			console.error("Error signing in:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleForgotPassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setResetStatus({ type: "idle", message: "" });

		try {
			// Using the authClient directly for forget password
			const { error } = await authClient.forgetPassword({
				email: resetEmail,
				redirectTo: window.location.origin + "/reset-password",
			});

			if (error) {
				setResetStatus({
					type: "error",
					message: error.message || "Failed to send reset email",
				});
			} else {
				setResetStatus({
					type: "success",
					message: "Password reset instructions sent to your email",
				});
				setResetEmail("");
			}
		} catch (error) {
			setResetStatus({
				type: "error",
				message: "An unexpected error occurred",
			});
			console.error("Error sending reset email:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (showForgotPassword) {
		return (
			<div className='mt-4'>
				<h3 className='text-lg font-medium mb-2'>Reset Password</h3>
				<form onSubmit={handleForgotPassword} className='space-y-4'>
					<div>
						<label
							htmlFor='reset-email'
							className='block text-sm font-medium mb-1'>
							Email
						</label>
						<input
							type='email'
							id='reset-email'
							value={resetEmail}
							onChange={(e) => setResetEmail(e.target.value)}
							required
							className='w-full px-3 py-2 border rounded-md'
							placeholder='you@example.com'
						/>
					</div>

					<div className='flex space-x-2'>
						<button
							type='submit'
							disabled={isSubmitting || !resetEmail}
							className='flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300'>
							{isSubmitting ? "Sending..." : "Send Reset Link"}
						</button>
						<button
							type='button'
							onClick={() => setShowForgotPassword(false)}
							className='py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300'>
							Back to Sign In
						</button>
					</div>
				</form>

				{resetStatus.message && (
					<div
						className={`mt-4 p-3 rounded-md ${
							resetStatus.type === "success"
								? "bg-green-50 text-green-700"
								: "bg-red-50 text-red-700"
						}`}>
						{resetStatus.message}
					</div>
				)}
			</div>
		);
	}

	return (
		<div className='mt-4'>
			<form onSubmit={handleSubmit} className='space-y-4'>
				<div>
					<label
						htmlFor='signin-email'
						className='block text-sm font-medium mb-1'>
						Email
					</label>
					<input
						type='email'
						id='signin-email'
						name='email'
						value={formData.email}
						onChange={handleChange}
						required
						className='w-full px-3 py-2 border rounded-md'
						placeholder='you@example.com'
					/>
				</div>

				<div>
					<div className='flex justify-between items-center'>
						<label
							htmlFor='signin-password'
							className='block text-sm font-medium mb-1'>
							Password
						</label>
						<button
							type='button'
							onClick={() => setShowForgotPassword(true)}
							className='text-xs text-blue-600 hover:text-blue-800'>
							Forgot password?
						</button>
					</div>
					<input
						type='password'
						id='signin-password'
						name='password'
						value={formData.password}
						onChange={handleChange}
						required
						className='w-full px-3 py-2 border rounded-md'
						placeholder='••••••••'
					/>
				</div>

				<button
					type='submit'
					disabled={isSubmitting || !formData.email || !formData.password}
					className='w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300'>
					{isSubmitting ? "Signing in..." : "Sign In"}
				</button>
			</form>

			{status.message && (
				<div
					className={`mt-4 p-3 rounded-md ${
						status.type === "success"
							? "bg-green-50 text-green-700"
							: "bg-red-50 text-red-700"
					}`}>
					{status.message}
				</div>
			)}
		</div>
	);
}
