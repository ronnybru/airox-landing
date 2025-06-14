"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Building, Users } from "lucide-react";
import { organization } from "@/lib/auth-client";
import { toast } from "sonner";

interface Organization {
	id: string;
	name: string;
	slug: string;
	logo?: string | null;
	role: string;
}

interface OrganizationListProps {
	organizations: Organization[];
	activeOrganizationId?: string;
}

export function OrganizationList({
	organizations,
	activeOrganizationId,
}: OrganizationListProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState<string | null>(null);

	const setActiveOrganization = async (organizationId: string) => {
		if (organizationId === activeOrganizationId) return;

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
		<div className='grid gap-4'>
			<div className='grid gap-4'>
				{organizations.map((org) => (
					<Card
						key={org.id}
						className={activeOrganizationId === org.id ? "border-primary" : ""}>
						<CardHeader className='pb-2'>
							<div className='flex justify-between items-start'>
								<div className='flex items-center gap-2'>
									{org.logo ? (
										<Image
											src={org.logo}
											alt={org.name}
											width={32}
											height={32}
											className='w-8 h-8 rounded-md object-cover'
										/>
									) : (
										<div className='w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center'>
											<Building className='w-4 h-4 text-primary' />
										</div>
									)}
									<div>
										<CardTitle className='text-lg'>{org.name}</CardTitle>
										<CardDescription>@{org.slug}</CardDescription>
									</div>
								</div>
								<Badge variant={org.role === "owner" ? "default" : "outline"}>
									{org.role}
								</Badge>
							</div>
						</CardHeader>
						<CardContent className='pb-2'>
							<div className='flex items-center gap-2 text-sm text-muted-foreground'>
								<Users className='w-4 h-4' />
								<span>Role: {org.role}</span>
							</div>
						</CardContent>
						<CardFooter className='pt-2'>
							{activeOrganizationId === org.id ? (
								<Button variant='outline' className='w-full' disabled>
									<CheckCircle2 className='mr-2 h-4 w-4' />
									Active Organization
								</Button>
							) : (
								<Button
									variant='secondary'
									className='w-full'
									onClick={() => setActiveOrganization(org.id)}
									disabled={isLoading === org.id}>
									{isLoading === org.id
										? "Setting as active..."
										: "Set as Active"}
								</Button>
							)}
						</CardFooter>
					</Card>
				))}
			</div>
		</div>
	);
}
