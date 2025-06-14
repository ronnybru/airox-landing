"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function DashboardButton() {
	return (
		<Button asChild>
			<Link href='/dashboard'>Go to Dashboard</Link>
		</Button>
	);
}
