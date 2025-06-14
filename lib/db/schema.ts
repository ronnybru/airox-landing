import { relations } from "drizzle-orm";
import {
	pgTable,
	serial,
	text,
	varchar,
	timestamp,
	integer,
	boolean,
	jsonb,
	uniqueIndex,
	real,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull(),
	image: text("image"),
	role: varchar("role", { length: 50 }).notNull().default("user"),
	emailVariant: varchar("email_variant", { length: 10 }),
	// Onboarding data
	gender: varchar("gender", { length: 10 }), // "male", "female", "other"
	hearAboutUs: varchar("hear_about_us", { length: 20 }), // "instagram", "facebook", etc.
	height: integer("height"), // in cm
	weight: integer("weight"), // in kg
	isMetric: boolean("is_metric").default(true),
	language: varchar("language", { length: 10 }).default("en"), // "en", "no", "es", "de"
	timezone: varchar("timezone", { length: 50 }).default("UTC"), // User's timezone (e.g., "Europe/Oslo", "America/New_York")
	birthDate: timestamp("birth_date"),
	// Gym preferences
	gymFrequency: integer("gym_frequency"), // times per week (1-7)
	gymLevel: varchar("gym_level", { length: 20 }), // "beginner", "intermediate", "advanced"
	preferredFocus: varchar("preferred_focus", { length: 20 }), // "strength", "muscle", "endurance", "general"
	injuries: text("injuries"), // text input for AI to use
	onboardingCompleted: boolean("onboarding_completed").default(false),
	// Public profile settings
	isProfilePublic: boolean("is_profile_public").default(false),
	publicUsername: varchar("public_username", { length: 50 }), // unique username for public profile
	profileImageUrl: text("profile_image_url"), // profile picture URL
	bio: text("bio"), // user bio for public profile
	socialLinks: jsonb("social_links"), // social media links as JSON object
	profileData: jsonb("profile_data"), // additional profile data for future expansion
	// Credits and referrals
	credits: integer("credits").notNull().default(0), // User credits in cents
	referralCode: varchar("referral_code", { length: 20 }), // User's personal referral code
	referredBy: text("referred_by"), // Who referred this user (will add foreign key in relations)
	// IAP tracking
	iapTransactionId: text("iap_transaction_id"), // Apple transaction ID or Android order ID
	iapPurchaseToken: text("iap_purchase_token"), // Android purchase token (for Google Play validation)
	iapPlatform: varchar("iap_platform", { length: 10 }), // "ios" or "android"
	iapOriginalTransactionId: text("iap_original_transaction_id"), // iOS original transaction ID
	subscriptionStatus: varchar("subscription_status", { length: 20 }).default(
		"none"
	), // "trial", "active", "expired", "cancelled"
	subscriptionPlan: varchar("subscription_plan", { length: 50 }), // "premium_monthly", "premium_yearly"
	subscriptionStartDate: timestamp("subscription_start_date"),
	subscriptionEndDate: timestamp("subscription_end_date"),
	// HealthKit integration status
	healthKitConnected: boolean("health_kit_connected").default(false),
	healthKitLastConnected: timestamp("health_kit_last_connected"),
	healthKitLastDisconnected: timestamp("health_kit_last_disconnected"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	activeOrganizationId: text("active_organization_id"),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at"),
	updatedAt: timestamp("updated_at"),
});

