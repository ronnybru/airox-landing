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
import { changeUserEmail } from "@/app/actions/user-settings";
import { Paragraph } from "@/components/ui/typography";

interface EmailSectionProps {
	email: string;
}

export default function EmailSection({ email }: EmailSectionProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [newEmail, setNewEmail] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);
		setSuccess(null);

		try {
			const formData = new FormData();
			formData.append("newEmail", newEmail);
			formData.append("callbackURL", `${window.location.origin}/settings`);

			const result = await changeUserEmail(formData);

			if (result.success) {
				setSuccess(
					result.message || "Verification email sent. Please check your inbox."
				);
				setIsEditing(false);
			} else {
				setError(result.error || "Failed to change email");
			}
		} catch (err) {
			setError("An unexpected error occurred");
			console.error(err);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Email Address</CardTitle>
				<CardDescription>
					Update your email address. A verification email will be sent to
					confirm the change.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{isEditing ? (
					<form onSubmit={handleSubmit} className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='current-email'>Current Email</Label>
							<Input
								id='current-email'
								value={email}
								disabled
								className='bg-muted'
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='new-email'>New Email</Label>
							<Input
								id='new-email'
								type='email'
								value={newEmail}
								onChange={(e) => setNewEmail(e.target.value)}
								placeholder='your-new-email@example.com'
								required
							/>
						</div>
						{error && (
							<Paragraph className='text-destructive'>{error}</Paragraph>
						)}
					</form>
				) : (
					<div className='space-y-2'>
						<Label htmlFor='email'>Email Address</Label>
						<div className='flex items-center space-x-2'>
							<Input id='email' value={email} disabled className='bg-muted' />
						</div>
						{success && (
							<Paragraph className='text-green-600 mt-2'>{success}</Paragraph>
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
								setNewEmail("");
								setError(null);
							}}>
							Cancel
						</Button>
						<Button
							type='submit'
							onClick={handleSubmit}
							disabled={isSubmitting}>
							{isSubmitting ? "Sending..." : "Send Verification"}
						</Button>
					</div>
				) : (
					<Button onClick={() => setIsEditing(true)}>Change Email</Button>
				)}
			</CardFooter>
		</Card>
	);
}
