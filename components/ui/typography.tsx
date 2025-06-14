import React from "react";

interface TypographyProps {
	children: React.ReactNode;
	className?: string;
}

export function H1({
	children,
	className,
	...props
}: TypographyProps & React.HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h1
			className={`scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl ${
				className || ""
			}`}
			{...props}>
			{children}
		</h1>
	);
}

export function H2({
	children,
	className,
	...props
}: TypographyProps & React.HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h2
			className={`scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 ${
				className || ""
			}`}
			{...props}>
			{children}
		</h2>
	);
}

export function H3({
	children,
	className,
	...props
}: TypographyProps & React.HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h3
			className={`scroll-m-20 text-2xl font-semibold tracking-tight ${
				className || ""
			}`}
			{...props}>
			{children}
		</h3>
	);
}

export function H4({
	children,
	className,
	...props
}: TypographyProps & React.HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h4
			className={`scroll-m-20 text-xl font-semibold tracking-tight ${
				className || ""
			}`}
			{...props}>
			{children}
		</h4>
	);
}

export function Paragraph({
	children,
	className,
	...props
}: TypographyProps & React.HTMLAttributes<HTMLParagraphElement>) {
	return (
		<p
			className={`leading-7 [&:not(:first-child)]:mt-6 ${className || ""}`}
			{...props}>
			{children}
		</p>
	);
}

export function Blockquote({
	children,
	className,
	...props
}: TypographyProps & React.HTMLAttributes<HTMLQuoteElement>) {
	return (
		<blockquote
			className={`mt-6 border-l-2 pl-6 italic ${className || ""}`}
			{...props}>
			{children}
		</blockquote>
	);
}

export function List({
	children,
	className,
	...props
}: TypographyProps & React.HTMLAttributes<HTMLUListElement>) {
	return (
		<ul
			className={`my-6 ml-6 list-disc [&>li]:mt-2 ${className || ""}`}
			{...props}>
			{children}
		</ul>
	);
}

export function InlineCode({
	children,
	className,
	...props
}: TypographyProps & React.HTMLAttributes<HTMLElement>) {
	return (
		<code
			className={`relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold ${
				className || ""
			}`}
			{...props}>
			{children}
		</code>
	);
}

export function Lead({
	children,
	className,
	...props
}: TypographyProps & React.HTMLAttributes<HTMLParagraphElement>) {
	return (
		<p
			className={`text-xl text-muted-foreground ${className || ""}`}
			{...props}>
			{children}
		</p>
	);
}

export function Large({
	children,
	className,
	...props
}: TypographyProps & React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={`text-lg font-semibold ${className || ""}`} {...props}>
			{children}
		</div>
	);
}

export function Small({
	children,
	className,
	...props
}: TypographyProps & React.HTMLAttributes<HTMLElement>) {
	return (
		<small
			className={`text-sm font-medium leading-none ${className || ""}`}
			{...props}>
			{children}
		</small>
	);
}

export function Muted({
	children,
	className,
	...props
}: TypographyProps & React.HTMLAttributes<HTMLParagraphElement>) {
	return (
		<p
			className={`text-sm text-muted-foreground ${className || ""}`}
			{...props}>
			{children}
		</p>
	);
}

export function Table({
	children,
	className,
	...props
}: TypographyProps & React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={`my-6 w-full overflow-y-auto ${className || ""}`}
			{...props}>
			<table className='w-full'>{children}</table>
		</div>
	);
}

// Export the old names for backward compatibility
export const TypographyH1 = H1;
export const TypographyH2 = H2;
export const TypographyH3 = H3;
export const TypographyH4 = H4;
export const TypographyP = Paragraph;
export const TypographyBlockquote = Blockquote;
export const TypographyList = List;
export const TypographyInlineCode = InlineCode;
export const TypographyLead = Lead;
export const TypographyLarge = Large;
export const TypographySmall = Small;
export const TypographyMuted = Muted;
export const TypographyTable = Table;
