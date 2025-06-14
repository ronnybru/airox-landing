import Link from "next/link";
import Image from "next/image";
import React from "react";
import { ImageProps } from "next/image";
import { Callout } from "./callout";
// Commented out until Calculator component is implemented
import { Calculator } from "../content/components/calculator";

type CustomLinkProps = {
	href: string;
	children: React.ReactNode;
	className?: string;
};

function CustomLink({ href, children, className, ...rest }: CustomLinkProps) {
	if (href.startsWith("/")) {
		return (
			<Link href={href} className={className} {...rest}>
				{children}
			</Link>
		);
	}

	if (href.startsWith("#")) {
		return (
			<a href={href} className={className} {...rest}>
				{children}
			</a>
		);
	}

	return (
		<a
			href={href}
			target='blank'
			rel='noopener noreferrer'
			className={className}
			{...rest}>
			{children}
		</a>
	);
}

type RoundedImageProps = Omit<ImageProps, "alt"> & {
	alt: string;
};

function RoundedImage({ alt, className, ...props }: RoundedImageProps) {
	return (
		<Image alt={alt} className={`rounded-lg ${className || ""}`} {...props} />
	);
}

type CodeProps = {
	children: string;
	className?: string;
	[key: string]: unknown;
};

function Code({ children, ...props }: CodeProps) {
	return <code {...props}>{children}</code>;
}

function slugify(str: string): string {
	return str
		.toString()
		.toLowerCase()
		.trim()
		.replace(/\s+/g, "-")
		.replace(/&/g, "-and-")
		.replace(/[^\w\-]+/g, "")
		.replace(/\-\-+/g, "-");
}

function createHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
	const Heading = ({ children }: { children: React.ReactNode }) => {
		const slug = slugify(children as string);
		return React.createElement(
			`h${level}`,
			{ id: slug },
			[
				React.createElement("a", {
					href: `#${slug}`,
					key: `link-${slug}`,
					className: "anchor",
				}),
			],
			children
		);
	};

	Heading.displayName = `Heading${level}`;

	return Heading;
}

// Export MDX components to be used with next-mdx-remote
export const MDXComponents = {
	h1: createHeading(1),
	h2: createHeading(2),
	h3: createHeading(3),
	h4: createHeading(4),
	h5: createHeading(5),
	h6: createHeading(6),
	Image: RoundedImage,
	a: CustomLink,
	code: Code,
	Callout,
	Calculator,
	// Calculator will be added when implemented
};
