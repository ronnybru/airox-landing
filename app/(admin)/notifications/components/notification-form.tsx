"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, TrashIcon, LinkIcon, Type } from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
	createNotificationForAllUsers,
	createOrganizationNotificationAction,
	createAllOrganizationsNotificationAction,
	createUserNotification,
} from "@/app/actions/notifications";
import { NotificationType } from "@/lib/notifications";

// Define notification target types
type NotificationTarget =
	| "all_users"
	| "organization"
	| "all_organizations"
	| "user";

interface NotificationFormProps {
	type?: NotificationType;
}

export function NotificationForm({ type = "info" }: NotificationFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formType, setFormType] = useState<NotificationType>(type);
	const [title, setTitle] = useState("");
	const [message, setMessage] = useState("");
	const [links, setLinks] = useState<
		Array<{ text: string; url: string; isExternal: boolean }>
	>([]);

	// New state for notification target
	const [target, setTarget] = useState<NotificationTarget>("all_users");
	const [organizationId, setOrganizationId] = useState("");
	const [userId, setUserId] = useState("");
	const [singleReadDismissal, setSingleReadDismissal] = useState(false);
	const [showInlinePopover, setShowInlinePopover] = useState(false);
	const [inlineLinkText, setInlineLinkText] = useState("");
	const [inlineLinkUrl, setInlineLinkUrl] = useState("");
	const [inlineLinkExternal, setInlineLinkExternal] = useState(true);
	const [selectionStart, setSelectionStart] = useState(0);
	const [selectionEnd, setSelectionEnd] = useState(0);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);
		setSuccess(false);

		// Validate form
		if (title.length < 3) {
			setError("Title must be at least 3 characters");
			setIsSubmitting(false);
			return;
		}

		if (message.length < 5) {
			setError("Message must be at least 5 characters");
			setIsSubmitting(false);
			return;
		}

		// Validate target-specific fields
		if (target === "organization" && !organizationId) {
			setError("Organization ID is required");
			setIsSubmitting(false);
			return;
		}

		if (target === "user" && !userId) {
			setError("User ID is required");
			setIsSubmitting(false);
			return;
		}

		try {
			// Prepare data with links if any
			const data = links.length > 0 ? { links } : undefined;

			// Send notification based on target
			if (target === "all_users") {
				await createNotificationForAllUsers(formType, title, message, data);
			} else if (target === "organization") {
				await createOrganizationNotificationAction(
					organizationId,
					formType,
					title,
					message,
					singleReadDismissal,
					data
				);
			} else if (target === "all_organizations") {
				await createAllOrganizationsNotificationAction(
					formType,
					title,
					message,
					singleReadDismissal,
					data
				);
			} else if (target === "user") {
				await createUserNotification({
					userId,
					type: formType,
					title,
					message,
					data,
				});
			}

			// Reset form
			setTitle("");
			setMessage("");
			setLinks([]);
			setFormType(type);
			setSuccess(true);
		} catch (error) {
			console.error("Error sending notification:", error);
			setError("Failed to send notification. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className='space-y-6'>
			{error && (
				<div className='bg-destructive/15 text-destructive p-3 rounded-md text-sm'>
					{error}
				</div>
			)}

			{success && (
				<div className='bg-green-500/15 text-green-600 p-3 rounded-md text-sm'>
					Notification sent successfully!
				</div>
			)}

			<div className='space-y-2'>
				<Label htmlFor='target'>Notification Target</Label>
				<Select
					value={target}
					onValueChange={(value) => setTarget(value as NotificationTarget)}>
					<SelectTrigger id='target'>
						<SelectValue placeholder='Select notification target' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='all_users'>All Users</SelectItem>
						<SelectItem value='organization'>Specific Organization</SelectItem>
						<SelectItem value='all_organizations'>All Organizations</SelectItem>
						<SelectItem value='user'>Specific User</SelectItem>
					</SelectContent>
				</Select>
				<p className='text-sm text-muted-foreground'>
					Select who should receive this notification
				</p>
			</div>

			{(target === "organization" || target === "all_organizations") && (
				<div className='space-y-2'>
					{target === "organization" && (
						<>
							<Label htmlFor='organizationId'>Organization ID</Label>
							<Input
								id='organizationId'
								placeholder='Enter organization ID'
								value={organizationId}
								onChange={(e) => setOrganizationId(e.target.value)}
								required
							/>
						</>
					)}
					<div className='flex items-center space-x-2 mt-2'>
						<input
							type='checkbox'
							id='singleReadDismissal'
							checked={singleReadDismissal}
							onChange={(e) => setSingleReadDismissal(e.target.checked)}
							className='rounded border-gray-300 text-primary focus:ring-primary'
						/>
						<Label
							htmlFor='singleReadDismissal'
							className='text-sm font-normal cursor-pointer'>
							Single-read dismissal (notification disappears for all when one
							user reads it)
						</Label>
					</div>
				</div>
			)}

			{target === "user" && (
				<div className='space-y-2'>
					<Label htmlFor='userId'>User ID</Label>
					<Input
						id='userId'
						placeholder='Enter user ID'
						value={userId}
						onChange={(e) => setUserId(e.target.value)}
						required
					/>
				</div>
			)}

			<div className='space-y-2'>
				<Label htmlFor='type'>Notification Type</Label>
				<Select
					value={formType}
					onValueChange={(value) => setFormType(value as NotificationType)}>
					<SelectTrigger id='type'>
						<SelectValue placeholder='Select a notification type' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='info'>Info</SelectItem>
						<SelectItem value='success'>Success</SelectItem>
						<SelectItem value='warning'>Warning</SelectItem>
						<SelectItem value='error'>Error</SelectItem>
						<SelectItem value='system'>System</SelectItem>
					</SelectContent>
				</Select>
				<p className='text-sm text-muted-foreground'>
					Select the type of notification to send
				</p>
			</div>

			<div className='space-y-2'>
				<Label htmlFor='title'>Title</Label>
				<Input
					id='title'
					placeholder='Notification title'
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					required
				/>
				<p className='text-sm text-muted-foreground'>
					A short, descriptive title for the notification
				</p>
			</div>

			<div className='space-y-2'>
				<div className='flex justify-between items-center'>
					<Label htmlFor='message'>Message</Label>
					<Popover open={showInlinePopover} onOpenChange={setShowInlinePopover}>
						<PopoverTrigger asChild>
							<Button
								type='button'
								variant='outline'
								size='sm'
								onClick={() => {
									if (textareaRef.current) {
										const start = textareaRef.current.selectionStart;
										const end = textareaRef.current.selectionEnd;
										setSelectionStart(start);
										setSelectionEnd(end);

										// Pre-fill the link text with selected text
										if (start !== end) {
											setInlineLinkText(message.substring(start, end));
										} else {
											setInlineLinkText("");
										}
										setInlineLinkUrl("");
									}
								}}>
								<Type className='h-4 w-4 mr-2' />
								Insert Link
							</Button>
						</PopoverTrigger>
						<PopoverContent className='w-80'>
							<div className='space-y-4'>
								<h4 className='font-medium'>Insert Link</h4>
								<div className='space-y-2'>
									<Label htmlFor='inline-link-text'>Link Text</Label>
									<Input
										id='inline-link-text'
										value={inlineLinkText}
										onChange={(e) => setInlineLinkText(e.target.value)}
										placeholder='Text to display'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='inline-link-url'>URL</Label>
									<Input
										id='inline-link-url'
										value={inlineLinkUrl}
										onChange={(e) => setInlineLinkUrl(e.target.value)}
										placeholder='https://example.com'
									/>
								</div>
								<div className='flex items-center space-x-2'>
									<input
										type='checkbox'
										id='inline-link-external'
										checked={inlineLinkExternal}
										onChange={(e) => setInlineLinkExternal(e.target.checked)}
										className='rounded border-gray-300 text-primary focus:ring-primary'
									/>
									<Label
										htmlFor='inline-link-external'
										className='text-sm font-normal cursor-pointer'>
										External link (opens in new tab)
									</Label>
								</div>
								<div className='flex justify-end space-x-2'>
									<Button
										type='button'
										variant='outline'
										size='sm'
										onClick={() => setShowInlinePopover(false)}>
										Cancel
									</Button>
									<Button
										type='button'
										size='sm'
										onClick={() => {
											if (inlineLinkText && inlineLinkUrl) {
												// Add to links array
												setLinks([
													...links,
													{
														text: inlineLinkText,
														url: inlineLinkUrl,
														isExternal: inlineLinkExternal,
													},
												]);

												// Insert the text at cursor position
												if (textareaRef.current) {
													const newMessage =
														message.substring(0, selectionStart) +
														inlineLinkText +
														message.substring(selectionEnd);

													setMessage(newMessage);

													// Focus back on textarea and set cursor position after inserted text
													setTimeout(() => {
														if (textareaRef.current) {
															textareaRef.current.focus();
															const newPosition =
																selectionStart + inlineLinkText.length;
															textareaRef.current.setSelectionRange(
																newPosition,
																newPosition
															);
														}
													}, 0);
												}

												// Reset and close popover
												setInlineLinkText("");
												setInlineLinkUrl("");
												setShowInlinePopover(false);
											}
										}}>
										Insert
									</Button>
								</div>
							</div>
						</PopoverContent>
					</Popover>
				</div>
				<Textarea
					id='message'
					ref={textareaRef}
					placeholder='Notification message'
					className='min-h-[100px]'
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					onSelect={() => {
						if (textareaRef.current) {
							setSelectionStart(textareaRef.current.selectionStart);
							setSelectionEnd(textareaRef.current.selectionEnd);
						}
					}}
					required
				/>
				<div className='flex justify-between'>
					<p className='text-sm text-muted-foreground'>
						The main content of the notification
					</p>
					{links.length > 0 && (
						<p className='text-sm text-muted-foreground'>
							{links.length} link{links.length !== 1 ? "s" : ""} added
						</p>
					)}
				</div>
			</div>

			{links.length > 0 && (
				<div className='space-y-4'>
					<div className='flex items-center justify-between'>
						<Label>Added Links</Label>
						<Button
							type='button'
							variant='outline'
							size='sm'
							onClick={() =>
								setLinks([...links, { text: "", url: "", isExternal: true }])
							}>
							<PlusIcon className='h-4 w-4 mr-2' />
							Add Link
						</Button>
					</div>

					<div className='space-y-4 max-h-[300px] overflow-y-auto'>
						{links.map((link, index) => (
							<div
								key={index}
								className='flex flex-col space-y-2 p-4 border rounded-md'>
								<div className='flex justify-between items-center'>
									<div className='flex items-center'>
										<LinkIcon className='h-4 w-4 mr-2' />
										<span className='text-sm font-medium'>
											Link {index + 1}
										</span>
									</div>
									<Button
										type='button'
										variant='ghost'
										size='sm'
										onClick={() => {
											const newLinks = [...links];
											newLinks.splice(index, 1);
											setLinks(newLinks);
										}}>
										<TrashIcon className='h-4 w-4' />
									</Button>
								</div>

								<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
									<div className='space-y-2'>
										<Label htmlFor={`link-text-${index}`}>Link Text</Label>
										<Input
											id={`link-text-${index}`}
											placeholder='Text to display'
											value={link.text}
											onChange={(e) => {
												const newLinks = [...links];
												newLinks[index].text = e.target.value;
												setLinks(newLinks);
											}}
										/>
									</div>

									<div className='space-y-2'>
										<Label htmlFor={`link-url-${index}`}>URL</Label>
										<Input
											id={`link-url-${index}`}
											placeholder='https://example.com'
											value={link.url}
											onChange={(e) => {
												const newLinks = [...links];
												newLinks[index].url = e.target.value;
												setLinks(newLinks);
											}}
										/>
									</div>
								</div>

								<div className='flex items-center space-x-2 mt-2'>
									<input
										type='checkbox'
										id={`link-external-${index}`}
										checked={link.isExternal}
										onChange={(e) => {
											const newLinks = [...links];
											newLinks[index].isExternal = e.target.checked;
											setLinks(newLinks);
										}}
										className='rounded border-gray-300 text-primary focus:ring-primary'
									/>
									<Label
										htmlFor={`link-external-${index}`}
										className='text-sm font-normal cursor-pointer'>
										External link (opens in new tab)
									</Label>
								</div>
							</div>
						))}
					</div>

					<p className='text-sm text-muted-foreground'>
						Links will be automatically detected in the message text and made
						clickable. Use the &ldquo;Insert Link&rdquo; button to add links
						directly in your text.
					</p>
				</div>
			)}

			<Button type='submit' disabled={isSubmitting}>
				{isSubmitting ? "Sending..." : "Send Notification"}
			</Button>
		</form>
	);
}
