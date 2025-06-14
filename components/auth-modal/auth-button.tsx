"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import AuthModal from "./auth-modal";

export default function AuthButton() {
	const { data: session, isPending } = useSession();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const router = useRouter();

	const handleDashboardClick = () => {
		router.push("/dashboard");
	};

	if (isPending) {
		return (
			<div className='flex justify-center items-center space-x-2'>
				<div className='w-4 h-4 rounded-full bg-blue-600 animate-pulse'></div>
				<div className='w-4 h-4 rounded-full bg-blue-600 animate-pulse delay-75'></div>
				<div className='w-4 h-4 rounded-full bg-blue-600 animate-pulse delay-150'></div>
			</div>
		);
	}

	if (session) {
		return <Button onClick={handleDashboardClick}>Dashboard</Button>;
	}

	return (
		<>
			<Button className='cursor-pointer' onClick={() => setIsModalOpen(true)}>
				Get Started
			</Button>
			<AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
		</>
	);
}
