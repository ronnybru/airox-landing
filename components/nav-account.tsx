"use client";

import React from "react";
import Link from "next/link";
import { User, Key, Bell } from "lucide-react";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
} from "@/components/ui/sidebar";

interface NavAccountProps {
	pathname: string;
}

export function NavAccount({ pathname }: NavAccountProps) {
	const accountItems = [
		{
			title: "Profile",
			href: "/settings/profile",
			icon: User,
		},
		{
			title: "Password",
			href: "/settings/password",
			icon: Key,
		},
		{
			title: "Notifications",
			href: "/settings/notifications",
			icon: Bell,
		},
	];

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Account</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{accountItems.map((item) => (
						<SidebarMenuItem key={item.href}>
							<Link href={item.href} passHref legacyBehavior>
								<SidebarMenuButton
									isActive={pathname === item.href}
									tooltip={item.title}>
									<item.icon className='mr-2 h-4 w-4' />
									<span>{item.title}</span>
								</SidebarMenuButton>
							</Link>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
