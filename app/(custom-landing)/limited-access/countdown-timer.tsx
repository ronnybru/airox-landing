"use client";

import React, { useState, useEffect } from "react";
import { H3 } from "@/components/ui/typography";

interface CountdownTimerProps {
	endDate: Date;
	message: string;
}

interface TimeLeft {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
}

export default function CountdownTimer({
	endDate,
	message,
}: CountdownTimerProps) {
	const [timeLeft, setTimeLeft] = useState<TimeLeft>({
		days: 0,
		hours: 0,
		minutes: 0,
		seconds: 0,
	});

	useEffect(() => {
		// Calculate time left
		const calculateTimeLeft = () => {
			const difference = endDate.getTime() - new Date().getTime();

			if (difference <= 0) {
				// Timer has expired
				setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
				return;
			}

			// Calculate time units
			const days = Math.floor(difference / (1000 * 60 * 60 * 24));
			const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
			const minutes = Math.floor((difference / 1000 / 60) % 60);
			const seconds = Math.floor((difference / 1000) % 60);

			setTimeLeft({ days, hours, minutes, seconds });
		};

		// Initial calculation
		calculateTimeLeft();

		// Set up interval to update every second
		const timer = setInterval(calculateTimeLeft, 1000);

		// Clean up interval on unmount
		return () => clearInterval(timer);
	}, [endDate]);

	// Time unit display component
	const TimeUnit = ({ value, label }: { value: number; label: string }) => (
		<div className='flex flex-col items-center'>
			<div className='bg-primary text-primary-foreground text-2xl md:text-3xl font-bold rounded-md px-4 py-3 min-w-[70px] text-center'>
				{value.toString().padStart(2, "0")}
			</div>
			<span className='text-xs mt-1 text-muted-foreground'>{label}</span>
		</div>
	);

	return (
		<div className='w-full bg-muted/20 border border-primary/10 rounded-lg p-6 text-center'>
			<H3 className='mb-4 text-primary'>{message}</H3>
			<div className='flex justify-center gap-4'>
				<TimeUnit value={timeLeft.days} label='Days' />
				<TimeUnit value={timeLeft.hours} label='Hours' />
				<TimeUnit value={timeLeft.minutes} label='Minutes' />
				<TimeUnit value={timeLeft.seconds} label='Seconds' />
			</div>
		</div>
	);
}
