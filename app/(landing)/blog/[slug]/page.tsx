import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { format } from "date-fns";
import { getPostBySlug, getAllPosts } from "@/lib/blog";
import { Tag } from "@/components/tag";
import { PlaceholderImage } from "@/components/placeholder-image";
import { BlogPostStructuredData } from "@/components/structured-data";
import { ShareButtons } from "@/components/share-buttons";
import "@/styles/mdx.css";

interface BlogPostProps {
	params: Promise<{ slug: string }>;
	searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateStaticParams() {
	const posts = await getAllPosts();
	return posts.map((post) => ({
		slug: post.slug,
	}));
}

export async function generateMetadata({
	params,
}: BlogPostProps): Promise<Metadata | undefined> {
	const { slug } = await params;
	const post = await getPostBySlug(slug);

	if (!post) {
		return;
	}

	// Use the post's front image if available, otherwise use the dynamic OG image route
	const ogImage = post.frontImage
		? post.frontImage
		: `/og?title=${encodeURIComponent(post.title)}`;

	return {
		title: post.title,
		description: post.description || undefined,
		openGraph: {
			title: post.title,
			description: post.description || "",
			type: "article",
			publishedTime: post.publishDate.toISOString(),
			url: `/blog/${post.slug}`,
			images: [
				{
					url: ogImage,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: post.title,
			description: post.description || "",
			images: [ogImage],
		},
	};
}

export default async function BlogPost({ params }: BlogPostProps) {
	const { slug } = await params;
	const post = await getPostBySlug(slug);

	if (!post) {
		notFound();
	}

	return (
		<section>
			<BlogPostStructuredData post={post} />
			<div className='container pt-8 pb-8 px-4 sm:px-8 mx-auto'>
				<article className='py-6 prose dark:prose-invert max-w-5xl mx-auto flex justify-center text-center flex-col items-center'>
					<h1 className='mb-2 text-center text-5xl font-semibold'>
						{post.title}
					</h1>
					{post.author && (
						<div className='flex items-center justify-center mb-4'>
							<div className='flex items-center'>
								{post.author.image ? (
									<Image
										src={post.author.image}
										alt={post.author.name}
										width={40}
										height={40}
										className='rounded-full mr-2'
									/>
								) : (
									<div className='w-10 h-10 bg-gray-200 rounded-full mr-2 flex items-center justify-center'>
										<span className='text-gray-500 text-sm'>
											{post.author.name.charAt(0)}
										</span>
									</div>
								)}
								<span className='text-sm text-muted-foreground'>
									By{" "}
									{post.author.url ? (
										<a
											href={post.author.url}
											target='_blank'
											rel='noopener noreferrer'
											className='hover:underline'>
											{post.author.name}
										</a>
									) : (
										post.author.name
									)}
								</span>
							</div>
						</div>
					)}
					<div className='flex gap-2 mb-2'>
						{post.tags?.map((tag) => <Tag key={tag.id} tag={tag.name} />)}
					</div>

					<div className='w-full flex justify-center my-4'>
						<ShareButtons
							url={`/blog/${post.slug}`}
							title={post.title}
							description={post.description || ""}
						/>
					</div>
					<div className='relative w-full aspect-[5/3] rounded-lg mb-4'>
						{post.frontImage ? (
							<Image
								alt={post.title}
								fill
								src={post.frontImage}
								className='object-cover rounded-lg object-left-top'
							/>
						) : (
							<PlaceholderImage
								width={1200}
								height={600}
								text={post.title}
								className='rounded-lg h-full w-full'
							/>
						)}
					</div>
					{post.updatedAt && (
						<div className='w-full max-w-3xl mx-auto text-left mt-4 mb-8'>
							<p className='text-sm text-muted-foreground'>
								Last updated: {format(new Date(post.updatedAt), "MMMM d, yyyy")}
							</p>
						</div>
					)}
					<div className='max-w-3xl mx-auto text-left pt-8 w-full'>
						{post.description ? (
							<p className='text-xl mt-0 text-muted-foreground'>
								{post.description}
							</p>
						) : null}
						<hr className='my-4' />

						{/* For MDX content, we can directly render the React node */}
						<div className='mdx-content'>{post.content}</div>
					</div>
				</article>
			</div>
		</section>
	);
}
