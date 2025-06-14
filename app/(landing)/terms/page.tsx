import { H1, H2, H3, Paragraph, Lead } from "@/components/ui/typography";

export const metadata = {
	title: "Terms of Service | Jack AI",
	description:
		"Terms of Service for Jack AI - AI-powered body composition analysis and fitness tracking app.",
};

export default function TermsPage() {
	return (
		<div className='container mx-auto py-12 px-4'>
			<div className='max-w-3xl mx-auto'>
				{/* Header */}
				<div className='mb-12 text-center'>
					<H1 className='mb-4'>Terms of Service</H1>
					<Lead>Last updated: January 24, 2025</Lead>
				</div>

				{/* Terms Content */}
				<div className='prose prose-slate dark:prose-invert max-w-none'>
					<Paragraph>
						Please read these Terms of Service (&ldquo;Terms&rdquo;) carefully
						before using the Jack AI platform (&ldquo;the Service&rdquo;)
						operated by Digital Trend AS (&ldquo;us&rdquo;, &ldquo;we&rdquo;, or
						&ldquo;our&rdquo;). Jack AI is a mobile application developed and
						published by Digital Trend AS.
					</Paragraph>

					<Paragraph>
						Your access to and use of the Service is conditioned on your
						acceptance of and compliance with these Terms. These Terms apply to
						all visitors, users, and others who access or use the Service.
					</Paragraph>

					<Paragraph>
						By accessing or using the Service, you agree to be bound by these
						Terms. If you disagree with any part of the terms, then you may not
						access the Service.
					</Paragraph>

					<H2 className='mt-8 mb-4'>1. About Digital Trend AS and Jack AI</H2>

					<Paragraph>
						Digital Trend AS is a Norwegian technology company that develops and
						publishes applications. Jack AI is one of our flagship applications,
						designed specifically for AI-powered body composition analysis and
						fitness tracking.
					</Paragraph>

					<Paragraph>
						When these Terms refer to &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
						&ldquo;our,&rdquo; they refer to Digital Trend AS. When they refer
						to &ldquo;the Service&rdquo; or &ldquo;Jack AI,&rdquo; they refer
						specifically to the Jack AI mobile application and related services.
					</Paragraph>

					<H2 className='mt-8 mb-4'>2. Description of Service</H2>

					<Paragraph>
						Jack AI is an AI-powered body tracker. The Service uses artificial
						intelligence to analyze images and provide estimates of body
						composition metrics, fitness scores, and progress tracking for
						entertainment and motivational purposes.
					</Paragraph>

					<H3 className='mt-6 mb-2'>2.1 AI Analysis Disclaimer</H3>

					<Paragraph>
						<strong>IMPORTANT:</strong> Jack AI provides AI-generated estimates
						and analysis for entertainment, motivation, and fitness tracking
						purposes only. Our AI analysis:
					</Paragraph>

					<ul className='list-disc pl-6 space-y-2 my-4'>
						<li>
							Provides <strong>estimates only</strong> and should not be
							considered medically accurate or precise measurements
						</li>
						<li>
							Is designed for <strong>entertainment and motivation</strong>, not
							medical diagnosis or health assessment
						</li>
						<li>
							May contain <strong>inaccuracies or errors</strong> and should not
							be relied upon for health decisions
						</li>
						<li>
							<strong>Does not replace</strong> professional medical advice,
							diagnosis, or treatment
						</li>
					</ul>

					<H3 className='mt-6 mb-2'>2.2 Medical Disclaimer</H3>

					<Paragraph>
						<strong>Jack AI is not a medical device or health service.</strong>{" "}
						Always consult with qualified healthcare professionals for:
					</Paragraph>

					<ul className='list-disc pl-6 space-y-2 my-4'>
						<li>Medical advice, diagnosis, or treatment</li>
						<li>Health and fitness program recommendations</li>
						<li>Body composition or health assessments</li>
						<li>Any health-related concerns or conditions</li>
					</ul>

					<Paragraph>
						You acknowledge that Jack AI&apos;s analysis should never be used as
						a substitute for professional medical advice or as the basis for
						medical decisions.
					</Paragraph>

					<H3 className='mt-6 mb-2'>2.3 Not a Medical Device</H3>

					<Paragraph>
						<strong>Jack AI is explicitly NOT a medical device</strong> and
						differs from medical devices in the following ways:
					</Paragraph>

					<ul className='list-disc pl-6 space-y-2 my-4'>
						<li>
							<strong>Entertainment Purpose:</strong> Jack AI is designed for
							entertainment, motivation, and general fitness tracking only
						</li>
						<li>
							<strong>No Medical Claims:</strong> We make no medical claims
							about accuracy, precision, or clinical validity of our analysis
						</li>
						<li>
							<strong>No Regulatory Approval:</strong> Jack AI has not been
							evaluated or approved by any medical regulatory authority (FDA,
							CE, etc.)
						</li>
						<li>
							<strong>AI Estimates Only:</strong> All results are AI-generated
							estimates that may contain significant inaccuracies
						</li>
						<li>
							<strong>No Diagnostic Use:</strong> The app cannot and should not
							be used for medical diagnosis, treatment planning, or health
							assessment
						</li>
						<li>
							<strong>Consumer Wellness Tool:</strong> Jack AI is a consumer
							wellness and fitness motivation tool, not a medical instrument
						</li>
					</ul>

					<Paragraph>
						If you need accurate body composition measurements for medical
						purposes, please consult healthcare professionals who use clinically
						validated medical devices such as DEXA scans, bioelectrical
						impedance analysis (BIA) devices, or other FDA-approved medical
						equipment.
					</Paragraph>

					<H2 className='mt-8 mb-4'>3. Account Registration and Use</H2>

					<H3 className='mt-6 mb-2'>3.1 Account Registration</H3>

					<Paragraph>
						To use the Service, you may be required to register for an account.
						You must provide accurate, current, and complete information during
						the registration process and keep your account information
						up-to-date.
					</Paragraph>

					<Paragraph>
						You are responsible for safeguarding the password that you use to
						access the Service and for any activities or actions under your
						password. We encourage you to use a strong, unique password for your
						account.
					</Paragraph>

					<H3 className='mt-6 mb-2'>3.2 Age Requirements</H3>

					<Paragraph>
						You must be at least 17 years old to use the Service. If you are
						under 18, you must have parental or guardian consent to use the
						Service.
					</Paragraph>

					<H3 className='mt-6 mb-2'>3.3 Prohibited Uses</H3>

					<Paragraph>You agree not to use the Service:</Paragraph>

					<ul className='list-disc pl-6 space-y-2 my-4'>
						<li>
							For any unlawful purpose or to solicit others to unlawful acts
						</li>
						<li>
							To violate any international, federal, provincial, or state
							regulations, rules, laws, or local ordinances
						</li>
						<li>To upload inappropriate, offensive, or explicit content</li>
						<li>To upload images of other people without their consent</li>
						<li>
							To attempt to reverse engineer or manipulate the AI analysis
						</li>
						<li>
							To use the Service for medical diagnosis or health assessment
						</li>
					</ul>

					<H2 className='mt-8 mb-4'>4. Image Upload and Content</H2>

					<H3 className='mt-6 mb-2'>4.1 Image Upload Responsibilities</H3>

					<Paragraph>
						When uploading images to the Service, you represent and warrant
						that:
					</Paragraph>

					<ul className='list-disc pl-6 space-y-2 my-4'>
						<li>You have the right to upload and share the images</li>
						<li>
							The images are of yourself or you have explicit consent from the
							person(s) depicted
						</li>
						<li>
							The images do not contain inappropriate, offensive, or explicit
							content
						</li>
						<li>
							You understand the images will be processed by AI for analysis
							purposes
						</li>
					</ul>

					<H3 className='mt-6 mb-2'>4.2 Image Content Guidelines</H3>

					<Paragraph>
						<strong>IMPORTANT:</strong> To ensure appropriate use and optimal
						scanning results:
					</Paragraph>

					<ul className='list-disc pl-6 space-y-2 my-4'>
						<li>
							<strong>No nudity allowed</strong> - Users must wear appropriate
							athletic clothing at all times
						</li>
						<li>
							<strong>Athletic wear recommended</strong> - Minimal clothing such
							as shorts and sports bra provides better scanning accuracy while
							maintaining appropriate coverage
						</li>
						<li>
							<strong>Images are private and secure</strong> - All uploaded
							images are private by default and stored securely unless you
							explicitly choose to share them
						</li>
						<li>
							<strong>Content moderation</strong> - Images violating these
							guidelines will be removed and may result in account suspension
						</li>
						<li>
							<strong>Age-appropriate content only</strong> - All content must
							be suitable for users 17 years and older
						</li>
					</ul>

					<H3 className='mt-6 mb-2'>4.3 Content Standards</H3>

					<Paragraph>
						All uploaded content must comply with our community standards and
						image content guidelines above. We reserve the right to remove any
						content that violates these standards or is deemed inappropriate.
					</Paragraph>

					<H3 className='mt-6 mb-2'>4.4 User-Generated Content License</H3>

					<Paragraph>
						You retain ownership of any intellectual property rights that you
						hold in content that you create, upload, or otherwise provide to the
						Service (&ldquo;User Content&rdquo;). By uploading User Content, you
						grant Digital Trend AS a limited, non-exclusive, royalty-free
						license to process, analyze, and store your User Content solely for
						the purpose of providing the Service to you.
					</Paragraph>

					<H2 className='mt-8 mb-4'>
						5. AI Processing and Third-Party Services
					</H2>

					<Paragraph>
						The Service uses third-party AI providers (OpenAI and Anthropic) to
						analyze uploaded images. By using the Service, you acknowledge and
						agree that:
					</Paragraph>

					<ul className='list-disc pl-6 space-y-2 my-4'>
						<li>
							Your images may be temporarily processed by these third-party
							services
						</li>
						<li>Processing is automatic and anonymous, with no human review</li>
						<li>Images are not permanently stored by AI providers</li>
						<li>
							We implement security measures to protect your data during
							processing
						</li>
					</ul>

					<H2 className='mt-8 mb-4'>6. Privacy and Data Protection</H2>

					<Paragraph>
						Your privacy is important to us. Please review our Privacy Policy,
						which also governs your use of the Service, to understand our
						practices regarding the collection, use, and disclosure of your
						information.
					</Paragraph>

					<H3 className='mt-6 mb-2'>6.1 Health Data Use and Storage</H3>

					<Paragraph>
						If you grant the app permission to access health-related data (such
						as body composition, height, weight, or other fitness-related
						metrics), you acknowledge and agree that:
					</Paragraph>

					<ul className='list-disc pl-6 space-y-2 my-4'>
						<li>
							This data may be securely stored off-device to provide you with
							long-term tracking, AI-generated insights, and personalized trend
							analysis.
						</li>
						<li>
							All health-related data is processed securely and used only to
							enhance your experience within the Jack AI app.
						</li>
						<li>
							We do not sell, share, or use your health data for advertising or
							marketing purposes.
						</li>
						<li>
							You can request deletion of your data at any time by contacting
							our support team or using the in-app settings.
						</li>
					</ul>

					<H2 className='mt-8 mb-4'>7. Intellectual Property</H2>

					<Paragraph>
						The Service and its original content, features, and functionality
						are and will remain the exclusive property of Digital Trend AS and
						its licensors. The Service is protected by copyright, trademark, and
						other laws of both Norway and foreign countries.
					</Paragraph>

					<H3 className='mt-6 mb-2'>7.1 License to Use the Service</H3>

					<Paragraph>
						Subject to these Terms, Digital Trend AS grants you a limited,
						non-exclusive, non-transferable, and revocable license to use the
						Service for your personal fitness tracking and entertainment
						purposes.
					</Paragraph>

					<H2 className='mt-8 mb-4'>8. Payments and Subscriptions</H2>

					<Paragraph>
						Certain aspects of the Service may be provided for a fee. You will
						be required to select a payment plan and provide accurate billing
						information.
					</Paragraph>

					<H3 className='mt-6 mb-2'>8.1 Billing</H3>

					<Paragraph>
						By providing a payment method, you authorize us to charge you for
						the Service according to your selected plan. We use third-party
						payment processors and do not store your full payment information.
					</Paragraph>

					<H3 className='mt-6 mb-2'>8.2 Refunds</H3>

					<Paragraph>
						Refunds are handled on a case-by-case basis and are at the
						discretion of Digital Trend AS. If you believe you are entitled to a
						refund, please contact our support team.
					</Paragraph>

					<H2 className='mt-8 mb-4'>9. Limitation of Liability</H2>

					<Paragraph>
						<strong>IMPORTANT LIABILITY LIMITATIONS:</strong> In no event shall
						Digital Trend AS, nor its directors, employees, partners, agents,
						suppliers, or affiliates, be liable for any indirect, incidental,
						special, consequential or punitive damages, including without
						limitation, loss of profits, data, use, goodwill, or other
						intangible losses, resulting from:
					</Paragraph>

					<ol className='list-decimal pl-6 space-y-2 my-4'>
						<li>
							Your access to or use of or inability to access or use the Service
						</li>
						<li>Any reliance on AI analysis results or fitness estimates</li>
						<li>Any health or fitness decisions made based on the Service</li>
						<li>Any conduct or content of any third party on the Service</li>
						<li>Any content obtained from the Service</li>
						<li>
							Unauthorized access, use, or alteration of your transmissions or
							content
						</li>
					</ol>

					<Paragraph>
						<strong>
							You acknowledge that you use the Service at your own risk and that
							any health or fitness decisions should be made in consultation
							with qualified healthcare professionals.
						</strong>
					</Paragraph>

					<H2 className='mt-8 mb-4'>10. Disclaimer</H2>

					<Paragraph>
						Your use of the Service is at your sole risk. The Service is
						provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo;
						basis. The Service is provided without warranties of any kind,
						whether express or implied.
					</Paragraph>

					<Paragraph>Digital Trend AS does not warrant that:</Paragraph>

					<ul className='list-disc pl-6 space-y-2 my-4'>
						<li>
							The Service will be uninterrupted, timely, secure, or error-free
						</li>
						<li>Any defects will be corrected</li>
						<li>AI analysis results will be accurate or reliable</li>
						<li>The Service will meet your specific fitness or health needs</li>
					</ul>

					<H2 className='mt-8 mb-4'>11. Termination</H2>

					<Paragraph>
						We may terminate or suspend your account immediately, without prior
						notice or liability, for any reason, including without limitation if
						you breach the Terms.
					</Paragraph>

					<Paragraph>
						Upon termination, your right to use the Service will immediately
						cease. If you wish to terminate your account, you may delete your
						account through the app settings or contact us to request account
						deletion.
					</Paragraph>

					<H2 className='mt-8 mb-4'>12. Governing Law</H2>

					<Paragraph>
						These Terms shall be governed and construed in accordance with the
						laws of Norway, without regard to its conflict of law provisions.
					</Paragraph>

					<Paragraph>
						Our failure to enforce any right or provision of these Terms will
						not be considered a waiver of those rights. If any provision of
						these Terms is held to be invalid or unenforceable by a court, the
						remaining provisions of these Terms will remain in effect.
					</Paragraph>

					<H2 className='mt-8 mb-4'>13. Changes to Terms</H2>

					<Paragraph>
						We reserve the right, at our sole discretion, to modify or replace
						these Terms at any time. If a revision is material, we will try to
						provide at least 30 days&apos; notice prior to any new terms taking
						effect.
					</Paragraph>

					<Paragraph>
						By continuing to access or use our Service after those revisions
						become effective, you agree to be bound by the revised terms. If you
						do not agree to the new terms, please stop using the Service.
					</Paragraph>

					<H2 className='mt-8 mb-4'>14. Contact Us</H2>

					<Paragraph>
						If you have any questions about these Terms, please contact us at:
					</Paragraph>

					<Paragraph className='mb-12'>
						<strong>Email:</strong> legal@airoxapp.com
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
