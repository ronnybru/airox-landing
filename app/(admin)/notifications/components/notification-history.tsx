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
import { Muted, Small } from "@/components/ui/typography";
import { formatDistanceToNow } from "date-fns";
import {
	getNotificationHistory,
	type NotificationHistoryRecord,
} from "@/app/actions/get-notification-history";

export function NotificationHistory() {
	const [notifications, setNotifications] = useState<
		NotificationHistoryRecord[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const pageSize = 10;

	// Fetch notification history
	const fetchNotificationHistory = async (page: number) => {
		try {
			setLoading(true);
			const result = await getNotificationHistory(page, pageSize);

			// Convert dates to Date objects and ensure target is properly typed
			const formattedResults = result.notifications.map((item) => ({
				...item,
				createdAt: new Date(item.createdAt),
				target: item.target as "user" | "organization" | "system",
			}));

			if (page === 1) {
				setNotifications(formattedResults);
			} else {
				setNotifications((prev) => [...prev, ...formattedResults]);
			}

			setHasMore(result.hasMore);
		} catch (error) {
			console.error("Error fetching notification history:", error);
		} finally {
			setLoading(false);
		}
	};

	// Initial fetch
	useEffect(() => {
		fetchNotificationHistory(page);
	}, [page]);

	// Load more notifications
	const loadMore = () => {
		if (!loading && hasMore) {
			setPage((prev) => prev + 1);
		}
	};

	// Get notification badge variant based on type
	const getNotificationBadgeVariant = (type: string) => {
		switch (type) {
			case "success":
				return "default";
			case "error":
				return "destructive";
			case "warning":
				return "secondary";
			case "info":
				return "outline";
			default:
				return "outline";
		}
	};

	return (
		<div>
			{loading && notifications.length === 0 ? (
				<div className='flex justify-center p-8'>
					<Muted>Loading notification history...</Muted>
				</div>
			) : notifications.length === 0 ? (
				<div className='flex justify-center p-8'>
					<Muted>No notifications have been sent yet</Muted>
				</div>
			) : (
				<>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Type</TableHead>
								<TableHead>Title</TableHead>
								<TableHead>Message</TableHead>
								<TableHead>Target</TableHead>
								<TableHead>Details</TableHead>
								<TableHead>Sent</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{notifications.map((notification) => (
								<TableRow key={notification.id}>
									<TableCell>
										<Badge
											variant={getNotificationBadgeVariant(notification.type)}>
											{notification.type}
										</Badge>
									</TableCell>
									<TableCell className='font-medium'>
										{notification.title}
									</TableCell>
									<TableCell className='max-w-[200px] truncate'>
										{notification.message}
									</TableCell>
									<TableCell>
										<Badge variant='outline'>
											{notification.target === "organization"
												? "Organization"
												: notification.target === "user"
													? "User"
													: "System"}
										</Badge>
									</TableCell>
									<TableCell>
										{notification.target === "organization" ? (
											<div className='flex flex-col'>
												<Small>ID: {notification.organizationId}</Small>
												{notification.singleReadDismissal && (
													<Small className='text-amber-500'>
														Single-read dismissal
													</Small>
												)}
											</div>
										) : notification.target === "user" ? (
											<Small>{notification.userCount} users</Small>
										) : (
											<Small>All users</Small>
										)}
									</TableCell>
									<TableCell>
										<Small className='text-muted-foreground'>
											{formatDistanceToNow(notification.createdAt, {
												addSuffix: true,
											})}
										</Small>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					{hasMore && (
						<div className='flex justify-center mt-4'>
							<Button variant='outline' onClick={loadMore} disabled={loading}>
								{loading ? "Loading..." : "Load More"}
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
