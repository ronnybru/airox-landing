"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { organization, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { H4, Paragraph } from "@/components/ui/typography";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { processInvitation } from "@/app/actions/process-invitation";
import InvitationAuthModal from "@/components/auth-modal/invitation-auth-modal";

// Define the invitation data type based on the database schema
interface InvitationData {
	id: string;
	email: string;
	role: string;
	status: string;
	organization: {
		id: string;
		name: string;
		slug: string;
	};
	inviter: {
		id: string;
		name: string;
		email: string;
	};
}

export function AcceptInvitationClient({
	invitation,
}: {
	invitation: InvitationData;
}) {
	const router = useRouter();
	const { data: session, isPending: isSessionLoading } = useSession();
	const [isAccepting, setIsAccepting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [showAuthModal, setShowAuthModal] = useState(true);

	// Show auth modal if not authenticated
	if (!isSessionLoading && !session) {
		console.log(
			`No session, showing auth modal for invitation: ${invitation.id}`
		);
		return (
			<>
				<InvitationAuthModal
					isOpen={showAuthModal}
					onClose={() => {
						setShowAuthModal(false);
						router.push("/");
					}}
					invitationId={invitation.id}
					organizationName={invitation.organization.name}
				/>
				<div className='flex flex-col items-center justify-center min-h-[70vh]'>
					<Loader2 className='h-12 w-12 animate-spin text-primary mb-4' />
					<H4>Please sign in or create an account to accept this invitation</H4>
				</div>
			</>
		);
	}

	const handleAcceptInvitation = async () => {
		setIsAccepting(true);
		setError(null);

		try {
			console.log(`Accepting invitation: ${invitation.id}`);

			// Try client-side acceptance first
			try {
				await organization.acceptInvitation({
					invitationId: invitation.id,
				});
				console.log("Client-side invitation acceptance successful");

				// Set the organization as the active organization
				await organization.setActive({
					organizationId: invitation.organization.id,
				});
				console.log(
					`Set active organization to: ${invitation.organization.name}`
				);
			} catch (clientError) {
				console.error("Client-side invitation acceptance failed:", clientError);

				// If client-side fails, try server-side via the process-invitation action
				console.log("Trying server-side invitation processing");
				const result = await processInvitation(invitation.id);

				if (!result.success) {
					throw new Error(result.message || "Failed to process invitation");
				}

				console.log("Server-side invitation processing successful");
				// Note: The server-side processInvitation already sets the active organization
			}

			setSuccess(true);

			// Redirect to dashboard after a short delay
			setTimeout(() => {
				router.push("/dashboard");
			}, 2000);
		} catch (err) {
			console.error("Error accepting invitation:", err);
			setError("Failed to accept the invitation. Please try again.");
		} finally {
			setIsAccepting(false);
		}
	};

	if (isSessionLoading) {
		return (
			<div className='flex flex-col items-center justify-center min-h-[70vh]'>
				<Loader2 className='h-12 w-12 animate-spin text-primary mb-4' />
				<H4>Loading...</H4>
			</div>
		);
	}

	if (error) {
		return (
			<div className='container max-w-md py-12'>
				<Card>
					<CardHeader className='text-center'>
						<AlertCircle className='h-12 w-12 text-destructive mx-auto mb-2' />
						<CardTitle>Invitation Error</CardTitle>
						<CardDescription>
							There was a problem with this invitation
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Paragraph className='text-center'>{error}</Paragraph>
					</CardContent>
					<CardFooter className='flex justify-center'>
						<Button onClick={() => router.push("/dashboard")}>
							Go to Dashboard
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	if (success) {
		return (
			<div className='container max-w-md py-12'>
				<Card>
					<CardHeader className='text-center'>
						<CheckCircle className='h-12 w-12 text-primary mx-auto mb-2' />
						<CardTitle>Invitation Accepted</CardTitle>
						<CardDescription>
							You have successfully joined the organization
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Paragraph className='text-center'>
							You are now a member of {invitation.organization.name}.
							Redirecting to dashboard...
						</Paragraph>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className='container max-w-md py-12'>
			<Card>
				<CardHeader>
					<CardTitle>Organization Invitation</CardTitle>
					<CardDescription>
						You have been invited to join an organization
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='space-y-4'>
						<div>
							<h3 className='font-medium'>Organization</h3>
							<p>{invitation.organization.name}</p>
						</div>
						<div>
							<h3 className='font-medium'>Invited by</h3>
							<p>
								{invitation.inviter.name} ({invitation.inviter.email})
							</p>
						</div>
						<div>
							<h3 className='font-medium'>Your Role</h3>
							<p className='capitalize'>{invitation.role}</p>
						</div>
					</div>
				</CardContent>
				<CardFooter className='flex justify-between'>
					<Button variant='outline' onClick={() => router.push("/dashboard")}>
						Cancel
					</Button>
					<Button onClick={handleAcceptInvitation} disabled={isAccepting}>
						{isAccepting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
						Accept Invitation
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
