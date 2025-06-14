"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function AppBreadcrumb() {
	const pathname = usePathname();

	// Function to generate breadcrumbs based on the current path
	const generateBreadcrumbs = () => {
		if (!pathname) return [];

		const segments = pathname.split("/").filter(Boolean);

		// Map path segments to breadcrumb items
		return segments.map((segment, index) => {
			const href = `/${segments.slice(0, index + 1).join("/")}`;
			const label = segment.charAt(0).toUpperCase() + segment.slice(1);

			return { href, label };
		});
	};

	const breadcrumbs = generateBreadcrumbs();

	return (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbSeparator />

				{breadcrumbs.map((breadcrumb, index) => (
					<React.Fragment key={breadcrumb.href}>
						{index === breadcrumbs.length - 1 ? (
							<BreadcrumbItem>
								<BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
							</BreadcrumbItem>
						) : (
							<>
								<BreadcrumbItem>
									<BreadcrumbLink asChild>
										<Link href={breadcrumb.href}>{breadcrumb.label}</Link>
									</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator />
							</>
						)}
					</React.Fragment>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
