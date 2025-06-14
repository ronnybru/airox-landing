"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Sidebar,
	SidebarHeader,
	SidebarContent,
	SidebarFooter,
	SidebarTrigger,
	useSidebar,
} from "@/components/ui/sidebar";
import { NavMain } from "@/components/nav-main";
import { NavSupport } from "@/components/nav-support";
import { NavUser } from "@/components/nav-user";
import { NavOrganization } from "@/components/nav-organization";
import { useActiveOrganization } from "@/lib/auth-client";
import { H3 } from "@/components/ui/typography";

function SidebarTitle() {
	const { state } = useSidebar();

	// Only show the title when sidebar is expanded
	if (state === "collapsed") {
		return null;
	}

	return <H3 className='text-2xl font-extrabold ml-1'>VibeSolo</H3>;
}

export function AppSidebar() {
	const pathname = usePathname();
	const { data: activeOrganization } = useActiveOrganization();

	return (
		<Sidebar collapsible='icon'>
			<SidebarHeader className='flex items-center pt-6 px-4 '>
				<div className='flex items-center gap-2 w-full'>
					<Link href='/dashboard' className='flex items-center'>
						<div className='flex h-9 w-9 items-center justify-center rounded-md bg-primary'>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'
								className='h-4 w-4 text-primary-foreground'>
								<path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' />
								<polyline points='9 22 9 12 15 12 15 22' />
							</svg>
						</div>
					</Link>
					<SidebarTitle />
					<div className='ml-auto cursor-pointer'>
						<SidebarTrigger className='relative -ml-3.5' />
					</div>
				</div>
			</SidebarHeader>
			<SidebarContent className='px-2 space-y-2 md:space-y-4'>
				<NavMain pathname={pathname} />
				{activeOrganization && <NavOrganization pathname={pathname} />}
				<NavSupport pathname={pathname} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}
