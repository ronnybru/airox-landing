import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { checkAdminAccess } from "@/app/actions/user-helpers";
import { ExerciseForm } from "../../components/exercise-form";

interface EditExercisePageProps {
	params: Promise<{
		id: string;
	}>;
}

async function getExercise(id: string) {
	const [exercise] = await db
		.select({
			id: schema.exercises.id,
			name: schema.exercises.name,
			description: schema.exercises.description,
			instructions: schema.exercises.instructions,
			category: schema.exercises.category,
			subcategory: schema.exercises.subcategory,
			muscleGroups: schema.exercises.muscleGroups,
			equipment: schema.exercises.equipment,
			difficultyLevel: schema.exercises.difficultyLevel,
			baseTimePerSet: schema.exercises.baseTimePerSet,
			baseRestTime: schema.exercises.baseRestTime,
			defaultSets: schema.exercises.defaultSets,
			defaultReps: schema.exercises.defaultReps,
			defaultDuration: schema.exercises.defaultDuration,
			exerciseType: schema.exercises.exerciseType,
			movementPattern: schema.exercises.movementPattern,
			progressionType: schema.exercises.progressionType,
			imageUrl: schema.exercises.imageUrl,
			videoUrl: schema.exercises.videoUrl,
			videoUrlDark: schema.exercises.videoUrlDark,
			thumbnailUrl: schema.exercises.thumbnailUrl,
			isActive: schema.exercises.isActive,
			tags: schema.exercises.tags,
		})
		.from(schema.exercises)
		.where(eq(schema.exercises.id, id))
		.limit(1);

	return exercise;
}

export default async function EditExercisePage({
	params,
}: EditExercisePageProps) {
	// Check admin access before rendering the page
	await checkAdminAccess();

	// Await params before accessing its properties (Next.js 15 requirement)
	const { id } = await params;
	const exercise = await getExercise(id);

	if (!exercise) {
		notFound();
	}

	return (
		<div className='space-y-6'>
			<div className='flex justify-between items-center'>
				<PageHeader
					title={`Edit ${exercise.name}`}
					subtitle='Update exercise details and settings'
				/>
				<div className='flex gap-2'>
					<Button variant='outline' asChild>
						<Link href={`/exercises/${exercise.id}`}>View Exercise</Link>
					</Button>
					<Button variant='outline' asChild>
						<Link href='/exercises'>Back to Exercises</Link>
					</Button>
				</div>
			</div>

			<ExerciseForm exercise={exercise} isEditing={true} />
		</div>
	);
}
