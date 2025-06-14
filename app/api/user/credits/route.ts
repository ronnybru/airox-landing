import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organization } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession, getActiveOrganization } from "@/lib/session";

export async function GET() {
	try {
		const session = await getServerSession();

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get the active organization
		const activeOrg = await getActiveOrganization();

		if (!activeOrg) {
			return NextResponse.json(
				{ error: "No active organization" },
				{ status: 404 }
			);
		}

		// Get the organization's credits from the database
		const orgData = await db
			.select({ credits: organization.credits })
			.from(organization)
			.where(eq(organization.id, activeOrg.id))
			.then((res) => res[0]);

		if (!orgData) {
			return NextResponse.json(
				{ error: "Organization not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({ credits: orgData.credits });
	} catch (error) {
		console.error("Error fetching organization credits:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
