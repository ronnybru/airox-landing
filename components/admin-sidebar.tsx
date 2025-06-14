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
import { NavAdmin } from "@/components/nav-admin";
import { NavUser } from "@/components/nav-user";
import { H3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert } from "lucide-react";

function SidebarTitle() {
	const { state } = useSidebar();

	// Only show the title when sidebar is expanded
	if (state === "collapsed") {
		return null;
	}

	return <H3 className='text-2xl font-extrabold ml-1'>Admin</H3>;
}

export function AdminSidebar() {
	const pathname = usePathname();

	return (
		<Sidebar collapsible='icon'>
			<SidebarHeader className='flex items-center pt-6 px-4 '>
				<div className='flex items-center gap-2 w-full'>
					<Link href='/admin' className='flex items-center'>
						<div className='flex h-9 w-9 items-center justify-center rounded-md bg-primary'>
							<ShieldAlert className='h-4 w-4 text-primary-foreground' />
						</div>
					</Link>
					<SidebarTitle />
					<div className='ml-auto cursor-pointer'>
						<SidebarTrigger className='relative -ml-3.5' />
					</div>
				</div>
			</SidebarHeader>
			<SidebarContent className='px-2 space-y-2 md:space-y-4'>
				<NavAdmin pathname={pathname} />

				<div className='px-3 py-2'>
					<Button variant='outline' className='w-full justify-start' asChild>
						<Link href='/dashboard'>
							<ArrowLeft className='mr-2 h-4 w-4' />
							Back to Dashboard
						</Link>
					</Button>
				</div>
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}
