"use client";

import { useState } from "react";
import { signUp } from "@/lib/auth-client";

export default function EmailSignupForm() {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		name: "",
	});
	const [status, setStatus] = useState<{
		type: "success" | "error" | "idle";
		message: string;
	}>({
		type: "idle",
		message: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setStatus({ type: "idle", message: "" });

		try {
			const { error } = await signUp.email({
				email: formData.email,
				password: formData.password,
				name: formData.name,
			});

			if (error) {
				setStatus({
					type: "error",
					message: error.message || "Failed to sign up",
				});
			} else {
				setStatus({
					type: "success",
					message: "Account created successfully! You can now sign in.",
				});
				setFormData({
					email: "",
					password: "",
					name: "",
				});
			}
		} catch (error) {
			setStatus({
				type: "error",
				message: "An unexpected error occurred",
			});
			console.error("Error signing up:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className='mt-4'>
			<form onSubmit={handleSubmit} className='space-y-4'>
				<div>
					<label
						htmlFor='signup-email'
						className='block text-sm font-medium mb-1'>
						Email *
					</label>
					<input
						type='email'
						id='signup-email'
						name='email'
						value={formData.email}
						onChange={handleChange}
						required
						className='w-full px-3 py-2 border rounded-md'
						placeholder='you@example.com'
					/>
				</div>

				<div>
					<label
						htmlFor='signup-name'
						className='block text-sm font-medium mb-1'>
						Name
					</label>
					<input
						type='text'
						id='signup-name'
						name='name'
						value={formData.name}
						onChange={handleChange}
						className='w-full px-3 py-2 border rounded-md'
						placeholder='John Doe'
					/>
				</div>

				<div>
					<label
						htmlFor='signup-password'
						className='block text-sm font-medium mb-1'>
						Password *
					</label>
					<input
						type='password'
						id='signup-password'
						name='password'
						value={formData.password}
						onChange={handleChange}
						required
						minLength={8}
						className='w-full px-3 py-2 border rounded-md'
						placeholder='••••••••'
					/>
					<p className='text-xs text-gray-500 mt-1'>
						Password must be at least 8 characters
					</p>
				</div>

				<button
					type='submit'
					disabled={isSubmitting || !formData.email || !formData.password}
					className='w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300'>
					{isSubmitting ? "Creating Account..." : "Sign Up"}
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
