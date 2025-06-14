import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	// Get the base URL from environment
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

	// Get all blog posts
	const posts = await getAllPosts();

	// Create sitemap entries for blog posts
	const blogPostsEntries = posts
		.filter((post) => post.published)
		.map((post) => ({
			url: `${baseUrl}/blog/${post.slug}`,
			lastModified: post.updatedAt,
			changeFrequency: "weekly" as const,
			priority: 0.7,
		}));

	// Static routes (excluding protected and admin routes)
	const routes = [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: "monthly" as const,
			priority: 1.0,
		},
		{
			url: `${baseUrl}/blog`,
			lastModified: new Date(),
			changeFrequency: "weekly" as const,
			priority: 0.8,
		},
		{
			url: `${baseUrl}/reset-password`,
			lastModified: new Date(),
			changeFrequency: "yearly" as const,
			priority: 0.3,
		},
		// Add other public routes here
	];

	return [...routes, ...blogPostsEntries];
}
