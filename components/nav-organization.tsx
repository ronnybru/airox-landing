"use client";

import React from "react";
import Link from "next/link";
import { CreditCard, Users, Mail } from "lucide-react";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
} from "@/components/ui/sidebar";

interface NavOrganizationProps {
	pathname: string;
}

export function NavOrganization({ pathname }: NavOrganizationProps) {
	const organizationItems = [
		{
			title: "Team Members",
			href: "/settings/organizations?tab=members",
			icon: Users,
		},
		{
			title: "Billing",
			href: "/membership",
			icon: CreditCard,
		},
		{
			title: "Email Settings",
			href: "/settings/notifications",
			icon: Mail,
		},
	];

	return (
		<SidebarGroup>
			<SidebarGroupLabel className='text-muted-foreground font-semibold tracking-wide'>
				Organization
			</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{organizationItems.map((item) => (
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
