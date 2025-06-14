import { BlogPost, Tag } from "@/lib/blog";

export interface TagWithCount extends Tag {
	count: number;
}

export function getAllTags(posts: BlogPost[]): Record<string, number> {
	const tagMap: Record<string, number> = {};

	posts.forEach((post) => {
		if (post.published && post.tags) {
			post.tags.forEach((tag) => {
				tagMap[tag.name] = (tagMap[tag.name] || 0) + 1;
			});
		}
	});

	return tagMap;
}

export function sortTagsByCount(tags: Record<string, number>): string[] {
	return Object.keys(tags).sort((a, b) => tags[b] - tags[a]);
}

export function getTagObjects(posts: BlogPost[]): TagWithCount[] {
	const tagMap: Record<string, TagWithCount> = {};

	posts.forEach((post) => {
		if (post.published && post.tags) {
			post.tags.forEach((tag) => {
				if (tagMap[tag.name]) {
					tagMap[tag.name].count += 1;
				} else {
					tagMap[tag.name] = {
						...tag,
						count: 1,
					};
				}
			});
		}
	});

	return Object.values(tagMap);
}

export function getPostsByTag(posts: BlogPost[], tagSlug: string): BlogPost[] {
	return posts.filter((post) => {
		if (!post.tags) return false;
		return post.tags.some(
			(tag) => slugifyTag(tag.name) === tagSlug.toLowerCase()
		);
	});
}

export function slugifyTag(tag: string): string {
	return tag.toLowerCase().replace(/\s+/g, "-");
}

export function formatDate(date: Date): string {
	return new Date(date).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

export function estimateReadingTime(content: string): number {
	const wordsPerMinute = 200;
	const words = content.trim().split(/\s+/).length;
	return Math.ceil(words / wordsPerMinute);
}
