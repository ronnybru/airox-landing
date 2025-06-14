import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Thank You - Jack AI Support",
	description:
		"Thank you for contacting Jack AI support. We'll get back to you soon.",
};

export default function ThankYouPage() {
	return (
		<div className='min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800'>
			<div className='container mx-auto px-4 py-16 max-w-2xl'>
				<div className='text-center'>
					<Card className='shadow-lg'>
						<CardHeader className='text-center pb-6'>
							<div className='mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center'>
								<CheckCircle className='h-8 w-8 text-green-600 dark:text-green-400' />
							</div>
							<CardTitle className='text-2xl font-bold text-gray-900 dark:text-white'>
								Thank You!
							</CardTitle>
						</CardHeader>
						<CardContent className='text-center space-y-6'>
							<div>
								<p className='text-lg text-gray-700 dark:text-gray-300 mb-2'>
									Your support request has been submitted successfully.
								</p>
								<p className='text-gray-600 dark:text-gray-400'>
									We&apos;ll get back to you within 24-48 hours at the email
									address you provided.
								</p>
							</div>

							<div className='bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4'>
								<div className='flex items-center justify-center gap-2 text-orange-700 dark:text-orange-300'>
									<Mail className='h-4 w-4' />
									<span className='text-sm font-medium'>
										Check your email for a confirmation
									</span>
								</div>
							</div>

							<div className='flex flex-col sm:flex-row gap-3 justify-center'>
								<Button asChild variant='outline'>
									<Link href='/support' className='flex items-center gap-2'>
										<ArrowLeft className='h-4 w-4' />
										Back to Support
									</Link>
								</Button>
								<Button asChild className='bg-orange-500 hover:bg-orange-600'>
									<Link href='/'>Return to Home</Link>
								</Button>
							</div>

							<div className='pt-4 border-t border-gray-200 dark:border-gray-700'>
								<p className='text-sm text-gray-500 dark:text-gray-400'>
									Need immediate assistance? Email us directly at{" "}
									<a
										href='mailto:support@airox.com'
										className='text-orange-600 dark:text-orange-400 hover:underline'>
										support@airox.com
									</a>
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
