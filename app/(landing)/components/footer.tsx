import Link from "next/link";
import React from "react";

export default function FooterLanding() {
	return (
		<div>
			{/* Footer */}
			<footer className='border-t py-16 bg-muted/30'>
				<div className='container mx-auto px-4'>
					<div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
						<div>
							<h3 className='font-bold mb-4 text-lg'>Jack AI</h3>
							<p className='text-sm text-muted-foreground mb-4'>
								Transform your body with AI-powered body scanning and
								personalized fitness insights.
							</p>
						</div>
						<div>
							<h4 className='font-bold mb-4'>Download</h4>
							<ul className='space-y-2'>
								<li>
									<Link
										href='https://apps.apple.com/app/jack-ai'
										target='_blank'
										className='text-sm text-muted-foreground hover:text-foreground transition-colors'>
										iOS App Store
									</Link>
								</li>
								<li>
									<Link
										href='https://play.google.com/store/apps/details?id=com.airox'
										target='_blank'
										className='text-sm text-muted-foreground hover:text-foreground transition-colors'>
										Google Play Store
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h4 className='font-bold mb-4'>Support</h4>
							<ul className='space-y-2'>
								<li>
									<Link
										href='/contact'
										className='text-sm text-muted-foreground hover:text-foreground transition-colors'>
										Contact Support
									</Link>
								</li>
								<li>
									<Link
										href='/help'
										className='text-sm text-muted-foreground hover:text-foreground transition-colors'>
										Help Center
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h4 className='font-bold mb-4'>Legal</h4>
							<ul className='space-y-2'>
								<li>
									<Link
										href='/terms'
										className='text-sm text-muted-foreground hover:text-foreground transition-colors'>
										Terms of Service
									</Link>
								</li>
								<li>
									<Link
										href='/privacy'
										className='text-sm text-muted-foreground hover:text-foreground transition-colors'>
										Privacy Policy
									</Link>
								</li>
							</ul>
						</div>
					</div>
					<div className='mt-8 pt-8 border-t text-center'>
						<p className='text-sm text-muted-foreground'>
							© {new Date().getFullYear()} Jack AI. All rights reserved.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
