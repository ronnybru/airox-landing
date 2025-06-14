import React from "react";
import MinimalNavbar from "./components/minimal-navbar";
import FooterLanding from "./components/footer";

export default function LandingLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className='flex min-h-screen flex-col'>
			<MinimalNavbar />
			{/* Main Content */}
			<main className='flex-1'>{children}</main>
			<FooterLanding />
		</div>
	);
}