// Notifications table
export const notifications = pgTable("notifications", {
	id: serial("id").primaryKey(),
	userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
	organizationId: text("organization_id").references(() => organization.id, {
		onDelete: "cascade",
	}),
	type: varchar("type", { length: 50 }).notNull(), // e.g., "system", "product_sold", "message"
	title: text("title").notNull(),
	message: text("message").notNull(),
	read: boolean("read").notNull().default(false),
	singleReadDismissal: boolean("single_read_dismissal")
		.notNull()
		.default(false), // If true, notification is dismissed for all org members when one reads it
	data: jsonb("data"), // Additional data for the notification
	groupKey: text("group_key"), // For grouping similar notifications
	groupCount: integer("group_count").default(1), // Count for grouped notifications
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Organization table
export const organization = pgTable("organization", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	logo: text("logo"),
	metadata: jsonb("metadata"),
	credits: integer("credits").notNull().default(0),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Member table
export const member = pgTable("member", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	teamId: text("team_id"),
	role: text("role").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Invitation table
export const invitation = pgTable("invitation", {
	id: text("id").primaryKey(),
	email: text("email").notNull(),
	inviterId: text("inviter_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	teamId: text("team_id"),
	role: text("role").notNull(),
	status: text("status").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Team table
export const team = pgTable("team", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for user
export const userRelations = relations(user, ({ many, one }) => ({
	notifications: many(notifications),
	members: many(member),
	invitations: many(invitation, { relationName: "inviter" }),
	bodyScans: many(bodyScans),
	bodyScanComparisons: many(bodyScanComparisons),
	leaderboardEntry: one(publicLeaderboard),
	pushTokens: many(pushTokens),
	pushCampaigns: many(pushCampaigns),
	pushReceipts: many(pushReceipts),
	referralCodes: many(referralCodes),
	referralUsageAsReferrer: many(referralUsage, { relationName: "referrer" }),
	referralUsageAsReferred: many(referralUsage, { relationName: "referred" }),
	scheduledPushNotifications: many(scheduledPushNotifications),
	userFeedback: many(userFeedback),
	healthData: many(healthData),
	healthInsights: many(healthInsights),
	healthScores: many(healthScores),
	healthGoals: many(healthGoals),
	// Exercise system relations
	userExercises: many(userExercises),
	workoutSessions: many(workoutSessions),
	exercisePerformances: many(exercisePerformance),
	workoutRecommendations: many(workoutRecommendations),
	createdExercises: many(exercises),
	referredBy: one(user, {
		fields: [user.referredBy],
		references: [user.id],
		relationName: "referrer",
	}),
	referredUsers: many(user, { relationName: "referrer" }),
}));

// Relations for notifications
export const notificationsRelations = relations(notifications, ({ one }) => ({
	user: one(user, {
		fields: [notifications.userId],
		references: [user.id],
	}),
	organization: one(organization, {
		fields: [notifications.organizationId],
		references: [organization.id],
	}),
}));

// Relations for organization
export const organizationRelations = relations(
	organization,
	({ many, one }) => ({
		members: many(member),
		invitations: many(invitation),
		teams: many(team),
		notifications: many(notifications),
		organizationMembership: one(organizationMemberships),
	})
);

// Relations for member
export const memberRelations = relations(member, ({ one }) => ({
	user: one(user, {
		fields: [member.userId],
		references: [user.id],
	}),
	organization: one(organization, {
		fields: [member.organizationId],
		references: [organization.id],
	}),
	team: one(team, {
		fields: [member.teamId],
		references: [team.id],
	}),
}));

// Relations for invitation
export const invitationRelations = relations(invitation, ({ one }) => ({
	inviter: one(user, {
		fields: [invitation.inviterId],
		references: [user.id],
		relationName: "inviter",
	}),
	organization: one(organization, {
		fields: [invitation.organizationId],
		references: [organization.id],
	}),
	team: one(team, {
		fields: [invitation.teamId],
		references: [team.id],
	}),
}));

// Relations for team
export const teamRelations = relations(team, ({ one, many }) => ({
	organization: one(organization, {
		fields: [team.organizationId],
		references: [organization.id],
	}),
	members: many(member),
}));

// Relations for session
export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
	activeOrganization: one(organization, {
		fields: [session.activeOrganizationId],
		references: [organization.id],
	}),
}));

export const organizationMemberships = pgTable("organization_memberships", {
	id: serial("id").primaryKey(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" })
		.unique(),
	membershipId: text("membership_id").notNull(),
	startDate: timestamp("start_date").defaultNow().notNull(),
	endDate: timestamp("end_date"), // Null for lifetime memberships
	status: varchar("status", { length: 255 }).notNull(), // e.g., active, cancelled, expired
	lemonSqueezySubscriptionId: varchar("lemon_squeezy_subscription_id", {
		length: 255,
	}).unique(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations for organizationMemberships
export const organizationMembershipsRelations = relations(
	organizationMemberships,
	({ one }) => ({
		organization: one(organization, {
			fields: [organizationMemberships.organizationId],
			references: [organization.id],
		}),
	})
);

export const waitlist = pgTable("waitlist", {
	id: text("id").primaryKey(),
	email: text("email").notNull().unique(),
	name: text("name"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	subscribedToNewsletter: boolean("subscribed_to_newsletter").default(true),
	source: text("source").default("waitlist"),
	notes: text("notes"),
});

// Body scans table for tracking user body analysis photos
export const bodyScans = pgTable("body_scans", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	imageUrl: text("image_url").notNull(), // URL to the uploaded image
	originalFileName: text("original_file_name"),
	fileSize: integer("file_size"), // in bytes
	mimeType: text("mime_type"),
	// AI Analysis results
	analysisStatus: varchar("analysis_status", { length: 20 })
		.notNull()
		.default("pending"), // "pending", "processing", "completed", "failed"
	analysisResults: jsonb("analysis_results"), // Store AI analysis data
	analysisError: text("analysis_error"), // Store error message if analysis fails
	// Body measurements extracted by AI
	bodyFatPercentage: integer("body_fat_percentage"), // stored as percentage * 100 (e.g., 15.5% = 1550)
	muscleMass: integer("muscle_mass"), // in grams
	visceralFat: integer("visceral_fat"), // rating scale
	// Progress tracking
	weight: integer("weight"), // weight at time of scan in grams
	notes: text("notes"), // user notes about the scan
	tags: text("tags").array(), // user tags for categorizing scans (e.g., "arm day", "leg day", "progress check")
	isBaseline: boolean("is_baseline").default(false), // mark as baseline measurement
	// Public visibility and scoring
	isPublic: boolean("is_public").default(false), // user can make specific scans public
	progressScore: integer("progress_score"), // overall progress score 0-10000 (for ranking)
	transformationRating: integer("transformation_rating"), // AI-generated transformation rating
	jackScore: integer("jack_score"), // Classic physique bodybuilding score 0-1000 (emphasizes low body fat + high muscle mass)
	// Metadata
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Body scan progress comparisons
export const bodyScanComparisons = pgTable("body_scan_comparisons", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	baselineScanId: text("baseline_scan_id")
		.notNull()
		.references(() => bodyScans.id, { onDelete: "cascade" }),
	currentScanId: text("current_scan_id")
		.notNull()
		.references(() => bodyScans.id, { onDelete: "cascade" }),
	// Progress metrics
	bodyFatChange: integer("body_fat_change"), // change in body fat percentage * 100
	muscleMassChange: integer("muscle_mass_change"), // change in muscle mass in grams
	weightChange: integer("weight_change"), // change in weight in grams
	progressScore: integer("progress_score"), // overall progress score 0-100
	// AI insights
	insights: jsonb("insights"), // AI-generated insights about progress
	recommendations: jsonb("recommendations"), // AI recommendations
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Public leaderboard for ranking users by their best transformations
export const publicLeaderboard = pgTable("public_leaderboard", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	bestScanId: text("best_scan_id")
		.notNull()
		.references(() => bodyScans.id, { onDelete: "cascade" }),
	// Ranking metrics
	overallScore: integer("overall_score").notNull(), // combined score for ranking
	transformationScore: integer("transformation_score"), // transformation quality score
	consistencyScore: integer("consistency_score"), // consistency of progress score
	timeToGoal: integer("time_to_goal"), // days to achieve transformation
	// Ranking position
	currentRank: integer("current_rank"),
	previousRank: integer("previous_rank"),
	rankChange: integer("rank_change"), // positive = moved up, negative = moved down
	// Categories for different rankings
	category: varchar("category", { length: 20 }).default("overall"), // "overall", "male", "female", "beginner", "advanced"
	ageGroup: varchar("age_group", { length: 10 }), // "18-25", "26-35", "36-45", "46+"
	// Metadata
	lastUpdated: timestamp("last_updated").defaultNow().notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations for body scans
export const bodyScansRelations = relations(bodyScans, ({ one, many }) => ({
	user: one(user, {
		fields: [bodyScans.userId],
		references: [user.id],
	}),
	baselineComparisons: many(bodyScanComparisons, { relationName: "baseline" }),
	currentComparisons: many(bodyScanComparisons, { relationName: "current" }),
}));

// Relations for body scan comparisons
export const bodyScanComparisonsRelations = relations(
	bodyScanComparisons,
	({ one }) => ({
		user: one(user, {
			fields: [bodyScanComparisons.userId],
			references: [user.id],
		}),
		baselineScan: one(bodyScans, {
			fields: [bodyScanComparisons.baselineScanId],
			references: [bodyScans.id],
			relationName: "baseline",
		}),
		currentScan: one(bodyScans, {
			fields: [bodyScanComparisons.currentScanId],
			references: [bodyScans.id],
			relationName: "current",
		}),
	})
);

// Relations for public leaderboard
export const publicLeaderboardRelations = relations(
	publicLeaderboard,
	({ one }) => ({
		user: one(user, {
			fields: [publicLeaderboard.userId],
			references: [user.id],
		}),
		bestScan: one(bodyScans, {
			fields: [publicLeaderboard.bestScanId],
			references: [bodyScans.id],
		}),
	})
);

// Push notification tokens table for storing device tokens
export const pushTokens = pgTable("push_tokens", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	token: text("token").notNull(), // Expo push token
	deviceId: text("device_id"), // Device identifier
	platform: varchar("platform", { length: 10 }).notNull(), // "ios", "android"
	isActive: boolean("is_active").notNull().default(true),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Push notification campaigns table for tracking sent notifications
export const pushCampaigns = pgTable("push_campaigns", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	message: text("message").notNull(),
	// Multi-language support
	titleEn: text("title_en"),
	messageEn: text("message_en"),
	titleNo: text("title_no"),
	messageNo: text("message_no"),
	titleEs: text("title_es"),
	messageEs: text("message_es"),
	titleDe: text("title_de"),
	messageDe: text("message_de"),
	data: jsonb("data"), // Additional data payload
	targetType: varchar("target_type", { length: 20 }).notNull(), // "all", "timezone", "user"
	targetValue: text("target_value"), // timezone name or user ID
	scheduledFor: timestamp("scheduled_for"), // null for immediate send
	status: varchar("status", { length: 20 }).notNull().default("pending"), // "pending", "sending", "completed", "failed"
	sentCount: integer("sent_count").default(0),
	deliveredCount: integer("delivered_count").default(0),
	failedCount: integer("failed_count").default(0),
	createdBy: text("created_by").references(() => user.id, {
		onDelete: "cascade",
	}),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Push notification receipts table for tracking delivery status
export const pushReceipts = pgTable("push_receipts", {
	id: text("id").primaryKey(),
	campaignId: text("campaign_id")
		.notNull()
		.references(() => pushCampaigns.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	tokenId: text("token_id")
		.notNull()
		.references(() => pushTokens.id, { onDelete: "cascade" }),
	status: varchar("status", { length: 20 }).notNull(), // "sent", "delivered", "failed"
	receiptId: text("receipt_id"), // Expo receipt ID
	errorMessage: text("error_message"),
	sentAt: timestamp("sent_at").defaultNow().notNull(),
	deliveredAt: timestamp("delivered_at"),
});

// Referral codes table for tracking user referrals
export const referralCodes = pgTable("referral_codes", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	code: varchar("code", { length: 20 }).notNull().unique(), // The referral code
	isActive: boolean("is_active").notNull().default(true),
	usageCount: integer("usage_count").notNull().default(0),
	maxUsage: integer("max_usage"), // null for unlimited
	creditAmount: integer("credit_amount").notNull().default(2000), // Amount in cents ($20.00)
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Referral usage table for tracking when referral codes are used
export const referralUsage = pgTable("referral_usage", {
	id: text("id").primaryKey(),
	referralCodeId: text("referral_code_id")
		.notNull()
		.references(() => referralCodes.id, { onDelete: "cascade" }),
	referrerId: text("referrer_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	referredUserId: text("referred_user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	creditAwarded: integer("credit_awarded").notNull(), // Amount in cents
	status: varchar("status", { length: 20 }).notNull().default("pending"), // "pending", "completed", "cancelled"
	createdAt: timestamp("created_at").defaultNow().notNull(),
	processedAt: timestamp("processed_at"),
});

// Scheduled push notifications table for delayed notifications
export const scheduledPushNotifications = pgTable(
	"scheduled_push_notifications",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		notificationType: varchar("notification_type", { length: 50 }).notNull(), // "referral_welcome", "weekly_reminder", etc.
		scheduledFor: timestamp("scheduled_for").notNull(),
		status: varchar("status", { length: 20 }).notNull().default("pending"), // "pending", "sent", "failed", "cancelled"
		campaignId: text("campaign_id").references(() => pushCampaigns.id),
		data: jsonb("data"), // Additional data for the notification
		createdAt: timestamp("created_at").defaultNow().notNull(),
		processedAt: timestamp("processed_at"),
	}
);

// Relations for push tokens
export const pushTokensRelations = relations(pushTokens, ({ one, many }) => ({
	user: one(user, {
		fields: [pushTokens.userId],
		references: [user.id],
	}),
	receipts: many(pushReceipts),
}));

// Relations for push campaigns
export const pushCampaignsRelations = relations(
	pushCampaigns,
	({ one, many }) => ({
		createdBy: one(user, {
			fields: [pushCampaigns.createdBy],
			references: [user.id],
		}),
		receipts: many(pushReceipts),
	})
);

// Relations for push receipts
export const pushReceiptsRelations = relations(pushReceipts, ({ one }) => ({
	campaign: one(pushCampaigns, {
		fields: [pushReceipts.campaignId],
		references: [pushCampaigns.id],
	}),
	user: one(user, {
		fields: [pushReceipts.userId],
		references: [user.id],
	}),
	token: one(pushTokens, {
		fields: [pushReceipts.tokenId],
		references: [pushTokens.id],
	}),
}));

// Relations for referral codes
export const referralCodesRelations = relations(
	referralCodes,
	({ one, many }) => ({
		user: one(user, {
			fields: [referralCodes.userId],
			references: [user.id],
		}),
		usage: many(referralUsage),
	})
);

// User feedback table for collecting feedback from low ratings
export const userFeedback = pgTable("user_feedback", {
	id: text("id").primaryKey(),
	userId: text("user_id").references(() => user.id, { onDelete: "cascade" }), // Nullable for anonymous feedback
	rating: integer("rating"), // The star rating that triggered the feedback (1-3)
	feedback: text("feedback").notNull(), // The feedback text
	source: varchar("source", { length: 20 }).notNull().default("onboarding"), // "onboarding", "app", etc.
	status: varchar("status", { length: 20 }).notNull().default("pending"), // "pending", "reviewed", "resolved"
	adminNotes: text("admin_notes"), // Notes from admin review
	// Anonymous user tracking fields
	deviceId: text("device_id"), // Device identifier for anonymous users
	userAgent: text("user_agent"), // Browser/app user agent
	ipAddress: text("ip_address"), // IP address for spam prevention
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations for user feedback
export const userFeedbackRelations = relations(userFeedback, ({ one }) => ({
	user: one(user, {
		fields: [userFeedback.userId],
		references: [user.id],
	}),
}));

// Relations for referral usage
export const referralUsageRelations = relations(referralUsage, ({ one }) => ({
	referralCode: one(referralCodes, {
		fields: [referralUsage.referralCodeId],
		references: [referralCodes.id],
	}),
	referrer: one(user, {
		fields: [referralUsage.referrerId],
		references: [user.id],
		relationName: "referrer",
	}),
	referredUser: one(user, {
		fields: [referralUsage.referredUserId],
		references: [user.id],
		relationName: "referred",
	}),
}));

// Relations for scheduled push notifications
export const scheduledPushNotificationsRelations = relations(
	scheduledPushNotifications,
	({ one }) => ({
		user: one(user, {
			fields: [scheduledPushNotifications.userId],
			references: [user.id],
		}),
		campaign: one(pushCampaigns, {
			fields: [scheduledPushNotifications.campaignId],
			references: [pushCampaigns.id],
		}),
	})
);

// Health data tables for tracking user health metrics
export const healthData = pgTable(
	"health_data",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		dataType: varchar("data_type", { length: 50 }).notNull(), // "steps", "sleep", "heart_rate", "hrv", "active_minutes"
		value: real("value").notNull(), // Main value (steps count, sleep minutes, heart rate bpm, etc.)
		unit: varchar("unit", { length: 20 }).notNull(), // "steps", "minutes", "bpm", "ms", etc.
		// Additional data fields for complex metrics
		additionalData: jsonb("additional_data"), // For complex data like sleep stages, workout types, etc.
		// Metadata
		recordedAt: timestamp("recorded_at").notNull(), // When the data was recorded by the device
		source: varchar("source", { length: 50 }), // "apple_health", "google_fit", "manual", etc.
		deviceType: varchar("device_type", { length: 50 }), // "iphone", "apple_watch", "fitbit", etc.
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => {
		return {
			// Unique constraint to prevent duplicate health data entries
			// For daily data like steps/sleep: group by date (day precision)
			// For real-time data like heart rate: use exact timestamp
			uniqueHealthDataEntry: uniqueIndex("unique_health_data_entry").on(
				table.userId,
				table.dataType,
				table.recordedAt,
				table.source
			),
		};
	}
);

// Health insights table for storing AI-generated health insights
export const healthInsights = pgTable("health_insights", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	insightType: varchar("insight_type", { length: 50 }).notNull(), // "sleep_quality", "recovery", "training_readiness", etc.
	title: text("title").notNull(),
	description: text("description").notNull(),
	score: integer("score"), // 0-100 score for the insight
	priority: varchar("priority", { length: 20 }).notNull().default("medium"), // "low", "medium", "high"
	category: varchar("category", { length: 30 }).notNull(), // "sleep", "activity", "recovery", "nutrition"
	// Data backing the insight
	dataPoints: jsonb("data_points"), // Health data points used to generate this insight
	recommendations: jsonb("recommendations"), // Actionable recommendations
	// Metadata
	validFrom: timestamp("valid_from").notNull(),
	validUntil: timestamp("valid_until"),
	isRead: boolean("is_read").notNull().default(false),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Health scores table for daily health scoring
export const healthScores = pgTable("health_scores", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	date: timestamp("date").notNull(), // Date for this score (daily)
	overallScore: integer("overall_score").notNull(), // 0-100 overall health score
	sleepScore: integer("sleep_score"), // 0-100 sleep quality score
	activityScore: integer("activity_score"), // 0-100 activity score
	recoveryScore: integer("recovery_score"), // 0-100 recovery score
	// Component scores
	stepGoalAchieved: boolean("step_goal_achieved").default(false),
	sleepGoalAchieved: boolean("sleep_goal_achieved").default(false),
	activeMinutesGoalAchieved: boolean("active_minutes_goal_achieved").default(
		false
	),
	// Metadata
	dataCompleteness: integer("data_completeness").notNull().default(0), // 0-100 how much data we have
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Health goals table for user-defined health targets
export const healthGoals = pgTable("health_goals", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	goalType: varchar("goal_type", { length: 50 }).notNull(), // "daily_steps", "sleep_duration", "active_minutes", etc.
	targetValue: integer("target_value").notNull(), // Target value for the goal
	unit: varchar("unit", { length: 20 }).notNull(), // "steps", "minutes", "hours", etc.
	isActive: boolean("is_active").notNull().default(true),
	// Goal tracking
	currentStreak: integer("current_streak").notNull().default(0), // Days in a row goal was met
	longestStreak: integer("longest_streak").notNull().default(0), // Longest streak ever
	totalAchievements: integer("total_achievements").notNull().default(0), // Total times goal was met
	// Metadata
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations for health data
export const healthDataRelations = relations(healthData, ({ one }) => ({
	user: one(user, {
		fields: [healthData.userId],
		references: [user.id],
	}),
}));

// Relations for health insights
export const healthInsightsRelations = relations(healthInsights, ({ one }) => ({
	user: one(user, {
		fields: [healthInsights.userId],
		references: [user.id],
	}),
}));

// Relations for health scores
export const healthScoresRelations = relations(healthScores, ({ one }) => ({
	user: one(user, {
		fields: [healthScores.userId],
		references: [user.id],
	}),
}));

// Relations for health goals
export const healthGoalsRelations = relations(healthGoals, ({ one }) => ({
	user: one(user, {
		fields: [healthGoals.userId],
		references: [user.id],
	}),
}));

// Exercise system tables

// Master exercises table - contains all available exercises
export const exercises = pgTable("exercises", {
	id: text("id").primaryKey(),
	name: text("name").notNull(), // Default/English name
	description: text("description").notNull(), // Default/English description
	instructions: text("instructions").notNull(), // Default/English step-by-step instructions
	// Multi-language support
	nameEn: text("name_en"),
	descriptionEn: text("description_en"),
	instructionsEn: text("instructions_en"),
	nameNo: text("name_no"),
	descriptionNo: text("description_no"),
	instructionsNo: text("instructions_no"),
	nameEs: text("name_es"),
	descriptionEs: text("description_es"),
	instructionsEs: text("instructions_es"),
	nameDe: text("name_de"),
	descriptionDe: text("description_de"),
	instructionsDe: text("instructions_de"),
	// Exercise categorization
	category: varchar("category", { length: 50 }).notNull(), // "chest", "back", "legs", "shoulders", "arms", "core", "cardio"
	subcategory: varchar("subcategory", { length: 50 }), // "upper_chest", "lower_back", "quads", etc.
	muscleGroups: text("muscle_groups").array().notNull(), // ["chest", "triceps", "shoulders"]
	equipment: text("equipment").array().notNull(), // ["barbell", "bench", "dumbbells"]
	// Difficulty and progression
	difficultyLevel: integer("difficulty_level").notNull(), // 1-10 scale
	baseTimePerSet: integer("base_time_per_set").notNull(), // seconds per set
	baseRestTime: integer("base_rest_time").notNull(), // seconds rest between sets
	defaultSets: integer("default_sets").notNull().default(3),
	defaultReps: integer("default_reps"), // null for time-based exercises
	defaultDuration: integer("default_duration"), // seconds for time-based exercises
	// Exercise type and mechanics
	exerciseType: varchar("exercise_type", { length: 30 }).notNull(), // "compound", "isolation", "cardio", "plyometric"
	movementPattern: varchar("movement_pattern", { length: 30 }), // "push", "pull", "squat", "hinge", "lunge", "carry"
	// Progression and scaling
	progressionType: varchar("progression_type", { length: 30 }).notNull(), // "weight", "reps", "time", "difficulty"
	scalingFactors: jsonb("scaling_factors"), // JSON with scaling rules for different fitness levels
	// Media and resources
	imageUrl: text("image_url"),
	videoUrl: text("video_url"),
	videoUrlDark: text("video_url_dark"), // Dark mode video URL
	thumbnailUrl: text("thumbnail_url"),
	// Admin and status
	isActive: boolean("is_active").notNull().default(true),
	createdBy: text("created_by").references(() => user.id),
	tags: text("tags").array(), // ["beginner_friendly", "home_workout", "no_equipment"]
	// Metadata
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User exercises - tracks which exercises are active for each user and their current levels
export const userExercises = pgTable("user_exercises", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	exerciseId: text("exercise_id")
		.notNull()
		.references(() => exercises.id, { onDelete: "cascade" }),
	// User-specific settings
	isActive: boolean("is_active").notNull().default(true),
	currentLevel: integer("current_level").notNull().default(1), // 1-10 progression level
	// Current working parameters
	currentWeight: integer("current_weight"), // in grams (for weight-based exercises)
	baseReps: integer("base_reps"), // foundational rep count for step progression
	currentReps: integer("current_reps"),
	currentSets: integer("current_sets").notNull().default(3),
	// Timed-exercise progression
	baseDuration: integer("base_duration"), // baseline hold duration (seconds)
	currentDuration: integer("current_duration"), // seconds for time-based exercises
	// Performance tracking
	lastPerformed: timestamp("last_performed"),
	totalSessions: integer("total_sessions").notNull().default(0),
	bestPerformance: jsonb("best_performance"), // Store best weight/reps/time achieved
	// User preferences
	preferredRestTime: integer("preferred_rest_time"), // Override default rest time
	notes: text("notes"), // User notes about the exercise
	// Metadata
	addedAt: timestamp("added_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Workout sessions - tracks individual workout sessions
export const workoutSessions = pgTable("workout_sessions", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	// Session details
	sessionType: varchar("session_type", { length: 30 })
		.notNull()
		.default("ai_recommended"), // "ai_recommended", "custom", "quick"
	targetDuration: integer("target_duration"), // planned duration in minutes
	actualDuration: integer("actual_duration"), // actual duration in minutes
	// User input and context
	userInput: text("user_input"), // User's input like "Go hard today" or "I feel tired"
	energyLevel: integer("energy_level"), // 1-5 scale from user input
	availableTime: integer("available_time").notNull(), // minutes available for workout
	// Session status
	status: varchar("status", { length: 20 }).notNull().default("planned"), // "planned", "in_progress", "completed", "cancelled"
	startedAt: timestamp("started_at"),
	completedAt: timestamp("completed_at"),
	// Progress tracking
	currentExerciseIndex: integer("current_exercise_index").default(0), // Track current exercise position for session resumption
	// AI recommendations context
	recommendationContext: jsonb("recommendation_context"), // Store AI reasoning and context
	// Session summary
	totalExercises: integer("total_exercises").default(0),
	completedExercises: integer("completed_exercises").default(0),
	overallRating: integer("overall_rating"), // 1-5 user rating of the session
	sessionNotes: text("session_notes"), // User notes about the session
	// Metadata
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Exercise performance - tracks how user performed each exercise in each session
export const exercisePerformance = pgTable("exercise_performance", {
	id: text("id").primaryKey(),
	sessionId: text("session_id")
		.notNull()
		.references(() => workoutSessions.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	exerciseId: text("exercise_id")
		.notNull()
		.references(() => exercises.id, { onDelete: "cascade" }),
	userExerciseId: text("user_exercise_id")
		.notNull()
		.references(() => userExercises.id, { onDelete: "cascade" }),
	// Exercise order in session
	orderInSession: integer("order_in_session").notNull(),
	// Planned vs actual performance
	plannedSets: integer("planned_sets").notNull(),
	completedSets: integer("completed_sets").notNull().default(0),
	plannedReps: integer("planned_reps"),
	plannedWeight: integer("planned_weight"), // in grams
	plannedDuration: integer("planned_duration"), // seconds
	// Actual performance data
	actualSets: jsonb("actual_sets"), // Array of set data: [{reps: 12, weight: 50000, duration: 30, restTime: 90}]
	// User feedback (required)
	difficultyRating: integer("difficulty_rating").notNull(), // 1-5: 1=way too easy, 2=easy, 3=perfect, 4=too hard, 5=way too hard
	// Optional feedback
	formRating: integer("form_rating"), // 1-5 self-assessment of form quality
	enjoymentRating: integer("enjoyment_rating"), // 1-5 how much they enjoyed the exercise
	exerciseNotes: text("exercise_notes"), // User notes about this specific exercise performance
	// Performance metrics
	totalVolume: integer("total_volume"), // total weight * reps for the exercise
	averageRestTime: integer("average_rest_time"), // seconds
	timeToComplete: integer("time_to_complete"), // total time spent on this exercise
	// Status
	isCompleted: boolean("is_completed").notNull().default(false),
	isSkipped: boolean("is_skipped").notNull().default(false),
	skipReason: text("skip_reason"), // Why the exercise was skipped
	// Metadata
	startedAt: timestamp("started_at"),
	completedAt: timestamp("completed_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Workout recommendations - AI-generated workout recommendations
export const workoutRecommendations = pgTable("workout_recommendations", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	sessionId: text("session_id").references(() => workoutSessions.id, {
		onDelete: "cascade",
	}), // null for unused recommendations
	// Recommendation context
	recommendationType: varchar("recommendation_type", { length: 30 })
		.notNull()
		.default("daily"), // "daily", "recovery", "intense", "quick"
	targetDuration: integer("target_duration").notNull(), // minutes
	userInput: text("user_input"), // User's input that influenced the recommendation
	// AI reasoning
	aiReasoning: text("ai_reasoning").notNull(), // Why these exercises were chosen
	contextFactors: jsonb("context_factors"), // Factors considered: HRV, last workouts, energy, etc.
	// Recommended exercises
	recommendedExercises: jsonb("recommended_exercises").notNull(), // Array of exercise recommendations with sets/reps/weight
	alternativeExercises: jsonb("alternative_exercises"), // Alternative exercises if user wants to swap
	// Recommendation quality
	confidenceScore: integer("confidence_score").notNull(), // 1-100 AI confidence in recommendation
	expectedDifficulty: integer("expected_difficulty").notNull(), // 1-10 expected difficulty
	focusAreas: text("focus_areas").array().notNull(), // ["chest", "triceps", "shoulders"]
	// Status
	status: varchar("status", { length: 20 }).notNull().default("pending"), // "pending", "accepted", "modified", "rejected"
	isUsed: boolean("is_used").notNull().default(false),
	userFeedback: text("user_feedback"), // User feedback on the recommendation
	// Metadata
	validUntil: timestamp("valid_until").notNull(), // Recommendations expire
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Exercise relations
export const exercisesRelations = relations(exercises, ({ one, many }) => ({
	createdBy: one(user, {
		fields: [exercises.createdBy],
		references: [user.id],
	}),
	userExercises: many(userExercises),
	exercisePerformances: many(exercisePerformance),
}));

// User exercises relations
export const userExercisesRelations = relations(
	userExercises,
	({ one, many }) => ({
		user: one(user, {
			fields: [userExercises.userId],
			references: [user.id],
		}),
		exercise: one(exercises, {
			fields: [userExercises.exerciseId],
			references: [exercises.id],
		}),
		performances: many(exercisePerformance),
	})
);

// Workout sessions relations
export const workoutSessionsRelations = relations(
	workoutSessions,
	({ one, many }) => ({
		user: one(user, {
			fields: [workoutSessions.userId],
			references: [user.id],
		}),
		exercisePerformances: many(exercisePerformance),
		recommendations: many(workoutRecommendations),
	})
);

// Exercise performance relations
export const exercisePerformanceRelations = relations(
	exercisePerformance,
	({ one }) => ({
		session: one(workoutSessions, {
			fields: [exercisePerformance.sessionId],
			references: [workoutSessions.id],
		}),
		user: one(user, {
			fields: [exercisePerformance.userId],
			references: [user.id],
		}),
		exercise: one(exercises, {
			fields: [exercisePerformance.exerciseId],
			references: [exercises.id],
		}),
		userExercise: one(userExercises, {
			fields: [exercisePerformance.userExerciseId],
			references: [userExercises.id],
		}),
	})
);

// Workout recommendations relations
export const workoutRecommendationsRelations = relations(
	workoutRecommendations,
	({ one }) => ({
		user: one(user, {
			fields: [workoutRecommendations.userId],
			references: [user.id],
		}),
		session: one(workoutSessions, {
			fields: [workoutRecommendations.sessionId],
			references: [workoutSessions.id],
		}),
	})
);
