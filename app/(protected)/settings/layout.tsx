"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";

export default function SettingsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();

	const tabs = [
		{ name: "Account", href: "/settings" },
		{ name: "API & Integrations", href: "/settings/api-integrations" },
		{ name: "Organizations", href: "/settings/organizations" },
		{ name: "Notifications", href: "/settings/notifications" },
	];

	return (
		<>
			<PageHeader title='Settings' />

			<div className='border-b mb-6'>
				<nav className='flex space-x-8'>
					{tabs.map((tab) => (
						<Link
							key={tab.href}
							href={tab.href}
							className={`
								py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
								${
									pathname === tab.href
										? "border-primary text-primary"
										: "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
								}
							`}>
							{tab.name}
						</Link>
					))}
				</nav>
			</div>

			{children}
		</>
	);
}
