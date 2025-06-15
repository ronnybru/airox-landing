import { Metadata } from "next";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Mail, MessageCircle, Clock, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
	title: "Support - Jack AI",
	description:
		"Get help with Jack AI. Contact our support team for assistance with body scanning, progress tracking, and account issues.",
};

export default function SupportPage() {
	return (
		<div className='min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800'>
			<div className='container mx-auto px-4 py-16 max-w-4xl'>
				{/* Header */}
				<div className='text-center mb-12'>
					<h1 className='text-4xl font-bold text-gray-900 dark:text-white mb-4'>
						Jack AI Support
					</h1>
					<p className='text-xl text-gray-600 dark:text-gray-300'>
						Having trouble? We&apos;re here to help!
					</p>
				</div>

				<div className='grid md:grid-cols-2 gap-8'>
					{/* Contact Form */}
					<Card className='shadow-lg'>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<MessageCircle className='h-5 w-5 text-orange-500' />
								Contact Us
							</CardTitle>
							<CardDescription>
								Send us a message and we&apos;ll get back to you within 24-48
								hours.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form className='space-y-4' action='/api/support' method='POST'>
								<div className='space-y-2'>
									<Label htmlFor='name'>Name</Label>
									<Input
										id='name'
										name='name'
										placeholder='Your full name'
										required
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='email'>Email</Label>
									<Input
										id='email'
										name='email'
										type='email'
										placeholder='your.email@example.com'
										required
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='issue-type'>Issue Type</Label>
									<Select name='issueType' required>
										<SelectTrigger>
											<SelectValue placeholder='Select issue type' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='bug-report'>Bug Report</SelectItem>
											<SelectItem value='feature-request'>
												Feature Request
											</SelectItem>
											<SelectItem value='account-issue'>
												Account Issue
											</SelectItem>
											<SelectItem value='scanning-help'>
												Scanning Help
											</SelectItem>
											<SelectItem value='billing'>
												Billing & Subscription
											</SelectItem>
											<SelectItem value='other'>Other</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='message'>Message</Label>
									<Textarea
										id='message'
										name='message'
										placeholder='Describe your issue or question in detail...'
										rows={5}
										required
									/>
								</div>

								<Button
									type='submit'
									className='w-full bg-orange-500 hover:bg-orange-600'>
									Send Message
								</Button>
							</form>
						</CardContent>
					</Card>

					{/* FAQ & Contact Info */}
					<div className='space-y-6'>
						{/* Quick Contact */}
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Mail className='h-5 w-5 text-orange-500' />
									Quick Contact
								</CardTitle>
							</CardHeader>
							<CardContent className='space-y-3'>
								<div className='flex items-center gap-2'>
									<Mail className='h-4 w-4 text-gray-500' />
									<span className='text-sm'>support@airox.ai</span>
								</div>
								<div className='flex items-center gap-2'>
									<Clock className='h-4 w-4 text-gray-500' />
									<span className='text-sm'>Response time: 24-48 hours</span>
								</div>
							</CardContent>
						</Card>

						{/* FAQ */}
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<HelpCircle className='h-5 w-5 text-orange-500' />
									Frequently Asked Questions
								</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div>
									<h4 className='font-semibold text-sm mb-1'>
										How do I take a better scan?
									</h4>
									<p className='text-sm text-gray-600 dark:text-gray-400'>
										Ensure good lighting, wear fitted clothing, and include your
										full upper body in the frame. Follow the in-app guidance for
										best results.
									</p>
								</div>

								<div>
									<h4 className='font-semibold text-sm mb-1'>
										Why isn&apos;t my scan processing?
									</h4>
									<p className='text-sm text-gray-600 dark:text-gray-400'>
										Scans typically process within 30 seconds. If it takes
										longer, check your internet connection and try again.
									</p>
								</div>

								<div>
									<h4 className='font-semibold text-sm mb-1'>
										How do I cancel my subscription?
									</h4>
									<p className='text-sm text-gray-600 dark:text-gray-400'>
										Go to Settings {">"} Subscription in the app, or manage your
										subscription through the App Store or Google Play.
									</p>
								</div>

								<div>
									<h4 className='font-semibold text-sm mb-1'>
										How do I delete my account?
									</h4>
									<p className='text-sm text-gray-600 dark:text-gray-400'>
										Go to Settings {">"} Delete Account in the app. This will
										permanently remove all your data.
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* App Info */}
				<div className='mt-12 text-center'>
					<p className='text-sm text-gray-500 dark:text-gray-400'>
						Jack AI - AI-powered body progress tracking
					</p>
					<p className='text-xs text-gray-400 dark:text-gray-500 mt-1'>
						Your privacy and data security are our top priorities
					</p>
				</div>
			</div>
		</div>
	);
}
