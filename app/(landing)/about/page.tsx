import { H1, H2, H3, Paragraph, Lead } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
	title: "About airox",
	description:
		"Learn about airox, the ultimate Next.js boilerplate designed for developers leveraging AI.",
};

export default function AboutPage() {
	return (
		<div className='container mx-auto py-12 px-4'>
			{/* Hero Section */}
			<section className='py-16 md:py-24'>
				<div className='max-w-3xl mx-auto text-center'>
					<H1 className='mb-6'>About airox</H1>
					<Lead className='mb-8'>
						airox is a comprehensive SaaS boilerplate designed for the new era
						of coding where LLMs are integral to the development process.
					</Lead>
				</div>
			</section>

			{/* Mission Section */}
			<section className='py-12 md:py-16'>
				<div className='grid md:grid-cols-2 gap-12 items-center'>
					<div>
						<H2 className='mb-6'>Our Mission</H2>
						<Paragraph className='mb-4'>
							We believe that AI is transforming how developers build software.
							airox was created to empower developers to focus on their vision
							while AI handles complex tasks such as generating content,
							managing deployments, and automating workflows.
						</Paragraph>
						<Paragraph>
							Our goal is to eliminate common SaaS setup barriers like
							authentication, database configuration, and deployment to
							accelerate your time-to-market. We want you to stay in flow and
							focus on building your unique vision.
						</Paragraph>
					</div>
					<div className='relative aspect-video rounded-lg overflow-hidden'>
						<Image
							src='https://res.cloudinary.com/dsbyq8lkx/image/upload/v1699302784/wxzdfckr0fhdb0uuym5p.jpg'
							alt='airox Mission'
							fill
							sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
							className='object-cover'
						/>
					</div>
				</div>
			</section>

			{/* Core Features Section */}
			<section className='py-12 md:py-16 bg-muted/30 rounded-lg'>
				<div className='max-w-3xl mx-auto text-center mb-12'>
					<H2 className='mb-4'>Core Features</H2>
					<Lead>
						airox is built with a focus on developer experience and AI
						integration.
					</Lead>
				</div>

				<div className='grid md:grid-cols-2 gap-8 max-w-4xl mx-auto'>
					<div className='p-6 bg-background rounded-lg border'>
						<H3 className='mb-4'>AI-First Architecture</H3>
						<Paragraph>
							Built with clean, LLM-friendly code that enables AI agents to
							understand and modify the codebase effectively. Designed for
							seamless integration with your favorite AI models and services.
						</Paragraph>
					</div>

					<div className='p-6 bg-background rounded-lg border'>
						<H3 className='mb-4'>Rapid Launch System</H3>
						<Paragraph>
							Eliminates common SaaS setup barriers (authentication, database
							configuration, deployment) to accelerate time-to-market. Get your
							MVP up and running in days, not weeks.
						</Paragraph>
					</div>

					<div className='p-6 bg-background rounded-lg border'>
						<H3 className='mb-4'>Full-Stack Solution</H3>
						<Paragraph>
							Includes everything from frontend components to backend services,
							cron jobs, queues, and database setup. A complete solution for
							modern SaaS applications.
						</Paragraph>
					</div>

					<div className='p-6 bg-background rounded-lg border'>
						<H3 className='mb-4'>Deployment Options</H3>
						<Paragraph>
							One-click deployment to Vercel or self-hosted Docker environments.
							Deploy your SaaS with confidence and scale as your user base
							grows.
						</Paragraph>
					</div>
				</div>
			</section>

			{/* Founder's Vision */}
			<section className='py-12 md:py-16'>
				<div className='max-w-3xl mx-auto'>
					<div className='flex flex-col md:flex-row gap-8 items-center mb-8'>
						<div className='w-32 h-32 rounded-full overflow-hidden relative flex-shrink-0'>
							<Image
								src='https://randomuser.me/api/portraits/men/22.jpg'
								alt='Ronny Bruknapp'
								fill
								className='object-cover'
							/>
						</div>
						<div>
							<H2 className='mb-2'>Founder&apos;s Vision</H2>
							<Paragraph className='text-lg font-medium mb-2'>
								Ronny Bruknapp, Founder of airox
							</Paragraph>
						</div>
					</div>

					<div className='bg-primary/5 border border-primary/20 rounded-lg p-6 md:p-8'>
						<Paragraph className='italic mb-4'>
							&ldquo;I poured thousands of dollars into API access and spent
							years fine-tuning how to code with AI—not just alongside it. I
							started learning to code one year before GPT-4 dropped, giving me
							a front-row seat to this revolution. airox is the result of
							obsession, battle-tested workflows, and a belief that LLMs
							aren&apos;t just tools—they&apos;re teammates. This is the
							framework I wish existed when I started. Now it&apos;s
							yours.&rdquo;
						</Paragraph>
					</div>
				</div>
			</section>

			{/* Tech Stack */}
			<section className='py-12 md:py-16'>
				<div className='max-w-3xl mx-auto'>
					<H2 className='mb-8 text-center'>Our Tech Stack</H2>

					<div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
						<div className='p-4 text-center'>
							<div className='text-3xl mb-2'>⚛️</div>
							<H3 className='text-lg mb-1'>Next.js 15</H3>
							<Paragraph className='text-sm text-muted-foreground'>
								With React 19
							</Paragraph>
						</div>

						<div className='p-4 text-center'>
							<div className='text-3xl mb-2'>🎨</div>
							<H3 className='text-lg mb-1'>Tailwind CSS</H3>
							<Paragraph className='text-sm text-muted-foreground'>
								Modern styling
							</Paragraph>
						</div>

						<div className='p-4 text-center'>
							<div className='text-3xl mb-2'>🔒</div>
							<H3 className='text-lg mb-1'>Auth System</H3>
							<Paragraph className='text-sm text-muted-foreground'>
								Secure & flexible
							</Paragraph>
						</div>

						<div className='p-4 text-center'>
							<div className='text-3xl mb-2'>🗃️</div>
							<H3 className='text-lg mb-1'>PostgreSQL</H3>
							<Paragraph className='text-sm text-muted-foreground'>
								With Drizzle ORM
							</Paragraph>
						</div>

						<div className='p-4 text-center'>
							<div className='text-3xl mb-2'>📧</div>
							<H3 className='text-lg mb-1'>Email System</H3>
							<Paragraph className='text-sm text-muted-foreground'>
								Transactional & marketing
							</Paragraph>
						</div>

						<div className='p-4 text-center'>
							<div className='text-3xl mb-2'>⏱️</div>
							<H3 className='text-lg mb-1'>Background Jobs</H3>
							<Paragraph className='text-sm text-muted-foreground'>
								BullMQ & node-cron
							</Paragraph>
						</div>

						<div className='p-4 text-center'>
							<div className='text-3xl mb-2'>💳</div>
							<H3 className='text-lg mb-1'>Payments</H3>
							<Paragraph className='text-sm text-muted-foreground'>
								LemonSqueezy integration
							</Paragraph>
						</div>

						<div className='p-4 text-center'>
							<div className='text-3xl mb-2'>🔔</div>
							<H3 className='text-lg mb-1'>Notifications</H3>
							<Paragraph className='text-sm text-muted-foreground'>
								In-app & email
							</Paragraph>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className='py-16 text-center'>
				<div className='max-w-2xl mx-auto'>
					<H2 className='mb-4'>Ready to Get Started?</H2>
					<Paragraph className='mb-8'>
						Join hundreds of developers building the future with airox. Get
						started today and launch your AI-powered SaaS faster.
					</Paragraph>
					<div className='flex flex-col sm:flex-row justify-center gap-4'>
						<Button size='lg' asChild>
							<Link href='/'>Get airox</Link>
						</Button>
						<Button variant='outline' size='lg' asChild>
							<Link href='/contact'>
								Contact Us <ArrowRight className='ml-2 h-4 w-4' />
							</Link>
						</Button>
					</div>
				</div>
			</section>
		</div>
	);
}
