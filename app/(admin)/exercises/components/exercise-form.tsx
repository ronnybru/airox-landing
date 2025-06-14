"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Upload, Loader2 } from "lucide-react";
import { createExercise, updateExercise } from "../actions";

// Simple Image Crop Modal Component
interface ImageCropModalProps {
	imageSrc: string;
	onCropComplete: (croppedBlob: Blob) => void;
	onCancel: () => void;
}

function ImageCropModal({
	imageSrc,
	onCropComplete,
	onCancel,
}: ImageCropModalProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const imageRef = useRef<HTMLImageElement>(null);
	const [crop, setCrop] = useState({ x: 0, y: 0, width: 200, height: 200 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

	const handleMouseDown = (e: React.MouseEvent) => {
		setIsDragging(true);
		setDragStart({ x: e.clientX - crop.x, y: e.clientY - crop.y });
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isDragging || !imageRef.current) return;

		const rect = imageRef.current.getBoundingClientRect();
		const newX = Math.max(
			0,
			Math.min(e.clientX - dragStart.x, rect.width - crop.width)
		);
		const newY = Math.max(
			0,
			Math.min(e.clientY - dragStart.y, rect.height - crop.height)
		);

		setCrop((prev) => ({ ...prev, x: newX, y: newY }));
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	const handleCrop = () => {
		if (!canvasRef.current || !imageRef.current) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");
		const image = imageRef.current;

		if (!ctx) return;

		// Set canvas size to crop size
		canvas.width = crop.width;
		canvas.height = crop.height;

		// Draw the cropped portion
		ctx.drawImage(
			image,
			crop.x,
			crop.y,
			crop.width,
			crop.height,
			0,
			0,
			crop.width,
			crop.height
		);

		// Convert to blob
		canvas.toBlob(
			(blob) => {
				if (blob) {
					onCropComplete(blob);
				}
			},
			"image/jpeg",
			0.9
		);
	};

	return (
		<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
			<div className='bg-white p-6 rounded-lg max-w-2xl max-h-[90vh] overflow-auto'>
				<h3 className='text-lg font-semibold mb-4'>Crop Thumbnail (Square)</h3>

				<div className='relative inline-block'>
					<img
						ref={imageRef}
						src={imageSrc}
						alt='Crop preview'
						className='max-w-full max-h-96'
						onMouseMove={handleMouseMove}
						onMouseUp={handleMouseUp}
						onMouseLeave={handleMouseUp}
					/>

					{/* Crop overlay */}
					<div
						className='absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 cursor-move'
						style={{
							left: crop.x,
							top: crop.y,
							width: crop.width,
							height: crop.height,
						}}
						onMouseDown={handleMouseDown}>
						{/* Resize handles */}
						<div className='absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 cursor-se-resize'></div>
					</div>
				</div>

				<canvas ref={canvasRef} className='hidden' />

				<div className='flex justify-end gap-2 mt-4'>
					<Button type='button' variant='outline' onClick={onCancel}>
						Cancel
					</Button>
					<Button type='button' onClick={handleCrop}>
						Crop & Upload
					</Button>
				</div>
			</div>
		</div>
	);
}

interface ExerciseFormProps {
	exercise?: {
		id: string;
		name: string;
		description: string;
		instructions: string;
		category: string;
		subcategory: string | null;
		muscleGroups: string[];
		equipment: string[];
		difficultyLevel: number;
		baseTimePerSet: number;
		baseRestTime: number;
		defaultSets: number;
		defaultReps: number | null;
		defaultDuration: number | null;
		exerciseType: string;
		movementPattern: string | null;
		progressionType: string;
		imageUrl: string | null;
		videoUrl: string | null;
		videoUrlDark: string | null;
		thumbnailUrl: string | null;
		isActive: boolean;
		tags: string[] | null;
	};
	isEditing?: boolean;
}

const CATEGORIES = [
	"chest",
	"back",
	"legs",
	"shoulders",
	"arms",
	"core",
	"cardio",
];

const EXERCISE_TYPES = ["compound", "isolation", "cardio", "plyometric"];

const MOVEMENT_PATTERNS = ["push", "pull", "squat", "hinge", "lunge", "carry"];

const PROGRESSION_TYPES = ["weight", "reps", "time", "difficulty"];

const COMMON_MUSCLE_GROUPS = [
	"chest",
	"back",
	"shoulders",
	"biceps",
	"triceps",
	"forearms",
	"core",
	"abs",
	"obliques",
	"quads",
	"hamstrings",
	"glutes",
	"calves",
	"traps",
	"lats",
	"delts",
];

const COMMON_EQUIPMENT = [
	"barbell",
	"dumbbells",
	"kettlebell",
	"resistance_bands",
	"pull_up_bar",
	"bench",
	"squat_rack",
	"cable_machine",
	"smith_machine",
	"leg_press",
	"treadmill",
	"rowing_machine",
	"bodyweight",
	"medicine_ball",
	"bosu_ball",
	"stability_ball",
];

export function ExerciseForm({
	exercise,
	isEditing = false,
}: ExerciseFormProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	// Form state
	const [formData, setFormData] = useState({
		name: exercise?.name || "",
		description: exercise?.description || "",
		instructions: exercise?.instructions || "",
		category: exercise?.category || "",
		subcategory: exercise?.subcategory || "",
		difficultyLevel: exercise?.difficultyLevel || 1,
		baseTimePerSet: exercise?.baseTimePerSet || 60,
		baseRestTime: exercise?.baseRestTime || 90,
		defaultSets: exercise?.defaultSets || 3,
		defaultReps: exercise?.defaultReps || null,
		defaultDuration: exercise?.defaultDuration || null,
		exerciseType: exercise?.exerciseType || "",
		movementPattern: exercise?.movementPattern || "",
		progressionType: exercise?.progressionType || "",
		imageUrl: exercise?.imageUrl || "",
		videoUrl: exercise?.videoUrl || "",
		videoUrlDark: exercise?.videoUrlDark || "",
		thumbnailUrl: exercise?.thumbnailUrl || "",
		isActive: exercise?.isActive ?? true,
	});

	const [muscleGroups, setMuscleGroups] = useState<string[]>(
		exercise?.muscleGroups || []
	);
	const [equipment, setEquipment] = useState<string[]>(
		exercise?.equipment || []
	);
	const [tags, setTags] = useState<string[]>(exercise?.tags || []);
	const [newMuscleGroup, setNewMuscleGroup] = useState("");
	const [newEquipment, setNewEquipment] = useState("");
	const [newTag, setNewTag] = useState("");

	// Upload states
	const [isUploadingVideo, setIsUploadingVideo] = useState(false);
	const [isUploadingVideoDark, setIsUploadingVideoDark] = useState(false);
	const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
	const [isUploadingImage, setIsUploadingImage] = useState(false);

	// Drag and drop states
	const [isDragOverVideo, setIsDragOverVideo] = useState(false);
	const [isDragOverVideoDark, setIsDragOverVideoDark] = useState(false);
	const [isDragOverThumbnail, setIsDragOverThumbnail] = useState(false);
	const [isDragOverImage, setIsDragOverImage] = useState(false);

	// Cropping state for thumbnail
	const [showCropModal, setShowCropModal] = useState(false);
	const [cropImageSrc, setCropImageSrc] = useState<string>("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const exerciseData = {
				...formData,
				muscleGroups,
				equipment,
				tags,
				defaultReps: formData.defaultReps || null,
				defaultDuration: formData.defaultDuration || null,
			};

			if (isEditing && exercise) {
				await updateExercise(exercise.id, exerciseData);
			} else {
				await createExercise(exerciseData);
			}

			router.push("/exercises");
		} catch (error) {
			console.error("Error saving exercise:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const addMuscleGroup = (group: string) => {
		if (group && !muscleGroups.includes(group)) {
			setMuscleGroups([...muscleGroups, group]);
		}
		setNewMuscleGroup("");
	};

	const removeMuscleGroup = (group: string) => {
		setMuscleGroups(muscleGroups.filter((g) => g !== group));
	};

	const addEquipment = (eq: string) => {
		if (eq && !equipment.includes(eq)) {
			setEquipment([...equipment, eq]);
		}
		setNewEquipment("");
	};

	const removeEquipment = (eq: string) => {
		setEquipment(equipment.filter((e) => e !== eq));
	};

	const addTag = (tag: string) => {
		if (tag && !tags.includes(tag)) {
			setTags([...tags, tag]);
		}
		setNewTag("");
	};

	const removeTag = (tag: string) => {
		setTags(tags.filter((t) => t !== tag));
	};

	// Video upload functions
	const handleVideoUpload = async (file: File, isDark: boolean = false) => {
		if (isDark) {
			setIsUploadingVideoDark(true);
		} else {
			setIsUploadingVideo(true);
		}

		try {
			const uploadFormData = new FormData();
			uploadFormData.append("video", file);
			uploadFormData.append("method", "direct");

			const response = await fetch("/api/admin/videos/upload", {
				method: "POST",
				body: uploadFormData,
			});

			if (!response.ok) {
				throw new Error("Failed to upload video");
			}

			const result = await response.json();

			// Update the appropriate video URL field
			if (isDark) {
				setFormData((prev) => ({ ...prev, videoUrlDark: result.url }));
			} else {
				setFormData((prev) => ({ ...prev, videoUrl: result.url }));
			}
		} catch (error) {
			console.error("Error uploading video:", error);
			alert("Failed to upload video. Please try again.");
		} finally {
			if (isDark) {
				setIsUploadingVideoDark(false);
			} else {
				setIsUploadingVideo(false);
			}
		}
	};

	const handleVideoFileChange = (
		event: React.ChangeEvent<HTMLInputElement>,
		isDark: boolean = false
	) => {
		const file = event.target.files?.[0];
		if (file) {
			handleVideoUpload(file, isDark);
		}
	};

	// Image upload functions
	const handleImageUpload = async (file: File) => {
		setIsUploadingImage(true);

		try {
			const uploadFormData = new FormData();
			uploadFormData.append("image", file);

			const response = await fetch("/api/admin/images/upload", {
				method: "POST",
				body: uploadFormData,
			});

			if (!response.ok) {
				throw new Error("Failed to upload image");
			}

			const result = await response.json();

			// Update the image URL field
			setFormData((prev) => ({ ...prev, imageUrl: result.url }));
		} catch (error) {
			console.error("Error uploading image:", error);
			alert("Failed to upload image. Please try again.");
		} finally {
			setIsUploadingImage(false);
		}
	};

	const handleImageFileChange = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (file) {
			handleImageUpload(file);
		}
	};

	// Thumbnail upload with cropping
	const handleThumbnailFileChange = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (file) {
			// Create object URL for cropping
			const imageUrl = URL.createObjectURL(file);
			setCropImageSrc(imageUrl);
			setShowCropModal(true);
		}
	};

	const handleCropComplete = async (croppedImageBlob: Blob) => {
		setIsUploadingThumbnail(true);
		setShowCropModal(false);

		try {
			const uploadFormData = new FormData();
			uploadFormData.append("image", croppedImageBlob, "thumbnail.jpg");

			const response = await fetch("/api/admin/images/upload", {
				method: "POST",
				body: uploadFormData,
			});

			if (!response.ok) {
				throw new Error("Failed to upload thumbnail");
			}

			const result = await response.json();

			// Update the thumbnail URL field
			setFormData((prev) => ({ ...prev, thumbnailUrl: result.url }));
		} catch (error) {
			console.error("Error uploading thumbnail:", error);
			alert("Failed to upload thumbnail. Please try again.");
		} finally {
			setIsUploadingThumbnail(false);
			// Clean up object URL
			if (cropImageSrc) {
				URL.revokeObjectURL(cropImageSrc);
			}
			setCropImageSrc("");
		}
	};

	const handleCropCancel = () => {
		setShowCropModal(false);
		// Clean up object URL
		if (cropImageSrc) {
			URL.revokeObjectURL(cropImageSrc);
		}
		setCropImageSrc("");
	};

	// Drag and drop handlers
	const createDragHandlers = (
		setIsDragOver: (value: boolean) => void,
		onFileUpload: (file: File) => void,
		acceptedTypes: string[]
	) => ({
		onDragEnter: (e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragOver(true);
		},
		onDragLeave: (e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			// Only set to false if we're leaving the drop zone entirely
			if (!e.currentTarget.contains(e.relatedTarget as Node)) {
				setIsDragOver(false);
			}
		},
		onDragOver: (e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
		},
		onDrop: (e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragOver(false);

			const files = Array.from(e.dataTransfer.files);
			const validFile = files.find((file) =>
				acceptedTypes.some((type) => file.type.startsWith(type))
			);

			if (validFile) {
				onFileUpload(validFile);
			} else {
				alert(
					`Please drop a valid file. Accepted types: ${acceptedTypes.join(", ")}`
				);
			}
		},
	});

	const videoDragHandlers = createDragHandlers(
		setIsDragOverVideo,
		(file) => handleVideoUpload(file, false),
		["video/"]
	);

	const videoDarkDragHandlers = createDragHandlers(
		setIsDragOverVideoDark,
		(file) => handleVideoUpload(file, true),
		["video/"]
	);

	const imageDragHandlers = createDragHandlers(
		setIsDragOverImage,
		handleImageUpload,
		["image/"]
	);

	const thumbnailDragHandlers = createDragHandlers(
		setIsDragOverThumbnail,
		(file) => {
			const imageUrl = URL.createObjectURL(file);
			setCropImageSrc(imageUrl);
			setShowCropModal(true);
		},
		["image/"]
	);

	return (
		<form onSubmit={handleSubmit} className='space-y-6'>
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
				{/* Basic Information */}
				<Card>
					<CardHeader>
						<CardTitle>Basic Information</CardTitle>
						<CardDescription>
							Essential exercise details and description
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div>
							<Label htmlFor='name'>Exercise Name</Label>
							<Input
								id='name'
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder='e.g., Barbell Bench Press'
								required
							/>
						</div>

						<div>
							<Label htmlFor='description'>Description</Label>
							<Textarea
								id='description'
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
								placeholder='Brief description of the exercise'
								required
							/>
						</div>

						<div>
							<Label htmlFor='instructions'>Instructions</Label>
							<Textarea
								id='instructions'
								value={formData.instructions}
								onChange={(e) =>
									setFormData({ ...formData, instructions: e.target.value })
								}
								placeholder='Step-by-step instructions for performing the exercise'
								rows={4}
								required
							/>
						</div>

						<div className='flex items-center space-x-2'>
							<Switch
								id='isActive'
								checked={formData.isActive}
								onCheckedChange={(checked) =>
									setFormData({ ...formData, isActive: checked })
								}
							/>
							<Label htmlFor='isActive'>Active</Label>
						</div>
					</CardContent>
				</Card>

				{/* Categorization */}
				<Card>
					<CardHeader>
						<CardTitle>Categorization</CardTitle>
						<CardDescription>
							Exercise category, type, and movement patterns
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div>
							<Label htmlFor='category'>Category</Label>
							<Select
								value={formData.category}
								onValueChange={(value) =>
									setFormData({ ...formData, category: value })
								}>
								<SelectTrigger>
									<SelectValue placeholder='Select category' />
								</SelectTrigger>
								<SelectContent>
									{CATEGORIES.map((category) => (
										<SelectItem key={category} value={category}>
											{category.charAt(0).toUpperCase() + category.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label htmlFor='subcategory'>Subcategory (Optional)</Label>
							<Input
								id='subcategory'
								value={formData.subcategory}
								onChange={(e) =>
									setFormData({ ...formData, subcategory: e.target.value })
								}
								placeholder='e.g., upper_chest, lower_back'
							/>
						</div>

						<div>
							<Label htmlFor='exerciseType'>Exercise Type</Label>
							<Select
								value={formData.exerciseType}
								onValueChange={(value) =>
									setFormData({ ...formData, exerciseType: value })
								}>
								<SelectTrigger>
									<SelectValue placeholder='Select exercise type' />
								</SelectTrigger>
								<SelectContent>
									{EXERCISE_TYPES.map((type) => (
										<SelectItem key={type} value={type}>
											{type.charAt(0).toUpperCase() + type.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label htmlFor='movementPattern'>Movement Pattern</Label>
							<Select
								value={formData.movementPattern}
								onValueChange={(value) =>
									setFormData({ ...formData, movementPattern: value })
								}>
								<SelectTrigger>
									<SelectValue placeholder='Select movement pattern' />
								</SelectTrigger>
								<SelectContent>
									{MOVEMENT_PATTERNS.map((pattern) => (
										<SelectItem key={pattern} value={pattern}>
											{pattern.charAt(0).toUpperCase() + pattern.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label htmlFor='progressionType'>Progression Type</Label>
							<Select
								value={formData.progressionType}
								onValueChange={(value) =>
									setFormData({ ...formData, progressionType: value })
								}>
								<SelectTrigger>
									<SelectValue placeholder='Select progression type' />
								</SelectTrigger>
								<SelectContent>
									{PROGRESSION_TYPES.map((type) => (
										<SelectItem key={type} value={type}>
											{type.charAt(0).toUpperCase() + type.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label htmlFor='difficultyLevel'>Difficulty Level (1-10)</Label>
							<Input
								id='difficultyLevel'
								type='number'
								min='1'
								max='10'
								value={formData.difficultyLevel}
								onChange={(e) =>
									setFormData({
										...formData,
										difficultyLevel: parseInt(e.target.value) || 1,
									})
								}
								required
							/>
						</div>
					</CardContent>
				</Card>

				{/* Muscle Groups */}
				<Card>
					<CardHeader>
						<CardTitle>Muscle Groups</CardTitle>
						<CardDescription>
							Target muscle groups for this exercise
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='flex flex-wrap gap-2'>
							{muscleGroups.map((group) => (
								<Badge
									key={group}
									variant='secondary'
									className='flex items-center gap-1'>
									{group}
									<X
										className='h-3 w-3 cursor-pointer'
										onClick={() => removeMuscleGroup(group)}
									/>
								</Badge>
							))}
						</div>

						<div className='flex gap-2'>
							<Select value={newMuscleGroup} onValueChange={setNewMuscleGroup}>
								<SelectTrigger className='flex-1'>
									<SelectValue placeholder='Select muscle group' />
								</SelectTrigger>
								<SelectContent>
									{COMMON_MUSCLE_GROUPS.filter(
										(group) => !muscleGroups.includes(group)
									).map((group) => (
										<SelectItem key={group} value={group}>
											{group.charAt(0).toUpperCase() + group.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button
								type='button'
								onClick={() => addMuscleGroup(newMuscleGroup)}
								disabled={!newMuscleGroup}>
								Add
							</Button>
						</div>

						<div className='flex gap-2'>
							<Input
								placeholder='Custom muscle group'
								value={newMuscleGroup}
								onChange={(e) => setNewMuscleGroup(e.target.value)}
								onKeyPress={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										addMuscleGroup(newMuscleGroup);
									}
								}}
							/>
							<Button
								type='button'
								onClick={() => addMuscleGroup(newMuscleGroup)}
								disabled={!newMuscleGroup}>
								Add
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Equipment */}
				<Card>
					<CardHeader>
						<CardTitle>Equipment</CardTitle>
						<CardDescription>
							Required equipment for this exercise
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='flex flex-wrap gap-2'>
							{equipment.map((eq) => (
								<Badge
									key={eq}
									variant='secondary'
									className='flex items-center gap-1'>
									{eq.replace("_", " ")}
									<X
										className='h-3 w-3 cursor-pointer'
										onClick={() => removeEquipment(eq)}
									/>
								</Badge>
							))}
						</div>

						<div className='flex gap-2'>
							<Select value={newEquipment} onValueChange={setNewEquipment}>
								<SelectTrigger className='flex-1'>
									<SelectValue placeholder='Select equipment' />
								</SelectTrigger>
								<SelectContent>
									{COMMON_EQUIPMENT.filter((eq) => !equipment.includes(eq)).map(
										(eq) => (
											<SelectItem key={eq} value={eq}>
												{eq.replace("_", " ").charAt(0).toUpperCase() +
													eq.replace("_", " ").slice(1)}
											</SelectItem>
										)
									)}
								</SelectContent>
							</Select>
							<Button
								type='button'
								onClick={() => addEquipment(newEquipment)}
								disabled={!newEquipment}>
								Add
							</Button>
						</div>

						<div className='flex gap-2'>
							<Input
								placeholder='Custom equipment'
								value={newEquipment}
								onChange={(e) => setNewEquipment(e.target.value)}
								onKeyPress={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										addEquipment(newEquipment);
									}
								}}
							/>
							<Button
								type='button'
								onClick={() => addEquipment(newEquipment)}
								disabled={!newEquipment}>
								Add
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Exercise Parameters */}
				<Card>
					<CardHeader>
						<CardTitle>Exercise Parameters</CardTitle>
						<CardDescription>
							Default sets, reps, timing, and rest periods
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='grid grid-cols-2 gap-4'>
							<div>
								<Label htmlFor='defaultSets'>Default Sets</Label>
								<Input
									id='defaultSets'
									type='number'
									min='1'
									value={formData.defaultSets}
									onChange={(e) =>
										setFormData({
											...formData,
											defaultSets: parseInt(e.target.value) || 1,
										})
									}
									required
								/>
							</div>

							<div>
								<Label htmlFor='defaultReps'>Default Reps (Optional)</Label>
								<Input
									id='defaultReps'
									type='number'
									min='1'
									value={formData.defaultReps || ""}
									onChange={(e) =>
										setFormData({
											...formData,
											defaultReps: e.target.value
												? parseInt(e.target.value)
												: null,
										})
									}
									placeholder='For rep-based exercises'
								/>
							</div>
						</div>

						<div>
							<Label htmlFor='defaultDuration'>
								Default Duration (seconds, optional)
							</Label>
							<Input
								id='defaultDuration'
								type='number'
								min='1'
								value={formData.defaultDuration || ""}
								onChange={(e) =>
									setFormData({
										...formData,
										defaultDuration: e.target.value
											? parseInt(e.target.value)
											: null,
									})
								}
								placeholder='For time-based exercises'
							/>
						</div>

						<div className='grid grid-cols-2 gap-4'>
							<div>
								<Label htmlFor='baseTimePerSet'>Time Per Set (seconds)</Label>
								<Input
									id='baseTimePerSet'
									type='number'
									min='1'
									value={formData.baseTimePerSet}
									onChange={(e) =>
										setFormData({
											...formData,
											baseTimePerSet: parseInt(e.target.value) || 60,
										})
									}
									required
								/>
							</div>

							<div>
								<Label htmlFor='baseRestTime'>Rest Time (seconds)</Label>
								<Input
									id='baseRestTime'
									type='number'
									min='1'
									value={formData.baseRestTime}
									onChange={(e) =>
										setFormData({
											...formData,
											baseRestTime: parseInt(e.target.value) || 90,
										})
									}
									required
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Media & Tags */}
				<Card>
					<CardHeader>
						<CardTitle>Media & Tags</CardTitle>
						<CardDescription>
							Images, videos, and tags for the exercise
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div>
							<Label htmlFor='imageUrl'>Image URL</Label>
							<div className='flex gap-2'>
								<Input
									id='imageUrl'
									type='url'
									value={formData.imageUrl}
									onChange={(e) =>
										setFormData({ ...formData, imageUrl: e.target.value })
									}
									placeholder='https://example.com/exercise-image.jpg'
								/>
								<div className='relative' {...imageDragHandlers}>
									<input
										type='file'
										accept='image/*'
										onChange={handleImageFileChange}
										className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
										disabled={isUploadingImage}
									/>
									<Button
										type='button'
										variant='outline'
										disabled={isUploadingImage}
										className={`whitespace-nowrap transition-colors ${
											isDragOverImage ? "bg-blue-50 border-blue-300" : ""
										}`}>
										{isUploadingImage ? (
											<>
												<Loader2 className='h-4 w-4 animate-spin mr-2' />
												Uploading...
											</>
										) : (
											<>
												<Upload className='h-4 w-4 mr-2' />
												{isDragOverImage ? "Drop image here" : "Upload"}
											</>
										)}
									</Button>
								</div>
							</div>
						</div>

						<div>
							<Label htmlFor='videoUrl'>Video URL (Light Mode)</Label>
							<div className='flex gap-2'>
								<Input
									id='videoUrl'
									type='url'
									value={formData.videoUrl}
									onChange={(e) =>
										setFormData({ ...formData, videoUrl: e.target.value })
									}
									placeholder='https://example.com/exercise-video.mp4'
								/>
								<div className='relative' {...videoDragHandlers}>
									<input
										type='file'
										accept='video/*'
										onChange={(e) => handleVideoFileChange(e, false)}
										className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
										disabled={isUploadingVideo}
									/>
									<Button
										type='button'
										variant='outline'
										disabled={isUploadingVideo}
										className={`whitespace-nowrap transition-colors ${
											isDragOverVideo ? "bg-blue-50 border-blue-300" : ""
										}`}>
										{isUploadingVideo ? (
											<>
												<Loader2 className='h-4 w-4 animate-spin mr-2' />
												Uploading...
											</>
										) : (
											<>
												<Upload className='h-4 w-4 mr-2' />
												{isDragOverVideo ? "Drop video here" : "Upload"}
											</>
										)}
									</Button>
								</div>
							</div>
						</div>

						<div>
							<Label htmlFor='videoUrlDark'>
								Video URL (Dark Mode - Optional)
							</Label>
							<div className='flex gap-2'>
								<Input
									id='videoUrlDark'
									type='url'
									value={formData.videoUrlDark}
									onChange={(e) =>
										setFormData({ ...formData, videoUrlDark: e.target.value })
									}
									placeholder='https://example.com/exercise-video-dark.mp4'
								/>
								<div className='relative' {...videoDarkDragHandlers}>
									<input
										type='file'
										accept='video/*'
										onChange={(e) => handleVideoFileChange(e, true)}
										className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
										disabled={isUploadingVideoDark}
									/>
									<Button
										type='button'
										variant='outline'
										disabled={isUploadingVideoDark}
										className={`whitespace-nowrap transition-colors ${
											isDragOverVideoDark ? "bg-blue-50 border-blue-300" : ""
										}`}>
										{isUploadingVideoDark ? (
											<>
												<Loader2 className='h-4 w-4 animate-spin mr-2' />
												Uploading...
											</>
										) : (
											<>
												<Upload className='h-4 w-4 mr-2' />
												{isDragOverVideoDark ? "Drop video here" : "Upload"}
											</>
										)}
									</Button>
								</div>
							</div>
						</div>

						<div>
							<Label htmlFor='thumbnailUrl'>Thumbnail URL</Label>
							<div className='flex gap-2'>
								<Input
									id='thumbnailUrl'
									type='url'
									value={formData.thumbnailUrl}
									onChange={(e) =>
										setFormData({ ...formData, thumbnailUrl: e.target.value })
									}
									placeholder='https://example.com/exercise-thumbnail.jpg'
								/>
								<div className='relative' {...thumbnailDragHandlers}>
									<input
										type='file'
										accept='image/*'
										onChange={handleThumbnailFileChange}
										className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
										disabled={isUploadingThumbnail}
									/>
									<Button
										type='button'
										variant='outline'
										disabled={isUploadingThumbnail}
										className={`whitespace-nowrap transition-colors ${
											isDragOverThumbnail ? "bg-blue-50 border-blue-300" : ""
										}`}>
										{isUploadingThumbnail ? (
											<>
												<Loader2 className='h-4 w-4 animate-spin mr-2' />
												Uploading...
											</>
										) : (
											<>
												<Upload className='h-4 w-4 mr-2' />
												{isDragOverThumbnail
													? "Drop image here"
													: "Upload & Crop"}
											</>
										)}
									</Button>
								</div>
							</div>
						</div>

						<div>
							<Label>Tags</Label>
							<div className='flex flex-wrap gap-2 mb-2'>
								{tags.map((tag) => (
									<Badge
										key={tag}
										variant='outline'
										className='flex items-center gap-1'>
										{tag}
										<X
											className='h-3 w-3 cursor-pointer'
											onClick={() => removeTag(tag)}
										/>
									</Badge>
								))}
							</div>
							<div className='flex gap-2'>
								<Input
									placeholder='Add tag (e.g., beginner_friendly, home_workout)'
									value={newTag}
									onChange={(e) => setNewTag(e.target.value)}
									onKeyPress={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											addTag(newTag);
										}
									}}
								/>
								<Button
									type='button'
									onClick={() => addTag(newTag)}
									disabled={!newTag}>
									Add
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className='flex justify-end gap-4'>
				<Button
					type='button'
					variant='outline'
					onClick={() => router.push("/exercises")}>
					Cancel
				</Button>
				<Button type='submit' disabled={isLoading}>
					{isLoading
						? "Saving..."
						: isEditing
							? "Update Exercise"
							: "Create Exercise"}
				</Button>
			</div>

			{/* Crop Modal */}
			{showCropModal && (
				<ImageCropModal
					imageSrc={cropImageSrc}
					onCropComplete={handleCropComplete}
					onCancel={handleCropCancel}
				/>
			)}
		</form>
	);
}
