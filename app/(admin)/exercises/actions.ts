"use server";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { checkAdminAccess } from "@/app/actions/user-helpers";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { eq, count } from "drizzle-orm";

interface CreateExerciseData {
	name: string;
	description: string;
	instructions: string;
	// Multi-language support
	nameEn?: string;
	descriptionEn?: string;
	instructionsEn?: string;
	nameNo?: string;
	descriptionNo?: string;
	instructionsNo?: string;
	nameEs?: string;
	descriptionEs?: string;
	instructionsEs?: string;
	nameDe?: string;
	descriptionDe?: string;
	instructionsDe?: string;
	category: string;
	subcategory?: string;
	muscleGroups: string[];
	equipment: string[];
	difficultyLevel: number;
	baseTimePerSet: number;
	baseRestTime: number;
	defaultSets: number;
	defaultReps: number | null;
	defaultDuration: number | null;
	exerciseType: string;
	movementPattern?: string;
	progressionType: string;
	imageUrl?: string;
	videoUrl?: string;
	videoUrlDark?: string;
	thumbnailUrl?: string;
	isActive: boolean;
	tags?: string[];
}

export async function createExercise(data: CreateExerciseData) {
	// Check admin access
	await checkAdminAccess();

	try {
		const exerciseId = nanoid();

		await db.insert(schema.exercises).values({
			id: exerciseId,
			name: data.name,
			description: data.description,
			instructions: data.instructions,
			// Multi-language support
			nameEn: data.nameEn || null,
			descriptionEn: data.descriptionEn || null,
			instructionsEn: data.instructionsEn || null,
			nameNo: data.nameNo || null,
			descriptionNo: data.descriptionNo || null,
			instructionsNo: data.instructionsNo || null,
			nameEs: data.nameEs || null,
			descriptionEs: data.descriptionEs || null,
			instructionsEs: data.instructionsEs || null,
			nameDe: data.nameDe || null,
			descriptionDe: data.descriptionDe || null,
			instructionsDe: data.instructionsDe || null,
			category: data.category,
			subcategory: data.subcategory || null,
			muscleGroups: data.muscleGroups,
			equipment: data.equipment,
			difficultyLevel: data.difficultyLevel,
			baseTimePerSet: data.baseTimePerSet,
			baseRestTime: data.baseRestTime,
			defaultSets: data.defaultSets,
			defaultReps: data.defaultReps,
			defaultDuration: data.defaultDuration,
			exerciseType: data.exerciseType,
			movementPattern: data.movementPattern || null,
			progressionType: data.progressionType,
			scalingFactors: null, // TODO: Implement scaling factors
			imageUrl: data.imageUrl || null,
			videoUrl: data.videoUrl || null,
			videoUrlDark: data.videoUrlDark || null,
			thumbnailUrl: data.thumbnailUrl || null,
			isActive: data.isActive,
			createdBy: null, // TODO: Get current admin user ID
			tags: data.tags || null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		revalidatePath("/admin/exercises");
		return { success: true, exerciseId };
	} catch (error) {
		console.error("Error creating exercise:", error);
		throw new Error("Failed to create exercise");
	}
}

export async function updateExercise(
	exerciseId: string,
	data: CreateExerciseData
) {
	// Check admin access
	await checkAdminAccess();

	try {
		await db
			.update(schema.exercises)
			.set({
				name: data.name,
				description: data.description,
				instructions: data.instructions,
				// Multi-language support
				nameEn: data.nameEn || null,
				descriptionEn: data.descriptionEn || null,
				instructionsEn: data.instructionsEn || null,
				nameNo: data.nameNo || null,
				descriptionNo: data.descriptionNo || null,
				instructionsNo: data.instructionsNo || null,
				nameEs: data.nameEs || null,
				descriptionEs: data.descriptionEs || null,
				instructionsEs: data.instructionsEs || null,
				nameDe: data.nameDe || null,
				descriptionDe: data.descriptionDe || null,
				instructionsDe: data.instructionsDe || null,
				category: data.category,
				subcategory: data.subcategory || null,
				muscleGroups: data.muscleGroups,
				equipment: data.equipment,
				difficultyLevel: data.difficultyLevel,
				baseTimePerSet: data.baseTimePerSet,
				baseRestTime: data.baseRestTime,
				defaultSets: data.defaultSets,
				defaultReps: data.defaultReps,
				defaultDuration: data.defaultDuration,
				exerciseType: data.exerciseType,
				movementPattern: data.movementPattern || null,
				progressionType: data.progressionType,
				imageUrl: data.imageUrl || null,
				videoUrl: data.videoUrl || null,
				videoUrlDark: data.videoUrlDark || null,
				thumbnailUrl: data.thumbnailUrl || null,
				isActive: data.isActive,
				tags: data.tags || null,
				updatedAt: new Date(),
			})
			.where(eq(schema.exercises.id, exerciseId));

		revalidatePath("/admin/exercises");
		revalidatePath(`/admin/exercises/${exerciseId}`);
		return { success: true };
	} catch (error) {
		console.error("Error updating exercise:", error);
		throw new Error("Failed to update exercise");
	}
}

export async function deleteExercise(exerciseId: string) {
	// Check admin access
	await checkAdminAccess();

	try {
		// Check if exercise is being used by any users
		const [userExerciseCount] = await db
			.select({ count: count() })
			.from(schema.userExercises)
			.where(eq(schema.userExercises.exerciseId, exerciseId));

		if (userExerciseCount.count > 0) {
			throw new Error(
				"Cannot delete exercise that is currently assigned to users. Deactivate it instead."
			);
		}

		await db
			.delete(schema.exercises)
			.where(eq(schema.exercises.id, exerciseId));

		revalidatePath("/admin/exercises");
		return { success: true };
	} catch (error) {
		console.error("Error deleting exercise:", error);
		throw new Error(
			error instanceof Error ? error.message : "Failed to delete exercise"
		);
	}
}

export async function toggleExerciseStatus(
	exerciseId: string,
	isActive: boolean
) {
	// Check admin access
	await checkAdminAccess();

	try {
		await db
			.update(schema.exercises)
			.set({
				isActive,
				updatedAt: new Date(),
			})
			.where(eq(schema.exercises.id, exerciseId));

		revalidatePath("/admin/exercises");
		revalidatePath(`/admin/exercises/${exerciseId}`);
		return { success: true };
	} catch (error) {
		console.error("Error toggling exercise status:", error);
		throw new Error("Failed to update exercise status");
	}
}

// Seed function to populate initial exercises
export async function seedExercises() {
	// Check admin access
	await checkAdminAccess();

	const sampleExercises = [
		{
			name: "Barbell Bench Press",
			description: "Classic chest exercise using a barbell on a bench",
			instructions:
				"1. Lie on bench with feet flat on floor\n2. Grip barbell slightly wider than shoulder width\n3. Lower bar to chest with control\n4. Press bar up explosively\n5. Repeat for desired reps",
			nameEn: "Barbell Bench Press",
			descriptionEn: "Classic chest exercise using a barbell on a bench",
			instructionsEn:
				"1. Lie on bench with feet flat on floor\n2. Grip barbell slightly wider than shoulder width\n3. Lower bar to chest with control\n4. Press bar up explosively\n5. Repeat for desired reps",
			nameNo: "Benkpress med Stang",
			descriptionNo: "Klassisk brystøvelse med stang på benk",
			instructionsNo:
				"1. Ligg på benken med føttene flatt på gulvet\n2. Grip stangen litt bredere enn skulderbredde\n3. Senk stangen til brystet med kontroll\n4. Press stangen opp eksplosivt\n5. Gjenta for ønsket antall repetisjoner",
			nameEs: "Press de Banca con Barra",
			descriptionEs: "Ejercicio clásico de pecho usando una barra en banco",
			instructionsEs:
				"1. Acuéstate en el banco con los pies planos en el suelo\n2. Agarra la barra un poco más ancha que el ancho de los hombros\n3. Baja la barra al pecho con control\n4. Presiona la barra hacia arriba explosivamente\n5. Repite para las repeticiones deseadas",
			nameDe: "Bankdrücken mit Langhantel",
			descriptionDe: "Klassische Brustübung mit Langhantel auf der Bank",
			instructionsDe:
				"1. Lege dich auf die Bank mit den Füßen flach auf dem Boden\n2. Greife die Stange etwas breiter als schulterbreit\n3. Senke die Stange kontrolliert zur Brust\n4. Drücke die Stange explosiv nach oben\n5. Wiederhole für die gewünschte Anzahl von Wiederholungen",
			category: "chest",
			subcategory: "upper_chest",
			muscleGroups: ["chest", "triceps", "shoulders"],
			equipment: ["barbell", "bench"],
			difficultyLevel: 6,
			baseTimePerSet: 90,
			baseRestTime: 120,
			defaultSets: 3,
			defaultReps: 8,
			defaultDuration: null,
			exerciseType: "compound",
			movementPattern: "push",
			progressionType: "weight",
			isActive: true,
			tags: ["compound", "strength", "upper_body"],
		},
		{
			name: "Deadlift",
			description: "Full body compound movement lifting weight from the floor",
			instructions:
				"1. Stand with feet hip-width apart, bar over mid-foot\n2. Bend at hips and knees to grip bar\n3. Keep chest up, shoulders back\n4. Drive through heels to stand up\n5. Lower bar with control",
			nameEn: "Deadlift",
			descriptionEn:
				"Full body compound movement lifting weight from the floor",
			instructionsEn:
				"1. Stand with feet hip-width apart, bar over mid-foot\n2. Bend at hips and knees to grip bar\n3. Keep chest up, shoulders back\n4. Drive through heels to stand up\n5. Lower bar with control",
			nameNo: "Markløft",
			descriptionNo: "Helkroppsøvelse som løfter vekt fra gulvet",
			instructionsNo:
				"1. Stå med føttene hoftebredde fra hverandre, stang over midtfoten\n2. Bøy i hofter og knær for å gripe stangen\n3. Hold brystet oppe, skuldrene tilbake\n4. Kjør gjennom hælene for å reise deg opp\n5. Senk stangen med kontroll",
			nameEs: "Peso Muerto",
			descriptionEs:
				"Movimiento compuesto de cuerpo completo levantando peso del suelo",
			instructionsEs:
				"1. Párate con los pies separados al ancho de las caderas, barra sobre el medio del pie\n2. Dobla las caderas y rodillas para agarrar la barra\n3. Mantén el pecho arriba, hombros hacia atrás\n4. Empuja a través de los talones para ponerte de pie\n5. Baja la barra con control",
			nameDe: "Kreuzheben",
			descriptionDe: "Ganzkörper-Verbundübung zum Heben von Gewicht vom Boden",
			instructionsDe:
				"1. Stehe mit hüftbreiten Füßen, Stange über dem Mittelfuß\n2. Beuge Hüften und Knie, um die Stange zu greifen\n3. Halte die Brust oben, Schultern zurück\n4. Drücke durch die Fersen, um aufzustehen\n5. Senke die Stange kontrolliert ab",
			category: "back",
			subcategory: "lower_back",
			muscleGroups: ["back", "glutes", "hamstrings", "traps"],
			equipment: ["barbell"],
			difficultyLevel: 8,
			baseTimePerSet: 120,
			baseRestTime: 180,
			defaultSets: 3,
			defaultReps: 5,
			defaultDuration: null,
			exerciseType: "compound",
			movementPattern: "hinge",
			progressionType: "weight",
			isActive: true,
			tags: ["compound", "strength", "full_body"],
		},
		{
			name: "Squats",
			description: "Fundamental lower body compound movement",
			instructions:
				"1. Stand with feet shoulder-width apart\n2. Lower body by bending knees and hips\n3. Keep chest up and knees tracking over toes\n4. Descend until thighs parallel to floor\n5. Drive through heels to return to start",
			nameEn: "Squats",
			descriptionEn: "Fundamental lower body compound movement",
			instructionsEn:
				"1. Stand with feet shoulder-width apart\n2. Lower body by bending knees and hips\n3. Keep chest up and knees tracking over toes\n4. Descend until thighs parallel to floor\n5. Drive through heels to return to start",
			nameNo: "Knebøy",
			descriptionNo: "Grunnleggende sammensatt bevegelse for underkroppen",
			instructionsNo:
				"1. Stå med føttene skulderbredde fra hverandre\n2. Senk kroppen ved å bøye knær og hofter\n3. Hold brystet oppe og knærne over tærne\n4. Gå ned til lårene er parallelle med gulvet\n5. Kjør gjennom hælene for å komme tilbake til start",
			nameEs: "Sentadillas",
			descriptionEs: "Movimiento compuesto fundamental del tren inferior",
			instructionsEs:
				"1. Párate con los pies separados al ancho de los hombros\n2. Baja el cuerpo doblando rodillas y caderas\n3. Mantén el pecho arriba y las rodillas sobre los dedos de los pies\n4. Desciende hasta que los muslos estén paralelos al suelo\n5. Empuja a través de los talones para volver al inicio",
			nameDe: "Kniebeugen",
			descriptionDe: "Grundlegende Verbundübung für den Unterkörper",
			instructionsDe:
				"1. Stehe mit schulterbreit auseinander stehenden Füßen\n2. Senke den Körper durch Beugen der Knie und Hüften\n3. Halte die Brust oben und die Knie über den Zehen\n4. Gehe hinunter, bis die Oberschenkel parallel zum Boden sind\n5. Drücke durch die Fersen, um zum Start zurückzukehren",
			category: "legs",
			subcategory: "quads",
			muscleGroups: ["quads", "glutes", "hamstrings", "core"],
			equipment: ["barbell", "squat_rack"],
			difficultyLevel: 7,
			baseTimePerSet: 90,
			baseRestTime: 150,
			defaultSets: 3,
			defaultReps: 10,
			defaultDuration: null,
			exerciseType: "compound",
			movementPattern: "squat",
			progressionType: "weight",
			isActive: true,
			tags: ["compound", "strength", "lower_body"],
		},
		{
			name: "Pull-ups",
			description: "Upper body pulling exercise using body weight",
			instructions:
				"1. Hang from pull-up bar with overhand grip\n2. Pull body up until chin clears bar\n3. Lower with control to full arm extension\n4. Repeat for desired reps",
			category: "back",
			subcategory: "lats",
			muscleGroups: ["lats", "biceps", "rhomboids", "traps"],
			equipment: ["pull_up_bar"],
			difficultyLevel: 7,
			baseTimePerSet: 60,
			baseRestTime: 120,
			defaultSets: 3,
			defaultReps: 8,
			defaultDuration: null,
			exerciseType: "compound",
			movementPattern: "pull",
			progressionType: "reps",
			isActive: true,
			tags: ["bodyweight", "upper_body", "pulling"],
		},
		{
			name: "Push-ups",
			description: "Classic bodyweight pushing exercise",
			instructions:
				"1. Start in plank position with hands under shoulders\n2. Lower body until chest nearly touches floor\n3. Push back up to starting position\n4. Keep body in straight line throughout",
			category: "chest",
			subcategory: null,
			muscleGroups: ["chest", "triceps", "shoulders", "core"],
			equipment: ["bodyweight"],
			difficultyLevel: 4,
			baseTimePerSet: 45,
			baseRestTime: 60,
			defaultSets: 3,
			defaultReps: 15,
			defaultDuration: null,
			exerciseType: "compound",
			movementPattern: "push",
			progressionType: "reps",
			isActive: true,
			tags: ["bodyweight", "beginner_friendly", "home_workout"],
		},
		{
			name: "Plank",
			description: "Isometric core strengthening exercise",
			instructions:
				"1. Start in push-up position\n2. Lower to forearms\n3. Keep body in straight line from head to heels\n4. Hold position for specified time\n5. Breathe normally throughout",
			category: "core",
			subcategory: "abs",
			muscleGroups: ["core", "abs", "shoulders"],
			equipment: ["bodyweight"],
			difficultyLevel: 3,
			baseTimePerSet: 60,
			baseRestTime: 60,
			defaultSets: 3,
			defaultReps: null,
			defaultDuration: 30,
			exerciseType: "isolation",
			movementPattern: null,
			progressionType: "time",
			isActive: true,
			tags: ["bodyweight", "beginner_friendly", "core", "isometric"],
		},
		// NEW EXERCISES - Heavy Compound Movements
		{
			name: "Overhead Press",
			description:
				"Standing barbell press targeting shoulders and core stability",
			instructions:
				"1. Stand with feet shoulder-width apart, bar at shoulder height\n2. Grip bar slightly wider than shoulders\n3. Brace core and press bar straight overhead\n4. Lock out arms fully at top\n5. Lower with control to starting position",
			nameEn: "Overhead Press",
			descriptionEn:
				"Standing barbell press targeting shoulders and core stability",
			instructionsEn:
				"1. Stand with feet shoulder-width apart, bar at shoulder height\n2. Grip bar slightly wider than shoulders\n3. Brace core and press bar straight overhead\n4. Lock out arms fully at top\n5. Lower with control to starting position",
			nameNo: "Skulderpress Stående",
			descriptionNo:
				"Stående stangpress som treffer skuldre og kjernestabilitet",
			instructionsNo:
				"1. Stå med føttene skulderbredde fra hverandre, stang på skulderhøyde\n2. Grip stangen litt bredere enn skuldrene\n3. Spenn kjernen og press stangen rett opp\n4. Lås ut armene helt på toppen\n5. Senk med kontroll til startposisjon",
			nameEs: "Press Militar",
			descriptionEs:
				"Press de barra de pie dirigido a hombros y estabilidad del core",
			instructionsEs:
				"1. Párate con pies separados al ancho de hombros, barra a altura de hombros\n2. Agarra la barra un poco más ancha que los hombros\n3. Contrae el core y presiona la barra hacia arriba\n4. Bloquea los brazos completamente arriba\n5. Baja con control a la posición inicial",
			nameDe: "Schulterdrücken Stehend",
			descriptionDe:
				"Stehendes Langhanteldrücken für Schultern und Rumpfstabilität",
			instructionsDe:
				"1. Stehe mit schulterbreit auseinander stehenden Füßen, Stange auf Schulterhöhe\n2. Greife die Stange etwas breiter als die Schultern\n3. Spanne den Rumpf an und drücke die Stange gerade nach oben\n4. Strecke die Arme oben vollständig durch\n5. Senke kontrolliert zur Startposition",
			category: "shoulders",
			subcategory: "front_delts",
			muscleGroups: ["shoulders", "triceps", "core", "upper_back"],
			equipment: ["barbell", "squat_rack"],
			difficultyLevel: 7,
			baseTimePerSet: 75,
			baseRestTime: 120,
			defaultSets: 3,
			defaultReps: 6,
			defaultDuration: null,
			exerciseType: "compound",
			movementPattern: "push",
			progressionType: "weight",
			isActive: true,
			tags: ["compound", "strength", "shoulders", "core"],
		},
		{
			name: "Barbell Rows",
			description: "Bent-over rowing movement for back thickness and strength",
			instructions:
				"1. Stand with feet hip-width apart, bar in hands\n2. Hinge at hips, keep back straight\n3. Pull bar to lower chest/upper abdomen\n4. Squeeze shoulder blades together\n5. Lower with control",
			nameEn: "Barbell Rows",
			descriptionEn:
				"Bent-over rowing movement for back thickness and strength",
			instructionsEn:
				"1. Stand with feet hip-width apart, bar in hands\n2. Hinge at hips, keep back straight\n3. Pull bar to lower chest/upper abdomen\n4. Squeeze shoulder blades together\n5. Lower with control",
			nameNo: "Stangro Forover",
			descriptionNo: "Foroverböyd robevegelse for ryggtykkelse og styrke",
			instructionsNo:
				"1. Stå med føttene hoftebredde fra hverandre, stang i hendene\n2. Bøy i hoftene, hold ryggen rett\n3. Trekk stangen til nedre bryst/øvre mage\n4. Klem skulderbladene sammen\n5. Senk med kontroll",
			nameEs: "Remo con Barra",
			descriptionEs:
				"Movimiento de remo inclinado para grosor y fuerza de espalda",
			instructionsEs:
				"1. Párate con pies separados al ancho de caderas, barra en las manos\n2. Inclínate en las caderas, mantén la espalda recta\n3. Tira la barra al pecho inferior/abdomen superior\n4. Aprieta los omóplatos juntos\n5. Baja con control",
			nameDe: "Langhantelrudern",
			descriptionDe: "Vorgebeugte Ruderbewegung für Rückendicke und Kraft",
			instructionsDe:
				"1. Stehe mit hüftbreit auseinander stehenden Füßen, Stange in den Händen\n2. Beuge dich in den Hüften, halte den Rücken gerade\n3. Ziehe die Stange zur unteren Brust/oberen Bauch\n4. Drücke die Schulterblätter zusammen\n5. Senke kontrolliert ab",
			category: "back",
			subcategory: "mid_back",
			muscleGroups: ["lats", "rhomboids", "traps", "rear_delts", "biceps"],
			equipment: ["barbell"],
			difficultyLevel: 6,
			baseTimePerSet: 75,
			baseRestTime: 120,
			defaultSets: 3,
			defaultReps: 8,
			defaultDuration: null,
			exerciseType: "compound",
			movementPattern: "pull",
			progressionType: "weight",
			isActive: true,
			tags: ["compound", "strength", "back", "pulling"],
		},
		{
			name: "Romanian Deadlift",
			description: "Hip-hinge movement targeting posterior chain",
			instructions:
				"1. Hold bar with overhand grip, feet hip-width apart\n2. Keep knees slightly bent throughout\n3. Hinge at hips, push hips back\n4. Lower bar along legs until deep stretch\n5. Drive hips forward to return to start",
			nameEn: "Romanian Deadlift",
			descriptionEn: "Hip-hinge movement targeting posterior chain",
			instructionsEn:
				"1. Hold bar with overhand grip, feet hip-width apart\n2. Keep knees slightly bent throughout\n3. Hinge at hips, push hips back\n4. Lower bar along legs until deep stretch\n5. Drive hips forward to return to start",
			nameNo: "Rumensk Markløft",
			descriptionNo: "Hoftebøy-bevegelse som treffer bakre kjede",
			instructionsNo:
				"1. Hold stangen med overgrep, føtter hoftebredde fra hverandre\n2. Hold knærne lett bøyd gjennom hele bevegelsen\n3. Bøy i hoftene, skyv hoftene bakover\n4. Senk stangen langs bena til dyp strekk\n5. Kjør hoftene fremover for å komme tilbake til start",
			nameEs: "Peso Muerto Rumano",
			descriptionEs:
				"Movimiento de bisagra de cadera dirigido a la cadena posterior",
			instructionsEs:
				"1. Sostén la barra con agarre por encima, pies separados al ancho de caderas\n2. Mantén las rodillas ligeramente dobladas durante todo el movimiento\n3. Inclínate en las caderas, empuja las caderas hacia atrás\n4. Baja la barra por las piernas hasta sentir estiramiento profundo\n5. Empuja las caderas hacia adelante para volver al inicio",
			nameDe: "Rumänisches Kreuzheben",
			descriptionDe: "Hüftgelenk-Bewegung für die hintere Kette",
			instructionsDe:
				"1. Halte die Stange mit Obergriff, Füße hüftbreit auseinander\n2. Halte die Knie während der gesamten Bewegung leicht gebeugt\n3. Beuge dich in den Hüften, schiebe die Hüften nach hinten\n4. Senke die Stange entlang der Beine bis zur tiefen Dehnung\n5. Treibe die Hüften nach vorne, um zum Start zurückzukehren",
			category: "legs",
			subcategory: "hamstrings",
			muscleGroups: ["hamstrings", "glutes", "lower_back", "traps"],
			equipment: ["barbell"],
			difficultyLevel: 6,
			baseTimePerSet: 90,
			baseRestTime: 120,
			defaultSets: 3,
			defaultReps: 10,
			defaultDuration: null,
			exerciseType: "compound",
			movementPattern: "hinge",
			progressionType: "weight",
			isActive: true,
			tags: ["compound", "strength", "posterior_chain", "hamstrings"],
		},
		{
			name: "Weighted Dips",
			description: "Advanced bodyweight pushing exercise with added resistance",
			instructions:
				"1. Position hands on parallel bars or dip station\n2. Start with arms extended, body upright\n3. Lower body by bending elbows\n4. Descend until shoulders below elbows\n5. Press back up to starting position",
			nameEn: "Weighted Dips",
			descriptionEn:
				"Advanced bodyweight pushing exercise with added resistance",
			instructionsEn:
				"1. Position hands on parallel bars or dip station\n2. Start with arms extended, body upright\n3. Lower body by bending elbows\n4. Descend until shoulders below elbows\n5. Press back up to starting position",
			nameNo: "Dips med Vekt",
			descriptionNo: "Avansert kroppsvekt-pressøvelse med tillagt motstand",
			instructionsNo:
				"1. Plasser hendene på parallelle stenger eller dip-stasjon\n2. Start med armene strukket, kroppen oppreist\n3. Senk kroppen ved å bøye albuene\n4. Gå ned til skuldrene er under albuene\n5. Press tilbake opp til startposisjon",
			nameEs: "Fondos con Peso",
			descriptionEs:
				"Ejercicio avanzado de empuje corporal con resistencia añadida",
			instructionsEs:
				"1. Coloca las manos en barras paralelas o estación de fondos\n2. Comienza con brazos extendidos, cuerpo erguido\n3. Baja el cuerpo doblando los codos\n4. Desciende hasta que los hombros estén debajo de los codos\n5. Presiona de vuelta a la posición inicial",
			nameDe: "Gewichtete Dips",
			descriptionDe:
				"Fortgeschrittene Körpergewicht-Drückübung mit zusätzlichem Widerstand",
			instructionsDe:
				"1. Positioniere die Hände an Parallelstangen oder Dip-Station\n2. Beginne mit gestreckten Armen, Körper aufrecht\n3. Senke den Körper durch Beugen der Ellbogen\n4. Gehe hinunter, bis die Schultern unter den Ellbogen sind\n5. Drücke zurück zur Startposition",
			category: "chest",
			subcategory: "lower_chest",
			muscleGroups: ["chest", "triceps", "shoulders"],
			equipment: ["dip_bars", "weight_belt"],
			difficultyLevel: 8,
			baseTimePerSet: 60,
			baseRestTime: 120,
			defaultSets: 3,
			defaultReps: 8,
			defaultDuration: null,
			exerciseType: "compound",
			movementPattern: "push",
			progressionType: "weight",
			isActive: true,
			tags: ["compound", "advanced", "chest", "triceps"],
		},
		{
			name: "Front Squats",
			description: "Quad-dominant squat variation with front-loaded barbell",
			instructions:
				"1. Position bar on front delts, elbows high\n2. Stand with feet shoulder-width apart\n3. Descend by bending knees and hips\n4. Keep torso upright, elbows up\n5. Drive through heels to stand",
			nameEn: "Front Squats",
			descriptionEn: "Quad-dominant squat variation with front-loaded barbell",
			instructionsEn:
				"1. Position bar on front delts, elbows high\n2. Stand with feet shoulder-width apart\n3. Descend by bending knees and hips\n4. Keep torso upright, elbows up\n5. Drive through heels to stand",
			nameNo: "Frontknebøy",
			descriptionNo: "Quadriceps-dominert knebøy-variant med stang foran",
			instructionsNo:
				"1. Plasser stangen på fremre skuldermuskel, albuer høyt\n2. Stå med føttene skulderbredde fra hverandre\n3. Gå ned ved å bøye knær og hofter\n4. Hold overkroppen oppreist, albuer opp\n5. Kjør gjennom hælene for å reise deg",
			nameEs: "Sentadillas Frontales",
			descriptionEs:
				"Variación de sentadilla dominante de cuádriceps con barra frontal",
			instructionsEs:
				"1. Coloca la barra en los deltoides frontales, codos altos\n2. Párate con pies separados al ancho de hombros\n3. Desciende doblando rodillas y caderas\n4. Mantén el torso erguido, codos arriba\n5. Empuja a través de los talones para ponerte de pie",
			nameDe: "Frontkniebeugen",
			descriptionDe:
				"Quadrizeps-dominante Kniebeuge-Variante mit vorderer Langhantel",
			instructionsDe:
				"1. Positioniere die Stange auf den vorderen Deltamuskeln, Ellbogen hoch\n2. Stehe mit schulterbreit auseinander stehenden Füßen\n3. Gehe hinunter durch Beugen der Knie und Hüften\n4. Halte den Oberkörper aufrecht, Ellbogen oben\n5. Drücke durch die Fersen, um aufzustehen",
			category: "legs",
			subcategory: "quads",
			muscleGroups: ["quads", "glutes", "core", "upper_back"],
			equipment: ["barbell", "squat_rack"],
			difficultyLevel: 8,
			baseTimePerSet: 90,
			baseRestTime: 150,
			defaultSets: 3,
			defaultReps: 8,
			defaultDuration: null,
			exerciseType: "compound",
			movementPattern: "squat",
			progressionType: "weight",
			isActive: true,
			tags: ["compound", "advanced", "quads", "core"],
		},
		// NEW EXERCISES - Isolation Movements
		{
			name: "Bicep Curls",
			description: "Classic isolation exercise for bicep development",
			instructions:
				"1. Stand with dumbbells at sides, palms forward\n2. Keep elbows close to torso\n3. Curl weights up by flexing biceps\n4. Squeeze at top of movement\n5. Lower with control",
			nameEn: "Bicep Curls",
			descriptionEn: "Classic isolation exercise for bicep development",
			instructionsEn:
				"1. Stand with dumbbells at sides, palms forward\n2. Keep elbows close to torso\n3. Curl weights up by flexing biceps\n4. Squeeze at top of movement\n5. Lower with control",
			nameNo: "Biceps Curls",
			descriptionNo: "Klassisk isolasjonsøvelse for biceps-utvikling",
			instructionsNo:
				"1. Stå med manualer på sidene, håndflater fremover\n2. Hold albuene nær kroppen\n3. Curl vektene opp ved å bøye biceps\n4. Klem sammen på toppen av bevegelsen\n5. Senk med kontroll",
			nameEs: "Curl de Bíceps",
			descriptionEs:
				"Ejercicio de aislamiento clásico para desarrollo de bíceps",
			instructionsEs:
				"1. Párate con mancuernas a los lados, palmas hacia adelante\n2. Mantén los codos cerca del torso\n3. Curva los pesos flexionando los bíceps\n4. Aprieta en la parte superior del movimiento\n5. Baja con control",
			nameDe: "Bizeps Curls",
			descriptionDe: "Klassische Isolationsübung für Bizeps-Entwicklung",
			instructionsDe:
				"1. Stehe mit Hanteln an den Seiten, Handflächen nach vorne\n2. Halte die Ellbogen nah am Körper\n3. Curle die Gewichte durch Anspannen der Bizeps\n4. Drücke oben in der Bewegung zusammen\n5. Senke kontrolliert ab",
			category: "arms",
			subcategory: "biceps",
			muscleGroups: ["biceps"],
			equipment: ["dumbbells"],
			difficultyLevel: 3,
			baseTimePerSet: 45,
			baseRestTime: 60,
			defaultSets: 3,
			defaultReps: 12,
			defaultDuration: null,
			exerciseType: "isolation",
			movementPattern: "pull",
			progressionType: "weight",
			isActive: true,
			tags: ["isolation", "arms", "biceps", "beginner_friendly"],
		},
		{
			name: "Tricep Extensions",
			description: "Overhead tricep isolation exercise",
			instructions:
				"1. Hold dumbbell overhead with both hands\n2. Keep elbows close to head\n3. Lower weight behind head by bending elbows\n4. Extend arms to return to start\n5. Keep upper arms stationary",
			nameEn: "Tricep Extensions",
			descriptionEn: "Overhead tricep isolation exercise",
			instructionsEn:
				"1. Hold dumbbell overhead with both hands\n2. Keep elbows close to head\n3. Lower weight behind head by bending elbows\n4. Extend arms to return to start\n5. Keep upper arms stationary",
			nameNo: "Triceps Strekk",
			descriptionNo: "Overhead triceps isolasjonsøvelse",
			instructionsNo:
				"1. Hold manual over hodet med begge hender\n2. Hold albuene nær hodet\n3. Senk vekten bak hodet ved å bøye albuene\n4. Strekk armene for å komme tilbake til start\n5. Hold overarmene stille",
			nameEs: "Extensiones de Tríceps",
			descriptionEs:
				"Ejercicio de aislamiento de tríceps por encima de la cabeza",
			instructionsEs:
				"1. Sostén la mancuerna por encima de la cabeza con ambas manos\n2. Mantén los codos cerca de la cabeza\n3. Baja el peso detrás de la cabeza doblando los codos\n4. Extiende los brazos para volver al inicio\n5. Mantén los brazos superiores inmóviles",
			nameDe: "Trizeps Streckungen",
			descriptionDe: "Overhead Trizeps Isolationsübung",
			instructionsDe:
				"1. Halte die Hantel über dem Kopf mit beiden Händen\n2. Halte die Ellbogen nah am Kopf\n3. Senke das Gewicht hinter den Kopf durch Beugen der Ellbogen\n4. Strecke die Arme, um zum Start zurückzukehren\n5. Halte die Oberarme ruhig",
			category: "arms",
			subcategory: "triceps",
			muscleGroups: ["triceps"],
			equipment: ["dumbbell"],
			difficultyLevel: 4,
			baseTimePerSet: 45,
			baseRestTime: 60,
			defaultSets: 3,
			defaultReps: 12,
			defaultDuration: null,
			exerciseType: "isolation",
			movementPattern: "push",
			progressionType: "weight",
			isActive: true,
			tags: ["isolation", "arms", "triceps"],
		},
		{
			name: "Lateral Raises",
			description: "Shoulder isolation exercise targeting side delts",
			instructions:
				"1. Stand with dumbbells at sides, slight bend in elbows\n2. Raise arms out to sides until parallel to floor\n3. Lead with pinkies, keep slight bend in elbows\n4. Pause at top\n5. Lower with control",
			nameEn: "Lateral Raises",
			descriptionEn: "Shoulder isolation exercise targeting side delts",
			instructionsEn:
				"1. Stand with dumbbells at sides, slight bend in elbows\n2. Raise arms out to sides until parallel to floor\n3. Lead with pinkies, keep slight bend in elbows\n4. Pause at top\n5. Lower with control",
			nameNo: "Sideløft",
			descriptionNo: "Skulder isolasjonsøvelse som treffer side-deltamuskler",
			instructionsNo:
				"1. Stå med manualer på sidene, lett bøy i albuene\n2. Løft armene ut til sidene til parallelt med gulvet\n3. Led med lillefingeren, behold lett bøy i albuene\n4. Pause på toppen\n5. Senk med kontroll",
			nameEs: "Elevaciones Laterales",
			descriptionEs:
				"Ejercicio de aislamiento de hombro dirigido a deltoides laterales",
			instructionsEs:
				"1. Párate con mancuernas a los lados, ligera flexión en los codos\n2. Levanta los brazos hacia los lados hasta quedar paralelos al suelo\n3. Guía con los meñiques, mantén ligera flexión en los codos\n4. Pausa en la parte superior\n5. Baja con control",
			nameDe: "Seitheben",
			descriptionDe: "Schulter-Isolationsübung für seitliche Deltamuskeln",
			instructionsDe:
				"1. Stehe mit Hanteln an den Seiten, leichte Beugung in den Ellbogen\n2. Hebe die Arme seitlich bis parallel zum Boden\n3. Führe mit den kleinen Fingern, behalte leichte Beugung in den Ellbogen\n4. Pausiere oben\n5. Senke kontrolliert ab",
			category: "shoulders",
			subcategory: "side_delts",
			muscleGroups: ["shoulders"],
			equipment: ["dumbbells"],
			difficultyLevel: 3,
			baseTimePerSet: 45,
			baseRestTime: 60,
			defaultSets: 3,
			defaultReps: 15,
			defaultDuration: null,
			exerciseType: "isolation",
			movementPattern: null,
			progressionType: "weight",
			isActive: true,
			tags: ["isolation", "shoulders", "side_delts"],
		},
		{
			name: "Leg Curls",
			description: "Hamstring isolation exercise using machine or dumbbells",
			instructions:
				"1. Lie face down on bench or machine\n2. Position ankles under pad or hold dumbbell\n3. Curl heels toward glutes\n4. Squeeze hamstrings at top\n5. Lower with control",
			nameEn: "Leg Curls",
			descriptionEn: "Hamstring isolation exercise using machine or dumbbells",
			instructionsEn:
				"1. Lie face down on bench or machine\n2. Position ankles under pad or hold dumbbell\n3. Curl heels toward glutes\n4. Squeeze hamstrings at top\n5. Lower with control",
			nameNo: "Bencurl",
			descriptionNo: "Hamstring isolasjonsøvelse med maskin eller manualer",
			instructionsNo:
				"1. Ligg på magen på benk eller maskin\n2. Plasser anklene under puten eller hold manual\n3. Curl hælene mot setemusklene\n4. Klem hamstrings på toppen\n5. Senk med kontroll",
			nameEs: "Curl de Piernas",
			descriptionEs:
				"Ejercicio de aislamiento de isquiotibiales usando máquina o mancuernas",
			instructionsEs:
				"1. Acuéstate boca abajo en banco o máquina\n2. Coloca los tobillos bajo la almohadilla o sostén mancuerna\n3. Curva los talones hacia los glúteos\n4. Aprieta los isquiotibiales en la parte superior\n5. Baja con control",
			nameDe: "Beinbeuger",
			descriptionDe: "Hamstring-Isolationsübung mit Maschine oder Hanteln",
			instructionsDe:
				"1. Lege dich bäuchlings auf Bank oder Maschine\n2. Positioniere die Knöchel unter dem Polster oder halte Hantel\n3. Beuge die Fersen zu den Gesäßmuskeln\n4. Drücke die Hamstrings oben zusammen\n5. Senke kontrolliert ab",
			category: "legs",
			subcategory: "hamstrings",
			muscleGroups: ["hamstrings"],
			equipment: ["leg_curl_machine", "dumbbell"],
			difficultyLevel: 3,
			baseTimePerSet: 45,
			baseRestTime: 60,
			defaultSets: 3,
			defaultReps: 12,
			defaultDuration: null,
			exerciseType: "isolation",
			movementPattern: null,
			progressionType: "weight",
			isActive: true,
			tags: ["isolation", "legs", "hamstrings", "machine"],
		},
		{
			name: "Calf Raises",
			description: "Isolation exercise for calf muscle development",
			instructions:
				"1. Stand on balls of feet on elevated surface\n2. Hold dumbbells or use machine for resistance\n3. Rise up on toes as high as possible\n4. Squeeze calves at top\n5. Lower heels below starting level for stretch",
			nameEn: "Calf Raises",
			descriptionEn: "Isolation exercise for calf muscle development",
			instructionsEn:
				"1. Stand on balls of feet on elevated surface\n2. Hold dumbbells or use machine for resistance\n3. Rise up on toes as high as possible\n4. Squeeze calves at top\n5. Lower heels below starting level for stretch",
			nameNo: "Leggløft",
			descriptionNo: "Isolasjonsøvelse for leggmuskel-utvikling",
			instructionsNo:
				"1. Stå på tåballene på forhøyet overflate\n2. Hold manualer eller bruk maskin for motstand\n3. Reis deg opp på tærne så høyt som mulig\n4. Klem leggmusklene på toppen\n5. Senk hælene under startnivået for strekk",
			nameEs: "Elevaciones de Pantorrillas",
			descriptionEs:
				"Ejercicio de aislamiento para desarrollo de músculos de pantorrilla",
			instructionsEs:
				"1. Párate en las puntas de los pies en superficie elevada\n2. Sostén mancuernas o usa máquina para resistencia\n3. Levántate en los dedos de los pies lo más alto posible\n4. Aprieta las pantorrillas en la parte superior\n5. Baja los talones por debajo del nivel inicial para estirar",
			nameDe: "Wadenheben",
			descriptionDe: "Isolationsübung für Wadenmuskel-Entwicklung",
			instructionsDe:
				"1. Stehe auf den Fußballen auf erhöhter Oberfläche\n2. Halte Hanteln oder verwende Maschine für Widerstand\n3. Hebe dich auf die Zehen so hoch wie möglich\n4. Drücke die Waden oben zusammen\n5. Senke die Fersen unter das Startniveau für Dehnung",
			category: "legs",
			subcategory: "calves",
			muscleGroups: ["calves"],
			equipment: ["dumbbells", "calf_raise_block"],
			difficultyLevel: 2,
			baseTimePerSet: 45,
			baseRestTime: 45,
			defaultSets: 4,
			defaultReps: 15,
			defaultDuration: null,
			exerciseType: "isolation",
			movementPattern: null,
			progressionType: "weight",
			isActive: true,
			tags: ["isolation", "legs", "calves", "beginner_friendly"],
		},
		// ADDITIONAL 10 EXERCISES - More variety and advanced movements
		{
			name: "Incline Dumbbell Press",
			description: "Upper chest focused pressing movement on inclined bench",
			instructions:
				"1. Set bench to 30-45 degree incline\n2. Hold dumbbells at chest level, palms forward\n3. Press weights up and slightly together\n4. Squeeze chest at top\n5. Lower with control to starting position",
			nameEn: "Incline Dumbbell Press",
			descriptionEn: "Upper chest focused pressing movement on inclined bench",
			instructionsEn:
				"1. Set bench to 30-45 degree incline\n2. Hold dumbbells at chest level, palms forward\n3. Press weights up and slightly together\n4. Squeeze chest at top\n5. Lower with control to starting position",
			nameNo: "Skråbenkpress med Manualer",
			descriptionNo: "Øvre bryst-fokusert pressebevegelse på skråbenk",
			instructionsNo:
				"1. Still benken til 30-45 graders skråning\n2. Hold manualene på brystnivå, håndflater fremover\n3. Press vektene opp og litt sammen\n4. Klem brystet på toppen\n5. Senk med kontroll til startposisjon",
			nameEs: "Press Inclinado con Mancuernas",
			descriptionEs:
				"Movimiento de press enfocado en pecho superior en banco inclinado",
			instructionsEs:
				"1. Ajusta el banco a inclinación de 30-45 grados\n2. Sostén las mancuernas a nivel del pecho, palmas hacia adelante\n3. Presiona los pesos hacia arriba y ligeramente juntos\n4. Aprieta el pecho en la parte superior\n5. Baja con control a la posición inicial",
			nameDe: "Schrägbankdrücken mit Hanteln",
			descriptionDe: "Obere Brust-fokussierte Drückbewegung auf Schrägbank",
			instructionsDe:
				"1. Stelle die Bank auf 30-45 Grad Neigung ein\n2. Halte die Hanteln auf Brusthöhe, Handflächen nach vorne\n3. Drücke die Gewichte nach oben und leicht zusammen\n4. Drücke die Brust oben zusammen\n5. Senke kontrolliert zur Startposition",
			category: "chest",
			subcategory: "upper_chest",
			muscleGroups: ["chest", "shoulders", "triceps"],
			equipment: ["dumbbells", "incline_bench"],
			difficultyLevel: 5,
			baseTimePerSet: 60,
			baseRestTime: 90,
			defaultSets: 3,
			defaultReps: 10,
			defaultDuration: null,
			exerciseType: "compound",
			movementPattern: "push",
			progressionType: "weight",
			isActive: true,
			tags: ["compound", "chest", "upper_chest", "dumbbells"],
		},
		{
			name: "T-Bar Rows",
			description: "Back thickness exercise using T-bar or landmine setup",
			instructions:
				"1. Straddle T-bar with feet shoulder-width apart\n2. Bend at hips, keep back straight\n3. Pull bar to lower chest\n4. Squeeze shoulder blades together\n5. Lower with control",
			nameEn: "T-Bar Rows",
			descriptionEn: "Back thickness exercise using T-bar or landmine setup",
			instructionsEn:
				"1. Straddle T-bar with feet shoulder-width apart\n2. Bend at hips, keep back straight\n3. Pull bar to lower chest\n4. Squeeze shoulder blades together\n5. Lower with control",
			nameNo: "T-Bar Roing",
			descriptionNo: "Ryggtykkelse-øvelse med T-bar eller landmine-oppsett",
			instructionsNo:
				"1. Stå over T-baren med føttene skulderbredde fra hverandre\n2. Bøy i hoftene, hold ryggen rett\n3. Trekk stangen til nedre bryst\n4. Klem skulderbladene sammen\n5. Senk med kontroll",
			nameEs: "Remo en T",
			descriptionEs:
				"Ejercicio de grosor de espalda usando barra en T o configuración landmine",
			instructionsEs:
				"1. Colócate a horcajadas sobre la barra en T con pies separados al ancho de hombros\n2. Inclínate en las caderas, mantén la espalda recta\n3. Tira la barra al pecho inferior\n4. Aprieta los omóplatos juntos\n5. Baja con control",
			nameDe: "T-Bar Rudern",
			descriptionDe: "Rückendicke-Übung mit T-Bar oder Landmine-Setup",
			instructionsDe:
				"1. Stelle dich rittlings über die T-Bar mit schulterbreit auseinander stehenden Füßen\n2. Beuge dich in den Hüften, halte den Rücken gerade\n3. Ziehe die Stange zur unteren Brust\n4. Drücke die Schulterblätter zusammen\n5. Senke kontrolliert ab",
			category: "back",
			subcategory: "mid_back",
			muscleGroups: ["lats", "rhomboids", "traps", "rear_delts"],
			equipment: ["t_bar", "plates"],
			difficultyLevel: 6,
			baseTimePerSet: 75,
			baseRestTime: 120,
			defaultSets: 3,
			defaultReps: 10,
			defaultDuration: null,
			exerciseType: "compound",
			movementPattern: "pull",
			progressionType: "weight",
			isActive: true,
			tags: ["compound", "back", "thickness", "pulling"],
		},
		{
			name: "Bulgarian Split Squats",
			description: "Single-leg squat variation for unilateral leg strength",
			instructions:
				"1. Stand 2-3 feet in front of bench\n2. Place rear foot on bench behind you\n3. Lower into lunge position\n4. Keep front knee over ankle\n5. Push through front heel to return",
			nameEn: "Bulgarian Split Squats",
			descriptionEn: "Single-leg squat variation for unilateral leg strength",
			instructionsEn:
				"1. Stand 2-3 feet in front of bench\n2. Place rear foot on bench behind you\n3. Lower into lunge position\n4. Keep front knee over ankle\n5. Push through front heel to return",
			nameNo: "Bulgarske Split Squats",
			descriptionNo: "Enbeins knebøy-variant for unilateral benstyrke",
			instructionsNo:
				"1. Stå 60-90 cm foran benken\n2. Plasser bakre fot på benken bak deg\n3. Senk deg ned i utfall-posisjon\n4. Hold fremre kne over ankelen\n5. Skyv gjennom fremre hæl for å komme tilbake",
			nameEs: "Sentadillas Búlgaras",
			descriptionEs:
				"Variación de sentadilla unilateral para fuerza de piernas",
			instructionsEs:
				"1. Párate a 60-90 cm frente al banco\n2. Coloca el pie trasero en el banco detrás de ti\n3. Baja a posición de estocada\n4. Mantén la rodilla delantera sobre el tobillo\n5. Empuja a través del talón delantero para volver",
			nameDe: "Bulgarische Split Squats",
			descriptionDe: "Einbeinige Kniebeuge-Variante für unilaterale Beinkraft",
			instructionsDe:
				"1. Stehe 60-90 cm vor der Bank\n2. Platziere den hinteren Fuß auf der Bank hinter dir\n3. Senke dich in Ausfallschritt-Position\n4. Halte das vordere Knie über dem Knöchel\n5. Drücke durch die vordere Ferse, um zurückzukehren",
			category: "legs",
			subcategory: "quads",
			muscleGroups: ["quads", "glutes", "hamstrings", "core"],
			equipment: ["bench", "dumbbells"],
			difficultyLevel: 6,
			baseTimePerSet: 75,
			baseRestTime: 90,
			defaultSets: 3,
			defaultReps: 12,
			defaultDuration: null,
			exerciseType: "compound",
			movementPattern: "lunge",
			progressionType: "weight",
			isActive: true,
			tags: ["compound", "unilateral", "legs", "balance"],
		},
		{
			name: "Face Pulls",
			description: "Rear delt and upper back exercise for posture improvement",
			instructions:
				"1. Set cable at face height with rope attachment\n2. Pull rope to face, elbows high\n3. Separate rope ends at face level\n4. Squeeze shoulder blades together\n5. Return with control",
			nameEn: "Face Pulls",
			descriptionEn:
				"Rear delt and upper back exercise for posture improvement",
			instructionsEn:
				"1. Set cable at face height with rope attachment\n2. Pull rope to face, elbows high\n3. Separate rope ends at face level\n4. Squeeze shoulder blades together\n5. Return with control",
			nameNo: "Ansiktstrekk",
			descriptionNo:
				"Bakre skulder og øvre rygg øvelse for holdningsforbedring",
			instructionsNo:
				"1. Still kabelen på ansiktshøyde med tau-tilkobling\n2. Trekk tauet til ansiktet, albuer høyt\n3. Separer tau-endene på ansiktsnivå\n4. Klem skulderbladene sammen\n5. Returner med kontroll",
			nameEs: "Jalones Faciales",
			descriptionEs:
				"Ejercicio de deltoides posterior y espalda alta para mejora postural",
			instructionsEs:
				"1. Ajusta el cable a altura de la cara con accesorio de cuerda\n2. Tira la cuerda hacia la cara, codos altos\n3. Separa los extremos de la cuerda a nivel de la cara\n4. Aprieta los omóplatos juntos\n5. Regresa con control",
			nameDe: "Face Pulls",
			descriptionDe:
				"Hintere Schulter- und obere Rückenübung zur Haltungsverbesserung",
			instructionsDe:
				"1. Stelle das Kabel auf Gesichtshöhe mit Seilaufsatz ein\n2. Ziehe das Seil zum Gesicht, Ellbogen hoch\n3. Trenne die Seilenden auf Gesichtshöhe\n4. Drücke die Schulterblätter zusammen\n5. Kehre kontrolliert zurück",
			category: "shoulders",
			subcategory: "rear_delts",
			muscleGroups: ["rear_delts", "rhomboids", "traps"],
			equipment: ["cable_machine", "rope_attachment"],
			difficultyLevel: 4,
			baseTimePerSet: 45,
			baseRestTime: 60,
			defaultSets: 3,
			defaultReps: 15,
			defaultDuration: null,
			exerciseType: "isolation",
			movementPattern: "pull",
			progressionType: "weight",
			isActive: true,
			tags: ["isolation", "rear_delts", "posture", "cable"],
		},
		{
			name: "Hip Thrusts",
			description: "Glute-focused exercise for posterior chain development",
			instructions:
				"1. Sit with upper back against bench\n2. Place barbell over hips (use pad)\n3. Drive hips up by squeezing glutes\n4. Create straight line from knees to shoulders\n5. Lower with control",
			nameEn: "Hip Thrusts",
			descriptionEn: "Glute-focused exercise for posterior chain development",
			instructionsEn:
				"1. Sit with upper back against bench\n2. Place barbell over hips (use pad)\n3. Drive hips up by squeezing glutes\n4. Create straight line from knees to shoulders\n5. Lower with control",
			nameNo: "Hoftepress",
			descriptionNo: "Setemuskel-fokusert øvelse for bakre kjede-utvikling",
			instructionsNo:
				"1. Sitt med øvre rygg mot benken\n2. Plasser stangen over hoftene (bruk pute)\n3. Kjør hoftene opp ved å klemme setemusklene\n4. Lag en rett linje fra knær til skuldre\n5. Senk med kontroll",
			nameEs: "Empuje de Cadera",
			descriptionEs:
				"Ejercicio enfocado en glúteos para desarrollo de cadena posterior",
			instructionsEs:
				"1. Siéntate con la espalda alta contra el banco\n2. Coloca la barra sobre las caderas (usa almohadilla)\n3. Empuja las caderas hacia arriba apretando los glúteos\n4. Crea una línea recta desde rodillas hasta hombros\n5. Baja con control",
			nameDe: "Hüftstöße",
			descriptionDe:
				"Gesäßmuskel-fokussierte Übung für hintere Ketten-Entwicklung",
			instructionsDe:
				"1. Sitze mit dem oberen Rücken gegen die Bank\n2. Platziere die Stange über den Hüften (verwende Polster)\n3. Treibe die Hüften nach oben durch Anspannen der Gesäßmuskeln\n4. Erstelle eine gerade Linie von Knien zu Schultern\n5. Senke kontrolliert ab",
			category: "legs",
			subcategory: "glutes",
			muscleGroups: ["glutes", "hamstrings", "core"],
			equipment: ["barbell", "bench", "hip_thrust_pad"],
			difficultyLevel: 5,
			baseTimePerSet: 60,
			baseRestTime: 90,
			defaultSets: 3,
			defaultReps: 12,
			defaultDuration: null,
			exerciseType: "isolation",
			movementPattern: "hinge",
			progressionType: "weight",
			isActive: true,
			tags: ["isolation", "glutes", "posterior_chain", "hip_thrust"],
		},
		{
			name: "Farmer's Walk",
			description:
				"Functional carry exercise for grip strength and core stability",
			instructions:
				"1. Pick up heavy weights in each hand\n2. Stand tall with shoulders back\n3. Walk forward with controlled steps\n4. Keep core tight throughout\n5. Maintain good posture",
			nameEn: "Farmer's Walk",
			descriptionEn:
				"Functional carry exercise for grip strength and core stability",
			instructionsEn:
				"1. Pick up heavy weights in each hand\n2. Stand tall with shoulders back\n3. Walk forward with controlled steps\n4. Keep core tight throughout\n5. Maintain good posture",
			nameNo: "Bonde-gange",
			descriptionNo:
				"Funksjonell bære-øvelse for gripestyrke og kjernestabilitet",
			instructionsNo:
				"1. Plukk opp tunge vekter i hver hånd\n2. Stå høy med skuldrene tilbake\n3. Gå fremover med kontrollerte skritt\n4. Hold kjernen stram gjennom hele øvelsen\n5. Oppretthold god holdning",
			nameEs: "Caminata del Granjero",
			descriptionEs:
				"Ejercicio funcional de carga para fuerza de agarre y estabilidad del core",
			instructionsEs:
				"1. Levanta pesos pesados en cada mano\n2. Mantente erguido con hombros hacia atrás\n3. Camina hacia adelante con pasos controlados\n4. Mantén el core tenso durante todo el ejercicio\n5. Mantén buena postura",
			nameDe: "Farmer's Walk",
			descriptionDe:
				"Funktionelle Trageübung für Griffkraft und Rumpfstabilität",
			instructionsDe:
				"1. Nimm schwere Gewichte in jede Hand\n2. Stehe aufrecht mit Schultern zurück\n3. Gehe vorwärts mit kontrollierten Schritten\n4. Halte den Rumpf während der gesamten Übung angespannt\n5. Behalte eine gute Haltung bei",
			category: "core",
			subcategory: "functional",
			muscleGroups: ["core", "traps", "forearms", "legs"],
			equipment: ["dumbbells", "farmer_walk_handles"],
			difficultyLevel: 5,
			baseTimePerSet: 60,
			baseRestTime: 120,
			defaultSets: 3,
			defaultReps: null,
			defaultDuration: 30,
			exerciseType: "compound",
			movementPattern: "carry",
			progressionType: "weight",
			isActive: true,
			tags: ["functional", "grip", "core", "carry"],
		},
		{
			name: "Hammer Curls",
			description: "Bicep and forearm exercise with neutral grip",
			instructions:
				"1. Hold dumbbells with neutral grip (palms facing each other)\n2. Keep elbows close to torso\n3. Curl weights up without rotating wrists\n4. Squeeze biceps at top\n5. Lower with control",
			nameEn: "Hammer Curls",
			descriptionEn: "Bicep and forearm exercise with neutral grip",
			instructionsEn:
				"1. Hold dumbbells with neutral grip (palms facing each other)\n2. Keep elbows close to torso\n3. Curl weights up without rotating wrists\n4. Squeeze biceps at top\n5. Lower with control",
			nameNo: "Hammer Curls",
			descriptionNo: "Biceps og underarm øvelse med nøytralt grep",
			instructionsNo:
				"1. Hold manualer med nøytralt grep (håndflater mot hverandre)\n2. Hold albuene nær kroppen\n3. Curl vektene opp uten å rotere håndleddene\n4. Klem biceps på toppen\n5. Senk med kontroll",
			nameEs: "Curl Martillo",
			descriptionEs: "Ejercicio de bíceps y antebrazo con agarre neutro",
			instructionsEs:
				"1. Sostén mancuernas con agarre neutro (palmas enfrentadas)\n2. Mantén los codos cerca del torso\n3. Curva los pesos hacia arriba sin rotar las muñecas\n4. Aprieta los bíceps en la parte superior\n5. Baja con control",
			nameDe: "Hammer Curls",
			descriptionDe: "Bizeps- und Unterarmübung mit neutralem Griff",
			instructionsDe:
				"1. Halte Hanteln mit neutralem Griff (Handflächen zueinander)\n2. Halte die Ellbogen nah am Körper\n3. Curle die Gewichte nach oben ohne die Handgelenke zu drehen\n4. Drücke die Bizeps oben zusammen\n5. Senke kontrolliert ab",
			category: "arms",
			subcategory: "biceps",
			muscleGroups: ["biceps", "forearms"],
			equipment: ["dumbbells"],
			difficultyLevel: 3,
			baseTimePerSet: 45,
			baseRestTime: 60,
			defaultSets: 3,
			defaultReps: 12,
			defaultDuration: null,
			exerciseType: "isolation",
			movementPattern: "pull",
			progressionType: "weight",
			isActive: true,
			tags: ["isolation", "biceps", "forearms", "neutral_grip"],
		},
		{
			name: "Close-Grip Bench Press",
			description: "Tricep-focused bench press variation",
			instructions:
				"1. Lie on bench with hands closer than shoulder width\n2. Keep elbows close to body\n3. Lower bar to lower chest\n4. Press up focusing on triceps\n5. Maintain tight core throughout",
			nameEn: "Close-Grip Bench Press",
			descriptionEn: "Tricep-focused bench press variation",
			instructionsEn:
				"1. Lie on bench with hands closer than shoulder width\n2. Keep elbows close to body\n3. Lower bar to lower chest\n4. Press up focusing on triceps\n5. Maintain tight core throughout",
			nameNo: "Smalgreps Benkpress",
			descriptionNo: "Triceps-fokusert benkpress variant",
			instructionsNo:
				"1. Ligg på benken med hendene nærmere enn skulderbredde\n2. Hold albuene nær kroppen\n3. Senk stangen til nedre bryst\n4. Press opp med fokus på triceps\n5. Oppretthold stram kjerne gjennom hele øvelsen",
			nameEs: "Press de Banca Agarre Cerrado",
			descriptionEs: "Variación de press de banca enfocada en tríceps",
			instructionsEs:
				"1. Acuéstate en el banco con las manos más cerca que el ancho de hombros\n2. Mantén los codos cerca del cuerpo\n3. Baja la barra al pecho inferior\n4. Presiona hacia arriba enfocándote en los tríceps\n5. Mantén el core tenso durante todo el ejercicio",
			nameDe: "Enges Bankdrücken",
			descriptionDe: "Trizeps-fokussierte Bankdrücken-Variante",
			instructionsDe:
				"1. Lege dich auf die Bank mit Händen enger als schulterbreit\n2. Halte die Ellbogen nah am Körper\n3. Senke die Stange zur unteren Brust\n4. Drücke nach oben mit Fokus auf Trizeps\n5. Halte den Rumpf während der gesamten Übung angespannt",
			category: "arms",
			subcategory: "triceps",
			muscleGroups: ["triceps", "chest", "shoulders"],
			equipment: ["barbell", "bench"],
			difficultyLevel: 6,
			baseTimePerSet: 75,
			baseRestTime: 120,
			defaultSets: 3,
			defaultReps: 8,
			defaultDuration: null,
			exerciseType: "compound",
			movementPattern: "push",
			progressionType: "weight",
			isActive: true,
			tags: ["compound", "triceps", "close_grip", "pressing"],
		},
		{
			name: "Walking Lunges",
			description: "Dynamic lunge variation for leg strength and stability",
			instructions:
				"1. Stand with feet hip-width apart\n2. Step forward into lunge position\n3. Lower until both knees at 90 degrees\n4. Push off front foot to step into next lunge\n5. Alternate legs with each step",
			nameEn: "Walking Lunges",
			descriptionEn: "Dynamic lunge variation for leg strength and stability",
			instructionsEn:
				"1. Stand with feet hip-width apart\n2. Step forward into lunge position\n3. Lower until both knees at 90 degrees\n4. Push off front foot to step into next lunge\n5. Alternate legs with each step",
			nameNo: "Gående Utfall",
			descriptionNo: "Dynamisk utfall-variant for benstyrke og stabilitet",
			instructionsNo:
				"1. Stå med føttene hoftebredde fra hverandre\n2. Ta skritt fremover i utfall-posisjon\n3. Senk deg til begge knær er i 90 grader\n4. Skyv av fra fremre fot for å ta neste utfall\n5. Veksle ben med hvert skritt",
			nameEs: "Zancadas Caminando",
			descriptionEs:
				"Variación dinámica de zancada para fuerza y estabilidad de piernas",
			instructionsEs:
				"1. Párate con pies separados al ancho de caderas\n2. Da un paso adelante en posición de zancada\n3. Baja hasta que ambas rodillas estén a 90 grados\n4. Empuja con el pie delantero para dar la siguiente zancada\n5. Alterna las piernas con cada paso",
			nameDe: "Gehende Ausfallschritte",
			descriptionDe:
				"Dynamische Ausfallschritt-Variante für Beinkraft und Stabilität",
			instructionsDe:
				"1. Stehe mit hüftbreit auseinander stehenden Füßen\n2. Tritt nach vorne in Ausfallschritt-Position\n3. Senke dich, bis beide Knie 90 Grad erreichen\n4. Stoße dich vom vorderen Fuß ab für den nächsten Ausfallschritt\n5. Wechsle die Beine mit jedem Schritt",
			category: "legs",
			subcategory: "quads",
			muscleGroups: ["quads", "glutes", "hamstrings", "core"],
			equipment: ["dumbbells", "bodyweight"],
			difficultyLevel: 5,
			baseTimePerSet: 60,
			baseRestTime: 90,
			defaultSets: 3,
			defaultReps: 20,
			defaultDuration: null,
			exerciseType: "compound",
			movementPattern: "lunge",
			progressionType: "weight",
			isActive: true,
			tags: ["compound", "dynamic", "legs", "functional"],
		},
		{
			name: "Russian Twists",
			description: "Core rotation exercise for oblique development",
			instructions:
				"1. Sit with knees bent, feet slightly off ground\n2. Lean back to 45-degree angle\n3. Hold weight or medicine ball\n4. Rotate torso side to side\n5. Keep core engaged throughout",
			nameEn: "Russian Twists",
			descriptionEn: "Core rotation exercise for oblique development",
			instructionsEn:
				"1. Sit with knees bent, feet slightly off ground\n2. Lean back to 45-degree angle\n3. Hold weight or medicine ball\n4. Rotate torso side to side\n5. Keep core engaged throughout",
			nameNo: "Russiske Vridninger",
			descriptionNo: "Kjerne rotasjonsøvelse for skrå magemuskel-utvikling",
			instructionsNo:
				"1. Sitt med bøyde knær, føttene lett over bakken\n2. Len deg tilbake til 45-graders vinkel\n3. Hold vekt eller medisinball\n4. Roter overkroppen fra side til side\n5. Hold kjernen aktivert gjennom hele øvelsen",
			nameEs: "Giros Rusos",
			descriptionEs:
				"Ejercicio de rotación del core para desarrollo de oblicuos",
			instructionsEs:
				"1. Siéntate con rodillas dobladas, pies ligeramente del suelo\n2. Inclínate hacia atrás a ángulo de 45 grados\n3. Sostén peso o pelota medicinal\n4. Rota el torso de lado a lado\n5. Mantén el core activado durante todo el ejercicio",
			nameDe: "Russische Drehungen",
			descriptionDe: "Rumpf-Rotationsübung für schräge Bauchmuskel-Entwicklung",
			instructionsDe:
				"1. Sitze mit gebeugten Knien, Füße leicht vom Boden\n2. Lehne dich in 45-Grad-Winkel zurück\n3. Halte Gewicht oder Medizinball\n4. Rotiere den Oberkörper von Seite zu Seite\n5. Halte den Rumpf während der gesamten Übung angespannt",
			category: "core",
			subcategory: "obliques",
			muscleGroups: ["obliques", "core", "abs"],
			equipment: ["medicine_ball", "weight_plate"],
			difficultyLevel: 4,
			baseTimePerSet: 45,
			baseRestTime: 60,
			defaultSets: 3,
			defaultReps: 20,
			defaultDuration: null,
			exerciseType: "isolation",
			movementPattern: null,
			progressionType: "weight",
			isActive: true,
			tags: ["isolation", "core", "obliques", "rotation"],
		},
	];

	try {
		for (const exercise of sampleExercises) {
			const exerciseId = nanoid();
			await db.insert(schema.exercises).values({
				id: exerciseId,
				...exercise,
				scalingFactors: null,
				imageUrl: null,
				videoUrl: null,
				thumbnailUrl: null,
				createdBy: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
		}

		revalidatePath("/admin/exercises");
		return { success: true, count: sampleExercises.length };
	} catch (error) {
		console.error("Error seeding exercises:", error);
		throw new Error("Failed to seed exercises");
	}
}
