import AuthButton from "@/components/auth-modal/auth-button";
import { ModeToggle } from "@/components/button-toggle-darkmode";
import Logo from "@/components/logo";
import Link from "next/link";
import React from "react";

export default function MinimalNavbar() {
	return (
		<div>
			{" "}
			{/* Minimalistic Navbar */}
			<header className=''>
				<div className='container mx-auto flex h-14 items-center justify-between px-4'>
					<Link href='/' className='flex items-center gap-2'>
						<Logo size={32} className='text-primary' />
						<span className='text-xl font-semibold'>Airox</span>
					</Link>
					<div className='flex items-center gap-8'>
						<nav className='hidden md:flex items-center gap-8'>
							<Link
								href='/about'
								className='text-sm text-muted-foreground hover:text-foreground transition-colors'>
								About
							</Link>
							<Link
								href='/contact'
								className='text-sm text-muted-foreground hover:text-foreground transition-colors'>
								Contact
							</Link>
							<Link
								href='/blog'
								className='text-sm text-muted-foreground hover:text-foreground transition-colors'>
								Blog
							</Link>
						</nav>
						<Link href='/waitlist' className='hidden md:block'>
							<span className='text-sm font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer'>
								Join Waitlist
							</span>
						</Link>
						<AuthButton />
						<ModeToggle />
					</div>
				</div>
			</header>
		</div>
	);
}
