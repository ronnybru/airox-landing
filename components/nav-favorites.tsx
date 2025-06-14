"use client";

import React from "react";
import Link from "next/link";
import { Star, Plus } from "lucide-react";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarGroupContent,
	SidebarGroupAction,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
} from "@/components/ui/sidebar";

interface NavFavoritesProps {
	pathname: string;
}

export function NavFavorites({ pathname }: NavFavoritesProps) {
	// This would typically come from a database or API
	const favoriteItems = [
		{
			title: "Weekly Newsletter",
			href: "/campaigns/weekly-newsletter",
		},
		{
			title: "Welcome Email",
			href: "/templates/welcome-email",
		},
	];

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Favorites</SidebarGroupLabel>
			<SidebarGroupAction asChild>
				<button title='Add to favorites'>
					<Plus className='h-4 w-4' />
				</button>
			</SidebarGroupAction>
			<SidebarGroupContent>
				<SidebarMenu>
					{favoriteItems.length > 0 ? (
						favoriteItems.map((item) => (
							<SidebarMenuItem key={item.href} className='py-0'>
								<Link href={item.href} passHref legacyBehavior>
									<SidebarMenuButton
										isActive={pathname === item.href}
										tooltip={item.title}>
										<Star className='mr-2 h-4 w-4 text-yellow-400 !size-5 ' />
										<span className='text-muted-foreground font-semibold tracking-wide'>
											{item.title}
										</span>
									</SidebarMenuButton>
								</Link>
							</SidebarMenuItem>
						))
					) : (
						<div className='px-3 py-2 text-sm text-muted-foreground'>
							No favorites yet
						</div>
					)}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
