import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { db } from "@/lib/db";
import { count, eq, desc } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { checkAdminAccess } from "@/app/actions/user-helpers";

import { ExerciseStats } from "./components/exercise-stats";
import { ExerciseList } from "./components/exercise-list";

export const dynamic = "force-dynamic";

async function getExerciseStats() {
	// Get total exercises count
	const [exerciseCount] = await db
		.select({ count: count() })
		.from(schema.exercises);

	// Get active exercises count
	const [activeExerciseCount] = await db
		.select({ count: count() })
		.from(schema.exercises)
		.where(eq(schema.exercises.isActive, true));

	// Get total user exercises count
	const [userExerciseCount] = await db
		.select({ count: count() })
		.from(schema.userExercises);

	// Get total workout sessions count
	const [sessionCount] = await db
		.select({ count: count() })
		.from(schema.workoutSessions);

	return {
		exerciseCount: exerciseCount?.count || 0,
		activeExerciseCount: activeExerciseCount?.count || 0,
		userExerciseCount: userExerciseCount?.count || 0,
		sessionCount: sessionCount?.count || 0,
	};
}

async function getExercises() {
	return await db
		.select({
			id: schema.exercises.id,
			name: schema.exercises.name,
			description: schema.exercises.description,
			category: schema.exercises.category,
			subcategory: schema.exercises.subcategory,
			difficultyLevel: schema.exercises.difficultyLevel,
			exerciseType: schema.exercises.exerciseType,
			isActive: schema.exercises.isActive,
			createdAt: schema.exercises.createdAt,
			updatedAt: schema.exercises.updatedAt,
		})
		.from(schema.exercises)
		.orderBy(desc(schema.exercises.createdAt));
}

export default async function ExercisesAdminPage() {
	// Check admin access before rendering the page
	await checkAdminAccess();

	const [stats, exercises] = await Promise.all([
		getExerciseStats(),
		getExercises(),
	]);

	return (
		<div className='space-y-6'>
			<div className='flex justify-between items-center'>
				<PageHeader
					title='Exercise Management'
					subtitle='Manage exercises, categories, and workout system'
				/>
				<div className='flex gap-2'>
					<Button asChild>
						<Link href='/exercises/new'>Add Exercise</Link>
					</Button>
					<Button variant='outline' asChild>
						<Link href='/exercises/seed'>Seed Exercises</Link>
					</Button>
					<Button variant='outline' asChild>
						<Link href='/admin'>Back to Admin</Link>
					</Button>
				</div>
			</div>

			<ExerciseStats stats={stats} />

			<Card>
				<CardHeader>
					<CardTitle>All Exercises</CardTitle>
					<CardDescription>Manage all exercises in the system</CardDescription>
				</CardHeader>
				<CardContent>
					<ExerciseList exercises={exercises} />
				</CardContent>
			</Card>
		</div>
	);
}
