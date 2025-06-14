import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { scheduleTrialNotifications } from "@/lib/scheduled-notifications";

export async function POST(request: NextRequest) {
	try {
		// Get the authenticated user
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return NextResponse.json(
				{ success: false, error: "Authentication required" },
				{ status: 401 }
			);
		}

		// Schedule trial notifications for the user
		const notificationIds = await scheduleTrialNotifications(session.user.id);

		console.log(
			`✅ Scheduled ${notificationIds.length} trial notifications for user ${session.user.id}`
		);

		return NextResponse.json({
			success: true,
			notificationIds,
			message: "Trial notifications scheduled successfully",
		});
	} catch (error) {
		console.error("❌ Failed to schedule trial notifications:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to schedule trial notifications" },
			{ status: 500 }
		);
	}
}
