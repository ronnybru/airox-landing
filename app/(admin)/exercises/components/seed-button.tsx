"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Database } from "lucide-react";
import { seedExercises } from "../actions";

export function SeedButton() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [isSeeded, setIsSeeded] = useState(false);

	const handleSeed = async () => {
		setIsLoading(true);
		try {
			const result = await seedExercises();
			if (result.success) {
				setIsSeeded(true);
				router.refresh();
				// Redirect to exercises page after a short delay
				setTimeout(() => {
					router.push("/exercises");
				}, 2000);
			}
		} catch (error) {
			console.error("Error seeding exercises:", error);
			// TODO: Show error toast
		} finally {
			setIsLoading(false);
		}
	};

	if (isSeeded) {
		return (
			<div className='flex items-center gap-2 text-green-600'>
				<Database className='h-5 w-5' />
				<span className='font-medium'>Exercises seeded successfully!</span>
				<span className='text-sm text-muted-foreground'>
					Redirecting to exercises page...
				</span>
			</div>
		);
	}

	return (
		<Button onClick={handleSeed} disabled={isLoading} className='w-fit'>
			{isLoading ? (
				<>
					<Loader2 className='mr-2 h-4 w-4 animate-spin' />
					Seeding Exercises...
				</>
			) : (
				<>
					<Database className='mr-2 h-4 w-4' />
					Seed Initial Exercises
				</>
			)}
		</Button>
	);
}
