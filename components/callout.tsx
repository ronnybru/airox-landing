import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CalloutProps {
	children?: ReactNode;
	type?: "default" | "warning" | "danger" | "info";
}

export function Callout({
	children,
	type = "default",
	...props
}: CalloutProps) {
	return (
		<div
			className={cn(
				"my-6 items-start rounded-md border border-l-4 p-4 w-full dark:max-w-none",
				{
					"border-red-900 bg-red-50 dark:bg-red-950/20 dark:border-red-800":
						type === "danger",
					"border-yellow-900 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800":
						type === "warning",
					"border-blue-900 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800":
						type === "info",
					"border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700":
						type === "default",
				}
			)}
			{...props}>
			<div>{children}</div>
		</div>
	);
}
