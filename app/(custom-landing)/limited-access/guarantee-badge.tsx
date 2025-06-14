import React from "react";
import { Shield } from "lucide-react";
import { H3, Paragraph } from "@/components/ui/typography";

interface GuaranteeBadgeProps {
	days: number;
}

export default function GuaranteeBadge({ days }: GuaranteeBadgeProps) {
	return (
		<div className='flex flex-col md:flex-row items-center justify-center gap-6 p-6 border border-primary/20 rounded-lg bg-primary/5'>
			{/* Badge/Seal */}
			<div className='flex-shrink-0 w-24 h-24 rounded-full bg-background border-4 border-primary flex items-center justify-center shadow-lg'>
				<Shield className='h-12 w-12 text-primary' />
			</div>

			{/* Guarantee Text */}
			<div className='text-center md:text-left'>
				<H3 className='text-xl md:text-2xl font-bold text-primary'>
					{days}-Day Money-Back Guarantee
				</H3>
				<Paragraph className='text-muted-foreground'>
					Try airox risk-free. If you&apos;re not completely satisfied within{" "}
					{days} days, we&apos;ll refund your purchase. No questions asked.
				</Paragraph>
			</div>
		</div>
	);
}
