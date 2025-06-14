import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlaceholderImage } from "@/components/placeholder-image";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tag } from "@/components/tag";
import { getAllPosts } from "@/lib/blog";

const POSTS_PER_PAGE = 6;

interface BlogPageProps {
	searchParams: Promise<{ page?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
	const params = await searchParams;
	const currentPage = Number(params.page || "1");

	// Fetching posts from the file system
	const posts = await getAllPosts();
	const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);

	const displayPosts = posts.slice(
		POSTS_PER_PAGE * (currentPage - 1),
		POSTS_PER_PAGE * currentPage
	);

	// Assuming the first post is the featured post
	const featuredPost = posts[0];

	return (
		<div className='min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800'>
			<main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-36'>
				{/* Hero Section */}
				{featuredPost && (
					<section className='mb-16'>
						<Card className='overflow-hidden'>
							<div className='md:flex'>
								<div className='md:flex-shrink-0'>
									{featuredPost.frontImage ? (
										<Image
											className='h-48 w-full object-cover md:h-full md:w-48'
											src={featuredPost.frontImage}
											alt={featuredPost.title}
											width={800}
											height={400}
										/>
									) : (
										<div className='h-48 w-full md:h-full md:w-48'>
											<PlaceholderImage
												width={800}
												height={400}
												text={featuredPost.title}
												className='h-full w-full'
											/>
										</div>
									)}
								</div>
								<div className='p-8'>
									<CardHeader>
										<CardTitle className='text-3xl font-bold'>
											{featuredPost.title}
										</CardTitle>
										<CardDescription>
											{"Your Name"} •{" "}
											{new Date(featuredPost.publishDate).toLocaleDateString()}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<p className='mt-2 text-gray-500 dark:text-gray-400'>
											{featuredPost.description}
										</p>
									</CardContent>
									<CardFooter>
										<Button asChild>
											<Link href={`/blog/${featuredPost.slug}`}>
												Read More
												<ChevronRight className='ml-2 h-4 w-4' />
											</Link>
										</Button>
									</CardFooter>
								</div>
							</div>
						</Card>
					</section>
				)}

				{/* Recent Posts Grid */}
				<section className='mb-16'>
					<h2 className='text-2xl font-bold mb-6'>Recent Posts</h2>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
						{displayPosts.map((post) => (
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
												<Tag key={tag.id} tag={tag.name} />
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
				</section>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className='flex justify-center gap-2 mt-8'>
						{Array.from({ length: totalPages }).map((_, i) => (
							<Link
								key={i}
								href={`/blog?page=${i + 1}`}
								className={`px-3 py-1 rounded ${
									currentPage === i + 1
										? "bg-primary text-primary-foreground"
										: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
								}`}>
								{i + 1}
							</Link>
						))}
					</div>
				)}
			</main>
		</div>
	);
}
