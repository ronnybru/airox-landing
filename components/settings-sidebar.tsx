"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
	Sidebar,
	SidebarHeader,
	SidebarContent,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavAccount } from "@/components/nav-account";
import { NavOrganization } from "@/components/nav-organization";
import { H3 } from "@/components/ui/typography";

export function SettingsSidebar() {
	const pathname = usePathname();

	return (
		<Sidebar side='right' variant='floating' collapsible='icon'>
			<SidebarHeader className='flex items-center justify-between'>
				<H3 className='text-xl'>Settings</H3>
				<SidebarTrigger />
			</SidebarHeader>
			<SidebarContent>
				<NavAccount pathname={pathname} />
				<NavOrganization pathname={pathname} />
			</SidebarContent>
		</Sidebar>
	);
}
