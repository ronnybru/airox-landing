"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetEmailTests } from "@/app/actions/reset-email-tests";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Paragraph } from "@/components/ui/typography";

export default function ResetButton() {
	const [isResetting, setIsResetting] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const router = useRouter();

	const handleReset = async () => {
		if (!showConfirm) {
			setShowConfirm(true);
			return;
		}

		setIsResetting(true);
		try {
			const result = await resetEmailTests();
			if (result.success) {
				// Refresh the page to show updated stats
				router.refresh();
				setShowConfirm(false);
			} else {
				alert(`Error: ${result.message}`);
			}
		} catch (error) {
			alert("An error occurred while resetting email tests");
			console.error(error);
		} finally {
			setIsResetting(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Reset Split Test</CardTitle>
				<CardDescription>
					Clear all variant assignments to start a new test
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Paragraph>
					{showConfirm
						? "Are you sure? This will clear all variant assignments and reset statistics."
						: "Use this to start a new split test after analyzing the current results."}
				</Paragraph>
			</CardContent>
			<CardFooter className='flex justify-end gap-2'>
				{showConfirm && (
					<Button variant='outline' onClick={() => setShowConfirm(false)}>
						Cancel
					</Button>
				)}
				<Button
					variant={showConfirm ? "destructive" : "default"}
					onClick={handleReset}
					disabled={isResetting}>
					{isResetting
						? "Resetting..."
						: showConfirm
							? "Yes, Reset All Data"
							: "Reset Split Test"}
				</Button>
			</CardFooter>
		</Card>
	);
}
