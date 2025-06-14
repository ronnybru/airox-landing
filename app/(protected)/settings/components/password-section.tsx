"use client";

import { useState } from "react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { changeUserPassword } from "@/app/actions/user-settings";
import { Paragraph } from "@/components/ui/typography";
import { useRouter } from "next/navigation";

interface PasswordSectionProps {
	hasCredentialAccount: boolean;
}

export default function PasswordSection({
	hasCredentialAccount,
}: PasswordSectionProps) {
	const router = useRouter();
	const [isEditing, setIsEditing] = useState(false);
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [revokeOtherSessions, setRevokeOtherSessions] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const validateForm = () => {
		if (!currentPassword) {
			setError("Current password is required");
			return false;
		}

		if (!newPassword) {
			setError("New password is required");
			return false;
		}

		if (newPassword.length < 8) {
			setError("Password must be at least 8 characters");
			return false;
		}

		if (newPassword !== confirmPassword) {
			setError("Passwords do not match");
			return false;
		}

		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setIsSubmitting(true);
		setError(null);
		setSuccess(false);

		try {
			const formData = new FormData();

			// Change existing password
			formData.append("currentPassword", currentPassword);
			formData.append("newPassword", newPassword);
			formData.append("revokeOtherSessions", revokeOtherSessions.toString());

			const result = await changeUserPassword(formData);

			if (result.success) {
				setSuccess(true);
				setIsEditing(false);
				resetForm();
				router.refresh();
			} else {
				setError(result.error || "Failed to change password");
			}
		} catch (err) {
			setError("An unexpected error occurred");
			console.error(err);
		} finally {
			setIsSubmitting(false);
		}
	};

	const resetForm = () => {
		setCurrentPassword("");
		setNewPassword("");
		setConfirmPassword("");
		setRevokeOtherSessions(false);
	};

	// If user doesn't have a credential account, show a message
	if (!hasCredentialAccount) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Password</CardTitle>
					<CardDescription>
						You signed in with a social provider and do not have a password set
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Paragraph>
						Your account is currently set up with a social login provider (like
						Google or GitHub). To set a password and enable email login, please
						use the &quot;Forgot Password&quot; option on the login page.
					</Paragraph>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Password</CardTitle>
				<CardDescription>
					Change your password to keep your account secure
				</CardDescription>
			</CardHeader>
			<CardContent>
				{isEditing ? (
					<form onSubmit={handleSubmit} className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='current-password'>Current Password</Label>
							<Input
								id='current-password'
								type='password'
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
								placeholder='••••••••'
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='new-password'>New Password</Label>
							<Input
								id='new-password'
								type='password'
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								placeholder='••••••••'
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='confirm-password'>Confirm New Password</Label>
							<Input
								id='confirm-password'
								type='password'
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder='••••••••'
							/>
						</div>

						<div className='flex items-center space-x-2'>
							<Checkbox
								id='revoke-sessions'
								checked={revokeOtherSessions}
								onCheckedChange={(checked) =>
									setRevokeOtherSessions(checked === true)
								}
							/>
							<Label
								htmlFor='revoke-sessions'
								className='text-sm font-normal cursor-pointer'>
								Sign out from all other devices
							</Label>
						</div>

						{error && (
							<Paragraph className='text-destructive'>{error}</Paragraph>
						)}
					</form>
				) : (
					<div className='space-y-2'>
						<Paragraph>
							Your password can be changed at any time to keep your account
							secure.
						</Paragraph>
						{success && (
							<Paragraph className='text-green-600'>
								Password updated successfully
							</Paragraph>
						)}
					</div>
				)}
			</CardContent>
			<CardFooter className='flex justify-end'>
				{isEditing ? (
					<div className='flex space-x-2'>
						<Button
							variant='outline'
							onClick={() => {
								setIsEditing(false);
								resetForm();
								setError(null);
							}}>
							Cancel
						</Button>
						<Button
							type='submit'
							onClick={handleSubmit}
							disabled={isSubmitting}>
							{isSubmitting ? "Saving..." : "Save Changes"}
						</Button>
					</div>
				) : (
					<Button onClick={() => setIsEditing(true)}>Change Password</Button>
				)}
			</CardFooter>
		</Card>
	);
}
