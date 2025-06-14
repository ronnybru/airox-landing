import { db } from "@/lib/db";
import { scheduledPushNotifications, user } from "@/lib/db/schema";
import { eq, lte, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { sendImmediatePushNotification } from "./push-notifications";

/**
 * Schedule a push notification for a user
 */
export async function scheduleNotification(
	userId: string,
	notificationType: string,
	scheduledFor: Date,
	data?: Record<string, unknown>
): Promise<string> {
	const notificationId = nanoid();

	await db.insert(scheduledPushNotifications).values({
		id: notificationId,
		userId,
		notificationType,
		scheduledFor,
		status: "pending",
		data,
		createdAt: new Date(),
	});

	return notificationId;
}

/**
 * Schedule referral welcome notification (5 minutes after registration)
 */
export async function scheduleReferralWelcomeNotification(
	userId: string
): Promise<string> {
	const scheduledFor = new Date();
	scheduledFor.setMinutes(scheduledFor.getMinutes() + 5); // 5 minutes from now

	return await scheduleNotification(userId, "referral_welcome", scheduledFor, {
		type: "referral_welcome",
		action: "open_referral_page",
	});
}

/**
 * Schedule welcome series notifications for new users
 */
export async function scheduleWelcomeSeriesNotifications(
	userId: string
): Promise<string[]> {
	const notificationIds: string[] = [];
	const now = new Date();

	// Notification 1: 2 hours after registration
	const notification1Time = new Date(now);
	// notification1Time.setHours(notification1Time.getHours() + 2);
	notification1Time.setHours(notification1Time.getHours() + 2);

	const id1 = await scheduleNotification(
		userId,
		"welcome_dream_body",
		notification1Time,
		{
			type: "welcome_dream_body",
			action: "open_home",
		}
	);
	notificationIds.push(id1);

	// Notification 2: 24 hours after registration
	const notification2Time = new Date(now);
	notification2Time.setHours(notification2Time.getHours() + 24);

	const id2 = await scheduleNotification(
		userId,
		"welcome_scan_benefits",
		notification2Time,
		{
			type: "welcome_scan_benefits",
			action: "open_home",
		}
	);
	notificationIds.push(id2);

	// Notification 3: 3 days after registration
	const notification3Time = new Date(now);
	notification3Time.setDate(notification3Time.getDate() + 3);

	const id3 = await scheduleNotification(
		userId,
		"welcome_2x_results",
		notification3Time,
		{
			type: "welcome_2x_results",
			action: "open_home",
		}
	);
	notificationIds.push(id3);

	return notificationIds;
}

/**
 * Schedule trial-specific notifications for users who convert
 */
export async function scheduleTrialNotifications(
	userId: string
): Promise<string[]> {
	const notificationIds: string[] = [];
	const now = new Date();

	// Notification 1: 48 hours after trial start - renewal reminder
	const renewalReminderTime = new Date(now);
	renewalReminderTime.setHours(renewalReminderTime.getHours() + 48);

	const id1 = await scheduleNotification(
		userId,
		"trial_renewal_reminder",
		renewalReminderTime,
		{
			type: "trial_renewal_reminder",
			action: "open_settings",
		}
	);
	notificationIds.push(id1);

	// Notification 2: 7 days after trial start - leaderboard check
	const leaderboardTime = new Date(now);
	leaderboardTime.setDate(leaderboardTime.getDate() + 7);

	const id2 = await scheduleNotification(
		userId,
		"check_leaderboard",
		leaderboardTime,
		{
			type: "check_leaderboard",
			action: "open_progress",
		}
	);
	notificationIds.push(id2);

	return notificationIds;
}

/**
 * Process pending scheduled notifications
 */
export async function processPendingNotifications(): Promise<void> {
	const now = new Date();

	// Get all pending notifications that are due
	const pendingNotifications = await db
		.select({
			id: scheduledPushNotifications.id,
			userId: scheduledPushNotifications.userId,
			notificationType: scheduledPushNotifications.notificationType,
			data: scheduledPushNotifications.data,
			userLanguage: user.language,
		})
		.from(scheduledPushNotifications)
		.innerJoin(user, eq(scheduledPushNotifications.userId, user.id))
		.where(
			and(
				eq(scheduledPushNotifications.status, "pending"),
				lte(scheduledPushNotifications.scheduledFor, now)
			)
		);

	for (const notification of pendingNotifications) {
		try {
			let notificationData;

			// Define notification content based on type
			switch (notification.notificationType) {
				case "referral_welcome":
					notificationData = {
						title: "Welcome to airox! 🎉",
						message: "Get $20 credit for each friend you refer!",
						titleEn: "Welcome to airox! 🎉",
						messageEn: "Get $20 credit for each friend you refer!",
						titleNo: "Velkommen til airox! 🎉",
						messageNo: "Få $20 kreditt for hver venn du henviser!",
						titleEs: "¡Bienvenido a airox! 🎉",
						messageEs: "¡Obtén $20 de crédito por cada amigo que refieras!",
						titleDe: "Willkommen bei airox! 🎉",
						messageDe:
							"Erhalte $20 Guthaben für jeden Freund, den du empfiehlst!",
						data: {
							type: "referral_welcome",
							action: "open_referral_page",
							...((notification.data as Record<string, unknown>) || {}),
						},
					};
					break;
				case "welcome_dream_body":
					notificationData = {
						title: "Don't wait to build your dream body! 💪",
						message: "Your transformation journey starts with one scan",
						titleEn: "Don't wait to build your dream body! 💪",
						messageEn: "Your transformation journey starts with one scan",
						titleNo: "Ikke vent med å bygge drømmekroppen din! 💪",
						messageNo: "Transformasjonsreisen din starter med én skanning",
						titleEs: "¡No esperes para construir el cuerpo de tus sueños! 💪",
						messageEs: "Tu viaje de transformación comienza con un escaneo",
						titleDe: "Warte nicht darauf, deinen Traumkörper aufzubauen! 💪",
						messageDe: "Deine Transformationsreise beginnt mit einem Scan",
						data: {
							type: "welcome_dream_body",
							action: "open_home",
							...((notification.data as Record<string, unknown>) || {}),
						},
					};
					break;
				case "welcome_scan_benefits":
					notificationData = {
						title: "Jack AI",
						message: "All it takes is a picture after working out",
						titleEn: "Jack AI",
						messageEn: "All it takes is a picture after working out",
						titleNo: "Jack AI",
						messageNo: "Alt som trengs er et bilde etter trening",
						titleEs: "Jack AI",
						messageEs: "Solo necesitas una foto después de entrenar",
						titleDe: "Jack AI",
						messageDe: "Alles was du brauchst ist ein Foto nach dem Training",
						data: {
							type: "welcome_scan_benefits",
							action: "open_home",
							...((notification.data as Record<string, unknown>) || {}),
						},
					};
					break;
				case "welcome_2x_results":
					notificationData = {
						title: "Users doing this get 2x better results! 🚀",
						message: "Join thousands tracking their body transformation",
						titleEn: "Users doing this get 2x better results! 🚀",
						messageEn: "Join thousands tracking their body transformation",
						titleNo: "Brukere som gjør dette får 2x bedre resultater! 🚀",
						messageNo: "Bli med tusenvis som sporer kroppsforvandlingen sin",
						titleEs:
							"¡Los usuarios que hacen esto obtienen 2x mejores resultados! 🚀",
						messageEs: "Únete a miles que siguen su transformación corporal",
						titleDe: "Nutzer, die das tun, erzielen 2x bessere Ergebnisse! 🚀",
						messageDe:
							"Schließe dich Tausenden an, die ihre Körpertransformation verfolgen",
						data: {
							type: "welcome_2x_results",
							action: "open_home",
							...((notification.data as Record<string, unknown>) || {}),
						},
					};
					break;
				case "trial_renewal_reminder":
					notificationData = {
						title: "You're doing great! 🌟",
						message: "Your trial renews tomorrow",
						titleEn: "You're doing great! 🌟",
						messageEn: "Your trial renews tomorrow",
						titleNo: "Du gjør det flott! 🌟",
						messageNo: "Prøveperioden din fornyes i morgen",
						titleEs: "¡Lo estás haciendo genial! 🌟",
						messageEs: "Tu prueba se renueva mañana",
						titleDe: "Du machst das großartig! 🌟",
						messageDe: "Deine Testversion wird morgen verlängert",
						data: {
							type: "trial_renewal_reminder",
							action: "open_settings",
							...((notification.data as Record<string, unknown>) || {}),
						},
					};
					break;
				case "check_leaderboard":
					notificationData = {
						title: "Check your ranking! 🏆",
						message: "See how you compare to other users on the leaderboard",
						titleEn: "Check your ranking! 🏆",
						messageEn: "See how you compare to other users on the leaderboard",
						titleNo: "Sjekk rangeringen din! 🏆",
						messageNo:
							"Se hvordan du sammenligner med andre brukere på topplisten",
						titleEs: "¡Revisa tu clasificación! 🏆",
						messageEs:
							"Ve cómo te comparas con otros usuarios en la tabla de clasificación",
						titleDe: "Überprüfe dein Ranking! 🏆",
						messageDe:
							"Sieh, wie du im Vergleich zu anderen Nutzern auf der Bestenliste stehst",
						data: {
							type: "check_leaderboard",
							action: "open_progress",
							...((notification.data as Record<string, unknown>) || {}),
						},
					};
					break;
				default:
					console.warn(
						`Unknown notification type: ${notification.notificationType}`
					);
					continue;
			}

			// Send the notification
			const campaignId = await sendImmediatePushNotification(notificationData, {
				targetType: "user",
				targetValue: notification.userId,
				createdBy: null, // System-generated notification
			});

			// Update the scheduled notification status
			await db
				.update(scheduledPushNotifications)
				.set({
					status: "sent",
					campaignId,
					processedAt: new Date(),
				})
				.where(eq(scheduledPushNotifications.id, notification.id));

			console.log(
				`Sent scheduled notification ${notification.id} to user ${notification.userId}`
			);
		} catch (error) {
			console.error(
				`Failed to send scheduled notification ${notification.id}:`,
				error
			);

			// Mark as failed
			await db
				.update(scheduledPushNotifications)
				.set({
					status: "failed",
					processedAt: new Date(),
				})
				.where(eq(scheduledPushNotifications.id, notification.id));
		}
	}
}

/**
 * Cancel a scheduled notification
 */
export async function cancelScheduledNotification(
	notificationId: string
): Promise<void> {
	await db
		.update(scheduledPushNotifications)
		.set({
			status: "cancelled",
			processedAt: new Date(),
		})
		.where(eq(scheduledPushNotifications.id, notificationId));
}

/**
 * Get scheduled notifications for a user
 */
export async function getUserScheduledNotifications(userId: string) {
	return await db
		.select()
		.from(scheduledPushNotifications)
		.where(eq(scheduledPushNotifications.userId, userId));
}
