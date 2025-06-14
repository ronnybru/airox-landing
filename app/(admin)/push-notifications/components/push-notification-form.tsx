"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { sendPushNotificationAction } from "@/app/actions/push-notifications";

type TargetType = "all" | "local_time" | "user";

export function PushNotificationForm() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [title, setTitle] = useState("");
	const [message, setMessage] = useState("");
	const [action, setAction] = useState("none");
	// Multi-language fields
	const [titleEn, setTitleEn] = useState("");
	const [messageEn, setMessageEn] = useState("");
	const [titleNo, setTitleNo] = useState("");
	const [messageNo, setMessageNo] = useState("");
	const [titleEs, setTitleEs] = useState("");
	const [messageEs, setMessageEs] = useState("");
	const [titleDe, setTitleDe] = useState("");
	const [messageDe, setMessageDe] = useState("");
	const [useMultiLanguage, setUseMultiLanguage] = useState(false);
	const [targetType, setTargetType] = useState<TargetType>("all");
	const [userId, setUserId] = useState("");
	const [localHour, setLocalHour] = useState("12");
	const [localMinute, setLocalMinute] = useState("0");
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

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

		if (targetType === "user" && !userId) {
			setError("User ID is required");
			setIsSubmitting(false);
			return;
		}

		try {
			const result = await sendPushNotificationAction({
				title,
				message,
				titleEn: useMultiLanguage ? titleEn : undefined,
				messageEn: useMultiLanguage ? messageEn : undefined,
				titleNo: useMultiLanguage ? titleNo : undefined,
				messageNo: useMultiLanguage ? messageNo : undefined,
				titleEs: useMultiLanguage ? titleEs : undefined,
				messageEs: useMultiLanguage ? messageEs : undefined,
				titleDe: useMultiLanguage ? titleDe : undefined,
				messageDe: useMultiLanguage ? messageDe : undefined,
				action: action && action !== "none" ? action : undefined,
				targetType,
				userId: targetType === "user" ? userId : undefined,
				localHour:
					targetType === "local_time" ? parseInt(localHour) : undefined,
				localMinute:
					targetType === "local_time" ? parseInt(localMinute) : undefined,
			});

			if (result.success) {
				// Reset form
				setTitle("");
				setMessage("");
				setAction("none");
				setTitleEn("");
				setMessageEn("");
				setTitleNo("");
				setMessageNo("");
				setTitleEs("");
				setMessageEs("");
				setTitleDe("");
				setMessageDe("");
				setUserId("");
				setTargetType("all");
				setLocalHour("12");
				setLocalMinute("0");
				setUseMultiLanguage(false);
				setSuccess(true);
			} else {
				setError(result.error || "Failed to send push notification");
			}
		} catch (error) {
			console.error("Error sending push notification:", error);
			setError("Failed to send push notification. Please try again.");
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
					Push notification sent successfully!
				</div>
			)}

			<div className='space-y-2'>
				<Label htmlFor='title'>Title</Label>
				<Input
					id='title'
					placeholder='Notification title (max 50 characters)'
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					maxLength={50}
					required
				/>
				<p className='text-sm text-muted-foreground'>
					{title.length}/50 characters
				</p>
			</div>

			<div className='space-y-2'>
				<Label htmlFor='message'>Message</Label>
				<Textarea
					id='message'
					placeholder='Notification message (max 150 characters)'
					className='min-h-[100px]'
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					maxLength={150}
					required
				/>
				<p className='text-sm text-muted-foreground'>
					{message.length}/150 characters
				</p>
			</div>

			<div className='space-y-2'>
				<Label htmlFor='action'>Deep Link Action (Optional)</Label>
				<Select value={action} onValueChange={setAction}>
					<SelectTrigger id='action'>
						<SelectValue placeholder='Select an action (optional)' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='none'>No action</SelectItem>
						<SelectItem value='open_referral_page'>
							Open Referrals Page
						</SelectItem>
						<SelectItem value='open_home'>Open Home Page</SelectItem>
						<SelectItem value='open_progress'>Open Progress Page</SelectItem>
						<SelectItem value='open_settings'>Open Settings Page</SelectItem>
					</SelectContent>
				</Select>
				<p className='text-sm text-muted-foreground'>
					Choose where to navigate users when they tap the notification
				</p>
			</div>

			<div className='space-y-2'>
				<div className='flex items-center space-x-2'>
					<Checkbox
						id='useMultiLanguage'
						checked={useMultiLanguage}
						onCheckedChange={(checked) => setUseMultiLanguage(checked === true)}
					/>
					<Label htmlFor='useMultiLanguage'>
						Enable multi-language support (English, Norwegian, Spanish, German)
					</Label>
				</div>
				<p className='text-sm text-muted-foreground'>
					When enabled, users will receive notifications in their preferred
					language
				</p>
			</div>

			{useMultiLanguage && (
				<div className='space-y-4 p-4 border rounded-lg bg-muted/50'>
					<h4 className='font-semibold'>Language-specific content</h4>

					{/* English */}
					<div className='space-y-2'>
						<Label htmlFor='titleEn'>Title (English)</Label>
						<Input
							id='titleEn'
							placeholder='English title'
							value={titleEn}
							onChange={(e) => setTitleEn(e.target.value)}
							maxLength={50}
						/>
						<Label htmlFor='messageEn'>Message (English)</Label>
						<Textarea
							id='messageEn'
							placeholder='English message'
							value={messageEn}
							onChange={(e) => setMessageEn(e.target.value)}
							maxLength={150}
						/>
					</div>

					{/* Norwegian */}
					<div className='space-y-2'>
						<Label htmlFor='titleNo'>Title (Norwegian)</Label>
						<Input
							id='titleNo'
							placeholder='Norwegian title'
							value={titleNo}
							onChange={(e) => setTitleNo(e.target.value)}
							maxLength={50}
						/>
						<Label htmlFor='messageNo'>Message (Norwegian)</Label>
						<Textarea
							id='messageNo'
							placeholder='Norwegian message'
							value={messageNo}
							onChange={(e) => setMessageNo(e.target.value)}
							maxLength={150}
						/>
					</div>

					{/* Spanish */}
					<div className='space-y-2'>
						<Label htmlFor='titleEs'>Title (Spanish)</Label>
						<Input
							id='titleEs'
							placeholder='Spanish title'
							value={titleEs}
							onChange={(e) => setTitleEs(e.target.value)}
							maxLength={50}
						/>
						<Label htmlFor='messageEs'>Message (Spanish)</Label>
						<Textarea
							id='messageEs'
							placeholder='Spanish message'
							value={messageEs}
							onChange={(e) => setMessageEs(e.target.value)}
							maxLength={150}
						/>
					</div>

					{/* German */}
					<div className='space-y-2'>
						<Label htmlFor='titleDe'>Title (German)</Label>
						<Input
							id='titleDe'
							placeholder='German title'
							value={titleDe}
							onChange={(e) => setTitleDe(e.target.value)}
							maxLength={50}
						/>
						<Label htmlFor='messageDe'>Message (German)</Label>
						<Textarea
							id='messageDe'
							placeholder='German message'
							value={messageDe}
							onChange={(e) => setMessageDe(e.target.value)}
							maxLength={150}
						/>
					</div>
				</div>
			)}

			<div className='space-y-2'>
				<Label htmlFor='targetType'>Target</Label>
				<Select
					value={targetType}
					onValueChange={(value) => setTargetType(value as TargetType)}>
					<SelectTrigger id='targetType'>
						<SelectValue placeholder='Select target type' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='all'>Send to Everyone Now</SelectItem>
						<SelectItem value='local_time'>
							Send at Users&apos; Local Time
						</SelectItem>
						<SelectItem value='user'>Send to Specific User</SelectItem>
					</SelectContent>
				</Select>
				<p className='text-sm text-muted-foreground'>
					Choose how to target this notification
				</p>
			</div>

			{targetType === "user" && (
				<div className='space-y-2'>
					<Label htmlFor='userId'>User ID</Label>
					<Input
						id='userId'
						placeholder='Enter user ID'
						value={userId}
						onChange={(e) => setUserId(e.target.value)}
						required
					/>
					<p className='text-sm text-muted-foreground'>
						The specific user ID to send the notification to
					</p>
				</div>
			)}

			{targetType === "local_time" && (
				<div className='space-y-2'>
					<Label>Local Time</Label>
					<div className='flex gap-2 items-center'>
						<Select value={localHour} onValueChange={setLocalHour}>
							<SelectTrigger className='w-20'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{Array.from({ length: 24 }, (_, i) => (
									<SelectItem key={i} value={i.toString()}>
										{i.toString().padStart(2, "0")}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<span>:</span>
						<Select value={localMinute} onValueChange={setLocalMinute}>
							<SelectTrigger className='w-20'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{Array.from({ length: 60 }, (_, i) => (
									<SelectItem key={i} value={i.toString()}>
										{i.toString().padStart(2, "0")}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<p className='text-sm text-muted-foreground'>
						The notification will be scheduled to send at this time in each
						user&apos;s local timezone
					</p>
				</div>
			)}

			<Button type='submit' disabled={isSubmitting} className='w-full'>
				{isSubmitting ? "Sending..." : "Send Push Notification"}
			</Button>
		</form>
	);
}
