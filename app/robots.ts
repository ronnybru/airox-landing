import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	// Get the base URL from environment
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: [
				"/api/",
				"/dashboard/",
				"/settings/",
				"/profile/",
				"/accept-invitation/",
				"/invitations/",
			],
		},
		sitemap: `${baseUrl}/sitemap.xml`,
	};
}
