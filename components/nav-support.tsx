"use client";

import React from "react";
import Link from "next/link";
import { HelpCircle, MessageSquare, UserPlus } from "lucide-react";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
} from "@/components/ui/sidebar";

interface NavSupportProps {
	pathname: string;
}

export function NavSupport({ pathname }: NavSupportProps) {
	const supportItems = [
		{
			title: "Help & Support",
			href: "/support",
			icon: HelpCircle,
		},
		{
			title: "Feedback",
			href: "/feedback",
			icon: MessageSquare,
		},
		{
			title: "Invite Team Member",
			href: "/invite",
			icon: UserPlus,
		},
	];

	return (
		<SidebarGroup>
			<SidebarGroupLabel className='text-muted-foreground font-semibold tracking-wide'>
				Support & Feedback
			</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{supportItems.map((item) => (
						<SidebarMenuItem key={item.href}>
							<Link href={item.href} passHref legacyBehavior>
								<SidebarMenuButton
									isActive={pathname === item.href}
									tooltip={item.title}>
									<item.icon className='mr-2 h-4 w-4 !size-5' />
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
