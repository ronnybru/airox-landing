"use client";

import { ReactNode } from "react";
import { H2, Lead } from "@/components/ui/typography";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";

interface PageHeaderProps {
	title?: string;
	subtitle?: string;
	customHeader?: ReactNode;
}

export function PageHeader({ title, subtitle, customHeader }: PageHeaderProps) {
	const pathname = usePathname();

	// Get the last part of the path for the default title
	const getDefaultTitle = () => {
		const path = pathname.split("/").filter(Boolean);
		if (path.length === 0) return "Dashboard";
		return (
			path[path.length - 1].charAt(0).toUpperCase() +
			path[path.length - 1].slice(1)
		);
	};

	const displayTitle = title || getDefaultTitle();
	const displaySubtitle = subtitle || "";

	return (
		<div className='mb-2 md:mb-3'>
			{customHeader || (
				<>
					<div className='flex flex-row justify-between items-center'>
						<H2 className='flex items-center gap-2 text-xl md:text-3xl font-bold pb-2 !border-0 md:!border-b'>
							{displayTitle}
						</H2>

						<div className='flex items-center gap-2'>
							<NotificationDropdown />
							<div className='md:hidden rounded-full bg-card h-11 w-11 flex justify-center items-center animate-pulse '>
								<SidebarTrigger />
							</div>
						</div>
					</div>
					{displaySubtitle && (
						<Lead className='text-muted-foreground mt-1 text-xs hidden md:block'>
							{displaySubtitle}
						</Lead>
					)}
				</>
			)}
		</div>
	);
}
