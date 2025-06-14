import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { checkAdminAccess } from "@/app/actions/user-helpers";
import { ExerciseForm } from "../components/exercise-form";

export const dynamic = "force-dynamic";

export default async function NewExercisePage() {
	// Check admin access before rendering the page
	await checkAdminAccess();

	return (
		<div className='space-y-6'>
			<div className='flex justify-between items-center'>
				<PageHeader
					title='Add New Exercise'
					subtitle='Create a new exercise for the workout system'
				/>
				<Button variant='outline' asChild>
					<Link href='/exercises'>Back to Exercises</Link>
				</Button>
			</div>

			<ExerciseForm />
		</div>
	);
}
