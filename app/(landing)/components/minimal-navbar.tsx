import AuthButton from "@/components/auth-modal/auth-button";
import { ModeToggle } from "@/components/button-toggle-darkmode";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

export default function MinimalNavbar() {
	return (
		<div>
			{" "}
			{/* Minimalistic Navbar */}
			<header className='border-b'>
				<div className='container mx-auto flex h-16 items-center justify-between px-4'>
					<div className='flex items-center gap-6'>
						<Link href='/' className='flex items-center gap-2'>
							<span className='text-xl font-bold'>airox</span>
						</Link>
						<nav className='hidden md:flex items-center gap-6'>
							<Link
								href='/about'
								className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'>
								About
							</Link>
							<Link
								href='/contact'
								className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'>
								Contact
							</Link>
							<Link
								href='/blog'
								className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'>
								Blog
							</Link>
						</nav>
					</div>
					<div className='flex items-center gap-4'>
						<Link href='/waitlist'>
							<Button
								variant='outline'
								className='hidden cursor-pointer md:flex border-primary/30 text-primary hover:bg-primary/5 hover:text-primary'>
								Join Waitlist
							</Button>
						</Link>
						<ModeToggle />
						<AuthButton />
					</div>
				</div>
			</header>
		</div>
	);
}
