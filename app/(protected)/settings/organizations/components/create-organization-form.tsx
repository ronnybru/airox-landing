"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { organization } from "@/lib/auth-client";
import { toast } from "sonner";

const formSchema = z.object({
	name: z.string().min(2, {
		message: "Organization name must be at least 2 characters.",
	}),
	slug: z
		.string()
		.min(2, {
			message: "Slug must be at least 2 characters.",
		})
		.regex(/^[a-z0-9-]+$/, {
			message: "Slug can only contain lowercase letters, numbers, and hyphens.",
		}),
});

export function CreateOrganizationForm() {
	const router = useRouter();
	const [isChecking, setIsChecking] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			slug: "",
		},
	});

	// Generate slug from name
	const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const name = e.target.value;
		const slug = name
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "");

		form.setValue("slug", slug);
	};

	// Check if slug is available
	const checkSlug = async (slug: string) => {
		if (!slug || slug.length < 2) return;

		setIsChecking(true);
		try {
			const result = await organization.checkSlug({ slug });
			// Based on the API documentation, the result should have a status property
			// where false means the slug is available and true means it's taken
			if (result && "status" in result && result.status === false) {
				form.clearErrors("slug");
			} else {
				form.setError("slug", {
					type: "manual",
					message: "This slug is already taken. Please choose another one.",
				});
			}
		} catch (error) {
			console.error("Error checking slug:", error);
		} finally {
			setIsChecking(false);
		}
	};

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		setIsSubmitting(true);
		try {
			await organization.create({
				name: values.name,
				slug: values.slug,
			});

			toast.success("Organization created successfully!");
			router.refresh();
			form.reset();
		} catch (error) {
			console.error("Error creating organization:", error);
			toast.error("Failed to create organization. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
				<FormField
					control={form.control}
					name='name'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Organization Name</FormLabel>
							<FormControl>
								<Input
									placeholder='Acme Inc.'
									{...field}
									onChange={(e) => {
										field.onChange(e);
										onNameChange(e);
									}}
								/>
							</FormControl>
							<FormDescription>
								This is your organization&apos;s display name.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name='slug'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Organization Slug</FormLabel>
							<FormControl>
								<Input
									placeholder='acme'
									{...field}
									onChange={(e) => {
										field.onChange(e);
										checkSlug(e.target.value);
									}}
								/>
							</FormControl>
							<FormDescription>
								This will be used in URLs and cannot be changed later.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button
					type='submit'
					disabled={isSubmitting || isChecking}
					className='w-full'>
					{isSubmitting ? "Creating..." : "Create Organization"}
				</Button>
			</form>
		</Form>
	);
}
