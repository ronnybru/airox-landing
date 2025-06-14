import Script from "next/script";

export function WebsiteStructuredData() {
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

	const structuredData = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: "airox",
		url: baseUrl,
		potentialAction: {
			"@type": "SearchAction",
			target: `${baseUrl}/search?q={search_term_string}`,
			"query-input": "required name=search_term_string",
		},
	};

	return (
		<Script
			id='structured-data-website'
			type='application/ld+json'
			dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
		/>
	);
}

export function BlogPostStructuredData({
	post,
}: {
	post: {
		title: string;
		description: string | null;
		frontImage: string | null;
		publishDate: Date;
		updatedAt: Date;
		slug: string;
		author?: {
			name: string;
			url?: string;
			image?: string;
		};
	};
}) {
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

	const structuredData = {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		headline: post.title,
		description: post.description,
		image: post.frontImage,
		url: `${baseUrl}/blog/${post.slug}`,
		datePublished: post.publishDate.toISOString(),
		dateModified: post.updatedAt.toISOString(),
		author: {
			"@type": "Person",
			name: post.author?.name || "airox Team",
			url: post.author?.url,
			image: post.author?.image,
		},
		publisher: {
			"@type": "Organization",
			name: "airox",
			logo: {
				"@type": "ImageObject",
				url: `${baseUrl}/logo.png`,
			},
		},
		mainEntityOfPage: {
			"@type": "WebPage",
			"@id": `${baseUrl}/blog/${post.slug}`,
		},
	};

	return (
		<Script
			id='structured-data-blog-post'
			type='application/ld+json'
			dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
		/>
	);
}

export function OrganizationStructuredData() {
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

	const structuredData = {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: "airox",
		url: baseUrl,
		logo: `${baseUrl}/logo.png`,
		sameAs: [
			"https://twitter.com/yourcompany",
			"https://www.linkedin.com/company/yourcompany",
			"https://github.com/yourcompany",
		],
	};

	return (
		<Script
			id='structured-data-organization'
			type='application/ld+json'
			dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
		/>
	);
}
