"use client";

import { H1, H2, Paragraph, Lead } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";

// Form validation schema
const formSchema = z.object({
	name: z.string().min(2, {
		message: "Name must be at least 2 characters.",
	}),
	email: z.string().email({
		message: "Please enter a valid email address.",
	}),
	subject: z.string().min(5, {
		message: "Subject must be at least 5 characters.",
	}),
	message: z.string().min(10, {
		message: "Message must be at least 10 characters.",
	}),
});

export default function ContactPage() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	// Initialize form
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			email: "",
			subject: "",
			message: "",
		},
	});

	// Form submission handler
	function onSubmit(values: z.infer<typeof formSchema>) {
		setIsSubmitting(true);

		// Simulate API call
		setTimeout(() => {
			console.log(values);
			setIsSubmitting(false);
			setIsSuccess(true);
			form.reset();

			// Reset success message after 5 seconds
			setTimeout(() => {
				setIsSuccess(false);
			}, 5000);
		}, 1500);
	}

	return (
		<div className='container mx-auto py-12 px-4'>
			{/* Hero Section */}
			<section className='py-16 md:py-24'>
				<div className='max-w-3xl mx-auto text-center'>
					<H1 className='mb-6'>Contact Us</H1>
					<Lead className='mb-8'>
						Have questions about airox? We&apos;re here to help. Reach out to
						our team and we&apos;ll get back to you as soon as possible.
					</Lead>
				</div>
			</section>

			{/* Contact Form and Info */}
			<section className='py-12'>
				<div className='grid md:grid-cols-3 gap-12 max-w-5xl mx-auto'>
					{/* Contact Information */}
					<div className='space-y-8'>
						<div>
							<H2 className='mb-6'>Get in Touch</H2>
							<Paragraph className='text-muted-foreground'>
								We&apos;d love to hear from you. Fill out the form or contact us
								directly using the information below.
							</Paragraph>
						</div>

						<div className='space-y-4'>
							<div className='flex items-start gap-3'>
								<Mail className='h-5 w-5 text-primary mt-1' />
								<div>
									<div className='font-medium'>Email</div>
									<a
										href='mailto:hello@airox.com'
										className='text-sm text-muted-foreground hover:text-primary transition-colors'>
										hello@airox.com
									</a>
								</div>
							</div>

							<div className='flex items-start gap-3'>
								<MapPin className='h-5 w-5 text-primary mt-1' />
								<div>
									<div className='font-medium'>Location</div>
									<div className='text-sm text-muted-foreground'>
										Oslo, Norway
									</div>
								</div>
							</div>

							<div className='flex items-start gap-3'>
								<Phone className='h-5 w-5 text-primary mt-1' />
								<div>
									<div className='font-medium'>Phone</div>
									<a
										href='tel:+4712345678'
										className='text-sm text-muted-foreground hover:text-primary transition-colors'>
										+47 123 45 678
									</a>
								</div>
							</div>
						</div>
					</div>

					{/* Contact Form */}
					<div className='md:col-span-2'>
						<div className='bg-card border rounded-lg p-6 md:p-8'>
							{isSuccess ? (
								<div className='text-center py-8'>
									<div className='inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4'>
										<svg
											xmlns='http://www.w3.org/2000/svg'
											fill='none'
											viewBox='0 0 24 24'
											strokeWidth={1.5}
											stroke='currentColor'
											className='w-6 h-6'>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												d='M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
											/>
										</svg>
									</div>
									<H2 className='mb-2'>Message Sent!</H2>
									<Paragraph className='text-muted-foreground'>
										Thank you for contacting us. We&apos;ll get back to you as
										soon as possible.
									</Paragraph>
								</div>
							) : (
								<Form {...form}>
									<form
										onSubmit={form.handleSubmit(onSubmit)}
										className='space-y-6'>
										<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
											<FormField
												control={form.control}
												name='name'
												render={({ field }) => (
													<FormItem>
														<FormLabel>Name</FormLabel>
														<FormControl>
															<Input placeholder='Your name' {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name='email'
												render={({ field }) => (
													<FormItem>
														<FormLabel>Email</FormLabel>
														<FormControl>
															<Input placeholder='Your email' {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										<FormField
											control={form.control}
											name='subject'
											render={({ field }) => (
												<FormItem>
													<FormLabel>Subject</FormLabel>
													<FormControl>
														<Input
															placeholder='Subject of your message'
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name='message'
											render={({ field }) => (
												<FormItem>
													<FormLabel>Message</FormLabel>
													<FormControl>
														<Textarea
															placeholder='Your message'
															className='min-h-[150px]'
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<Button
											type='submit'
											className='w-full md:w-auto'
											size='lg'
											disabled={isSubmitting}>
											{isSubmitting ? "Sending..." : "Send Message"}
										</Button>
									</form>
								</Form>
							)}
						</div>
					</div>
				</div>
			</section>

			{/* FAQ Section */}
			<section className='py-16 md:py-24'>
				<div className='max-w-3xl mx-auto'>
					<H2 className='text-center mb-12'>Frequently Asked Questions</H2>

					<div className='space-y-8'>
						{[
							{
								question: "What is airox?",
								answer:
									"airox is a comprehensive SaaS boilerplate designed for developers leveraging AI. It provides a production-ready foundation with authentication, database setup, payment processing, and more, allowing you to focus on building your core features.",
							},
							{
								question: "Do you offer custom development services?",
								answer:
									"Yes, we offer custom development services for businesses looking to build AI-powered SaaS applications. Contact us with your requirements, and we'll get back to you with a proposal.",
							},
							{
								question: "Is there a free trial available?",
								answer:
									"We don't currently offer a free trial, but we do have a money-back guarantee if you're not satisfied with the product within 14 days of purchase.",
							},
							{
								question: "What kind of support do you provide?",
								answer:
									"We provide documentation, email support, and a community forum for all customers. Premium support with faster response times is available for Pro customers.",
							},
						].map((faq, i) => (
							<div key={i} className='border-b pb-8'>
								<H2 className='text-xl mb-2'>{faq.question}</H2>
								<Paragraph className='text-muted-foreground'>
									{faq.answer}
								</Paragraph>
							</div>
						))}
					</div>
				</div>
			</section>
		</div>
	);
}
