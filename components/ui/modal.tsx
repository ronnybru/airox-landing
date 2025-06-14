"use client";

import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	children: React.ReactNode;
	maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
}

export function Modal({
	isOpen,
	onClose,
	title,
	children,
	maxWidth = "md",
}: ModalProps) {
	const maxWidthClasses = {
		sm: "max-w-sm",
		md: "max-w-md",
		lg: "max-w-lg",
		xl: "max-w-xl",
		"2xl": "max-w-2xl",
		"3xl": "max-w-3xl",
		"4xl": "max-w-4xl",
		"5xl": "max-w-5xl",
		full: "max-w-full",
	};

	return (
		<Transition appear show={isOpen} as={Fragment}>
			<Dialog as='div' className='relative z-50' onClose={onClose}>
				<Transition.Child
					as={Fragment}
					enter='ease-out duration-300'
					enterFrom='opacity-0'
					enterTo='opacity-100'
					leave='ease-in duration-200'
					leaveFrom='opacity-100'
					leaveTo='opacity-0'>
					<div className='fixed inset-0 bg-black/25 backdrop-blur-sm' />
				</Transition.Child>

				<div className='fixed inset-0 overflow-y-auto'>
					<div className='flex min-h-full items-center justify-center p-4 text-center'>
						<Transition.Child
							as={Fragment}
							enter='ease-out duration-300'
							enterFrom='opacity-0 scale-95'
							enterTo='opacity-100 scale-100'
							leave='ease-in duration-200'
							leaveFrom='opacity-100 scale-100'
							leaveTo='opacity-0 scale-95'>
							<Dialog.Panel
								className={`w-full ${maxWidthClasses[maxWidth]} transform overflow-hidden rounded-lg bg-background p-0 text-left align-middle shadow-xl transition-all dark:text-foreground`}>
								<div className='absolute right-4 top-4 z-10'>
									<button
										type='button'
										className='rounded-md bg-background text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
										onClick={onClose}>
										<span className='sr-only'>Close</span>
										<X className='h-5 w-5' aria-hidden='true' />
									</button>
								</div>
								{title && (
									<Dialog.Title
										as='h3'
										className='text-lg font-medium leading-6 text-gray-900 p-6'>
										{title}
									</Dialog.Title>
								)}
								<div>{children}</div>
							</Dialog.Panel>
						</Transition.Child>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
}
