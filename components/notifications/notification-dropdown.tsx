"use client";

import { useState, useEffect } from "react";
import { BellIcon, CheckIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { H4, Small, Muted, Paragraph } from "@/components/ui/typography";
import {
	getNotifications,
	getNotificationCount,
	markAsRead,
	markAllAsRead,
	removeNotification,
} from "@/app/actions/notifications";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";

interface Notification {
	id: number;
	type: string;
	title: string;
	message: string;
	read: boolean;
	groupCount: number | null;
	groupKey: string | null;
	userId: string | null;
	organizationId: string | null;
	singleReadDismissal: boolean;
	data: {
		links?: Array<{
			text: string;
			url: string;
			isExternal?: boolean;
		}>;
		[key: string]: unknown;
	} | null;
	updatedAt: Date;
	createdAt: Date;
}

interface NotificationResponse {
	id: number;
	type: string;
	title: string;
	message: string;
	read: boolean;
	groupCount: number | null;
	groupKey: string | null;
	userId: string | null;
	organizationId: string | null;
	singleReadDismissal: boolean;
	data: unknown;
	updatedAt: Date | string;
	createdAt: Date | string;
}

export function NotificationDropdown() {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [isOpen, setIsOpen] = useState(false);
	const [selectedNotification, setSelectedNotification] =
		useState<Notification | null>(null);

	// Fetch notifications when dropdown is opened
	const fetchNotifications = async () => {
		try {
			const notifs = await getNotifications(10);
			setNotifications(
				notifs.map((n: NotificationResponse) => ({
					...n,
					createdAt: new Date(n.createdAt),
					updatedAt: new Date(n.updatedAt),
					data: n.data as Notification["data"],
				}))
			);
		} catch (error) {
			console.error("Error fetching notifications:", error);
		}
	};

	// Fetch unread count
	const fetchUnreadCount = async () => {
		try {
			const count = await getNotificationCount();
			setUnreadCount(count);
		} catch (error) {
			console.error("Error fetching unread count:", error);
		}
	};

	// Initial fetch
	useEffect(() => {
		fetchUnreadCount();

		// Set up polling for unread count (every 30 seconds)
		const interval = setInterval(fetchUnreadCount, 30000);

		return () => clearInterval(interval);
	}, []);

	// Fetch notifications when dropdown is opened
	useEffect(() => {
		if (isOpen) {
			fetchNotifications();
		}
	}, [isOpen]);

	// Handle marking a notification as read
	const handleMarkAsRead = async (id: number) => {
		try {
			await markAsRead(id);
			// Update local state
			setNotifications((prev) =>
				prev.map((n) => (n.id === id ? { ...n, read: true } : n))
			);
			fetchUnreadCount();
		} catch (error) {
			console.error("Error marking notification as read:", error);
		}
	};

	// Handle marking all notifications as read
	const handleMarkAllAsRead = async () => {
		try {
			await markAllAsRead();
			// Update local state
			setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
			setUnreadCount(0);
		} catch (error) {
			console.error("Error marking all notifications as read:", error);
		}
	};

	// Handle removing a notification
	const handleRemoveNotification = async (id: number) => {
		try {
			await removeNotification(id);
			// Update local state
			setNotifications((prev) => prev.filter((n) => n.id !== id));
			fetchUnreadCount();
		} catch (error) {
			console.error("Error removing notification:", error);
		}
	};

	// Function to open the notification detail modal
	const openNotificationDetail = (notification: Notification) => {
		setSelectedNotification(notification);
	};

	// Function to close the notification detail modal
	const closeNotificationDetail = () => {
		setSelectedNotification(null);
	};

	// Function to render message with links
	const renderMessageWithLinks = (
		message: string,
		links?: Array<{ text: string; url: string; isExternal?: boolean }>
	) => {
		if (!links || links.length === 0) {
			return message;
		}

		// Create a map of link text to URL for easy lookup
		const linkMap = new Map(
			links.map((link) => [
				link.text,
				{ url: link.url, isExternal: link.isExternal },
			])
		);

		// Split the message by link texts and create an array of text and link elements
		let parts: React.ReactNode[] = [message];

		links.forEach((link) => {
			const newParts: React.ReactNode[] = [];

			parts.forEach((part) => {
				if (typeof part !== "string") {
					newParts.push(part);
					return;
				}

				const splitParts = part.split(link.text);

				for (let i = 0; i < splitParts.length; i++) {
					if (i > 0) {
						const linkInfo = linkMap.get(link.text);
						newParts.push(
							<a
								key={`${link.text}-${i}`}
								href={linkInfo?.url}
								className='text-primary hover:underline font-medium'
								target={linkInfo?.isExternal ? "_blank" : undefined}
								rel={linkInfo?.isExternal ? "noopener noreferrer" : undefined}
								onClick={(e) => e.stopPropagation()}>
								{link.text}
							</a>
						);
					}
					if (splitParts[i]) {
						newParts.push(splitParts[i]);
					}
				}
			});

			parts = newParts;
		});

		return <>{parts}</>;
	};

	return (
		<>
			<DropdownMenu onOpenChange={setIsOpen}>
				<DropdownMenuTrigger asChild>
					<Button
						variant='ghost'
						size='icon'
						className='relative bg-card rounded-full h-11 w-11 border dark:border-none hover:bg-muted/80 transition-colors'>
						<BellIcon className='h-6 w-6' />
						{unreadCount > 0 && (
							<Badge
								variant='destructive'
								className='absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center'>
								{unreadCount > 99 ? "99+" : unreadCount}
							</Badge>
						)}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='w-80 sm:w-96'>
					<div className='flex items-center justify-between p-4'>
						<DropdownMenuLabel className='p-0'>
							<H4 className='text-lg font-semibold border-none pb-0'>
								Notifications
							</H4>
						</DropdownMenuLabel>
						{unreadCount > 0 && (
							<Button
								variant='ghost'
								size='sm'
								className='h-8 text-xs'
								onClick={handleMarkAllAsRead}>
								Mark all as read
							</Button>
						)}
					</div>

					<div className='max-h-[400px] overflow-y-auto overflow-x-hidden'>
						{notifications.length === 0 ? (
							<div className='p-4 text-center'>
								<Muted>No notifications</Muted>
							</div>
						) : (
							notifications.map((notification) => (
								<div
									key={notification.id}
									className='relative [&:not(:last-child)]:mb-1'>
									<DropdownMenuItem
										className={`p-4 flex flex-col items-start gap-1 cursor-pointer hover:bg-muted/70 transition-colors ${!notification.read ? "bg-muted/50" : ""}`}
										onSelect={(e) => {
											e.preventDefault();
											if (!notification.read) {
												handleMarkAsRead(notification.id);
											}
										}}>
										<div className='flex items-center w-full'>
											<span className='font-medium flex-1'>
												{notification.title}
											</span>
											<Small className='text-muted-foreground ml-2'>
												{formatDistanceToNow(notification.createdAt, {
													addSuffix: true,
												})}
											</Small>
										</div>
										<div className='mt-2 w-full'>
											<div className='pl-1'>
												<Muted className='text-xs line-clamp-5 whitespace-pre-line'>
													{renderMessageWithLinks(
														notification.message,
														notification.data?.links as Array<{
															text: string;
															url: string;
															isExternal?: boolean;
														}>
													)}
												</Muted>
												{notification.groupCount &&
													notification.groupCount > 1 && (
														<Badge variant='outline' className='mt-2 text-xs'>
															{notification.groupCount} items
														</Badge>
													)}
												<button
													className='text-primary hover:underline text-xs mt-2 font-medium'
													onClick={(e) => {
														e.preventDefault();
														e.stopPropagation();
														openNotificationDetail(notification);
													}}>
													read more
												</button>
											</div>
										</div>
										<div className='absolute right-2 bottom-2 flex gap-1'>
											{!notification.read && (
												<Button
													variant='ghost'
													size='icon'
													className='h-6 w-6 hover:bg-muted/80'
													onClick={() => handleMarkAsRead(notification.id)}>
													<CheckIcon className='h-3 w-3' />
												</Button>
											)}
											<Button
												variant='ghost'
												size='icon'
												className='h-6 w-6 hover:bg-muted/80'
												onClick={() =>
													handleRemoveNotification(notification.id)
												}>
												<Trash2Icon className='h-3 w-3' />
											</Button>
										</div>
									</DropdownMenuItem>
								</div>
							))
						)}
					</div>
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Notification Detail Modal */}
			{selectedNotification && (
				<Dialog
					open={true}
					onOpenChange={(open) => {
						if (!open) closeNotificationDetail();
					}}>
					<DialogContent className='sm:max-w-md'>
						<DialogHeader>
							<DialogTitle className='flex items-center'>
								{selectedNotification.title}
							</DialogTitle>
							<Small className='text-muted-foreground'>
								{formatDistanceToNow(selectedNotification.createdAt, {
									addSuffix: true,
								})}
							</Small>
						</DialogHeader>
						<div className='space-y-4'>
							<Paragraph className='whitespace-pre-line'>
								{renderMessageWithLinks(
									selectedNotification.message,
									selectedNotification.data?.links as Array<{
										text: string;
										url: string;
										isExternal?: boolean;
									}>
								)}
							</Paragraph>
						</div>
					</DialogContent>
				</Dialog>
			)}
		</>
	);
}
