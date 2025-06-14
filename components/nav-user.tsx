"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User, Moon, Sun, ChevronUp, Coins } from "lucide-react";
import { useTheme } from "next-themes";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	useSession,
	signOut,
	useListOrganizations,
	useActiveOrganization,
	organization,
} from "@/lib/auth-client";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Small, Muted } from "@/components/ui/typography";

export function NavUser() {
	const { data: session } = useSession();
	const { setTheme } = useTheme();
	const router = useRouter();
	const { data: organizations } = useListOrganizations();
	const { data: activeOrganization } = useActiveOrganization();

	const handleSignOut = async () => {
		await signOut({
			fetchOptions: {
				onSuccess: () => {
					router.push("/");
				},
			},
		});
	};

	const handleSwitchOrganization = async (organizationId: string) => {
		try {
			await organization.setActive({
				organizationId,
			});
			router.refresh();
		} catch (error) {
			console.error("Failed to switch organization:", error);
		}
	};

	// Use real user data from session, or fallback to placeholder
	const user = session?.user || {
		name: "Guest User",
		email: "guest@example.com",
		image: null,
	};

	const userInitials = user.name
		? user.name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
		: "GU";

	// Check if user has multiple organizations
	const hasMultipleOrganizations = organizations && organizations.length > 1;

	return (
		<SidebarGroup className=''>
			<SidebarGroupContent>
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger className='p-0' asChild>
								<SidebarMenuButton tooltip='User Menu'>
									<Avatar className='mr-2 h-6 w-6'>
										<AvatarImage src={user.image || ""} alt={user.name} />
										<AvatarFallback>{userInitials}</AvatarFallback>
									</Avatar>
									<div className='flex flex-col items-start flex-grow'>
										<Small className='font-medium'>{user.name}</Small>
										<Muted className='text-xs'>{user.email}</Muted>
									</div>
									<ChevronUp className='h-4 w-4 text-muted-foreground' />
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end' className='w-56'>
								<DropdownMenuItem asChild>
									<Link href='/settings' className='flex items-center'>
										<User className='mr-2 h-4 w-4' />
										<span>Profile</span>
									</Link>
								</DropdownMenuItem>

								<DropdownMenuItem asChild>
									<Link href='/membership' className='flex items-center'>
										<Coins className='mr-2 h-4 w-4' />
										<span>
											Credits: {session?.user.organizationCredits || 0}
										</span>
									</Link>
								</DropdownMenuItem>

								{hasMultipleOrganizations && (
									<>
										<DropdownMenuSeparator />
										<div className='px-2 py-1.5'>
											<Muted className='text-xs font-medium'>
												Organizations
											</Muted>
										</div>
										{organizations?.map((org) => (
											<DropdownMenuItem
												key={org.id}
												onClick={() => handleSwitchOrganization(org.id)}
												className='flex items-center justify-between'>
												<span>{org.name}</span>
												{activeOrganization?.id === org.id && (
													<span className='h-2 w-2 rounded-full bg-primary' />
												)}
											</DropdownMenuItem>
										))}
										<DropdownMenuSeparator />
									</>
								)}

								<DropdownMenuItem onClick={() => setTheme("light")}>
									<Sun className='mr-2 h-4 w-4' />
									<span>Light Mode</span>
								</DropdownMenuItem>

								<DropdownMenuItem onClick={() => setTheme("dark")}>
									<Moon className='mr-2 h-4 w-4' />
									<span>Dark Mode</span>
								</DropdownMenuItem>

								<DropdownMenuSeparator />

								<DropdownMenuItem
									onClick={handleSignOut}
									className='flex items-center text-destructive'>
									<LogOut className='mr-2 h-4 w-4' />
									<span>Logout</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
