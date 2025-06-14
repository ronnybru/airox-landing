import { CSSProperties } from "react";

interface PlaceholderImageProps {
	width: number;
	height: number;
	text?: string;
	className?: string;
	style?: CSSProperties;
}

export function PlaceholderImage({
	width,
	height,
	text = "",
	className = "",
	style = {},
}: PlaceholderImageProps) {
	const bgColor = "#f3f4f6";
	const textColor = "#6b7280";

	return (
		<div
			className={`flex items-center justify-center overflow-hidden ${className}`}
			style={{
				width,
				height,
				backgroundColor: bgColor,
				color: textColor,
				fontSize: Math.min(width, height) * 0.1,
				fontWeight: "bold",
				textAlign: "center",
				...style,
			}}>
			<div className='p-4'>{text}</div>
		</div>
	);
}
