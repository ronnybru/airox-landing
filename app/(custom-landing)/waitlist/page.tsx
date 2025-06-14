"use client";

import { useState } from "react";
import { H1, H2, Paragraph, Lead, Muted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { ArrowRight, Check, Smartphone } from "lucide-react";

export default function WaitlistPage() {
	const [email, setEmail] = useState("");
	const [name, setName] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError("");

		try {
			const response = await fetch("/api/waitlist", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, name }),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || "Something went wrong");
			}

			setIsSubmitted(true);
		} catch (err: unknown) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to join waitlist. Please try again."
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className='min-h-screen bg-gradient-to-b from-background to-muted/30'>
			<div className='container mx-auto py-12 px-4 max-w-5xl'>
				{/* Main Content - Single Column Layout */}
				<div className='flex flex-col items-center text-center'>
					{/* Pre-headline */}
					<div className='inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-6'>
						<span className='flex h-2 w-2 rounded-full bg-primary mr-2'></span>
						<span>Early Access Available</span>
					</div>

					{/* Main Headline - The ONE Big Idea */}
					<H1 className='mb-6 text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-3xl'>
						Transform Your Body with{" "}
						<span className='text-primary'>Jack AI</span>
					</H1>

					{/* Subheadline that reinforces the main idea */}
					<Lead className='mb-8 max-w-2xl text-xl md:text-2xl'>
						Join the waitlist for early access to Jack AI — the most advanced AI
						body scanning app that tracks your progress and keeps you motivated
						on your fitness journey.
					</Lead>

					{/* Waitlist Form - The Only Action */}
					{!isSubmitted ? (
						<div className='w-full max-w-md bg-background border rounded-lg p-6 shadow-lg'>
							<form onSubmit={handleSubmit} className='space-y-4'>
								<div className='space-y-2 text-left'>
									<Label htmlFor='name'>Your Name</Label>
									<Input
										id='name'
										type='text'
										placeholder='Enter your name'
										value={name}
										onChange={(e) => setName(e.target.value)}
										required
									/>
								</div>
								<div className='space-y-2 text-left'>
									<Label htmlFor='email'>Email Address</Label>
									<Input
										id='email'
										type='email'
										placeholder='you@example.com'
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
									/>
								</div>
								<Button
									type='submit'
									className='w-full text-lg py-6'
									size='lg'
									disabled={isSubmitting}>
									{isSubmitting ? "Joining..." : "Join the Waitlist"}
									<ArrowRight className='ml-2' />
								</Button>

								{error && (
									<div className='text-destructive text-sm mt-2'>{error}</div>
								)}

								<Muted className='text-center mt-4'>
									We&apos;ll notify you when early access is available. No spam,
									ever.
								</Muted>
							</form>
						</div>
					) : (
						<div className='w-full max-w-md bg-background border border-primary/20 rounded-lg p-8 shadow-lg'>
							<div className='flex flex-col items-center'>
								<div className='h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4'>
									<Check className='h-6 w-6 text-primary' />
								</div>
								<H2 className='text-xl border-none pb-0'>
									You&apos;re on the list!
								</H2>
								<Paragraph className='mt-2'>
									Thank you for joining our waitlist. We&apos;ll notify you when
									Jack AI early access is available.
								</Paragraph>
							</div>
						</div>
					)}

					{/* Social Proof - Reinforces Decision */}
					<div className='mt-12 flex flex-col items-center'>
						<div className='flex -space-x-2 mb-4'>
							{[1, 2, 3, 4, 5].map((i) => (
								<div
									key={i}
									className='inline-block h-8 w-8 rounded-full bg-muted overflow-hidden border-2 border-background'>
									<Image
										src={`https://randomuser.me/api/portraits/${i % 2 === 0 ? "men" : "women"}/${i + 10}.jpg`}
										alt='User avatar'
										width={32}
										height={32}
									/>
								</div>
							))}
						</div>
						<Paragraph className='font-medium'>
							<span className='text-primary'>1,000+</span> fitness enthusiasts
							already on the waitlist
						</Paragraph>
					</div>

					{/* Key Benefits - Reinforcing the Main Idea */}
					<div className='mt-16 grid md:grid-cols-3 gap-6 w-full'>
						{[
							{
								title: "AI Body Analysis",
								description:
									"Get instant body composition analysis including muscle mass, body fat percentage, and personalized insights using advanced AI technology.",
							},
							{
								title: "Progress Tracking",
								description:
									"Never lose motivation again with detailed progress charts, photo comparisons, and your personalized Jack Score fitness rating.",
							},
							{
								title: "Stay Motivated",
								description:
									"Automated progress tracking and visual feedback keep you motivated and accountable on your fitness journey.",
							},
						].map((benefit, i) => (
							<div key={i} className='bg-background p-6 rounded-lg border'>
								<h3 className='text-xl font-semibold mb-2'>{benefit.title}</h3>
								<p className='text-muted-foreground'>{benefit.description}</p>
							</div>
						))}
					</div>

					{/* Founder's Story */}
					<div className='mt-16 bg-background border rounded-lg p-8 max-w-2xl'>
						<div className='flex flex-col items-center text-center'>
							<div className='mb-4 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium'>
								Founder&apos;s Story
							</div>
							<Paragraph className='text-lg mb-6'>
								&quot;I was so sick of manually writing and measuring my
								progress and wanted something to be motivated.
								<br />
								<br />
								Every day I&apos;d step on the scale, take progress photos, and
								try to track my workouts in different apps. Nothing gave me the
								complete picture I needed to stay motivated.
								<br />
								<br />
								I wanted something that could instantly tell me if I was making
								real progress — not just weight changes, but actual body
								composition improvements. Something that would keep me
								accountable and motivated even when the scale wasn&apos;t
								moving.
								<br />
								<br />
								That&apos;s why I built Jack AI. It&apos;s the fitness tracking
								app I wish I had from day one.&quot;
							</Paragraph>
							<div className='flex items-center'>
								<div className='h-12 w-12 rounded-full overflow-hidden mr-3 border-2 border-primary/20'>
									<Image
										src='/images/ronny-profile.jpg'
										alt='Ronny Bruknapp'
										width={48}
										height={48}
										unoptimized
										onError={(e) => {
											const target = e.target as HTMLImageElement;
											target.src =
												"https://randomuser.me/api/portraits/men/22.jpg";
										}}
									/>
								</div>
								<div className='text-left'>
									<div className='font-medium'>Ronny Bruknapp</div>
									<Muted>Founder, Jack AI</Muted>
								</div>
							</div>
						</div>
					</div>

					{/* Final CTA - Repeat the Main Action */}
					{!isSubmitted && (
						<div className='mt-16 flex flex-col sm:flex-row gap-4 justify-center'>
							<Button
								onClick={() => document.getElementById("email")?.focus()}
								size='lg'
								className='text-lg py-6 px-8'>
								Join the Waitlist <ArrowRight className='ml-2' />
							</Button>
							<Button
								variant='outline'
								size='lg'
								className='text-lg py-6 px-8'
								asChild>
								<a href='https://apps.apple.com/app/jack-ai' target='_blank'>
									<Smartphone className='mr-2 h-4 w-4' />
									Download Now
								</a>
							</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
