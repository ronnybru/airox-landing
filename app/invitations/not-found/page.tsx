import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { DashboardButton } from "./dashboard-button";
import { AlertCircle } from "lucide-react";
import { Paragraph } from "@/components/ui/typography";

export const metadata = {
	title: "Invitation Not Found - Vibeplate",
	description: "The invitation you're looking for could not be found",
};

export default function InvitationNotFoundPage() {
	return (
		<div className='min-h-screen flex items-center justify-center bg-background p-4'>
			<Card className='max-w-md w-full'>
				<CardHeader className='text-center'>
					<AlertCircle className='h-12 w-12 text-destructive mx-auto mb-2' />
					<CardTitle>Invitation Not Found</CardTitle>
					<CardDescription>
						The invitation you&apos;re looking for could not be found
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Paragraph className='text-center'>
						The invitation link may have expired or been removed. Please contact
						the person who invited you to request a new invitation.
					</Paragraph>
				</CardContent>
				<CardFooter className='flex justify-center'>
					<DashboardButton />
				</CardFooter>
			</Card>
		</div>
	);
}
