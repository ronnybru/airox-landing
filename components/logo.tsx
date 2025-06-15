import React from "react";

interface LogoProps {
	className?: string;
	size?: number; // size in pixels
}

/**
 * A minimalist geometric logo that scales with the `size` prop.
 * The design consists of a subtle hexagon outline with a stylised “A”
 * to evoke “AI” while remaining abstract. Stroke / fill both inherit
 * `currentColor` so the logo adapts to any text/brand color via Tailwind.
 *
 * Usage:
 *   <Logo size={64} className="text-primary" />
 */
export default function Logo({ className = "", size = 32 }: LogoProps) {
	return (
		<svg
			className={className}
			xmlns='http://www.w3.org/2000/svg'
			width={size}
			height={size}
			viewBox='0 0 100 100'
			fill='none'
			stroke='currentColor'
			strokeWidth={6}
			strokeLinecap='round'
			strokeLinejoin='round'>
			{/* Hexagon outline */}
			<polygon
				points='50 5 90 25 90 75 50 95 10 75 10 25'
				opacity='0.2'
				fill='currentColor'
				stroke='currentColor'
				strokeWidth={4}
			/>
			{/* Stylized letter A / upward arrow */}
			<path
				d='M50 25 L70 70 H58 L50 50 L42 70 H30 Z'
				fill='currentColor'
				stroke='none'
			/>
		</svg>
	);
}
