import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { checkAdminAccess } from "@/app/actions/user-helpers";
import { SeedButton } from "../components/seed-button";

export const dynamic = "force-dynamic";

export default async function SeedExercisesPage() {
	// Check admin access before rendering the page
	await checkAdminAccess();

	return (
		<div className='space-y-6'>
			<div className='flex justify-between items-center'>
				<PageHeader
					title='Seed Exercises'
					subtitle='Populate the database with initial exercise data'
				/>
				<Button variant='outline' asChild>
					<Link href='/exercises'>Back to Exercises</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Seed Initial Exercises</CardTitle>
					<CardDescription>
						This will add a comprehensive set of gym exercises to get you
						started. This includes both heavy compound movements and isolation
						exercises.
					</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
						<h4 className='font-medium text-yellow-800 mb-2'>
							⚠️ Important Notes:
						</h4>
						<ul className='text-sm text-yellow-700 space-y-1'>
							<li>• This will add 26 comprehensive exercises</li>
							<li>
								• Heavy compounds: Bench Press, Deadlift, Squats, Overhead
								Press, Barbell Rows, Romanian Deadlift, Front Squats, Weighted
								Dips
							</li>
							<li>
								• Isolation exercises: Bicep Curls, Tricep Extensions, Lateral
								Raises, Leg Curls, Calf Raises, Face Pulls, Hip Thrusts, Hammer
								Curls
							</li>
							<li>
								• Functional movements: Farmer&apos;s Walk, Walking Lunges,
								Bulgarian Split Squats, Russian Twists
							</li>
							<li>• All exercises will be marked as active by default</li>
							<li>• You can edit or deactivate any exercise after seeding</li>
							<li>
								• This action is safe to run multiple times (duplicates will be
								avoided)
							</li>
						</ul>
					</div>

					<SeedButton />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>What&apos;s Included</CardTitle>
					<CardDescription>
						Preview of exercises that will be added to your system
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						<div className='space-y-2'>
							<h4 className='font-medium'>Heavy Compound Movements</h4>
							<ul className='text-sm text-muted-foreground space-y-1'>
								<li>• Barbell Bench Press</li>
								<li>• Deadlift</li>
								<li>• Squats</li>
								<li>• Overhead Press</li>
								<li>• Barbell Rows</li>
								<li>• Romanian Deadlift</li>
								<li>• Weighted Dips</li>
								<li>• Front Squats</li>
							</ul>
						</div>
						<div className='space-y-2'>
							<h4 className='font-medium'>Isolation Exercises</h4>
							<ul className='text-sm text-muted-foreground space-y-1'>
								<li>• Bicep Curls</li>
								<li>• Tricep Extensions</li>
								<li>• Lateral Raises</li>
								<li>• Leg Curls</li>
								<li>• Calf Raises</li>
								<li>• Face Pulls</li>
								<li>• Hip Thrusts</li>
								<li>• Hammer Curls</li>
							</ul>
						</div>
						<div className='space-y-2'>
							<h4 className='font-medium'>Functional & Bodyweight</h4>
							<ul className='text-sm text-muted-foreground space-y-1'>
								<li>• Pull-ups</li>
								<li>• Push-ups</li>
								<li>• Plank</li>
								<li>• Farmer&apos;s Walk</li>
								<li>• Walking Lunges</li>
								<li>• Bulgarian Split Squats</li>
								<li>• Russian Twists</li>
								<li>• Incline Dumbbell Press</li>
								<li>• T-Bar Rows</li>
								<li>• Close-Grip Bench Press</li>
							</ul>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
