import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { checkAdminAccess } from "@/app/actions/user-helpers";
import { ExerciseActions } from "../components/exercise-actions";

export const dynamic = "force-dynamic";

interface ExercisePageProps {
	params: Promise<{
		id: string;
	}>;
}

async function getExercise(id: string) {
	const [exercise] = await db
		.select()
		.from(schema.exercises)
		.where(eq(schema.exercises.id, id))
		.limit(1);

	return exercise;
}

export default async function ExercisePage({ params }: ExercisePageProps) {
	// Check admin access before rendering the page
	await checkAdminAccess();

	// Await params before accessing its properties (Next.js 15 requirement)
	const { id } = await params;
	const exercise = await getExercise(id);

	if (!exercise) {
		notFound();
	}

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
		<div className='space-y-6'>
			<div className='flex justify-between items-center'>
				<PageHeader
					title={exercise.name}
					subtitle='Exercise details and management'
				/>
				<div className='flex gap-2'>
					<Button asChild>
						<Link href={`/exercises/${exercise.id}/edit`}>Edit Exercise</Link>
					</Button>
					<Button variant='outline' asChild>
						<Link href='/exercises'>Back to Exercises</Link>
					</Button>
				</div>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
				{/* Basic Information */}
				<Card>
					<CardHeader>
						<CardTitle>Basic Information</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div>
							<h4 className='font-medium text-sm text-muted-foreground'>
								Name
							</h4>
							<p className='text-lg font-semibold'>{exercise.name}</p>
						</div>

						<div>
							<h4 className='font-medium text-sm text-muted-foreground'>
								Description
							</h4>
							<p>{exercise.description}</p>
						</div>

						<div>
							<h4 className='font-medium text-sm text-muted-foreground'>
								Status
							</h4>
							<Badge variant={exercise.isActive ? "default" : "secondary"}>
								{exercise.isActive ? "Active" : "Inactive"}
							</Badge>
						</div>

						<div>
							<h4 className='font-medium text-sm text-muted-foreground'>
								Created
							</h4>
							<p>{exercise.createdAt.toLocaleDateString()}</p>
						</div>

						<div>
							<h4 className='font-medium text-sm text-muted-foreground'>
								Last Updated
							</h4>
							<p>{exercise.updatedAt.toLocaleDateString()}</p>
						</div>
					</CardContent>
				</Card>

				{/* Categorization */}
				<Card>
					<CardHeader>
						<CardTitle>Categorization</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div>
							<h4 className='font-medium text-sm text-muted-foreground'>
								Category
							</h4>
							<Badge className={getCategoryColor(exercise.category)}>
								{exercise.category}
							</Badge>
						</div>

						{exercise.subcategory && (
							<div>
								<h4 className='font-medium text-sm text-muted-foreground'>
									Subcategory
								</h4>
								<p>{exercise.subcategory}</p>
							</div>
						)}

						<div>
							<h4 className='font-medium text-sm text-muted-foreground'>
								Exercise Type
							</h4>
							<Badge className={getTypeColor(exercise.exerciseType)}>
								{exercise.exerciseType}
							</Badge>
						</div>

						{exercise.movementPattern && (
							<div>
								<h4 className='font-medium text-sm text-muted-foreground'>
									Movement Pattern
								</h4>
								<p className='capitalize'>{exercise.movementPattern}</p>
							</div>
						)}

						<div>
							<h4 className='font-medium text-sm text-muted-foreground'>
								Difficulty Level
							</h4>
							<Badge className={getDifficultyColor(exercise.difficultyLevel)}>
								Level {exercise.difficultyLevel}
							</Badge>
						</div>

						<div>
							<h4 className='font-medium text-sm text-muted-foreground'>
								Progression Type
							</h4>
							<p className='capitalize'>{exercise.progressionType}</p>
						</div>
					</CardContent>
				</Card>

				{/* Instructions */}
				<Card className='lg:col-span-2'>
					<CardHeader>
						<CardTitle>Instructions</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='whitespace-pre-line'>{exercise.instructions}</div>
					</CardContent>
				</Card>

				{/* Muscle Groups */}
				<Card>
					<CardHeader>
						<CardTitle>Muscle Groups</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='flex flex-wrap gap-2'>
							{exercise.muscleGroups.map((muscle) => (
								<Badge key={muscle} variant='secondary'>
									{muscle}
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Equipment */}
				<Card>
					<CardHeader>
						<CardTitle>Equipment</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='flex flex-wrap gap-2'>
							{exercise.equipment.map((eq) => (
								<Badge key={eq} variant='outline'>
									{eq.replace("_", " ")}
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Exercise Parameters */}
				<Card>
					<CardHeader>
						<CardTitle>Exercise Parameters</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='grid grid-cols-2 gap-4'>
							<div>
								<h4 className='font-medium text-sm text-muted-foreground'>
									Default Sets
								</h4>
								<p className='text-lg font-semibold'>{exercise.defaultSets}</p>
							</div>

							{exercise.defaultReps && (
								<div>
									<h4 className='font-medium text-sm text-muted-foreground'>
										Default Reps
									</h4>
									<p className='text-lg font-semibold'>
										{exercise.defaultReps}
									</p>
								</div>
							)}

							{exercise.defaultDuration && (
								<div>
									<h4 className='font-medium text-sm text-muted-foreground'>
										Default Duration
									</h4>
									<p className='text-lg font-semibold'>
										{exercise.defaultDuration}s
									</p>
								</div>
							)}
						</div>

						<div className='grid grid-cols-2 gap-4'>
							<div>
								<h4 className='font-medium text-sm text-muted-foreground'>
									Time Per Set
								</h4>
								<p className='text-lg font-semibold'>
									{exercise.baseTimePerSet}s
								</p>
							</div>

							<div>
								<h4 className='font-medium text-sm text-muted-foreground'>
									Rest Time
								</h4>
								<p className='text-lg font-semibold'>
									{exercise.baseRestTime}s
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Media & Tags */}
				<Card>
					<CardHeader>
						<CardTitle>Media & Tags</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						{exercise.imageUrl && (
							<div>
								<h4 className='font-medium text-sm text-muted-foreground'>
									Image
								</h4>
								<Image
									src={exercise.imageUrl}
									alt={exercise.name}
									width={384}
									height={256}
									className='w-full max-w-sm rounded-lg'
								/>
							</div>
						)}

						{exercise.videoUrl && (
							<div>
								<h4 className='font-medium text-sm text-muted-foreground'>
									Video URL
								</h4>
								<a
									href={exercise.videoUrl}
									target='_blank'
									rel='noopener noreferrer'
									className='text-blue-600 hover:underline'>
									{exercise.videoUrl}
								</a>
							</div>
						)}

						{exercise.tags && exercise.tags.length > 0 && (
							<div>
								<h4 className='font-medium text-sm text-muted-foreground'>
									Tags
								</h4>
								<div className='flex flex-wrap gap-2'>
									{exercise.tags.map((tag) => (
										<Badge key={tag} variant='outline'>
											{tag}
										</Badge>
									))}
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<ExerciseActions exercise={exercise} />
		</div>
	);
}
