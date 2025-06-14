import React from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import { Muted } from "@/components/ui/typography";

interface TestimonialCardProps {
	quote: string;
	author: string;
	role: string;
	imageSrc: string;
}

export default function TestimonialCard({
	quote,
	author,
	role,
	imageSrc,
}: TestimonialCardProps) {
	return (
		<div className='p-6 border rounded-lg bg-background hover:shadow-md transition-shadow'>
			<div className='flex flex-col h-full'>
				{/* Star Rating */}
				<div className='mb-4'>
					{[1, 2, 3, 4, 5].map((star) => (
						<Star
							key={star}
							className='inline-block h-4 w-4 fill-primary text-primary'
						/>
					))}
				</div>

				{/* Quote */}
				<p className='italic mb-4 flex-grow text-muted-foreground'>
					&ldquo;{quote}&rdquo;
				</p>

				{/* Author Info */}
				<div className='flex items-center mt-4'>
					<div className='h-10 w-10 rounded-full overflow-hidden mr-3 border'>
						<Image
							src={imageSrc}
							alt={author}
							width={40}
							height={40}
							className='object-cover'
						/>
					</div>
					<div>
						<div className='font-medium'>{author}</div>
						<Muted>{role}</Muted>
					</div>
				</div>
			</div>
		</div>
	);
}
