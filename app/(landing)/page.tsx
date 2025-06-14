"use client";

import { H1, H2, H3, Paragraph, Lead, Muted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Star, Smartphone } from "lucide-react";

export default function Home() {
	return (
		<div className='container mx-auto py-12 px-4'>
			{/* Hero Section - Conversion Focused */}
			<section className='py-16 md:py-24'>
				<div className='grid md:grid-cols-2 gap-12 items-center'>
					<div className='space-y-6'>
						<div className='inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium'>
							<span className='flex h-2 w-2 rounded-full bg-primary mr-2'></span>
							<span>AI-Powered Body Analysis</span>
						</div>
						<H1 className='mb-4 text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight'>
							Transform Your Body with{" "}
							<span className='text-primary'>Jack AI</span>
						</H1>
						<Lead className='mb-6'>
							The most advanced AI body scanning app for iOS and Android. Get
							instant body composition analysis, track your progress, and
							achieve your fitness goals with personalized insights.
						</Lead>
						<div className='flex flex-col sm:flex-row gap-4'>
							<Button
								size='lg'
								asChild
								className='bg-primary/90 hover:bg-primary'>
								<Link href='https://apps.apple.com/app/jack-ai' target='_blank'>
									<Smartphone className='mr-2 h-4 w-4' />
									Download for iOS
								</Link>
							</Button>
							<Button variant='outline' size='lg' asChild>
								<Link
									href='https://play.google.com/store/apps/details?id=com.airox'
									target='_blank'>
									<Smartphone className='mr-2 h-4 w-4' />
									Download for Android
								</Link>
							</Button>
						</div>
						<div className='flex items-center gap-2 pt-4'>
							<div className='flex -space-x-2'>
								{[1, 2, 3, 4].map((i) => (
									<div
										key={i}
										className='inline-block h-8 w-8 rounded-full bg-muted overflow-hidden border-2 border-background'>
										<Image
											src={`https://randomuser.me/api/portraits/${
												i % 2 === 0 ? "men" : "women"
											}/${i + 10}.jpg`}
											alt='User avatar'
											width={32}
											height={32}
										/>
									</div>
								))}
							</div>
							<Paragraph className='text-sm'>
								<span className='font-medium'>10,000+</span> users tracking
								their fitness journey
							</Paragraph>
						</div>
					</div>
					<div className='relative'>
						<div className='aspect-[9/16] max-w-sm mx-auto'>
							<Image
								src='/scan-raport-male-flexing-one-arm.webp'
								alt='Jack AI Body Scan Analysis'
								fill
								sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
								priority
								className='object-contain'
							/>
						</div>
						<div className='absolute -bottom-6 -left-6 bg-background rounded-lg p-4 shadow-lg border hidden md:block'>
							<div className='flex items-center gap-2'>
								<div className='flex items-center'>
									{[1, 2, 3, 4, 5].map((i) => (
										<Star
											key={i}
											className='h-4 w-4 fill-primary text-primary'
										/>
									))}
								</div>
								<span className='text-sm font-medium'>4.8 rating</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section - Benefit Focused */}
			<section className='py-16 md:py-24'>
				<div className='text-center mb-16'>
					<H2 className='mb-4'>Advanced AI Body Analysis</H2>
					<Lead className='max-w-2xl mx-auto'>
						Get instant insights into your body composition, track your progress
						over time, and receive personalized recommendations to achieve your
						fitness goals.
					</Lead>
				</div>

				<div className='grid md:grid-cols-3 gap-8'>
					{[
						{
							title: "AI Body Scanning",
							description:
								"Take a photo and get instant analysis of your body fat percentage, muscle mass, and overall body composition using advanced AI technology.",
						},
						{
							title: "Progress Tracking",
							description:
								"Monitor your fitness journey with detailed charts, progress photos, and comprehensive analytics to see how your body changes over time.",
						},
						{
							title: "Jack Score",
							description:
								"Get a personalized fitness score that takes into account your body composition, symmetry, posture, and overall health metrics.",
						},
						{
							title: "Health Integration",
							description:
								"Sync with Apple Health and Google Fit to get a complete picture of your health data including heart rate, sleep, and activity levels.",
						},
						{
							title: "Personalized Insights",
							description:
								"Receive AI-powered recommendations and insights tailored to your specific body type, goals, and progress patterns.",
						},
						{
							title: "Privacy First",
							description:
								"Your body scan data is processed securely and privately. We prioritize your privacy and data security above all else.",
						},
					].map((feature, i) => (
						<div
							key={i}
							className='p-6 border rounded-lg bg-card hover:shadow-md transition-shadow'>
							<H3 className='mb-2 text-xl'>{feature.title}</H3>
							<Paragraph className='text-muted-foreground'>
								{feature.description}
							</Paragraph>
						</div>
					))}
				</div>
			</section>

			{/* Testimonials */}
			<section className='py-16 md:py-24 bg-muted/30 rounded-lg'>
				<div className='text-center mb-16'>
					<H2 className='mb-4'>Real Results from Real Users</H2>
					<Lead className='max-w-2xl mx-auto'>
						See how Jack AI is helping people transform their bodies and achieve
						their fitness goals.
					</Lead>
				</div>

				<div className='grid md:grid-cols-3 gap-8 max-w-5xl mx-auto'>
					{[
						{
							quote:
								"Plateaued for years. This app got me fired up again — now I'm seeing gains I thought were behind me. The AI analysis is incredibly accurate!",
							author: "Marcus Johnson",
							role: "Fitness Enthusiast",
						},
						{
							quote:
								"The body composition tracking is amazing. I can finally see my muscle gain and fat loss progress in real numbers, not just the scale.",
							author: "Sarah Chen",
							role: "Personal Trainer",
						},
						{
							quote:
								"As someone who travels a lot, having my entire fitness tracking in one app that works anywhere is a game-changer. The Jack Score keeps me motivated.",
							author: "David Rodriguez",
							role: "Business Executive",
						},
					].map((testimonial, i) => (
						<div key={i} className='p-6 border rounded-lg bg-background'>
							<div className='flex flex-col h-full'>
								<div className='mb-4'>
									{[1, 2, 3, 4, 5].map((star) => (
										<Star
											key={star}
											className='inline-block h-4 w-4 fill-primary text-primary'
										/>
									))}
								</div>
								<Paragraph className='italic mb-4 flex-grow'>
									&ldquo;{testimonial.quote}&rdquo;
								</Paragraph>
								<div>
									<div className='font-medium'>{testimonial.author}</div>
									<Muted>{testimonial.role}</Muted>
								</div>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Final CTA Section */}
			<section className='py-16 md:py-24 text-center'>
				<div className='max-w-3xl mx-auto'>
					<H2 className='mb-4'>Ready to Transform Your Body?</H2>
					<Lead className='mb-8'>
						Join thousands of users who are already using Jack AI to track their
						fitness progress and achieve their body goals. Download now and
						start your 3-day free trial.
					</Lead>
					<div className='flex flex-col sm:flex-row justify-center gap-4'>
						<Button
							size='lg'
							asChild
							className='bg-primary/90 hover:bg-primary'>
							<Link href='https://apps.apple.com/app/jack-ai' target='_blank'>
								<Smartphone className='mr-2 h-4 w-4' />
								Download for iOS
							</Link>
						</Button>
						<Button variant='outline' size='lg' asChild>
							<Link
								href='https://play.google.com/store/apps/details?id=com.airox'
								target='_blank'>
								<Smartphone className='mr-2 h-4 w-4' />
								Download for Android
							</Link>
						</Button>
					</div>
					<Paragraph className='text-sm text-muted-foreground mt-4'>
						Available on iOS and Android • 3-day free trial • No credit card
						required
					</Paragraph>
				</div>
			</section>
		</div>
	);
}
