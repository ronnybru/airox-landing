"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Paragraph, Small } from "@/components/ui/typography";
import { organization } from "@/lib/auth-client";
import { toast } from "sonner";

interface Organization {
	id: string;
	name: string;
	logo?: string | null;
	role: string;
}

interface AccountInfoBoxProps {
	user: {
		id: string;
		name?: string | null;
		email: string;
		image?: string | null;
		emailVerified: boolean;
		createdAt: Date;
		role: string;
	};
	organizations: Organization[];
	activeOrganization?: {
		id: string;
		name: string;
		logo?: string | null;
		credits: number;
	} | null;
}

export default function AccountInfoBox({
	user,
	organizations,
	activeOrganization,
}: AccountInfoBoxProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState<string | null>(null);

	// Get initials for avatar fallback
	const getInitials = (name?: string | null) => {
		if (!name) return "U";
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.substring(0, 2);
	};

	// Format role for display
	const formatRole = (role: string) => {
		return role.charAt(0).toUpperCase() + role.slice(1);
	};

	// Set active organization
	const setActiveOrganization = async (organizationId: string) => {
		if (activeOrganization && organizationId === activeOrganization.id) return;

		setIsLoading(organizationId);
		try {
			await organization.setActive({
				organizationId,
			});

			toast.success("Active organization updated");
			router.refresh();
		} catch (error) {
			console.error("Error setting active organization:", error);
			toast.error("Failed to update active organization");
		} finally {
			setIsLoading(null);
		}
	};

	return (
		<Card className='h-fit'>
			<CardHeader>
				<CardTitle>Account Information</CardTitle>
			</CardHeader>
			<CardContent className='space-y-6'>
				{/* Account Age */}
				<div>
					<Small className='text-muted-foreground'>Account Age</Small>
					<Paragraph>
						Member since {format(new Date(user.createdAt), "MMMM d, yyyy")}
					</Paragraph>
				</div>

				<Separator />

				{/* Account Status */}
				<div>
					<Small className='text-muted-foreground'>Account Status</Small>
					<div className='flex items-center space-x-2 mt-1'>
						<Badge variant={user.emailVerified ? "default" : "outline"}>
							{user.emailVerified ? "Verified" : "Unverified"}
						</Badge>
						<Badge variant='outline'>{formatRole(user.role)}</Badge>
					</div>
				</div>

				<Separator />

				{/* Organizations */}
				<div>
					<Small className='text-muted-foreground'>Your Organizations</Small>
					<div className='space-y-4 mt-2'>
						{organizations.length > 0 ? (
							organizations.map((org) => (
								<div key={org.id} className='space-y-2'>
									<div className='flex items-center space-x-3'>
										<Avatar className='h-8 w-8'>
											{org.logo ? (
												<AvatarImage src={org.logo} alt={org.name} />
											) : (
												<AvatarFallback>{getInitials(org.name)}</AvatarFallback>
											)}
										</Avatar>
										<div className='flex-1'>
											<Paragraph className='font-medium'>{org.name}</Paragraph>
											<Small className='text-muted-foreground'>
												{formatRole(org.role)}
											</Small>
										</div>
										{activeOrganization && activeOrganization.id === org.id ? (
											<Badge variant='secondary' className='ml-auto'>
												Active
											</Badge>
										) : (
											<Badge
												variant='secondary'
												className='ml-auto cursor-pointer hover:bg-secondary/80'
												onClick={() => setActiveOrganization(org.id)}>
												{isLoading === org.id ? "Setting..." : "Set as Active"}
											</Badge>
										)}
									</div>
								</div>
							))
						) : (
							<Paragraph className='text-muted-foreground'>
								You are not a member of any organizations
							</Paragraph>
						)}
					</div>
				</div>

				{/* Active Organization Credits */}
				{activeOrganization && (
					<>
						<Separator />
						<div>
							<Small className='text-muted-foreground'>
								Active Organization
							</Small>
							<div className='flex items-center space-x-3 mt-2'>
								<Avatar className='h-8 w-8'>
									{activeOrganization.logo ? (
										<AvatarImage
											src={activeOrganization.logo}
											alt={activeOrganization.name}
										/>
									) : (
										<AvatarFallback>
											{getInitials(activeOrganization.name)}
										</AvatarFallback>
									)}
								</Avatar>
								<div>
									<Paragraph className='font-medium'>
										{activeOrganization.name}
									</Paragraph>
									<Small className='text-muted-foreground'>
										{activeOrganization.credits} credits available
									</Small>
								</div>
							</div>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
