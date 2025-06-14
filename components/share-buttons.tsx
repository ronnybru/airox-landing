"use client";

import { useState } from "react";
import { Twitter, Linkedin, Facebook, Link, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface ShareButtonsProps {
	url: string;
	title: string;
	description?: string;
}

export function ShareButtons({
	url,
	title,
	description = "", // eslint-disable-line @typescript-eslint/no-unused-vars
}: ShareButtonsProps) {
	const [copied, setCopied] = useState(false);

	// Ensure we have the full URL (with domain)
	const getFullUrl = () => {
		// If url is already absolute, return it
		if (url.startsWith("http")) return url;

		// Otherwise, prepend the base URL
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
		return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
	};

	const fullUrl = getFullUrl();
	const encodedUrl = encodeURIComponent(fullUrl);
	const encodedTitle = encodeURIComponent(title);
	// We'll keep description in the props for future use if needed

	const shareLinks = {
		twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
		linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
		facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
	};

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(fullUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy: ", err);
		}
	};

	return (
		<div className='flex items-center space-x-2'>
			<span className='text-sm text-muted-foreground mr-2'>Share:</span>

			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant='outline'
							size='icon'
							className='h-8 w-8'
							onClick={() => window.open(shareLinks.twitter, "_blank")}>
							<Twitter className='h-4 w-4' />
							<span className='sr-only'>Share on Twitter</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Share on Twitter</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant='outline'
							size='icon'
							className='h-8 w-8'
							onClick={() => window.open(shareLinks.linkedin, "_blank")}>
							<Linkedin className='h-4 w-4' />
							<span className='sr-only'>Share on LinkedIn</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Share on LinkedIn</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant='outline'
							size='icon'
							className='h-8 w-8'
							onClick={() => window.open(shareLinks.facebook, "_blank")}>
							<Facebook className='h-4 w-4' />
							<span className='sr-only'>Share on Facebook</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Share on Facebook</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant='outline'
							size='icon'
							className='h-8 w-8'
							onClick={copyToClipboard}>
							{copied ? (
								<Check className='h-4 w-4 text-green-500' />
							) : (
								<Link className='h-4 w-4' />
							)}
							<span className='sr-only'>Copy link</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>{copied ? "Copied!" : "Copy link"}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	);
}
