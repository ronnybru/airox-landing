"use client";

import React from "react";
import Link from "next/link";
import {
	LayoutDashboard,
	Mail,
	Bell,
	CreditCard,
	ShieldAlert,
	Smartphone,
	MessageSquare,
	Dumbbell,
} from "lucide-react";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
} from "@/components/ui/sidebar";

interface NavAdminProps {
	pathname: string;
}

export function NavAdmin({ pathname }: NavAdminProps) {
	const adminNavItems = [
		{
			title: "Admin Dashboard",
			href: "/admin",
			icon: LayoutDashboard,
		},
		{
			title: "Exercises",
			href: "/exercises",
			icon: Dumbbell,
		},
		{
			title: "Email Tests",
			href: "/email-tests",
			icon: Mail,
		},
		{
			title: "Notifications",
			href: "/notifications",
			icon: Bell,
		},
		{
			title: "Push Notifications",
			href: "/push-notifications",
			icon: Smartphone,
		},
		{
			title: "User Feedback",
			href: "/feedback",
			icon: MessageSquare,
		},
		{
			title: "Memberships",
			href: "/memberships",
			icon: CreditCard,
		},
	];

	return (
		<SidebarGroup>
			<SidebarGroupLabel>
				<div className='flex items-center'>
					<ShieldAlert className='mr-2 h-4 w-4' />
					<span>Admin</span>
				</div>
			</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{adminNavItems.map((item) => (
						<SidebarMenuItem key={item.href} className='py-0'>
							<Link href={item.href} passHref legacyBehavior>
								<SidebarMenuButton
									isActive={
										pathname === item.href ||
										(item.href === "/exercises" &&
											pathname.startsWith("/exercises"))
									}
									tooltip={item.title}>
									<item.icon className='mr-2 !size-5 text-muted-foreground' />
									<span className='text-muted-foreground font-semibold tracking-wide'>
										{item.title}
									</span>
								</SidebarMenuButton>
							</Link>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
