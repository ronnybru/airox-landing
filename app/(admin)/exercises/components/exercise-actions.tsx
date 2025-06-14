"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { deleteExercise, toggleExerciseStatus } from "../actions";

interface Exercise {
	id: string;
	name: string;
	isActive: boolean;
}

interface ExerciseActionsProps {
	exercise: Exercise;
}

export function ExerciseActions({ exercise }: ExerciseActionsProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const handleToggleStatus = async () => {
		setIsLoading(true);
		try {
			await toggleExerciseStatus(exercise.id, !exercise.isActive);
			router.refresh();
		} catch (error) {
			console.error("Error toggling exercise status:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		setIsLoading(true);
		try {
			await deleteExercise(exercise.id);
			router.push("/exercises");
		} catch (error) {
			console.error("Error deleting exercise:", error);
			// TODO: Show error toast
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Actions</CardTitle>
			</CardHeader>
			<CardContent className='flex gap-4'>
				<Button
					variant='outline'
					onClick={handleToggleStatus}
					disabled={isLoading}
					className='flex items-center gap-2'>
					{exercise.isActive ? (
						<>
							<ToggleLeft className='h-4 w-4' />
							Deactivate
						</>
					) : (
						<>
							<ToggleRight className='h-4 w-4' />
							Activate
						</>
					)}
				</Button>

				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button variant='destructive' disabled={isLoading}>
							<Trash2 className='h-4 w-4 mr-2' />
							Delete Exercise
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
							<AlertDialogDescription>
								This action cannot be undone. This will permanently delete the
								exercise &apos;{exercise.name}&apos; from the system.
								<br />
								<br />
								<strong>Note:</strong> If this exercise is currently assigned to
								users, the deletion will fail. You should deactivate it instead.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleDelete}
								className='bg-red-600 hover:bg-red-700'>
								Delete Exercise
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</CardContent>
		</Card>
	);
}
