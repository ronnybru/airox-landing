"use client";

import React, { useState } from "react";
import { H1, H2, Paragraph, Lead } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import CountdownTimer from "./countdown-timer";
import TestimonialCard from "./testimonial-card";
import GuaranteeBadge from "./guarantee-badge";
import LeadCaptureForm from "./lead-capture-form";

export default function LimitedAccessPage() {
	const [isSubmitted, setIsSubmitted] = useState(false);

	// Limited spots available - for scarcity
	const totalSpots = 20;
	const spotsRemaining = 7; // Set to a low number to create urgency

	// Handle form submission
	const handleFormSubmit = (email: string, name: string) => {
		// In a real implementation, you would send this data to your backend
		console.log("Form submitted with:", { email, name });
		setIsSubmitted(true);
	};

	// Calculate end date for countdown timer (7 days from now)
	const endDate = new Date();
	endDate.setDate(endDate.getDate() + 7);

	return (
		<div className='min-h-screen bg-background'>
			<div className='container mx-auto py-12 px-4 max-w-5xl'>
				{/* Main Content - Single Column Layout */}
				<div className='flex flex-col items-center'>
					{/* Pre-headline - Limited Spots */}
					<div className='inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-6'>
						<span className='flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse'></span>
						<span>
							Only {spotsRemaining} of {totalSpots} Spots Remaining
						</span>
					</div>

					{/* Main Headline */}
					<H1 className='mb-6 text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-3xl text-center'>
						Build Your SaaS <span className='text-primary'>10x Faster</span>{" "}
						With AI Agents
					</H1>

					{/* Subheadline */}
					<Lead className='mb-8 max-w-2xl text-xl md:text-2xl text-center'>
						Skip the database headaches, auth complexity, and deployment
						struggles. From idea to revenue in record time with airox.
					</Lead>

					{/* YouTube Video */}
					<div className='w-full max-w-3xl mb-10'>
						<div className='aspect-video rounded-lg overflow-hidden border shadow-xl'>
							<iframe
								width='100%'
								height='100%'
								src='https://www.youtube.com/embed/rhwtAbXsesw?si=pUBPKjp3n_7rA5mV'
								title='airox Demo'
								frameBorder='0'
								allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
								allowFullScreen
								className='aspect-video'></iframe>
						</div>
					</div>

					{/* Countdown Timer with Scarcity */}
					<div className='w-full max-w-2xl mb-6'>
						<CountdownTimer
							endDate={endDate}
							message='Special Launch Offer Ends In:'
						/>
					</div>

					{/* Scarcity Indicator */}
					<div className='w-full max-w-2xl mb-12 bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center'>
						<h3 className='text-lg font-bold text-destructive mb-1'>
							Limited Availability Alert
						</h3>
						<p className='text-muted-foreground'>
							We&apos;re only accepting{" "}
							<span className='font-bold text-destructive'>{totalSpots}</span>{" "}
							members in this batch to ensure we can provide exceptional support
							and follow-up on feedback. Only{" "}
							<span className='font-bold text-destructive'>
								{spotsRemaining}
							</span>{" "}
							spots remaining!
						</p>
					</div>

					{/* Lead Capture Form */}
					{!isSubmitted ? (
						<div className='w-full max-w-md bg-background border rounded-lg p-6 shadow-lg mb-12'>
							<LeadCaptureForm
								onSubmit={handleFormSubmit}
								totalSpots={totalSpots}
								spotsRemaining={spotsRemaining}
							/>
						</div>
					) : (
						<div className='w-full max-w-md bg-background border border-primary/20 rounded-lg p-8 shadow-lg mb-12'>
							<div className='flex flex-col items-center'>
								<div className='h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4'>
									<Check className='h-6 w-6 text-primary' />
								</div>
								<H2 className='text-xl border-none pb-0'>
									You&apos;re all set!
								</H2>
								<Paragraph className='mt-2 text-center'>
									Thank you for your interest. We&apos;ll be in touch shortly
									with your exclusive access.
								</Paragraph>
							</div>
						</div>
					)}

					{/* Key Benefits */}
					<div className='grid md:grid-cols-3 gap-6 w-full mb-12'>
						{[
							{
								title: "AI-First Architecture",
								description:
									"Built with clean, LLM-friendly code that enables AI agents to understand and modify the codebase effectively.",
							},
							{
								title: "Rapid Launch System",
								description:
									"Eliminates common SaaS setup barriers to accelerate your time-to-market and start generating revenue faster.",
							},
							{
								title: "Full-Stack Solution",
								description:
									"Includes everything from frontend components to backend services, cron jobs, queues, and database setup.",
							},
						].map((benefit, i) => (
							<div
								key={i}
								className='bg-background p-6 rounded-lg border hover:shadow-md transition-shadow'>
								<h3 className='text-xl font-semibold mb-2'>{benefit.title}</h3>
								<p className='text-muted-foreground'>{benefit.description}</p>
							</div>
						))}
					</div>

					{/* Testimonials */}
					<div className='w-full mb-12'>
						<H2 className='text-center mb-8'>What Our Customers Say</H2>
						<div className='grid md:grid-cols-3 gap-6'>
							<TestimonialCard
								quote='I tried other boilerplates but hit a wall when I needed database integration. airox just worked, and the AI agent compatibility saved me weeks of coding.'
								author='Arild Johansen'
								role='CSO, TechVentures'
								imageSrc='https://randomuser.me/api/portraits/men/32.jpg'
							/>
							<TestimonialCard
								quote='The LLM-friendly codebase means my AI agent can write blog posts, handle business logic, and even deploy updates with minimal supervision.'
								author='Maria Nordmann'
								role='Founder, AI Solutions'
								imageSrc='https://randomuser.me/api/portraits/women/44.jpg'
							/>
							<TestimonialCard
								quote="As a non-technical founder, this is a game-changer. I'm building and learning simultaneously, with AI doing the heavy lifting."
								author='Thomas Berg'
								role='Serial Entrepreneur'
								imageSrc='https://randomuser.me/api/portraits/men/22.jpg'
							/>
						</div>
					</div>

					{/* Money-back Guarantee */}
					<div className='w-full max-w-2xl mb-12'>
						<GuaranteeBadge days={30} />
					</div>

					{/* Final CTA */}
					{!isSubmitted && (
						<div className='w-full max-w-md bg-background border rounded-lg p-6 shadow-lg mb-12'>
							<div className='text-center mb-6'>
								<H2 className='text-2xl border-none pb-0'>
									Ready to Build Your SaaS?
								</H2>
								<Paragraph className='text-muted-foreground'>
									Only {spotsRemaining} of {totalSpots} spots remaining - Secure
									yours now!
								</Paragraph>
							</div>
							<Button
								onClick={() => document.getElementById("email")?.focus()}
								size='lg'
								className='w-full text-lg py-6'>
								Get Started Now <ArrowRight className='ml-2' />
							</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
