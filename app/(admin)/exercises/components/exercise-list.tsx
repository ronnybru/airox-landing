"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Eye, Trash2 } from "lucide-react";

interface Exercise {
	id: string;
	name: string;
	description: string;
	category: string;
	subcategory: string | null;
	difficultyLevel: number;
	exerciseType: string;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

interface ExerciseListProps {
	exercises: Exercise[];
}

export function ExerciseList({ exercises }: ExerciseListProps) {
	const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

	const filteredExercises = exercises.filter((exercise) => {
		if (filter === "active") return exercise.isActive;
		if (filter === "inactive") return !exercise.isActive;
		return true;
	});

	const getCategoryColor = (category: string) => {
		const colors: Record<string, string> = {
			chest: "bg-red-100 text-red-800",
			back: "bg-blue-100 text-blue-800",
			legs: "bg-green-100 text-green-800",
			shoulders: "bg-yellow-100 text-yellow-800",
			arms: "bg-purple-100 text-purple-800",
			core: "bg-orange-100 text-orange-800",
			cardio: "bg-pink-100 text-pink-800",
		};
		return colors[category] || "bg-gray-100 text-gray-800";
	};

	const getTypeColor = (type: string) => {
		const colors: Record<string, string> = {
			compound: "bg-emerald-100 text-emerald-800",
			isolation: "bg-cyan-100 text-cyan-800",
			cardio: "bg-rose-100 text-rose-800",
			plyometric: "bg-violet-100 text-violet-800",
		};
		return colors[type] || "bg-gray-100 text-gray-800";
	};

	const getDifficultyColor = (level: number) => {
		if (level <= 3) return "bg-green-100 text-green-800";
		if (level <= 6) return "bg-yellow-100 text-yellow-800";
		if (level <= 8) return "bg-orange-100 text-orange-800";
		return "bg-red-100 text-red-800";
	};

	return (
		<div className='space-y-4'>
			<div className='flex gap-2'>
				<Button
					variant={filter === "all" ? "default" : "outline"}
					size='sm'
					onClick={() => setFilter("all")}>
					All ({exercises.length})
				</Button>
				<Button
					variant={filter === "active" ? "default" : "outline"}
					size='sm'
					onClick={() => setFilter("active")}>
					Active ({exercises.filter((e) => e.isActive).length})
				</Button>
				<Button
					variant={filter === "inactive" ? "default" : "outline"}
					size='sm'
					onClick={() => setFilter("inactive")}>
					Inactive ({exercises.filter((e) => !e.isActive).length})
				</Button>
			</div>

			<div className='rounded-md border'>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Difficulty</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Created</TableHead>
							<TableHead className='w-[70px]'>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredExercises.length === 0 ? (
							<TableRow>
								<TableCell colSpan={7} className='text-center py-8'>
									No exercises found.
								</TableCell>
							</TableRow>
						) : (
							filteredExercises.map((exercise) => (
								<TableRow key={exercise.id}>
									<TableCell>
										<div>
											<div className='font-medium'>{exercise.name}</div>
											<div className='text-sm text-muted-foreground truncate max-w-[200px]'>
												{exercise.description}
											</div>
										</div>
									</TableCell>
									<TableCell>
										<div className='space-y-1'>
											<Badge className={getCategoryColor(exercise.category)}>
												{exercise.category}
											</Badge>
											{exercise.subcategory && (
												<div className='text-xs text-muted-foreground'>
													{exercise.subcategory}
												</div>
											)}
										</div>
									</TableCell>
									<TableCell>
										<Badge className={getTypeColor(exercise.exerciseType)}>
											{exercise.exerciseType}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge
											className={getDifficultyColor(exercise.difficultyLevel)}>
											Level {exercise.difficultyLevel}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge
											variant={exercise.isActive ? "default" : "secondary"}>
											{exercise.isActive ? "Active" : "Inactive"}
										</Badge>
									</TableCell>
									<TableCell className='text-sm text-muted-foreground'>
										{exercise.createdAt.toLocaleDateString()}
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant='ghost' className='h-8 w-8 p-0'>
													<MoreHorizontal className='h-4 w-4' />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align='end'>
												<DropdownMenuItem asChild>
													<Link href={`/exercises/${exercise.id}`}>
														<Eye className='mr-2 h-4 w-4' />
														View
													</Link>
												</DropdownMenuItem>
												<DropdownMenuItem asChild>
													<Link href={`/exercises/${exercise.id}/edit`}>
														<Edit className='mr-2 h-4 w-4' />
														Edit
													</Link>
												</DropdownMenuItem>
												<DropdownMenuItem className='text-red-600'>
													<Trash2 className='mr-2 h-4 w-4' />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
