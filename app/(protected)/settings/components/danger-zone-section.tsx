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
import { deleteUserAccount } from "@/app/actions/user-settings";
import { Paragraph } from "@/components/ui/typography";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DangerZoneSection() {
	const [isDeleting, setIsDeleting] = useState(false);
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [showConfirmation, setShowConfirmation] = useState(false);

	const handleDeleteAccount = async () => {
		setIsDeleting(true);
		setError(null);

		try {
			const formData = new FormData();
			formData.append("password", password);
			formData.append("callbackURL", "/");

			const result = await deleteUserAccount(formData);

			if (result.success && result.redirect) {
				// Redirect to the specified URL
				window.location.href = result.redirect;
			} else {
				setError(result.error || "Failed to delete account");
				setShowConfirmation(false);
			}
		} catch (err) {
			setError("An unexpected error occurred");
			console.error(err);
			setShowConfirmation(false);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Card className='border-destructive/20'>
			<CardHeader>
				<CardTitle className='text-destructive'>Delete Account</CardTitle>
				<CardDescription>
					Permanently delete your account and all associated data
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Paragraph>
					Once you delete your account, there is no going back. This action is
					permanent and will remove all your data from our systems.
				</Paragraph>

				{error && (
					<Paragraph className='text-destructive mt-2'>{error}</Paragraph>
				)}
			</CardContent>
			<CardFooter>
				<AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
					<AlertDialogTrigger asChild>
						<Button variant='destructive'>Delete Account</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
							<AlertDialogDescription>
								This action cannot be undone. This will permanently delete your
								account and remove all your data from our servers.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<div className='space-y-4 py-4'>
							<div className='space-y-2'>
								<Label htmlFor='password'>
									Enter your password to confirm deletion
								</Label>
								<Input
									id='password'
									type='password'
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder='••••••••'
								/>
							</div>
						</div>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={(e) => {
									e.preventDefault();
									handleDeleteAccount();
								}}
								className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
								disabled={isDeleting}>
								{isDeleting ? "Deleting..." : "Delete Account"}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</CardFooter>
		</Card>
	);
}
