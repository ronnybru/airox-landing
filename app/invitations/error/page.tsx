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
	title: "Invitation Error - Vibeplate",
	description: "There was an error processing your invitation",
};

export default function InvitationErrorPage() {
	return (
		<div className='min-h-screen flex items-center justify-center bg-background p-4'>
			<Card className='max-w-md w-full'>
				<CardHeader className='text-center'>
					<AlertCircle className='h-12 w-12 text-destructive mx-auto mb-2' />
					<CardTitle>Invitation Error</CardTitle>
					<CardDescription>
						There was an error processing your invitation
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Paragraph className='text-center'>
						We encountered an unexpected error while processing your invitation.
						Please try again later or contact the organization admin for
						assistance.
					</Paragraph>
				</CardContent>
				<CardFooter className='flex justify-center'>
					<DashboardButton />
				</CardFooter>
			</Card>
		</div>
	);
}
