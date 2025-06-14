import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PlaceholderImage } from "@/components/placeholder-image";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Tag } from "@/components/tag";
import { getAllPosts } from "@/lib/blog";
import { getPostsByTag, slugifyTag } from "@/lib/blog-utils";

interface TagPageProps {
	params: Promise<{ tag: string }>;
}

export async function generateMetadata({
	params,
}: TagPageProps): Promise<Metadata | undefined> {
	const paramsData = await params;
	const tag = decodeURIComponent(paramsData.tag);

	return {
		title: `Posts tagged with "${tag}"`,
		description: `Browse all blog posts tagged with ${tag}`,
	};
}

export default async function TagPage({ params }: TagPageProps) {
	const paramsData = await params;
	const tagSlug = paramsData.tag;
	const tag = decodeURIComponent(tagSlug);

	const posts = await getAllPosts();
	const taggedPosts = getPostsByTag(posts, tag);

	if (taggedPosts.length === 0) {
		notFound();
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800'>
			<main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-36'>
				<h1 className='text-3xl font-bold mb-8 capitalize'>
					Posts tagged with &ldquo;{tag}&rdquo;
				</h1>

				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
					{taggedPosts.map((post) => (
						<div
							key={post.slug}
							className='transition-transform duration-300 ease-in-out hover:scale-[1.03]'>
							<Card className='h-full flex flex-col overflow-hidden'>
								<div className='relative h-48'>
									{post.frontImage ? (
										<Image
											src={post.frontImage}
											alt={post.title}
											fill
											className='object-cover'
										/>
									) : (
										<PlaceholderImage
											width={400}
											height={300}
											text={post.title}
											className='h-full w-full'
										/>
									)}
									<div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent' />
									<div className='absolute bottom-4 left-4 right-4'>
										<CardTitle className='text-white text-xl font-bold line-clamp-2'>
											{post.title}
										</CardTitle>
									</div>
								</div>
								<CardContent className='flex-grow'>
									<p className='text-gray-600 dark:text-gray-300 line-clamp-3 mt-2'>
										{post.description}
									</p>
									<div className='flex items-center mt-4 text-sm text-gray-500 dark:text-gray-400'>
										<span>
											{new Date(post.publishDate).toLocaleDateString()}
										</span>
									</div>
								</CardContent>
								<CardFooter className='flex flex-wrap justify-between items-center gap-2 bg-gray-50 dark:bg-gray-800/50'>
									<div className='flex flex-wrap gap-1'>
										{post.tags.slice(0, 3).map((tag) => (
											<Tag
												key={tag.id}
												tag={tag.name}
												current={slugifyTag(tag.name) === tagSlug.toLowerCase()}
											/>
										))}
									</div>
									<Button
										variant='ghost'
										size='sm'
										className='text-primary'
										asChild>
										<Link href={`/blog/${post.slug}`}>Read More</Link>
									</Button>
								</CardFooter>
							</Card>
						</div>
					))}
				</div>

				<div className='mt-12'>
					<Button variant='outline' asChild>
						<Link href='/blog'>← Back to all posts</Link>
					</Button>
				</div>
			</main>
		</div>
	);
}
