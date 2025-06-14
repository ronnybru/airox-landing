"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Star, MessageSquare, Calendar, User } from "lucide-react";

interface FeedbackItem {
	id: string;
	user_id: string | null;
	user_name: string | null;
	user_email: string | null;
	rating: number | null;
	feedback: string;
	source: string;
	status: string;
	admin_notes: string | null;
	device_id: string | null;
	user_agent: string | null;
	ip_address: string | null;
	created_at: string;
	updated_at: string;
}

interface FeedbackResponse {
	feedback: FeedbackItem[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export default function FeedbackPage() {
	const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [sourceFilter, setSourceFilter] = useState<string>("all");
	const [currentPage, setCurrentPage] = useState(1);
	const [pagination, setPagination] = useState({
		page: 1,
		limit: 50,
		total: 0,
		totalPages: 0,
	});
	const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(
		null
	);
	const [adminNotes, setAdminNotes] = useState("");
	const [newStatus, setNewStatus] = useState("");

	const fetchFeedback = useCallback(async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: "50",
			});

			if (statusFilter !== "all") {
				params.append("status", statusFilter);
			}
			if (sourceFilter !== "all") {
				params.append("source", sourceFilter);
			}

			const response = await fetch(`/api/feedback?${params}`);
			if (!response.ok) {
				throw new Error("Failed to fetch feedback");
			}

			const data: FeedbackResponse = await response.json();
			setFeedback(data.feedback);
			setPagination(data.pagination);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setLoading(false);
		}
	}, [currentPage, statusFilter, sourceFilter]);

	useEffect(() => {
		fetchFeedback();
	}, [fetchFeedback]);

	const updateFeedback = async (
		id: string,
		updates: { status?: string; adminNotes?: string }
	) => {
		try {
			const response = await fetch(`/api/feedback/${id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updates),
			});

			if (!response.ok) {
				throw new Error("Failed to update feedback");
			}

			// Refresh the feedback list
			fetchFeedback();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to update feedback"
			);
		}
	};

	const handleStatusChange = (feedbackId: string, status: string) => {
		updateFeedback(feedbackId, { status });
	};

	const handleNotesSubmit = () => {
		if (selectedFeedback) {
			updateFeedback(selectedFeedback.id, {
				adminNotes: adminNotes,
				status: newStatus || selectedFeedback.status,
			});
			setSelectedFeedback(null);
			setAdminNotes("");
			setNewStatus("");
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "pending":
				return "bg-yellow-100 text-yellow-800";
			case "reviewed":
				return "bg-blue-100 text-blue-800";
			case "resolved":
				return "bg-green-100 text-green-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const renderStars = (rating: number | null) => {
		if (!rating) return null;
		return (
			<div className='flex items-center gap-1'>
				{[1, 2, 3, 4, 5].map((star) => (
					<Star
						key={star}
						className={`w-4 h-4 ${
							star <= rating
								? "fill-yellow-400 text-yellow-400"
								: "text-gray-300"
						}`}
					/>
				))}
			</div>
		);
	};

	if (loading) {
		return (
			<div className='container mx-auto p-6'>
				<div className='flex items-center justify-center h-64'>
					<div className='text-lg'>Loading feedback...</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='container mx-auto p-6'>
				<div className='flex items-center justify-center h-64'>
					<div className='text-lg text-red-600'>Error: {error}</div>
				</div>
			</div>
		);
	}

	return (
		<div className='container mx-auto p-6'>
			<div className='flex justify-between items-center mb-6'>
				<h1 className='text-3xl font-bold'>User Feedback</h1>
				<div className='text-sm text-gray-600'>
					Total: {pagination.total} feedback items
				</div>
			</div>

			{/* Filters */}
			<div className='flex gap-4 mb-6'>
				<div className='flex flex-col gap-2'>
					<Label htmlFor='status-filter'>Status</Label>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className='w-40'>
							<SelectValue placeholder='All statuses' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='all'>All statuses</SelectItem>
							<SelectItem value='pending'>Pending</SelectItem>
							<SelectItem value='reviewed'>Reviewed</SelectItem>
							<SelectItem value='resolved'>Resolved</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className='flex flex-col gap-2'>
					<Label htmlFor='source-filter'>Source</Label>
					<Select value={sourceFilter} onValueChange={setSourceFilter}>
						<SelectTrigger className='w-40'>
							<SelectValue placeholder='All sources' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='all'>All sources</SelectItem>
							<SelectItem value='onboarding'>Onboarding</SelectItem>
							<SelectItem value='app'>App</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Feedback List */}
			<div className='space-y-4'>
				{feedback.map((item) => (
					<Card key={item.id} className='w-full'>
						<CardHeader className='pb-3'>
							<div className='flex justify-between items-start'>
								<div className='flex items-center gap-3'>
									<div className='flex items-center gap-2'>
										<User className='w-4 h-4 text-gray-500' />
										<span className='font-medium'>
											{item.user_name || "Anonymous User"}
										</span>
										{item.user_email ? (
											<span className='text-sm text-gray-500'>
												({item.user_email})
											</span>
										) : (
											<span className='text-sm text-gray-500'>
												(IP: {item.ip_address || "unknown"})
											</span>
										)}
									</div>
									{item.rating && renderStars(item.rating)}
								</div>
								<div className='flex items-center gap-2'>
									<Badge variant='outline' className='text-xs'>
										{item.source}
									</Badge>
									<Badge className={getStatusColor(item.status)}>
										{item.status}
									</Badge>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className='space-y-3'>
								<div className='flex items-start gap-2'>
									<MessageSquare className='w-4 h-4 text-gray-500 mt-1' />
									<p className='text-gray-700 flex-1'>{item.feedback}</p>
								</div>

								{item.admin_notes && (
									<div className='bg-blue-50 p-3 rounded-lg'>
										<div className='text-sm font-medium text-blue-800 mb-1'>
											Admin Notes:
										</div>
										<div className='text-sm text-blue-700'>
											{item.admin_notes}
										</div>
									</div>
								)}

								<div className='flex justify-between items-center pt-2 border-t'>
									<div className='flex items-center gap-2 text-sm text-gray-500'>
										<Calendar className='w-4 h-4' />
										{new Date(item.created_at).toLocaleDateString()} at{" "}
										{new Date(item.created_at).toLocaleTimeString()}
									</div>

									<div className='flex items-center gap-2'>
										<Select
											value={item.status}
											onValueChange={(status) =>
												handleStatusChange(item.id, status)
											}>
											<SelectTrigger className='w-32'>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value='pending'>Pending</SelectItem>
												<SelectItem value='reviewed'>Reviewed</SelectItem>
												<SelectItem value='resolved'>Resolved</SelectItem>
											</SelectContent>
										</Select>

										<Dialog>
											<DialogTrigger asChild>
												<Button
													variant='outline'
													size='sm'
													onClick={() => {
														setSelectedFeedback(item);
														setAdminNotes(item.admin_notes || "");
														setNewStatus(item.status);
													}}>
													Add Notes
												</Button>
											</DialogTrigger>
											<DialogContent>
												<DialogHeader>
													<DialogTitle>Add Admin Notes</DialogTitle>
												</DialogHeader>
												<div className='space-y-4'>
													<div>
														<Label htmlFor='feedback-text'>Feedback</Label>
														<div className='p-3 bg-gray-50 rounded-lg text-sm'>
															{selectedFeedback?.feedback}
														</div>
													</div>
													<div>
														<Label htmlFor='status'>Status</Label>
														<Select
															value={newStatus}
															onValueChange={setNewStatus}>
															<SelectTrigger>
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value='pending'>Pending</SelectItem>
																<SelectItem value='reviewed'>
																	Reviewed
																</SelectItem>
																<SelectItem value='resolved'>
																	Resolved
																</SelectItem>
															</SelectContent>
														</Select>
													</div>
													<div>
														<Label htmlFor='admin-notes'>Admin Notes</Label>
														<Textarea
															id='admin-notes'
															value={adminNotes}
															onChange={(e) => setAdminNotes(e.target.value)}
															placeholder='Add notes about this feedback...'
															rows={4}
														/>
													</div>
													<Button
														onClick={handleNotesSubmit}
														className='w-full'>
														Save Notes
													</Button>
												</div>
											</DialogContent>
										</Dialog>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Pagination */}
			{pagination.totalPages > 1 && (
				<div className='flex justify-center items-center gap-2 mt-6'>
					<Button
						variant='outline'
						onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
						disabled={currentPage === 1}>
						Previous
					</Button>
					<span className='text-sm text-gray-600'>
						Page {currentPage} of {pagination.totalPages}
					</span>
					<Button
						variant='outline'
						onClick={() =>
							setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))
						}
						disabled={currentPage === pagination.totalPages}>
						Next
					</Button>
				</div>
			)}
		</div>
	);
}
