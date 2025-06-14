import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface ExerciseStatsProps {
	stats: {
		exerciseCount: number;
		activeExerciseCount: number;
		userExerciseCount: number;
		sessionCount: number;
	};
}

export function ExerciseStats({ stats }: ExerciseStatsProps) {
	return (
		<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
			<Card>
				<CardHeader className='pb-2'>
					<CardTitle className='text-2xl'>Total Exercises</CardTitle>
					<CardDescription>All exercises in database</CardDescription>
				</CardHeader>
				<CardContent>
					<p className='text-4xl font-bold'>{stats.exerciseCount}</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className='pb-2'>
					<CardTitle className='text-2xl'>Active Exercises</CardTitle>
					<CardDescription>Currently available exercises</CardDescription>
				</CardHeader>
				<CardContent>
					<p className='text-4xl font-bold'>{stats.activeExerciseCount}</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className='pb-2'>
					<CardTitle className='text-2xl'>User Exercises</CardTitle>
					<CardDescription>Total user exercise assignments</CardDescription>
				</CardHeader>
				<CardContent>
					<p className='text-4xl font-bold'>{stats.userExerciseCount}</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className='pb-2'>
					<CardTitle className='text-2xl'>Workout Sessions</CardTitle>
					<CardDescription>Total completed sessions</CardDescription>
				</CardHeader>
				<CardContent>
					<p className='text-4xl font-bold'>{stats.sessionCount}</p>
				</CardContent>
			</Card>
		</div>
	);
}
