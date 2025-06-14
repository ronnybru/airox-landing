"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { signIn, authClient, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { processInvitation } from "@/app/actions/process-invitation";
import { Loader2 } from "lucide-react";

export default function InvitationAuthModal({
	isOpen,
	onClose,
	invitationId,
	organizationName,
}: {
	isOpen: boolean;
	onClose: () => void;
	invitationId: string;
	organizationName: string;
}) {
	const router = useRouter();
	const { data: session } = useSession();
	const [authMode, setAuthMode] = useState<
		"signin" | "signup" | "google" | "forgot"
	>("signin");
	const [isLoading, setIsLoading] = useState(false);
	const [isProcessingInvitation, setIsProcessingInvitation] = useState(false);
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

	// Process invitation after successful authentication
	const handleProcessInvitation = async () => {
		if (!session) return;

		setIsProcessingInvitation(true);
		setStatus({
			type: "idle",
			message: "Processing invitation...",
		});

		try {
			console.log(`Processing invitation ${invitationId} after authentication`);
			const result = await processInvitation(invitationId);

			if (result.success) {
				setStatus({
					type: "success",
					message: `Successfully joined ${organizationName}! Redirecting to dashboard...`,
				});

				// Redirect to dashboard after a short delay
				setTimeout(() => {
					router.push("/dashboard");
				}, 2000);
			} else {
				setStatus({
					type: "error",
					message: result.message || "Failed to process invitation",
				});
			}
		} catch (error) {
			console.error("Error processing invitation:", error);
			setStatus({
				type: "error",
				message: "An unexpected error occurred while processing the invitation",
			});
		} finally {
			setIsProcessingInvitation(false);
		}
	};

	// If user is already signed in, process the invitation
	if (session && !isProcessingInvitation) {
		handleProcessInvitation();
		return (
			<Modal isOpen={isOpen} onClose={onClose} title='Processing Invitation'>
				<div className='flex flex-col items-center justify-center py-8'>
					<Loader2 className='h-12 w-12 animate-spin text-primary mb-4' />
					<p className='text-center'>Processing your invitation...</p>
				</div>
			</Modal>
		);
	}

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSignIn = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
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
				// The session will be updated and the component will re-render,
				// triggering the invitation processing
			}
		} catch (error) {
			setStatus({
				type: "error",
				message: "An unexpected error occurred",
			});
			console.error("Error signing in:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setStatus({ type: "idle", message: "" });

		try {
			const { error } = await authClient.signUp.email({
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
					message: "Signed up successfully!",
				});
				// The session will be updated and the component will re-render,
				// triggering the invitation processing
			}
		} catch (error) {
			setStatus({
				type: "error",
				message: "An unexpected error occurred",
			});
			console.error("Error signing up:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleSignIn = async () => {
		setIsLoading(true);
		try {
			// For Google sign-in, we need to use a special callback URL that will
			// redirect back to the invitation acceptance page
			await signIn.social({
				provider: "google",
				callbackURL: `/accept-invitation/${invitationId}`,
			});
		} catch (error) {
			console.error("Error signing in with Google:", error);
			setIsLoading(false);
		}
	};

	const handleForgotPassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setStatus({ type: "idle", message: "" });

		try {
			const { error } = await authClient.forgetPassword({
				email: formData.email,
				redirectTo: window.location.origin + "/reset-password",
			});

			if (error) {
				setStatus({
					type: "error",
					message: error.message || "Failed to send reset email",
				});
			} else {
				setStatus({
					type: "success",
					message: "Password reset instructions sent to your email",
				});
			}
		} catch (error) {
			setStatus({
				type: "error",
				message: "An unexpected error occurred",
			});
			console.error("Error sending reset email:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={`Join ${organizationName}`}>
			<div className='mt-2'>
				<p className='text-center mb-4'>
					Sign in or create an account to accept the invitation to join{" "}
					{organizationName}
				</p>

				<div className='flex border-b mb-4'>
					<button
						onClick={() => {
							setAuthMode("signin");
							setStatus({ type: "idle", message: "" });
						}}
						className={`flex-1 py-2 text-center font-medium ${
							authMode === "signin"
								? "text-blue-600 border-b-2 border-blue-600"
								: "text-gray-500 hover:text-gray-700"
						}`}>
						Sign In
					</button>
					<button
						onClick={() => {
							setAuthMode("signup");
							setStatus({ type: "idle", message: "" });
						}}
						className={`flex-1 py-2 text-center font-medium ${
							authMode === "signup"
								? "text-blue-600 border-b-2 border-blue-600"
								: "text-gray-500 hover:text-gray-700"
						}`}>
						Sign Up
					</button>
					<button
						onClick={() => {
							setAuthMode("google");
							setStatus({ type: "idle", message: "" });
						}}
						className={`flex-1 py-2 text-center font-medium ${
							authMode === "google"
								? "text-blue-600 border-b-2 border-blue-600"
								: "text-gray-500 hover:text-gray-700"
						}`}>
						Google
					</button>
				</div>

				{authMode === "signin" && (
					<form onSubmit={handleSignIn} className='space-y-4'>
						<div>
							<label htmlFor='email' className='block text-sm font-medium mb-1'>
								Email
							</label>
							<input
								type='email'
								id='email'
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
									htmlFor='password'
									className='block text-sm font-medium mb-1'>
									Password
								</label>
								<button
									type='button'
									onClick={() => {
										setAuthMode("forgot");
										setStatus({ type: "idle", message: "" });
									}}
									className='text-xs text-blue-600 hover:text-blue-800'>
									Forgot password?
								</button>
							</div>
							<input
								type='password'
								id='password'
								name='password'
								value={formData.password}
								onChange={handleChange}
								required
								className='w-full px-3 py-2 border rounded-md'
								placeholder='••••••••'
							/>
						</div>

						<Button
							type='submit'
							disabled={isLoading || !formData.email || !formData.password}
							className='w-full'>
							{isLoading ? "Signing in..." : "Sign In"}
						</Button>
					</form>
				)}

				{authMode === "signup" && (
					<form onSubmit={handleSignUp} className='space-y-4'>
						<div>
							<label htmlFor='name' className='block text-sm font-medium mb-1'>
								Name
							</label>
							<input
								type='text'
								id='name'
								name='name'
								value={formData.name}
								onChange={handleChange}
								required
								className='w-full px-3 py-2 border rounded-md'
								placeholder='Your Name'
							/>
						</div>

						<div>
							<label htmlFor='email' className='block text-sm font-medium mb-1'>
								Email
							</label>
							<input
								type='email'
								id='email'
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
								htmlFor='password'
								className='block text-sm font-medium mb-1'>
								Password
							</label>
							<input
								type='password'
								id='password'
								name='password'
								value={formData.password}
								onChange={handleChange}
								required
								className='w-full px-3 py-2 border rounded-md'
								placeholder='••••••••'
							/>
						</div>

						<Button
							type='submit'
							disabled={
								isLoading ||
								!formData.name ||
								!formData.email ||
								!formData.password
							}
							className='w-full'>
							{isLoading ? "Signing up..." : "Sign Up"}
						</Button>
					</form>
				)}

				{authMode === "google" && (
					<div className='pt-2'>
						<Button
							onClick={handleGoogleSignIn}
							disabled={isLoading}
							variant='outline'
							className='w-full flex items-center justify-center'>
							<svg
								className='w-5 h-5 mr-2'
								viewBox='0 0 24 24'
								xmlns='http://www.w3.org/2000/svg'>
								<g transform='matrix(1, 0, 0, 1, 27.009001, -39.238998)'>
									<path
										fill='#4285F4'
										d='M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z'
									/>
									<path
										fill='#34A853'
										d='M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z'
									/>
									<path
										fill='#FBBC05'
										d='M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z'
									/>
									<path
										fill='#EA4335'
										d='M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z'
									/>
								</g>
							</svg>
							{isLoading ? "Signing in..." : "Sign in with Google"}
						</Button>
					</div>
				)}

				{authMode === "forgot" && (
					<form onSubmit={handleForgotPassword} className='space-y-4'>
						<div>
							<label htmlFor='email' className='block text-sm font-medium mb-1'>
								Email
							</label>
							<input
								type='email'
								id='email'
								name='email'
								value={formData.email}
								onChange={handleChange}
								required
								className='w-full px-3 py-2 border rounded-md'
								placeholder='you@example.com'
							/>
						</div>

						<Button
							type='submit'
							disabled={isLoading || !formData.email}
							className='w-full'>
							{isLoading ? "Sending..." : "Send Reset Link"}
						</Button>

						<Button
							type='button'
							variant='outline'
							onClick={() => {
								setAuthMode("signin");
								setStatus({ type: "idle", message: "" });
							}}
							className='w-full mt-2'>
							Back to Sign In
						</Button>
					</form>
				)}

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
		</Modal>
	);
}
