import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);

		// Get title from query params
		const title = searchParams.get("title") || "airox";

		return new ImageResponse(
			(
				<div
					style={{
						display: "flex",
						fontSize: 60,
						color: "white",
						background: "linear-gradient(to bottom right, #3b82f6, #8b5cf6)",
						width: "100%",
						height: "100%",
						padding: "50px 200px",
						textAlign: "center",
						justifyContent: "center",
						alignItems: "center",
					}}>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
						}}>
						<div style={{ fontSize: 30, opacity: 0.8, marginBottom: 24 }}>
							airox
						</div>
						<div style={{ fontWeight: "bold" }}>{title}</div>
					</div>
				</div>
			),
			{
				width: 1200,
				height: 630,
			}
		);
	} catch (e) {
		console.error(e);
		return new Response("Failed to generate OG image", { status: 500 });
	}
}
