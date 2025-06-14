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
import { updateUserProfile } from "@/app/actions/user-settings";
import { Paragraph, Small } from "@/components/ui/typography";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileSectionProps {
	user: {
		name?: string | null;
		email: string;
		image?: string | null;
	};
}

export default function ProfileSection({ user }: ProfileSectionProps) {
	const router = useRouter();
	const [isEditing, setIsEditing] = useState(false);
	const [name, setName] = useState(user.name || "");
	const [image, setImage] = useState(user.image || "");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);
		setSuccess(false);

		try {
			const formData = new FormData();
			formData.append("name", name);
			// Only append image if it's not empty
			if (image) {
				formData.append("image", image);
			} else {
				// If image is empty, pass null to clear the image
				formData.append("image", "");
			}

			const result = await updateUserProfile(formData);

			if (result.success) {
				setSuccess(true);
				setIsEditing(false);
				router.refresh();
			} else {
				setError(result.error || "Failed to update profile");
			}
		} catch (err) {
			setError("An unexpected error occurred");
			console.error(err);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Get initials for avatar fallback
	const getInitials = () => {
		if (!name) return "U";
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.substring(0, 2);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Profile Information</CardTitle>
				<CardDescription>
					Update your personal information and profile picture
				</CardDescription>
			</CardHeader>
			<CardContent>
				{isEditing ? (
					<form onSubmit={handleSubmit} className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='name'>Name</Label>
							<Input
								id='name'
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder='Your name'
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='image'>Profile Image URL (Optional)</Label>
							<Input
								id='image'
								value={image}
								onChange={(e) => setImage(e.target.value)}
								placeholder='https://example.com/your-image.jpg'
							/>
							<Small>
								Enter a URL to your profile picture or leave empty for no image
							</Small>
						</div>
						{error && (
							<Paragraph className='text-destructive'>{error}</Paragraph>
						)}
						{success && (
							<Paragraph className='text-green-600'>
								Profile updated successfully
							</Paragraph>
						)}
					</form>
				) : (
					<div className='space-y-4'>
						<div className='flex items-center space-x-4'>
							<div className='h-16 w-16 rounded-full overflow-hidden'>
								{user.image ? (
									<Avatar className='h-16 w-16'>
										<AvatarImage
											src={user.image}
											alt={user.name || "Profile"}
										/>
										<AvatarFallback>{getInitials()}</AvatarFallback>
									</Avatar>
								) : (
									<Avatar className='h-16 w-16'>
										<AvatarFallback>{getInitials()}</AvatarFallback>
									</Avatar>
								)}
							</div>
							<div>
								<h4 className='text-lg font-medium'>
									{user.name || "No name set"}
								</h4>
								<p className='text-muted-foreground'>{user.email}</p>
								<Button
									variant='outline'
									size='sm'
									className='mt-2'
									onClick={() => setIsEditing(true)}>
									{user.image ? "Change Profile Image" : "Add Profile Image"}
								</Button>
							</div>
						</div>
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
								setName(user.name || "");
								setImage(user.image || "");
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
					<Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
				)}
			</CardFooter>
		</Card>
	);
}
