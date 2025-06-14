"use client";

import React from "react";
import Link from "next/link";
import { LayoutDashboard, Mail, FileText, Settings, Users } from "lucide-react";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Separator } from "./ui/separator";

interface NavMainProps {
	pathname: string;
}

export function NavMain({ pathname }: NavMainProps) {
	const mainNavItems = [
		{
			title: "Dashboard",
			href: "/dashboard",
			icon: LayoutDashboard,
		},
		{
			title: "Campaigns",
			href: "/campaigns",
			icon: Mail,
		},
		{
			title: "Templates",
			href: "/templates",
			icon: FileText,
		},
		{
			title: "Subscribers",
			href: "/subscribers",
			icon: Users,
		},

		{
			title: "Settings",
			href: "/settings",
			icon: Settings,
		},
	];

	return (
		<SidebarGroup className='pt-0'>
			<Separator className='mb-4 ' />
			<SidebarGroupContent className='pt-4'>
				<SidebarMenu>
					{mainNavItems.map((item) => (
						<SidebarMenuItem key={item.href} className='py-0'>
							<Link href={item.href} passHref legacyBehavior>
								<SidebarMenuButton
									isActive={pathname === item.href}
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
