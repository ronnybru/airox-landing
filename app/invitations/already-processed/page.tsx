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
	title: "Invitation Already Processed - Vibeplate",
	description: "This invitation has already been processed",
};

export default function InvitationAlreadyProcessedPage() {
	return (
		<div className='min-h-screen flex items-center justify-center bg-background p-4'>
			<Card className='max-w-md w-full'>
				<CardHeader className='text-center'>
					<AlertCircle className='h-12 w-12 text-amber-500 mx-auto mb-2' />
					<CardTitle>Invitation Already Processed</CardTitle>
					<CardDescription>
						This invitation has already been accepted, rejected, or canceled
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Paragraph className='text-center'>
						If you&apos;ve already accepted this invitation, you should be able
						to access the organization from your dashboard. If you need a new
						invitation, please contact the organization admin.
					</Paragraph>
				</CardContent>
				<CardFooter className='flex justify-center'>
					<DashboardButton />
				</CardFooter>
			</Card>
		</div>
	);
}
