import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
	title: "Accept Organization Invitation - Vibeplate",
	description: "Accept an invitation to join an organization on Vibeplate",
};

export default function AcceptInvitationLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang='en'>
			<body className={inter.className}>
				<main className='min-h-screen bg-background flex flex-col'>
					<div className='flex-1 flex flex-col items-center justify-center py-12'>
						{children}
					</div>
				</main>
			</body>
		</html>
	);
}
