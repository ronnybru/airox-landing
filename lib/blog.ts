import fs from "fs";
import path from "path";
import React from "react";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import { MDXComponents } from "@/components/mdx-components";

const postsDirectory = path.join(process.cwd(), "content/blog");

export type Tag = {
	id: string;
	name: string;
	description: string | null;
	blogId: string;
};

export type Author = {
	name: string;
	url?: string;
	image?: string;
};

export type BlogPost = {
	slug: string;
	title: string;
	description: string | null;
	content: React.ReactNode;
	rawContent: string;
	publishDate: Date;
	updatedAt: Date;
	frontImage: string | null;
	tags: Tag[];
	published: boolean;
	author?: Author;
};

export async function getAllPosts(): Promise<BlogPost[]> {
	const fileNames = fs.readdirSync(postsDirectory);

	const allPostsData = await Promise.all(
		fileNames
			.filter((file) => file.endsWith(".mdx"))
			.map(async (fileName) => {
				// Remove ".mdx" from file name to get slug
				const slug = fileName.replace(/\.mdx$/, "");

				// Read MDX file as string
				const fullPath = path.join(postsDirectory, fileName);
				const fileContents = fs.readFileSync(fullPath, "utf8");

				// Use gray-matter to parse the post metadata section
				const { data, content } = matter(fileContents);

				// Compile MDX content
				const { content: mdxContent } = await compileMDX({
					source: content,
					components: MDXComponents,
					options: {
						parseFrontmatter: false,
					},
				});

				// Parse tags from frontmatter
				const tags = data.tags
					? data.tags.map((tag: string, index: number) => ({
							id: `tag-${index}`,
							name: tag,
							description: null,
							blogId: "local",
					  }))
					: [];

				// Parse author from frontmatter or use default
				const author = data.author
					? typeof data.author === "string"
						? { name: data.author }
						: data.author
					: { name: "airox Team" }; // Default author

				return {
					slug,
					title: data.title,
					description: data.description || null,
					content: mdxContent,
					rawContent: content,
					publishDate: new Date(data.publishDate),
					updatedAt: new Date(data.updatedAt || data.publishDate),
					frontImage: data.frontImage || null,
					tags,
					published: data.published !== false, // Default to true if not specified
					author,
				};
			})
	);

	// Sort posts by date
	return allPostsData.sort((a, b) => {
		if (a.publishDate < b.publishDate) {
			return 1;
		} else {
			return -1;
		}
	});
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
	const fullPath = path.join(postsDirectory, `${slug}.mdx`);

	// Check if file exists
	if (!fs.existsSync(fullPath)) {
		return null;
	}

	const fileContents = fs.readFileSync(fullPath, "utf8");

	// Use gray-matter to parse the post metadata section
	const { data, content } = matter(fileContents);

	// Compile MDX content
	const { content: mdxContent } = await compileMDX({
		source: content,
		components: MDXComponents,
		options: {
			parseFrontmatter: false,
		},
	});

	// Parse tags from frontmatter
	const tags = data.tags
		? data.tags.map((tag: string, index: number) => ({
				id: `tag-${index}`,
				name: tag,
				description: null,
				blogId: "local",
		  }))
		: [];

	// Parse author from frontmatter or use default
	const author = data.author
		? typeof data.author === "string"
			? { name: data.author }
			: data.author
		: { name: "airox Team" }; // Default author

	return {
		slug,
		title: data.title,
		description: data.description || null,
		content: mdxContent,
		rawContent: content,
		publishDate: new Date(data.publishDate),
		updatedAt: new Date(data.updatedAt || data.publishDate),
		frontImage: data.frontImage || null,
		tags,
		published: data.published !== false, // Default to true if not specified
		author,
	};
}
