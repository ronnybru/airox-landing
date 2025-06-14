"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { H4, Paragraph } from "@/components/ui/typography";
import {
	AlertCircle,
	Users,
	Settings,
	Trash2,
	Mail,
	UserMinus,
} from "lucide-react";
import { organization as orgClient } from "@/lib/auth-client";
import { toast } from "sonner";
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

interface Member {
	id: string;
	userId: string;
	role: string;
	organizationId: string;
	teamId?: string | null;
	createdAt?: Date;
	user?: {
		name: string;
		email: string;
		image?: string | null; // Allow null for image
	};
}

interface Organization {
	id: string;
	name: string;
	slug: string;
	logo?: string | null;
	members?: Member[];
}

interface OrganizationSettingsProps {
	organization: Organization;
}

// Invite Member Form Component
const inviteMemberSchema = z.object({
	email: z.string().email({ message: "Please enter a valid email address." }),
	role: z.enum(["admin", "member"], {
		required_error: "Please select a role.",
	}),
});

function InviteMemberForm({ organizationId }: { organizationId: string }) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const router = useRouter();

	const form = useForm<z.infer<typeof inviteMemberSchema>>({
		resolver: zodResolver(inviteMemberSchema),
		defaultValues: {
			email: "",
			role: "member",
		},
	});

	const onSubmit = async (values: z.infer<typeof inviteMemberSchema>) => {
		setIsSubmitting(true);
		try {
			await orgClient.inviteMember({
				email: values.email,
				role: values.role,
				organizationId,
			});

			toast.success(`Invitation sent to ${values.email}`);
			form.reset();
			router.refresh();
		} catch (error) {
			console.error("Error inviting member:", error);
			toast.error("Failed to send invitation. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
			<div className='space-y-2'>
				<Label htmlFor='email'>Email Address</Label>
				<div className='flex gap-2'>
					<div className='flex-1'>
						<Input
							id='email'
							placeholder='colleague@example.com'
							{...form.register("email")}
							className={
								form.formState.errors.email ? "border-destructive" : ""
							}
						/>
						{form.formState.errors.email && (
							<p className='text-sm text-destructive mt-1'>
								{form.formState.errors.email.message}
							</p>
						)}
					</div>
					<select
						{...form.register("role")}
						className='h-10 rounded-md border border-input bg-background px-3 py-2 text-sm'>
						<option value='member'>Member</option>
						<option value='admin'>Admin</option>
					</select>
				</div>
				<p className='text-sm text-muted-foreground'>
					An invitation will be sent to this email address.
				</p>
			</div>

			<Button
				type='submit'
				disabled={isSubmitting}
				className='flex items-center'>
				<Mail className='mr-2 h-4 w-4' />
				{isSubmitting ? "Sending Invitation..." : "Send Invitation"}
			</Button>
		</form>
	);
}

export function OrganizationSettings({
	organization,
}: OrganizationSettingsProps) {
	// No longer need to check for tab parameter since we've consolidated the view
	const router = useRouter();
	const [isUpdating, setIsUpdating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isRemovingMember, setIsRemovingMember] = useState<string | null>(null);
	const [formData, setFormData] = useState({
		name: organization.name,
		logo: organization.logo || "",
		slug: organization.slug,
	});

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const updateOrganization = async () => {
		if (formData.name.trim() === "") {
			toast.error("Organization name cannot be empty");
			return;
		}

		if (formData.slug.trim() === "") {
			toast.error("Organization slug cannot be empty");
			return;
		}

		setIsUpdating(true);
		try {
			// First check if the slug is available (if it changed)
			if (formData.slug !== organization.slug) {
				try {
					const slugCheckResponse = await orgClient.checkSlug({
						slug: formData.slug,
					});

					// Handle the response safely with type checking
					const slugAvailable =
						typeof slugCheckResponse === "object" &&
						slugCheckResponse !== null &&
						"data" in slugCheckResponse &&
						typeof slugCheckResponse.data === "object" &&
						slugCheckResponse.data !== null &&
						"status" in slugCheckResponse.data &&
						slugCheckResponse.data.status === true;

					if (!slugAvailable) {
						toast.error(
							"This slug is already taken. Please choose another one."
						);
						setIsUpdating(false);
						return;
					}
				} catch (slugError) {
					console.error("Error checking slug availability:", slugError);
					toast.error("Failed to check slug availability");
					setIsUpdating(false);
					return;
				}
			}

			// Update the organization with the new data
			await orgClient.update({
				data: {
					name: formData.name,
					logo: formData.logo || undefined,
					slug: formData.slug,
				},
				organizationId: organization.id,
			});

			toast.success("Organization updated successfully");
			router.refresh();
		} catch (error) {
			console.error("Error updating organization:", error);
			toast.error("Failed to update organization");
		} finally {
			setIsUpdating(false);
		}
	};

	const deleteOrganization = async () => {
		setIsDeleting(true);
		try {
			await orgClient.delete({
				organizationId: organization.id,
			});

			toast.success("Organization deleted successfully");
			router.push("/settings/organizations");
			router.refresh();
		} catch (error) {
			console.error("Error deleting organization:", error);
			toast.error("Failed to delete organization");
			setIsDeleting(false);
		}
	};

	const removeMember = async (memberId: string) => {
		setIsRemovingMember(memberId);
		try {
			await orgClient.removeMember({
				memberIdOrEmail: memberId,
				organizationId: organization.id,
			});

			toast.success("Member removed successfully");
			router.refresh();
		} catch (error) {
			console.error("Error removing member:", error);
			toast.error("Failed to remove member. Please try again.");
		} finally {
			setIsRemovingMember(null);
		}
	};

	return (
		<div className='w-full'>
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
				{/* General Settings Section */}
				<div className='space-y-6'>
					<Card>
						<CardHeader>
							<div className='flex items-center'>
								<Settings className='mr-2 h-4 w-4' />
								<CardTitle>Organization Settings</CardTitle>
							</div>
							<CardDescription>
								Manage your organization&apos;s profile and settings.
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='space-y-4'>
								<div className='space-y-2'>
									<Label htmlFor='name'>Organization Name</Label>
									<Input
										id='name'
										name='name'
										value={formData.name}
										onChange={handleInputChange}
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='logo'>Logo URL</Label>
									<Input
										id='logo'
										name='logo'
										value={formData.logo}
										onChange={handleInputChange}
										placeholder='https://example.com/logo.png'
									/>
									<p className='text-sm text-muted-foreground'>
										Enter a URL for your organization&apos;s logo.
									</p>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='slug'>Organization Slug</Label>
									<Input
										id='slug'
										name='slug'
										value={formData.slug}
										onChange={handleInputChange}
									/>
									<p className='text-sm text-muted-foreground'>
										The slug is used in URLs and must be unique.
									</p>
								</div>

								<Button onClick={updateOrganization} disabled={isUpdating}>
									{isUpdating ? "Updating..." : "Update Organization"}
								</Button>
							</div>

							<Separator className='my-6' />

							<div className='space-y-4'>
								<H4>Danger Zone</H4>
								<Paragraph className='text-muted-foreground'>
									Permanently delete this organization and all of its data.
								</Paragraph>

								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button variant='destructive'>
											<Trash2 className='mr-2 h-4 w-4' />
											Delete Organization
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>
												Are you absolutely sure?
											</AlertDialogTitle>
											<AlertDialogDescription>
												This action cannot be undone. This will permanently
												delete the organization &quot;{organization.name}&quot;
												and remove all associated data from our servers.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Cancel</AlertDialogCancel>
											<AlertDialogAction
												onClick={deleteOrganization}
												disabled={isDeleting}
												className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
												{isDeleting ? "Deleting..." : "Delete Organization"}
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Members Section */}
				<div className='space-y-6'>
					<Card>
						<CardHeader>
							<div className='flex items-center'>
								<Users className='mr-2 h-4 w-4' />
								<CardTitle>Invite Members</CardTitle>
							</div>
							<CardDescription>
								Invite new members to join your organization.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<InviteMemberForm organizationId={organization.id} />
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Team Members</CardTitle>
							<CardDescription>
								Manage your organization&apos;s team members and their roles.
							</CardDescription>
						</CardHeader>
						<CardContent>
							{organization.members && organization.members.length > 0 ? (
								<div className='space-y-4'>
									{organization.members.map((member) => (
										<div
											key={member.id}
											className='flex items-center justify-between p-4 border rounded-lg'>
											<div className='flex items-center gap-3'>
												{member.user?.image ? (
													<Image
														src={member.user.image}
														alt={member.user.name || "User"}
														width={40}
														height={40}
														className='w-10 h-10 rounded-full object-cover'
													/>
												) : (
													<div className='w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center'>
														<Users className='w-5 h-5 text-primary' />
													</div>
												)}
												<div>
													<p className='font-medium'>
														{member.user?.name || "Unknown User"}
													</p>
													<p className='text-sm text-muted-foreground'>
														{member.user?.email || member.userId}
													</p>
												</div>
											</div>
											<div className='flex items-center gap-3'>
												<div className='text-sm font-medium'>{member.role}</div>
												{member.role !== "owner" && (
													<AlertDialog>
														<AlertDialogTrigger asChild>
															<Button
																variant='outline'
																size='sm'
																className='text-destructive hover:text-destructive hover:bg-destructive/10'>
																<UserMinus className='h-4 w-4 mr-1' />
																Revoke Access
															</Button>
														</AlertDialogTrigger>
														<AlertDialogContent>
															<AlertDialogHeader>
																<AlertDialogTitle>
																	Revoke access for this member?
																</AlertDialogTitle>
																<AlertDialogDescription>
																	This will remove{" "}
																	{member.user?.name || "this user"} from the
																	organization. They will no longer have access
																	to any resources in this organization.
																</AlertDialogDescription>
															</AlertDialogHeader>
															<AlertDialogFooter>
																<AlertDialogCancel>Cancel</AlertDialogCancel>
																<AlertDialogAction
																	onClick={() => removeMember(member.id)}
																	disabled={isRemovingMember === member.id}
																	className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
																	{isRemovingMember === member.id
																		? "Removing..."
																		: "Revoke Access"}
																</AlertDialogAction>
															</AlertDialogFooter>
														</AlertDialogContent>
													</AlertDialog>
												)}
											</div>
										</div>
									))}
								</div>
							) : (
								<div className='flex flex-col items-center justify-center py-8 text-center'>
									<AlertCircle className='w-12 h-12 text-muted-foreground mb-4' />
									<h3 className='text-lg font-medium'>No members found</h3>
									<p className='text-muted-foreground mt-2'>
										There are no members in this organization yet.
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
