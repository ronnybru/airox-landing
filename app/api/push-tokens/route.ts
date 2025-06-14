import { NextRequest, NextResponse } from "next/server";
import { requireServerSession } from "@/lib/session";
import {
	registerPushToken,
	deactivatePushToken,
} from "@/lib/push-notifications";
import { z } from "zod";

const registerTokenSchema = z.object({
	token: z.string().min(1, "Token is required"),
	deviceId: z.string().optional(),
	platform: z.enum(["ios", "android"]).default("ios"),
});

const deactivateTokenSchema = z.object({
	token: z.string().min(1, "Token is required"),
});

export async function POST(request: NextRequest) {
	try {
		const session = await requireServerSession();
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const validatedData = registerTokenSchema.parse(body);

		const tokenId = await registerPushToken(
			session.user.id,
			validatedData.token,
			validatedData.deviceId,
			validatedData.platform
		);

		return NextResponse.json({
			success: true,
			tokenId,
		});
	} catch (error) {
		console.error("Error registering push token:", error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid request data", details: error.errors },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{ error: "Failed to register push token" },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const session = await requireServerSession();
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const validatedData = deactivateTokenSchema.parse(body);

		await deactivatePushToken(session.user.id, validatedData.token);

		return NextResponse.json({
			success: true,
		});
	} catch (error) {
		console.error("Error deactivating push token:", error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid request data", details: error.errors },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{ error: "Failed to deactivate push token" },
			{ status: 500 }
		);
	}
}
