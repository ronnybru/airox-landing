"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import { Muted } from "@/components/ui/typography";

interface LeadCaptureFormProps {
	onSubmit: (email: string, name: string) => void;
	totalSpots?: number;
	spotsRemaining?: number;
}

export default function LeadCaptureForm({
	onSubmit,
	totalSpots = 20,
	spotsRemaining = 7,
}: LeadCaptureFormProps) {
	const [email, setEmail] = useState("");
	const [name, setName] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError("");

		try {
			// Basic validation
			if (!email.trim() || !name.trim()) {
				throw new Error("Please fill in all fields");
			}

			// Email format validation
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				throw new Error("Please enter a valid email address");
			}

			// Call the onSubmit callback
			onSubmit(email, name);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "An error occurred");
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className='space-y-4'>
			<div className='text-center mb-4'>
				<h3 className='text-xl font-bold'>Secure Your Spot Now</h3>
				<div className='flex items-center justify-center gap-2 mt-1'>
					<span className='inline-block h-2 w-2 bg-destructive rounded-full animate-pulse'></span>
					<Muted>
						Only {spotsRemaining} of {totalSpots} spots remaining
					</Muted>
				</div>
			</div>

			<div className='space-y-2'>
				<Label htmlFor='name'>Your Name</Label>
				<Input
					id='name'
					type='text'
					placeholder='Enter your name'
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
					className='h-12'
				/>
			</div>

			<div className='space-y-2'>
				<Label htmlFor='email'>Email Address</Label>
				<Input
					id='email'
					type='email'
					placeholder='you@example.com'
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					className='h-12'
				/>
			</div>

			<Button
				type='submit'
				className='w-full text-lg py-6 bg-destructive hover:bg-destructive/90 text-destructive-foreground'
				size='lg'
				disabled={isSubmitting}>
				{isSubmitting
					? "Processing..."
					: `Reserve Your Spot (${spotsRemaining} Left)`}
				<ArrowRight className='ml-2' />
			</Button>

			{error && (
				<div className='text-destructive text-sm mt-2 text-center'>{error}</div>
			)}

			<div className='text-center'>
				<Muted className='text-xs'>
					By submitting this form, you agree to our{" "}
					<span className='underline cursor-pointer'>Privacy Policy</span> and{" "}
					<span className='underline cursor-pointer'>Terms of Service</span>.
				</Muted>
				<p className='text-xs text-destructive mt-2 font-medium'>
					* Due to high demand, spots may fill up quickly
				</p>
			</div>
		</form>
	);
}
