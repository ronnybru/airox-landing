"use client";

import { H1, H2, H3, Paragraph, Lead, Muted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Star, Brain, Rocket, Code, Zap, Users, Shield } from "lucide-react";

export default function Home() {
	return (
		<div className='container mx-auto py-12 px-4'>
			{/* Hero Section - Conversion Focused */}
			<section className='py-16 md:py-24'>
				<div className='grid md:grid-cols-2 gap-12 items-center'>
					<div className='space-y-6'>
						<div className='inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium'>
							<span className='flex h-2 w-2 rounded-full bg-primary mr-2'></span>
							<span>AI-First Development Firm</span>
						</div>
						<H1 className='mb-4 text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight'>
							Grow Your Business with{" "}
							<span className='text-primary'>AI Done Right</span>
						</H1>
						<Lead className='mb-6'>
							We&apos;re Airox.ai - the AI-first development house that
							transforms businesses through intelligent automation, custom AI
							solutions, and cutting-edge technology. Make AI the right way to
							scale your operations and accelerate growth.
						</Lead>
						<div className='flex flex-col sm:flex-row gap-4'>
							<Button
								size='lg'
								asChild
								className='bg-primary/90 hover:bg-primary'>
								<Link href='/contact'>
									<Rocket className='mr-2 h-4 w-4' />
									Start Your AI Journey
								</Link>
							</Button>
							<Button variant='outline' size='lg' asChild>
								<Link href='/about'>
									<Brain className='mr-2 h-4 w-4' />
									Learn About Our Approach
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
											}/${i + 20}.jpg`}
											alt='Client avatar'
											width={32}
											height={32}
										/>
									</div>
								))}
							</div>
							<Paragraph className='text-sm'>
								<span className='font-medium'>50+</span> businesses transformed
								with AI solutions
							</Paragraph>
						</div>
					</div>
					<div className='relative'>
						<div className='aspect-square max-w-lg mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl p-8 flex items-center justify-center'>
							<div className='text-center space-y-4'>
								<Brain className='h-24 w-24 mx-auto text-primary' />
								<H3 className='text-2xl font-bold'>AI-Powered Solutions</H3>
								<Paragraph className='text-muted-foreground'>
									Custom AI development tailored to your business needs
								</Paragraph>
							</div>
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
								<span className='text-sm font-medium'>
									5.0 client satisfaction
								</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Services Section - Benefit Focused */}
			<section className='py-16 md:py-24'>
				<div className='text-center mb-16'>
					<H2 className='mb-4'>AI Solutions That Drive Real Results</H2>
					<Lead className='max-w-2xl mx-auto'>
						We specialize in building custom AI solutions that automate
						processes, enhance decision-making, and unlock new growth
						opportunities for your business.
					</Lead>
				</div>

				<div className='grid md:grid-cols-3 gap-8'>
					{[
						{
							icon: <Brain className='h-8 w-8 text-primary' />,
							title: "Custom AI Development",
							description:
								"Tailored AI solutions built specifically for your business needs. From machine learning models to intelligent automation systems.",
						},
						{
							icon: <Code className='h-8 w-8 text-primary' />,
							title: "AI Integration Services",
							description:
								"Seamlessly integrate AI capabilities into your existing systems and workflows without disrupting your operations.",
						},
						{
							icon: <Zap className='h-8 w-8 text-primary' />,
							title: "Process Automation",
							description:
								"Automate repetitive tasks and complex workflows with intelligent systems that learn and adapt to your business patterns.",
						},
						{
							icon: <Users className='h-8 w-8 text-primary' />,
							title: "AI Strategy Consulting",
							description:
								"Get expert guidance on AI adoption, implementation roadmaps, and strategic planning to maximize your AI investment.",
						},
						{
							icon: <Rocket className='h-8 w-8 text-primary' />,
							title: "Scalable AI Infrastructure",
							description:
								"Build robust, scalable AI systems that grow with your business and handle increasing data volumes and complexity.",
						},
						{
							icon: <Shield className='h-8 w-8 text-primary' />,
							title: "Secure & Compliant AI",
							description:
								"Enterprise-grade security and compliance built into every AI solution, ensuring your data stays protected and private.",
						},
					].map((service, i) => (
						<div
							key={i}
							className='p-6 border rounded-lg bg-card hover:shadow-md transition-shadow'>
							<div className='mb-4'>{service.icon}</div>
							<H3 className='mb-2 text-xl'>{service.title}</H3>
							<Paragraph className='text-muted-foreground'>
								{service.description}
							</Paragraph>
						</div>
					))}
				</div>
			</section>

			{/* Client Success Stories */}
			<section className='py-16 md:py-24 bg-muted/30 rounded-lg'>
				<div className='text-center mb-16'>
					<H2 className='mb-4'>Transforming Businesses with AI</H2>
					<Lead className='max-w-2xl mx-auto'>
						See how our AI solutions are helping businesses automate processes,
						increase efficiency, and accelerate growth across industries.
					</Lead>
				</div>

				<div className='grid md:grid-cols-3 gap-8 max-w-5xl mx-auto'>
					{[
						{
							quote:
								"Airox.ai transformed our customer service with intelligent automation. We reduced response times by 80% and increased customer satisfaction significantly.",
							author: "Jennifer Martinez",
							role: "CTO, TechFlow Solutions",
						},
						{
							quote:
								"The custom AI model they built for our inventory management has saved us over $200K annually. Their expertise in AI implementation is unmatched.",
							author: "Michael Thompson",
							role: "Operations Director, RetailMax",
						},
						{
							quote:
								"Working with Airox.ai was a game-changer. They didn&apos;t just build AI tools - they redesigned our entire workflow to be AI-first. Revenue increased 40%.",
							author: "Sarah Kim",
							role: "CEO, DataDriven Analytics",
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
					<H2 className='mb-4'>Ready to Transform Your Business with AI?</H2>
					<Lead className='mb-8'>
						Join forward-thinking companies that are already leveraging AI to
						automate processes, enhance decision-making, and accelerate growth.
						Let&apos;s discuss how we can build the perfect AI solution for your
						business.
					</Lead>
					<div className='flex flex-col sm:flex-row justify-center gap-4'>
						<Button
							size='lg'
							asChild
							className='bg-primary/90 hover:bg-primary'>
							<Link href='/contact'>
								<Rocket className='mr-2 h-4 w-4' />
								Get Started Today
							</Link>
						</Button>
						<Button variant='outline' size='lg' asChild>
							<Link href='/about'>
								<Brain className='mr-2 h-4 w-4' />
								Learn More About Us
							</Link>
						</Button>
					</div>
					<Paragraph className='text-sm text-muted-foreground mt-4'>
						Free consultation • Custom AI solutions • Enterprise-grade security
					</Paragraph>
				</div>
			</section>
		</div>
	);
}
