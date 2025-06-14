"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { RefreshCw, Clock, CheckCircle, XCircle, Send } from "lucide-react";
import { getPushCampaignHistoryAction } from "@/app/actions/push-notifications";

interface PushCampaign {
	id: string;
	title: string;
	message: string;
	targetType: string;
	targetValue: string | null;
	status: string;
	sentCount: number | null;
	deliveredCount: number | null;
	failedCount: number | null;
	scheduledFor: Date | null;
	createdAt: Date;
	createdBy: string | null;
}

export function PushNotificationHistory() {
	const [campaigns, setCampaigns] = useState<PushCampaign[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadCampaigns = async () => {
		try {
			setIsLoading(true);
			setError(null);
			const result = await getPushCampaignHistoryAction();
			if (result.success) {
				setCampaigns(result.campaigns || []);
			} else {
				setError(result.error || "Failed to load campaigns");
			}
		} catch (err) {
			console.error("Error loading campaigns:", err);
			setError("Failed to load campaigns");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadCampaigns();
	}, []);

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "pending":
				return (
					<Badge variant='outline' className='text-yellow-600'>
						<Clock className='w-3 h-3 mr-1' />
						Pending
					</Badge>
				);
			case "sending":
				return (
					<Badge variant='outline' className='text-blue-600'>
						<Send className='w-3 h-3 mr-1' />
						Sending
					</Badge>
				);
			case "completed":
				return (
					<Badge variant='outline' className='text-green-600'>
						<CheckCircle className='w-3 h-3 mr-1' />
						Completed
					</Badge>
				);
			case "failed":
				return (
					<Badge variant='outline' className='text-red-600'>
						<XCircle className='w-3 h-3 mr-1' />
						Failed
					</Badge>
				);
			default:
				return <Badge variant='outline'>{status}</Badge>;
		}
	};

	const getTargetDescription = (
		targetType: string,
		targetValue: string | null
	) => {
		switch (targetType) {
			case "all":
				return "All Users";
			case "timezone":
				return `Timezone: ${targetValue}`;
			case "user":
				return `User: ${targetValue}`;
			default:
				return targetType;
		}
	};

	const formatDate = (date: Date | string) => {
		return new Date(date).toLocaleString();
	};

	if (isLoading) {
		return (
			<div className='flex items-center justify-center py-8'>
				<RefreshCw className='w-6 h-6 animate-spin mr-2' />
				Loading campaigns...
			</div>
		);
	}

	if (error) {
		return (
			<div className='text-center py-8'>
				<p className='text-red-600 mb-4'>{error}</p>
				<Button onClick={loadCampaigns} variant='outline'>
					<RefreshCw className='w-4 h-4 mr-2' />
					Retry
				</Button>
			</div>
		);
	}

	return (
		<div className='space-y-4'>
			<div className='flex justify-between items-center'>
				<p className='text-sm text-muted-foreground'>
					{campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} found
				</p>
				<Button onClick={loadCampaigns} variant='outline' size='sm'>
					<RefreshCw className='w-4 h-4 mr-2' />
					Refresh
				</Button>
			</div>

			{campaigns.length === 0 ? (
				<div className='text-center py-8 text-muted-foreground'>
					No push notification campaigns found.
				</div>
			) : (
				<div className='border rounded-md'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Title</TableHead>
								<TableHead>Target</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Sent</TableHead>
								<TableHead>Delivered</TableHead>
								<TableHead>Failed</TableHead>
								<TableHead>Created</TableHead>
								<TableHead>Scheduled</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{campaigns.map((campaign) => (
								<TableRow key={campaign.id}>
									<TableCell>
										<div>
											<p className='font-medium'>{campaign.title}</p>
											<p className='text-sm text-muted-foreground truncate max-w-xs'>
												{campaign.message}
											</p>
										</div>
									</TableCell>
									<TableCell>
										{getTargetDescription(
											campaign.targetType,
											campaign.targetValue
										)}
									</TableCell>
									<TableCell>{getStatusBadge(campaign.status)}</TableCell>
									<TableCell>{campaign.sentCount || 0}</TableCell>
									<TableCell>{campaign.deliveredCount || 0}</TableCell>
									<TableCell>{campaign.failedCount || 0}</TableCell>
									<TableCell className='text-sm'>
										{formatDate(campaign.createdAt)}
									</TableCell>
									<TableCell className='text-sm'>
										{campaign.scheduledFor
											? formatDate(campaign.scheduledFor)
											: "Immediate"}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}
