import { NextResponse } from "next/server";
import { requireServerSession } from "@/lib/session";
import { deactivateAllUserTokens } from "@/lib/push-notifications";

export async function POST() {
	try {
		const session = await requireServerSession();
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		// Deactivate all push tokens for the user
		await deactivateAllUserTokens(session.user.id);

		return NextResponse.json({
			success: true,
			message: "All push tokens deactivated successfully",
		});
	} catch (error) {
		console.error("Error deactivating push tokens on logout:", error);
		return NextResponse.json(
			{ error: "Failed to deactivate push tokens" },
			{ status: 500 }
		);
	}
}
