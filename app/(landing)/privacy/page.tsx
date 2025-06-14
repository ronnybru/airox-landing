import { H1, H2, H3, Paragraph, Lead } from "@/components/ui/typography";

export const metadata = {
	title: "Privacy Policy | Jack AI",
	description:
		"Privacy Policy for Jack AI - AI-powered body composition analysis and fitness tracking app.",
};

export default function PrivacyPage() {
	return (
		<div className='container mx-auto py-12 px-4'>
			<div className='max-w-3xl mx-auto'>
				{/* Header */}
				<div className='mb-12 text-center'>
					<H1 className='mb-4'>Privacy Policy</H1>
					<Lead>Last updated: January 24, 2025</Lead>
				</div>

				{/* Privacy Content */}
				<div className='prose prose-slate dark:prose-invert max-w-none'>
					<Paragraph>
						At Digital Trend AS, we take your privacy seriously. This Privacy
						Policy explains how we collect, use, disclose, and safeguard your
						information when you use our AI-powered body composition analysis
						and fitness tracking service, Jack AI.
					</Paragraph>

					<Paragraph>
						Please read this Privacy Policy carefully. By accessing or using the
						Service, you acknowledge that you have read, understood, and agree
						to be bound by all the terms of this Privacy Policy.
					</Paragraph>

					<H2 className='mt-8 mb-4'>🏢 About Digital Trend AS and Jack AI</H2>

					<Paragraph>
						Digital Trend AS is a Norwegian technology company. Jack AI is one
						of our flagship applications, designed specifically for AI-powered
						body composition analysis and fitness tracking.
					</Paragraph>

					<Paragraph>
						When this Privacy Policy refers to &ldquo;we,&rdquo;
						&ldquo;us,&rdquo; or &ldquo;our,&rdquo; it refers to Digital Trend
						AS. When it refers to &ldquo;the Service&rdquo; or &ldquo;Jack
						AI,&rdquo; it refers specifically to the Jack AI mobile application
						and related services.
					</Paragraph>

					<H2 className='mt-8 mb-4'>Image Upload and AI Analysis</H2>

					<Paragraph>
						When you upload an image in Jack AI to analyze your progress, the
						image is processed via artificial intelligence provided by OpenAI
						and Anthropic (Claude). The image is analyzed to estimate body fat
						percentage, fitness score, and other body composition metrics.
					</Paragraph>

					<ul className='list-disc pl-6 space-y-2 my-4'>
						<li>
							Images are sent only temporarily for analysis and are{" "}
							<strong>not permanently stored</strong> by AI providers
						</li>
						<li>
							All communication with third parties occurs via{" "}
							<strong>signed, time-limited URLs</strong> generated from AWS S3,
							ensuring only authorized analysis units gain access
						</li>
						<li>
							Your images are protected behind{" "}
							<strong>authentication keys</strong> and stored securely on our
							secure S3 solution
						</li>
						<li>
							No manual review of images occurs – processing is{" "}
							<strong>completely automatic and anonymous</strong>
						</li>
					</ul>

					<H2 className='mt-8 mb-4'>Privacy by Default</H2>

					<Paragraph>
						Your privacy is our priority. We implement privacy-first principles
						throughout our service:
					</Paragraph>

					<ul className='list-disc pl-6 space-y-2 my-4'>
						<li>
							All accounts and content are <strong>private by default</strong>
						</li>
						<li>
							<strong>Images are private and secure</strong> - Your images are
							stored securely and remain completely private unless you
							explicitly choose to share them
						</li>
						<li>
							<strong>No nudity allowed</strong> - Athletic wear is required for
							all uploaded images to maintain appropriate content standards
						</li>
						<li>
							Users can choose to make individual content or their entire
							profile public
						</li>
						<li>
							Using the <strong>&ldquo;Share&rdquo;</strong> function generates
							a public URL for selected content. This URL is open and should
							only be shared with people you trust
						</li>
						<li>
							You have full control at all times over what is public or private
						</li>
					</ul>

					<H2 className='mt-8 mb-4'>Use of Artificial Intelligence</H2>

					<Paragraph>
						We use artificial intelligence (AI) to provide you with motivation
						and insights into your own progress.
					</Paragraph>

					<ul className='list-disc pl-6 space-y-2 my-4'>
						<li>
							AI analysis occurs via third-party services OpenAI and Anthropic
						</li>
						<li>
							Content sent for analysis contains no identifying user data beyond
							the image itself
						</li>
						<li>
							Results from AI are used{" "}
							<strong>
								exclusively to improve your own training experience
							</strong>{" "}
							and are never shared with others unless you choose to do so
						</li>
						<li>
							AI analysis is used for fitness insights and motivation, not
							medical advice
						</li>
					</ul>

					<H2 className='mt-8 mb-4'>1. Information We Collect</H2>

					<Paragraph>
						We collect information that you provide directly to us when using
						the Service, as well as information collected automatically through
						your use of the Service.
					</Paragraph>

					<H3 className='mt-6 mb-2'>1.1 Information You Provide</H3>

					<Paragraph>
						We may collect the following types of information when you register
						for an account, submit forms, or otherwise interact with our
						Service:
					</Paragraph>

					<ul className='list-disc pl-6 space-y-2 my-4'>
						<li>Personal identifiers such as your name and email address</li>
						<li>Account credentials such as usernames and passwords</li>
						<li>Images for AI analysis</li>
						<li>Fitness goals and preferences</li>
						<li>Progress tracking data and measurements</li>
						<li>
							Communications you send to us, such as customer support inquiries
						</li>
						<li>
							User-generated content that you create, upload, or share through
							the Service
						</li>
					</ul>

					<H3 className='mt-6 mb-2'>1.2 Information Collected Automatically</H3>

					<Paragraph>
						When you use our Service, we may automatically collect certain
						information about your device and usage patterns, including:
					</Paragraph>

					<ul className='list-disc pl-6 space-y-2 my-4'>
						<li>
							Device information such as your IP address, browser type,
							operating system, and device identifiers
						</li>
						<li>
							Usage data such as features used, analysis requests, and time
							spent on the Service
						</li>
						<li>
							Log data such as error reports, activity logs, and performance
							data
						</li>
						<li>
							Cookies and similar tracking technologies for service
							functionality
						</li>
					</ul>

					<H2 className='mt-8 mb-4'>2. How We Use Your Information</H2>

					<Paragraph>
						We use the information we collect for various purposes, including:
					</Paragraph>

					<ul className='list-disc pl-6 space-y-2 my-4'>
						<li>Providing AI-powered body composition analysis</li>
						<li>Tracking your fitness progress and goals</li>
						<li>Providing, maintaining, and improving the Service</li>
						<li>Processing transactions and managing your account</li>
						<li>Responding to your requests and providing customer support</li>
						<li>
							Sending you technical notices, updates, security alerts, and
							administrative messages
						</li>
						<li>
							Sending you marketing communications, promotional offers, and
							product updates via email (you can opt-out at any time)
						</li>
						<li>
							Monitoring and analyzing trends, usage, and activities in
							connection with the Service
						</li>
						<li>
							Detecting, investigating, and preventing fraudulent transactions
							and other illegal activities
						</li>
						<li>
							Personalizing and improving your experience with the Service
						</li>
					</ul>

					<H2 className='mt-8 mb-4'>2.1 Email Communications and Marketing</H2>

					<Paragraph>
						We may use your email address to communicate with you about:
					</Paragraph>

					<ul className='list-disc pl-6 space-y-2 my-4'>
						<li>
							<strong>Service-related communications:</strong> Account updates,
							security alerts, technical notices, and customer support responses
						</li>
						<li>
							<strong>Product updates:</strong> New features, improvements, and
							important announcements about Jack AI
						</li>
						<li>
							<strong>Marketing communications:</strong> Promotional offers,
							fitness tips, and other marketing content related to our services
						</li>
					</ul>

					<Paragraph>
						<strong>Your consent and opt-out rights:</strong> By creating an
						account and providing your email address, you consent to receiving
						these communications. You can opt-out of marketing emails at any
						time by:
					</Paragraph>

					<ul className='list-disc pl-6 space-y-2 my-4'>
						<li>
							Clicking the &ldquo;unsubscribe&rdquo; link in any marketing email
						</li>
						<li>Contacting us directly at support@airoxapp.app</li>
						<li>Updating your preferences in your account settings</li>
					</ul>

					<Paragraph>
						Please note that even if you opt-out of marketing communications,
						you will still receive essential service-related emails necessary
						for your account and the proper functioning of the Service.
					</Paragraph>

					<H2 className='mt-8 mb-4'>3. Sharing of Information</H2>

					<Paragraph>
						We may share your information in the following circumstances:
					</Paragraph>

					<H3 className='mt-6 mb-2'>3.1 AI Service Providers</H3>

					<Paragraph>
						We share images temporarily with OpenAI and Anthropic (Claude) for
						AI analysis purposes only. These images are not stored permanently
						by these providers and are processed automatically without human
						review.
					</Paragraph>

					<H3 className='mt-6 mb-2'>3.2 Other Service Providers</H3>

					<Paragraph>
						We may share your information with third-party vendors, consultants,
						and other service providers who need access to such information to
						carry out work on our behalf, such as cloud storage (AWS S3), email
						delivery, hosting services, and customer service.
					</Paragraph>

					<H3 className='mt-6 mb-2'>3.3 Legal Requirements</H3>

					<Paragraph>
						We may disclose your information if required to do so by law or in
						response to valid requests by public authorities (e.g., a court or
						government agency).
					</Paragraph>

					<H3 className='mt-6 mb-2'>3.4 With Your Consent</H3>

					<Paragraph>
						We may share your information with third parties when you have given
						us your consent to do so, such as when you choose to make your
						profile or specific content public.
					</Paragraph>

					<H2 className='mt-8 mb-4'>4. Data Security</H2>

					<Paragraph>
						We implement appropriate technical and organizational measures to
						protect the security of your personal information, including:
					</Paragraph>

					<ul className='list-disc pl-6 space-y-2 my-4'>
						<li>Secure cloud storage with AWS S3</li>
						<li>Authentication keys for image access</li>
						<li>Signed, time-limited URLs for AI processing</li>
						<li>Encryption of data in transit and at rest</li>
					</ul>

					<Paragraph>
						While we strive to use commercially acceptable means to protect your
						personal information, we cannot guarantee its absolute security. You
						are responsible for maintaining the secrecy of any credentials used
						to access your account.
					</Paragraph>

					<H2 className='mt-8 mb-4'>🗑️ Deletion and Control</H2>

					<Paragraph>You can at any time:</Paragraph>

					<ul className='list-disc pl-6 space-y-2 my-4'>
						<li>Delete images, analyses, or other data</li>
						<li>Delete your entire account and all associated data</li>
						<li>Change who can see your profile and results</li>
						<li>Control what content is public or private</li>
					</ul>

					<Paragraph>
						All deleted content is permanently removed from our systems,
						including from AWS S3 storage.
					</Paragraph>

					<H2 className='mt-8 mb-4'>5. Your Rights and Choices</H2>

					<Paragraph>
						Depending on your location, you may have certain rights regarding
						your personal information, including:
					</Paragraph>

					<ul className='list-disc pl-6 space-y-2 my-4'>
						<li>
							The right to access and receive a copy of your personal
							information
						</li>
						<li>The right to rectify or update your personal information</li>
						<li>The right to delete your personal information</li>
						<li>
							The right to restrict or object to our processing of your personal
							information
						</li>
						<li>The right to data portability</li>
						<li>The right to withdraw consent</li>
					</ul>

					<Paragraph>
						To exercise these rights, please contact us using the information
						provided in the &ldquo;Contact Us&rdquo; section below.
					</Paragraph>

					<H2 className='mt-8 mb-4'>6. Children&apos;s Privacy</H2>

					<Paragraph>
						Our Service is not directed to children under the age of 17. We do
						not knowingly collect personal information from children under 17.
						If you are a parent or guardian and you are aware that your child
						has provided us with personal information, please contact us so that
						we can take necessary actions.
					</Paragraph>

					<H2 className='mt-8 mb-4'>7. Important Disclaimers</H2>

					<Paragraph>
						Jack AI is designed for fitness tracking and motivation purposes
						only. Our AI analysis provides estimates and insights for
						entertainment and fitness tracking purposes and should not be
						considered medical advice. Always consult with healthcare
						professionals for medical concerns.
					</Paragraph>

					<H2 className='mt-8 mb-4'>8. International Data Transfers</H2>

					<Paragraph>
						Your information may be transferred to, and maintained on, computers
						located outside of your state, province, country, or other
						governmental jurisdiction where the data protection laws may differ
						from those in your jurisdiction.
					</Paragraph>

					<Paragraph>
						If you are located outside Norway and choose to provide information
						to us, please note that we transfer the information, including
						personal information, to Norway and process it there.
					</Paragraph>

					<H2 className='mt-8 mb-4'>9. Changes to This Privacy Policy</H2>

					<Paragraph>
						We may update our Privacy Policy from time to time. We will notify
						you of any changes by posting the new Privacy Policy on this page
						and updating the &ldquo;Last updated&rdquo; date at the top of this
						Privacy Policy.
					</Paragraph>

					<Paragraph>
						You are advised to review this Privacy Policy periodically for any
						changes. Changes to this Privacy Policy are effective when they are
						posted on this page.
					</Paragraph>

					<H2 className='mt-8 mb-4'>🧾 Contact Us</H2>

					<Paragraph>
						If you have any questions about this Privacy Policy or how we handle
						your data, please contact us at:
					</Paragraph>

					<Paragraph className='mb-12'>
						<strong>Email:</strong> support@airoxapp.app
						<br />
						<strong>Company:</strong> Digital Trend AS
						<br />
						<strong>Address:</strong> Havnevegen 3, 5918 Frekhaug, Norway
					</Paragraph>
				</div>
			</div>
		</div>
	);
}
