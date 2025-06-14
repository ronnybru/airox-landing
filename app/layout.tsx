import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import {
	WebsiteStructuredData,
	OrganizationStructuredData,
} from "@/components/structured-data";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: {
		template: "%s | airox",
		default: "airox - Build & Scale Your SaaS Faster with AI",
	},
	description:
		"airox is the ultimate Next.js boilerplate designed for developers leveraging AI. Launch faster, iterate smarter, and focus on what matters – your product.",
	keywords: [
		"SaaS",
		"AI",
		"Next.js",
		"Boilerplate",
		"Web Development",
		"React",
	],
	authors: [{ name: "Your Company Name" }],
	creator: "Your Company Name",
	publisher: "Your Company Name",
	openGraph: {
		type: "website",
		locale: "en_US",
		url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
		siteName: "airox",
		title: "airox - Build & Scale Your SaaS Faster with AI",
		description:
			"airox is the ultimate Next.js boilerplate designed for developers leveraging AI.",
		images: [
			{
				url: "/og?title=airox", // Dynamic OG image
				width: 1200,
				height: 630,
				alt: "airox",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "airox - Build & Scale Your SaaS Faster with AI",
		description:
			"airox is the ultimate Next.js boilerplate designed for developers leveraging AI.",
		images: ["/og?title=airox"], // Same as OG image
		creator: "@yourtwitter",
	},
	icons: {
		icon: "/favicon.ico",
	},
	metadataBase: new URL(
		process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
	),
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en'>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<ThemeProvider
					attribute='class'
					defaultTheme='system'
					enableSystem
					disableTransitionOnChange>
					{children}
				</ThemeProvider>
				<WebsiteStructuredData />
				<OrganizationStructuredData />
			</body>
		</html>
	);
}
