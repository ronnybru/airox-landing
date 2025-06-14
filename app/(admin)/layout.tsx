"use client";

import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebarRenderer } from "@/components/admin-sidebar-renderer";

export default function AdminLayout({ children }: { children: ReactNode }) {
	return (
		<div className='flex h-screen overflow-hidden'>
			<SidebarProvider>
				<AdminSidebarRenderer />
				<SidebarInset
					id='skip'
					className='size-full lg:peer-data-[state=collapsed]:max-w-[calc(100vw-var(--sidebar-width-icon))] lg:peer-data-[state=expanded]:max-w-[calc(100vw-var(--sidebar-width))]'>
					<div className='p-3 md:p-6 h-full overflow-auto'>{children}</div>
				</SidebarInset>
			</SidebarProvider>
		</div>
	);
}
