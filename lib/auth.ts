import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as authSchema from "./db/schema";
import { eq } from "drizzle-orm";
import { nextCookies } from "better-auth/next-js";
import { createAuthMiddleware } from "better-auth/api";
import { customSession, organization } from "better-auth/plugins";
import { expo } from "@better-auth/expo";
import { sendEmail } from "@/app/emails";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: authSchema,
	}),
	// session: {
	// 	cookieCache: {
	// 		enabled: true,
	// 		maxAge: 5 * 60, // Cache duration in seconds (5 minutes)
	// 	},
	// 	// Add logging for session operations
	// 	updateAge: 24 * 60 * 60, // 24 hours
	// },
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		minPasswordLength: 8,
		maxPasswordLength: 128,
		sendResetPassword: async ({ user, url }) => {
			await sendEmail({
				to: user.email,
				subject: "Reset your password - airox",
				html: `
					<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
						<div style="text-align: center; margin-bottom: 30px;">
							<h1 style="color: #333; margin: 0;">airox</h1>
						</div>
						
						<h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
						
						<p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
							Hello ${user.name || "there"},
						</p>
						
						<p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
							We received a request to reset your password for your airox account. Click the button below to create a new password:
						</p>
						
						<div style="text-align: center; margin: 30px 0;">
							<a href="${url}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
								Reset Password
							</a>
						</div>
						
						<p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
							If the button doesn't work, you can copy and paste this link into your browser:
						</p>
						
						<p style="color: #4F46E5; word-break: break-all; margin-bottom: 30px;">
							${url}
						</p>
						
						<p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
							This link will expire in 1 hour for security reasons.
						</p>
						
						<p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
							If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
						</p>
						
						<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
						
						<p style="color: #999; font-size: 14px; text-align: center;">
							Best regards,<br>
							The airox Team
						</p>
					</div>
				`,
				text: `Reset Your Password - airox

Hello ${user.name || "there"},

We received a request to reset your password for your airox account. Click the link below to create a new password:

${url}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Best regards,
The airox Team`,
			});
		},
		resetPasswordTokenExpiresIn: 3600, // 1 hour
	},
	emailVerification: {
		sendVerificationEmail: async ({ user, url }) => {
			await sendEmail({
				to: user.email,
				subject: "Verify your email address - airox",
				html: `
					<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
						<div style="text-align: center; margin-bottom: 30px;">
							<h1 style="color: #333; margin: 0;">airox</h1>
						</div>
						
						<h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
						
						<p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
							Hello ${user.name || "there"},
						</p>
						
						<p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
							Thank you for signing up for airox! To complete your registration and start using your account, please verify your email address by clicking the button below:
						</p>
						
						<div style="text-align: center; margin: 30px 0;">
							<a href="${url}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
								Verify Email Address
							</a>
						</div>
						
						<p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
							If the button doesn't work, you can copy and paste this link into your browser:
						</p>
						
						<p style="color: #4F46E5; word-break: break-all; margin-bottom: 30px;">
							${url}
						</p>
						
						<p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
							This verification link will expire in 24 hours for security reasons.
						</p>
						
						<p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
							If you didn't create an account with airox, you can safely ignore this email.
						</p>
						
						<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
						
						<p style="color: #999; font-size: 14px; text-align: center;">
							Welcome to airox!<br>
							The airox Team
						</p>
					</div>
				`,
				text: `Verify Your Email Address - airox

Hello ${user.name || "there"},

Thank you for signing up for airox! To complete your registration and start using your account, please verify your email address by clicking the link below:

${url}

This verification link will expire in 24 hours for security reasons.

If you didn't create an account with airox, you can safely ignore this email.

Welcome to airox!
The airox Team`,
			});
		},
		callbackURL: "/",
	},
	account: {
		accountLinking: {
			enabled: true,
			allowDifferentEmails: false, // Only link accounts with the same email
		},
	},
	trustedOrigins: [
		"airox://",
		"airox://*",
		// Apple Sign In requirement
		"https://appleid.apple.com",
		// Production domain
		"https://airox.ai",
		// Local development origins
		"exp://192.168.1.251:8081/--/(tabs)",
		"exp://172.19.1.10:8081/--/(onboarding)/register",
		"exp://172.19.1.10:8081/--/(tabs)",
		"exp://172.20.10.7:8081",
		"exp://10.110.45.85:8081/--/converting",
		"exp://10.110.45.85:8081/--/(onboarding)/register",
		"exp://192.168.86.68:8081/--/(tabs)",
		"exp://192.168.86.68:8081/--/(onboarding)/register",
		// Production/EAS build origins
		"app.airox.airox://",
		"app.airox.airox://*",
		// Ngrok development URL
		"https://de6d-92-220-217-1.ngrok-free.app",
		"exp://192.168.86.110:8081/--/(tabs)",
		"http://localhost:3000",
	],

	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
		apple: {
			clientId: process.env.APPLE_CLIENT_ID as string,
			clientSecret: process.env.APPLE_CLIENT_SECRET as string,
			// Optional
			appBundleIdentifier: process.env.APPLE_APP_BUNDLE_IDENTIFIER as string,
		},
	},
	plugins: [
		expo(),
		nextCookies(),
		customSession(async ({ user, session }) => {
			// Fetch the user from the database to get the role
			const userData = await db.query.user.findFirst({
				where: eq(authSchema.user.id, user.id),
			});

			// Get active organization for the user
			const sessionRecord = await db.query.session.findFirst({
				where: eq(authSchema.session.userId, user.id),
				orderBy: (s, { desc }) => [desc(s.createdAt)],
			});

			let activeOrganization = null;
			let organizationCredits = 0;
			let organizationMembership = null;

			if (sessionRecord?.activeOrganizationId) {
				// Get the active organization with credits
				activeOrganization = await db.query.organization.findFirst({
					where: eq(
						authSchema.organization.id,
						sessionRecord.activeOrganizationId
					),
					columns: {
						id: true,
						name: true,
						slug: true,
						credits: true,
					},
				});

				if (activeOrganization) {
					organizationCredits = activeOrganization.credits;

					// Get the organization's membership
					const membership = await db.query.organizationMemberships.findFirst({
						where: eq(
							authSchema.organizationMemberships.organizationId,
							activeOrganization.id
						),
					});

					if (membership) {
						organizationMembership = {
							id: membership.id,
							membershipId: membership.membershipId,
							status: membership.status,
							startDate: membership.startDate,
							endDate: membership.endDate,
						};
					}
				}
			}

			// Compute if user has active subscription
			const isActiveSubscription =
				userData?.subscriptionStatus === "trial" ||
				userData?.subscriptionStatus === "active";

			return {
				user: {
					...user,
					role: userData?.role || "user",
					language: userData?.language || "en", // Add language preference
					activeOrganization,
					organizationCredits,
					organizationMembership,
					// Simplified subscription data
					isActiveSubscription,
					subscriptionStatus: userData?.subscriptionStatus || "none",
					subscriptionPlan: userData?.subscriptionPlan || null,
					// HealthKit integration data
					healthKitConnected: userData?.healthKitConnected || false,
					healthKitLastConnected: userData?.healthKitLastConnected || null,
					healthKitLastDisconnected:
						userData?.healthKitLastDisconnected || null,
					// Onboarding data
					gender: userData?.gender || null,
					hearAboutUs: userData?.hearAboutUs || null,
					height: userData?.height || null,
					weight: userData?.weight || null,
					isMetric: userData?.isMetric ?? true,
					birthDate: userData?.birthDate || null,
					onboardingCompleted: userData?.onboardingCompleted || false,
					// Gym preferences
					gymFrequency: userData?.gymFrequency || null,
					gymLevel: userData?.gymLevel || null,
					preferredFocus: userData?.preferredFocus || null,
					injuries: userData?.injuries || null,
					// Public profile data
					isProfilePublic: userData?.isProfilePublic || false,
					publicUsername: userData?.publicUsername || null,
					bio: userData?.bio || null,
					socialLinks: userData?.socialLinks || null,
				},
				session,
			};
		}),
		organization({
			// Configure organization invitation email
			async sendInvitationEmail(data) {
				const inviteLink = `${
					process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
				}/accept-invitation/${data.id}`;

				// Send invitation email
				await sendEmail({
					to: data.email,
					subject: `You've been invited to join ${data.organization.name}`,
					html: `
						<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
							<h2>You've been invited to join ${data.organization.name}</h2>
							<p>Hello,</p>
							<p>${data.inviter.user.name} (${data.inviter.user.email}) has invited you to join their organization on Vibeplate.</p>
							<p>Click the button below to accept the invitation:</p>
							<p style="text-align: center;">
								<a href="${inviteLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
									Accept Invitation
								</a>
							</p>
							<p>If the button doesn't work, you can copy and paste this link into your browser:</p>
							<p>${inviteLink}</p>
							<p>This invitation will expire in 48 hours.</p>
							<p>Thank you,<br>The Vibeplate Team</p>
						</div>
					`,
				});
			},
			// Optional: Configure organization creation hooks
			organizationCreation: {
				afterCreate: async ({ organization, user }) => {
					console.log(
						`Organization created: ${organization.name} by user ${user.email}`
					);
				},
			},
		}),
	],

	hooks: {
		// After hook to send welcome emails when a new user is created
		// and process pending invitations
		after: createAuthMiddleware(async (ctx) => {
			// Check if this is a new session (either from sign-up or social provider)
			if (ctx.context.newSession) {
				try {
					// Dynamically import to avoid circular dependencies
					// TODO: Add the WelcomeEmails
					// const { startWelcomeEmailSeries } = await import(
					// 	"@/app/actions/welcome-emails"
					// );

					// Check if this is a new user (not just a new session for an existing user)
					const isNewUser = await db.query.user
						.findFirst({
							where: eq(authSchema.user.id, ctx.context.newSession.user.id),
							columns: { emailVariant: true },
						})
						.then((user) => !user?.emailVariant);

					if (isNewUser) {
						// Randomly assign an email variant (A/B testing)
						// const variant = Math.random() < 0.5 ? "a" : "b";

						// // Schedule welcome emails for the new user with the assigned variant
						// await startWelcomeEmailSeries(
						// 	ctx.context.newSession.user.id,
						// 	variant
						// );

						// Generate referral code for new user
						try {
							const { generateReferralCode } = await import("@/lib/referrals");
							await generateReferralCode(ctx.context.newSession.user.id);
						} catch (referralError) {
							console.error("Failed to generate referral code:", referralError);
						}

						// Schedule welcome series notifications for new users
						try {
							const { scheduleWelcomeSeriesNotifications } = await import(
								"@/lib/scheduled-notifications"
							);
							await scheduleWelcomeSeriesNotifications(
								ctx.context.newSession.user.id
							);
						} catch (notificationError) {
							console.error(
								"Failed to schedule welcome series notifications:",
								notificationError
							);
						}

						// Create welcome notification
						const { createNotification } = await import("@/lib/notifications");
						await createNotification({
							userId: ctx.context.newSession.user.id,
							type: "success",
							title: "Welcome to Vibeplate!",
							message:
								"Thank you for signing up! We're excited to have you here.\n\nGet started by exploring your Go to Dashboard and setting up your profile.",
							data: {
								links: [
									{
										text: "Go to Dashboard",
										url: "/dashboard",
										isExternal: false,
									},
								],
							},
						});

						// Create a personal workspace for the new user
						try {
							// Check if the user already has pending invitations
							const hasPendingInvitations = await db.query.invitation.findFirst(
								{
									where: eq(
										authSchema.invitation.email,
										ctx.context.newSession.user.email.toLowerCase()
									),
									columns: { id: true },
								}
							);

							// Only create a personal workspace if the user doesn't have pending invitations
							if (!hasPendingInvitations) {
								// Generate a unique slug based on the user's name
								const userName = ctx.context.newSession.user.name || "User";
								const baseSlug = userName
									.toLowerCase()
									.replace(/[^a-z0-9]/g, "-");
								const timestamp = Date.now().toString().slice(-6);
								const slug = `${baseSlug}-${timestamp}`;

								// Generate a unique ID for the organization
								const { randomUUID } = await import("crypto");
								const organizationId = randomUUID();
								const now = new Date();

								// Create the organization directly in the database
								await db.insert(authSchema.organization).values({
									id: organizationId,
									name: `${userName}'s Workspace`,
									slug: slug,
									createdAt: now,
								});

								// Create the member record to make the user an owner of the organization
								await db.insert(authSchema.member).values({
									id: randomUUID(),
									userId: ctx.context.newSession.user.id,
									organizationId: organizationId,
									role: "owner",
									createdAt: now,
								});

								console.log(
									`Created personal workspace for user: ${ctx.context.newSession.user.email}`
								);

								// Update the session to set the active organization
								await db
									.update(authSchema.session)
									.set({ activeOrganizationId: organizationId })
									.where(
										eq(
											authSchema.session.userId,
											ctx.context.newSession.user.id
										)
									);

								console.log(
									`Set active organization for user: ${ctx.context.newSession.user.email}`
								);
							} else {
								console.log(
									`User ${ctx.context.newSession.user.email} has pending invitations, skipping personal workspace creation`
								);
							}
						} catch (workspaceError) {
							console.error(
								"Failed to create personal workspace:",
								workspaceError
							);
						}
					}
				} catch (error) {
					// Log the error but don't block user creation
					console.error(
						"Failed to schedule welcome emails or create notification:",
						error
					);
				}
			}

			// We now handle invitation processing directly in the accept-invitation page
			// with a dedicated auth flow, so we don't need to process invitations from URL parameters
		}),
	},
});
