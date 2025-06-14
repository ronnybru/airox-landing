"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { signIn, authClient, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { H3, Muted } from "@/components/ui/typography";
import { LockIcon, MailIcon, UserIcon } from "lucide-react";

export default function AuthModal({
	isOpen,
	onClose,
}: {
	isOpen: boolean;
	onClose: () => void;
}) {
	const router = useRouter();
	const { data: session } = useSession();
	const [activeTab, setActiveTab] = useState<string>("signin");
	const [isLoading, setIsLoading] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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

	// Helper function to handle redirects
	const handleRedirect = () => {
		const urlParams = new URLSearchParams(window.location.search);
		const pendingInvitation = urlParams.get("pendingInvitation");
		const callbackUrl = urlParams.get("callbackUrl");

		if (pendingInvitation) {
			console.log(`Redirecting with pending invitation: ${pendingInvitation}`);
			// Add a small delay to ensure the session is fully established
			setTimeout(() => {
				router.push(`/?pendingInvitation=${pendingInvitation}`);
			}, 500);
		} else if (callbackUrl) {
			router.push(callbackUrl);
		} else {
			router.push("/dashboard");
		}
	};

	// If user is already signed in, redirect
	if (session) {
		handleRedirect();
		return null;
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
				handleRedirect();
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
			// Check if there's a pending invitation
			const urlParams = new URLSearchParams(window.location.search);
			const pendingInvitation = urlParams.get("pendingInvitation");

			console.log(
				`Sign up with pending invitation: ${pendingInvitation || "none"}`
			);

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
					message: pendingInvitation
						? "Signed up successfully! Processing invitation..."
						: "Signed up successfully!",
				});

				// If we have a pending invitation, make sure we preserve it in the redirect
				handleRedirect();
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
		setIsGoogleLoading(true);
		try {
			const urlParams = new URLSearchParams(window.location.search);
			const pendingInvitation = urlParams.get("pendingInvitation");
			const callbackUrl = urlParams.get("callbackUrl") || "/dashboard";

			console.log(
				`Google sign in with pending invitation: ${pendingInvitation || "none"}`
			);

			// Construct the callback URL with the pending invitation if present
			const finalCallbackUrl = pendingInvitation
				? `${callbackUrl}?pendingInvitation=${pendingInvitation}`
				: callbackUrl;

			console.log(`Google sign in callback URL: ${finalCallbackUrl}`);

			await signIn.social({
				provider: "google",
				callbackURL: finalCallbackUrl,
			});
		} catch (error) {
			console.error("Error signing in with Google:", error);
			setIsGoogleLoading(false);
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
		<Modal isOpen={isOpen} onClose={onClose} title=''>
			<Card className='border-none shadow-none w-full h-full rounded-lg bg-muted/60 dark:bg-muted pt-8'>
				<CardHeader className='rounded-t-lg'>
					<CardTitle>
						<H3 className='text-center'>Welcome to airox</H3>
					</CardTitle>
					<CardDescription className='text-center'>
						<Muted>Join our community of developers building with AI</Muted>
					</CardDescription>
				</CardHeader>
				<CardContent className='min-h-[320px] flex-1'>
					<Tabs
						defaultValue='signin'
						value={activeTab}
						onValueChange={setActiveTab}
						className='w-full'>
						<TabsList className='grid grid-cols-2 w-full mb-6 bg-background/50'>
							<TabsTrigger value='signin'>Sign In</TabsTrigger>
							<TabsTrigger value='signup'>Sign Up</TabsTrigger>
						</TabsList>

						<TabsContent value='signin' className='space-y-4'>
							<form onSubmit={handleSignIn} className='space-y-4'>
								<div className='space-y-2'>
									<Label htmlFor='email' className='flex items-center gap-2'>
										<MailIcon className='h-4 w-4' />
										Email
									</Label>
									<Input
										type='email'
										id='email'
										name='email'
										value={formData.email}
										onChange={handleChange}
										required
										placeholder='you@example.com'
									/>
								</div>

								<div className='space-y-2'>
									<div className='flex justify-between items-center'>
										<Label
											htmlFor='password'
											className='flex items-center gap-2'>
											<LockIcon className='h-4 w-4' />
											Password
										</Label>
										<button
											type='button'
											onClick={() => {
												setActiveTab("forgot");
												setStatus({ type: "idle", message: "" });
											}}
											className='text-xs text-muted-foreground hover:text-primary/80 hover:underline'>
											Forgot password?
										</button>
									</div>
									<Input
										type='password'
										id='password'
										name='password'
										value={formData.password}
										onChange={handleChange}
										required
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

							<div className='relative my-6'>
								<div className='absolute inset-0 flex items-center'>
									<div className='w-full border-t border-gray-300 dark:border-gray-700'></div>
								</div>
								<div className='relative flex justify-center text-sm'>
									<span className='px-2 bg-background dark:bg-muted text-muted-foreground'>
										Or continue with
									</span>
								</div>
							</div>

							<Button
								onClick={handleGoogleSignIn}
								disabled={isGoogleLoading}
								variant='outline'
								className='w-full flex items-center justify-center gap-2 dark:bg-background/50 dark:border-gray-700'>
								<svg
									className='w-5 h-5'
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
								{isGoogleLoading ? "Signing in..." : "Google"}
							</Button>
						</TabsContent>

						<TabsContent value='signup' className='space-y-4'>
							<form onSubmit={handleSignUp} className='space-y-4'>
								<div className='space-y-2'>
									<Label htmlFor='name' className='flex items-center gap-2'>
										<UserIcon className='h-4 w-4' />
										Name
									</Label>
									<Input
										type='text'
										id='name'
										name='name'
										value={formData.name}
										onChange={handleChange}
										required
										placeholder='Your Name'
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='email' className='flex items-center gap-2'>
										<MailIcon className='h-4 w-4' />
										Email
									</Label>
									<Input
										type='email'
										id='email'
										name='email'
										value={formData.email}
										onChange={handleChange}
										required
										placeholder='you@example.com'
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='password' className='flex items-center gap-2'>
										<LockIcon className='h-4 w-4' />
										Password
									</Label>
									<Input
										type='password'
										id='password'
										name='password'
										value={formData.password}
										onChange={handleChange}
										required
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

							<div className='relative my-6'>
								<div className='absolute inset-0 flex items-center'>
									<div className='w-full border-t border-gray-300 dark:border-gray-700'></div>
								</div>
								<div className='relative flex justify-center text-sm'>
									<span className='px-2 bg-background dark:bg-muted text-muted-foreground'>
										Or continue with
									</span>
								</div>
							</div>

							<Button
								onClick={handleGoogleSignIn}
								disabled={isGoogleLoading}
								variant='outline'
								className='w-full flex items-center justify-center gap-2 dark:bg-background/50 dark:border-gray-700'>
								<svg
									className='w-5 h-5'
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
								{isGoogleLoading ? "Signing in..." : "Google"}
							</Button>
						</TabsContent>

						<TabsContent value='forgot' className='space-y-4'>
							<form onSubmit={handleForgotPassword} className='space-y-4'>
								<div className='space-y-2'>
									<Label htmlFor='email' className='flex items-center gap-2'>
										<MailIcon className='h-4 w-4' />
										Email
									</Label>
									<Input
										type='email'
										id='email'
										name='email'
										value={formData.email}
										onChange={handleChange}
										required
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
										setActiveTab("signin");
										setStatus({ type: "idle", message: "" });
									}}
									className='w-full mt-2'>
									Back to Sign In
								</Button>
							</form>
						</TabsContent>
					</Tabs>

					{status.message && (
						<div
							className={`mt-6 p-4 rounded-lg ${
								status.type === "success"
									? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
									: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
							}`}>
							{status.message}
						</div>
					)}
				</CardContent>
				<CardFooter className='flex justify-center pt-2 pb-6 rounded-b-lg'>
					{activeTab === "signin" && (
						<Muted>
							Don&apos;t have an account?{" "}
							<button
								onClick={() => setActiveTab("signup")}
								className='text-primary hover:underline hover:text-primary/80'>
								Sign up
							</button>
						</Muted>
					)}
					{activeTab === "signup" && (
						<Muted>
							Already have an account?{" "}
							<button
								onClick={() => setActiveTab("signin")}
								className='text-primary hover:underline hover:text-primary/80'>
								Sign in
							</button>
						</Muted>
					)}
				</CardFooter>
			</Card>
		</Modal>
	);
}
