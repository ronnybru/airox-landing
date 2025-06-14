import Link from "next/link";
import { badgeVariants } from "@/components/ui/badge";

interface TagProps {
	tag: string;
	current?: boolean;
	count?: number;
}

export function Tag({ tag, current, count }: TagProps) {
	return (
		<Link
			className={badgeVariants({
				variant: current ? "default" : "secondary",
				className: "no-underline rounded-md",
			})}
			href={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, "-")}`}>
			{tag} {count ? `(${count})` : null}
		</Link>
	);
}
