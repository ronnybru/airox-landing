import { H3, Paragraph } from "@/components/ui/typography";
import {
	getUserOrganizations,
	getActiveOrganization,
	requireServerSession,
} from "@/lib/session";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateOrganizationForm } from "./components/create-organization-form";
import { OrganizationList } from "./components/organization-list";
import { OrganizationSettings } from "./components/organization-settings";
import { Building, Calendar, Users, CreditCard } from "lucide-react";
export const dynamic = "force-dynamic";

export default async function OrganizationsSettingsPage() {
	// Ensure user is authenticated
	await requireServerSession();

	// Get user's organizations and active organization
	const organizations = await getUserOrganizations();
	const activeOrganization = await getActiveOrganization();

	// Set default tab based on whether there's an active organization
	const defaultTab = activeOrganization ? "settings" : "list";

	// Format the creation date
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	return (
		<div>
			<H3>Organizations</H3>
			<Paragraph className='text-muted-foreground mt-2 mb-6'>
				Manage your organizations, team members, and permissions.
			</Paragraph>

			<Tabs defaultValue={defaultTab} className='w-full'>
				<TabsList className='mb-4'>
					<TabsTrigger value='list'>My Organizations</TabsTrigger>
					{activeOrganization && (
						<TabsTrigger value='settings'>Organization Settings</TabsTrigger>
					)}
				</TabsList>

				<TabsContent value='list'>
					<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
						<div className='lg:col-span-2'>
							<div className='grid gap-6'>
								{organizations.length > 0 ? (
									<OrganizationList
										organizations={organizations}
										activeOrganizationId={activeOrganization?.id}
									/>
								) : (
									<Card>
										<CardHeader>
											<CardTitle>No Organizations</CardTitle>
											<CardDescription>
												You don&apos;t have any organizations yet. Create your
												first organization to get started.
											</CardDescription>
										</CardHeader>
									</Card>
								)}

								<Card>
									<CardHeader>
										<CardTitle>Create New Organization</CardTitle>
										<CardDescription>
											Create a new organization to collaborate with your team.
										</CardDescription>
									</CardHeader>
									<CardContent>
										<CreateOrganizationForm />
									</CardContent>
								</Card>
							</div>
						</div>

						{/* Organization Info Box - Only visible on large screens */}
						{activeOrganization && (
							<div className='hidden lg:block'>
								<Card>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<Building className='h-5 w-5' />
											Organization Info
										</CardTitle>
										<CardDescription>
											Details about {activeOrganization.name}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className='space-y-4'>
											<div className='flex items-start gap-3'>
												<Calendar className='h-5 w-5 text-muted-foreground mt-0.5' />
												<div>
													<h4 className='font-medium'>Created</h4>
													<p className='text-sm text-muted-foreground'>
														{formatDate(
															activeOrganization.createdAt.toString()
														)}
													</p>
												</div>
											</div>

											<div className='flex items-start gap-3'>
												<Users className='h-5 w-5 text-muted-foreground mt-0.5' />
												<div>
													<h4 className='font-medium'>Members</h4>
													<p className='text-sm text-muted-foreground'>
														{activeOrganization.members?.length || 0} team
														members
													</p>
												</div>
											</div>

											{activeOrganization.credits !== undefined && (
												<div className='flex items-start gap-3'>
													<CreditCard className='h-5 w-5 text-muted-foreground mt-0.5' />
													<div>
														<h4 className='font-medium'>Credits</h4>
														<p className='text-sm text-muted-foreground'>
															{activeOrganization.credits} available
														</p>
													</div>
												</div>
											)}

											{/* Display roles distribution */}
											{activeOrganization.members &&
												activeOrganization.members.length > 0 && (
													<div className='pt-2 border-t'>
														<h4 className='font-medium mb-2'>
															Team Composition
														</h4>
														{(() => {
															const roleCount: Record<string, number> = {};
															activeOrganization.members.forEach((member) => {
																roleCount[member.role] =
																	(roleCount[member.role] || 0) + 1;
															});

															return Object.entries(roleCount).map(
																([role, count]) => (
																	<div
																		key={role}
																		className='flex justify-between items-center text-sm'>
																		<span className='capitalize'>{role}s</span>
																		<span className='text-muted-foreground'>
																			{count}
																		</span>
																	</div>
																)
															);
														})()}
													</div>
												)}
										</div>
									</CardContent>
								</Card>
							</div>
						)}
					</div>
				</TabsContent>

				{activeOrganization && (
					<TabsContent value='settings'>
						<OrganizationSettings organization={activeOrganization} />
					</TabsContent>
				)}
			</Tabs>
		</div>
	);
}
