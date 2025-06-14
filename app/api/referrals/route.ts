import { NextResponse } from "next/server";
import { requireServerSession } from "@/lib/session";
import { getReferralStats } from "@/lib/referrals";

export async function GET() {
	try {
		const session = await requireServerSession();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const stats = await getReferralStats(session.user.id);

		return NextResponse.json({
			success: true,
			data: stats,
		});
	} catch (error) {
		console.error("Error getting referral stats:", error);
		return NextResponse.json(
			{
				error: "Failed to get referral stats",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
