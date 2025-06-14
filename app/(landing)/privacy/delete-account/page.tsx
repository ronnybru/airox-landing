import { H1, H2, H3, Paragraph, Lead } from "@/components/ui/typography";
import Image from "next/image";

export const metadata = {
	title: "Delete Account | Jack AI",
	description:
		"Learn how to delete your Jack AI account and all associated data permanently through the mobile app settings.",
};

export default function DeleteAccountPage() {
	return (
		<div className='container mx-auto py-12 px-4'>
			<div className='max-w-3xl mx-auto'>
				{/* Header */}
				<div className='mb-12 text-center'>
					<H1 className='mb-4'>Delete Your Jack AI Account</H1>
					<Lead>
						Complete guide to permanently deleting your account and all
						associated data
					</Lead>
				</div>

				{/* Content */}
				<div className='prose prose-slate dark:prose-invert max-w-none'>
					<Paragraph>
						You can permanently delete your Jack AI account and all associated
						data directly through the mobile app. This process is immediate and
						cannot be undone.
					</Paragraph>

					<H2 className='mt-8 mb-4'>🗑️ What Gets Deleted</H2>

					<Paragraph>
						When you delete your account, the following data is permanently
						removed from our systems:
					</Paragraph>

					<ul className='list-disc pl-6 space-y-2 my-4'>
						<li>
							<strong>Your account and profile information</strong> - Name,
							email, and all personal details
						</li>
						<li>
							<strong>All body scan images</strong> - Every photo you&apos;ve
							uploaded for analysis
						</li>
						<li>
							<strong>Progress data and comparisons</strong> - All fitness
							tracking data, measurements, and progress history
						</li>
						<li>
							<strong>AI analysis results</strong> - Body composition estimates,
							fitness scores, and insights
						</li>
						<li>
							<strong>Leaderboard entries</strong> - Your position and data in
							any leaderboards
						</li>
						<li>
							<strong>Health data connections</strong> - Any linked HealthKit or
							Health Connect data
						</li>
						<li>
							<strong>Subscription information</strong> - Payment history and
							subscription status
						</li>
						<li>
							<strong>All other personal data</strong> - Settings, preferences,
							and usage history
						</li>
					</ul>

					<div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 my-6'>
						<div className='flex items-start'>
							<div className='flex-shrink-0'>
								<span className='text-red-600 dark:text-red-400 text-xl'>
									⚠️
								</span>
							</div>
							<div className='ml-3'>
								<h3 className='text-sm font-medium text-red-800 dark:text-red-200'>
									Important Warning
								</h3>
								<div className='mt-2 text-sm text-red-700 dark:text-red-300'>
									<p>
										Account deletion is{" "}
										<strong>permanent and irreversible</strong>. Once deleted,
										your data cannot be recovered, and you will need to create a
										new account to use Jack AI again.
									</p>
								</div>
							</div>
						</div>
					</div>

					<H2 className='mt-8 mb-4'>📱 How to Delete Your Account</H2>

					<Paragraph>
						Follow these simple steps to delete your account through the Jack AI
						mobile app:
					</Paragraph>

					<H3 className='mt-6 mb-4'>Step 1: Open the Jack AI App</H3>
					<Paragraph>
						Launch the Jack AI app on your mobile device and ensure you&apos;re
						logged into the account you want to delete.
					</Paragraph>

					<H3 className='mt-6 mb-4'>Step 2: Navigate to Settings</H3>
					<Paragraph>
						Tap on the <strong>&quot;Settings&quot;</strong> tab at the bottom
						of your screen. This will take you to your account settings page.
					</Paragraph>

					<H3 className='mt-6 mb-4'>Step 3: Find Delete Account Option</H3>
					<Paragraph>
						Scroll down to the bottom of the settings page. You&apos;ll find the{" "}
						<strong>&quot;Delete Account&quot;</strong> option displayed in red
						text, indicating its permanent nature.
					</Paragraph>

					{/* Screenshot */}
					<div className='my-8 text-center'>
						<Image
							src='/settings-delete-account-mobile.webp'
							alt='Jack AI mobile app settings screen showing the Delete Account option at the bottom'
							width={300}
							height={600}
							className='mx-auto rounded-lg shadow-lg border border-gray-200 dark:border-gray-700'
						/>
						<p className='text-sm text-gray-600 dark:text-gray-400 mt-2'>
							The Delete Account option in Jack AI settings
						</p>
					</div>

					<H3 className='mt-6 mb-4'>Step 4: Confirm Deletion</H3>
					<Paragraph>
						Tap on <strong>&quot;Delete Account&quot;</strong>. The app will
						show you a detailed warning about what will be deleted and ask for
						your confirmation.
					</Paragraph>

					<H3 className='mt-6 mb-4'>Step 5: Final Confirmation</H3>
					<Paragraph>
						You&apos;ll be asked to confirm the deletion one final time. Tap{" "}
						<strong>&quot;DELETE FOREVER&quot;</strong> to permanently delete
						your account and all associated data.
					</Paragraph>

					<H2 className='mt-8 mb-4'>⏱️ Immediate Processing</H2>

					<Paragraph>
						Account deletion is processed immediately. Once confirmed:
					</Paragraph>

					<ul className='list-disc pl-6 space-y-2 my-4'>
						<li>Your account is permanently deleted from our systems</li>
						<li>All images are removed from secure AWS S3 storage</li>
						<li>You&apos;re automatically signed out of the app</li>
						<li>
							You&apos;ll receive a confirmation that the deletion was
							successful
						</li>
					</ul>

					<H2 className='mt-8 mb-4'>🔒 Data Retention Policy</H2>

					<Paragraph>
						Jack AI follows a strict no-retention policy for deleted accounts:
					</Paragraph>

					<ul className='list-disc pl-6 space-y-2 my-4'>
						<li>
							<strong>No backup copies</strong> - Deleted data is not stored in
							backups or archives
						</li>
						<li>
							<strong>No recovery period</strong> - There is no grace period
							where data can be recovered
						</li>
						<li>
							<strong>Complete removal</strong> - All traces of your account are
							permanently erased
						</li>
						<li>
							<strong>Third-party data</strong> - Any data shared with AI
							providers for analysis is also permanently removed
						</li>
					</ul>

					<H2 className='mt-8 mb-4'>🆘 Need Help?</H2>

					<Paragraph>
						If you&apos;re having trouble deleting your account through the app
						or have questions about the deletion process, please contact our
						support team:
					</Paragraph>

					<div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-6'>
						<div className='text-center'>
							<p className='text-blue-800 dark:text-blue-200 font-medium'>
								📧 Email: support@airoxapp.app
							</p>
							<p className='text-blue-600 dark:text-blue-300 text-sm mt-1'>
								We typically respond within 24 hours
							</p>
						</div>
					</div>

					<H2 className='mt-8 mb-4'>🔄 Alternative: Account Deactivation</H2>

					<Paragraph>
						If you&apos;re not ready for permanent deletion, consider these
						alternatives:
					</Paragraph>

					<ul className='list-disc pl-6 space-y-2 my-4'>
						<li>
							<strong>Sign out</strong> - Simply log out of the app to stop
							using it temporarily
						</li>
						<li>
							<strong>Delete specific data</strong> - Remove individual scans or
							progress data while keeping your account
						</li>
						<li>
							<strong>Privacy settings</strong> - Make your profile private and
							stop sharing data
						</li>
					</ul>

					<Paragraph>
						These options allow you to return to Jack AI later without losing
						your progress and data.
					</Paragraph>

					<H2 className='mt-8 mb-4'>📋 Company Information</H2>

					<Paragraph>
						Jack AI is developed by Digital Trend AS, a Norwegian technology
						company committed to user privacy and data protection.
					</Paragraph>

					<Paragraph className='mb-12'>
						<strong>Company:</strong> Digital Trend AS
						<br />
						<strong>Address:</strong> Havnevegen 3, 5918 Frekhaug, Norway
						<br />
						<strong>Support:</strong> support@airoxapp.app
					</Paragraph>
				</div>
			</div>
		</div>
	);
}
