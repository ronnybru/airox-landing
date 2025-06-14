"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Calculator() {
	const [num1, setNum1] = useState<number>(0);
	const [num2, setNum2] = useState<number>(0);
	const [operation, setOperation] = useState<string>("+");
	const [result, setResult] = useState<number | null>(null);

	const calculate = () => {
		switch (operation) {
			case "+":
				setResult(num1 + num2);
				break;
			case "-":
				setResult(num1 - num2);
				break;
			case "*":
				setResult(num1 * num2);
				break;
			case "/":
				setResult(num2 !== 0 ? num1 / num2 : null);
				break;
			default:
				setResult(null);
		}
	};

	return (
		<Card className='my-6'>
			<CardHeader>
				<CardTitle>Interactive Calculator</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='flex flex-col gap-4'>
					<div className='flex gap-2 flex-wrap items-center'>
						<Input
							type='number'
							value={num1}
							onChange={(e) => setNum1(Number(e.target.value))}
							className='w-24'
						/>
						<select
							value={operation}
							onChange={(e) => setOperation(e.target.value)}
							className='px-2 py-2 border rounded'>
							<option value='+'>+</option>
							<option value='-'>-</option>
							<option value='*'>×</option>
							<option value='/'>÷</option>
						</select>
						<Input
							type='number'
							value={num2}
							onChange={(e) => setNum2(Number(e.target.value))}
							className='w-24'
						/>
						<Button onClick={calculate}>=</Button>
						<div className='flex items-center ml-2 min-w-[50px]'>
							{result !== null ? result : "Error"}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
