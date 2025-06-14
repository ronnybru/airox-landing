import { exercises } from "@/lib/db/schema";
import {
	categoryTranslations,
	subcategoryTranslations,
	muscleGroupTranslations,
	equipmentTranslations,
	exerciseTypeTranslations,
	movementPatternTranslations,
	tagTranslations,
	translateTerm,
	translateTerms,
	type SupportedLanguage,
} from "./exercise-translations";

export type Exercise = typeof exercises.$inferSelect;
export { type SupportedLanguage };

/**
 * Get localized exercise data based on user's language preference
 */
export function getLocalizedExercise(
	exercise: Exercise,
	language: SupportedLanguage = "en"
) {
	// Default to English if no translation exists
	const getName = () => {
		switch (language) {
			case "no":
				return exercise.nameNo || exercise.nameEn || exercise.name;
			case "es":
				return exercise.nameEs || exercise.nameEn || exercise.name;
			case "de":
				return exercise.nameDe || exercise.nameEn || exercise.name;
			case "en":
			default:
				return exercise.nameEn || exercise.name;
		}
	};

	const getDescription = () => {
		switch (language) {
			case "no":
				return (
					exercise.descriptionNo ||
					exercise.descriptionEn ||
					exercise.description
				);
			case "es":
				return (
					exercise.descriptionEs ||
					exercise.descriptionEn ||
					exercise.description
				);
			case "de":
				return (
					exercise.descriptionDe ||
					exercise.descriptionEn ||
					exercise.description
				);
			case "en":
			default:
				return exercise.descriptionEn || exercise.description;
		}
	};

	const getInstructions = () => {
		switch (language) {
			case "no":
				return (
					exercise.instructionsNo ||
					exercise.instructionsEn ||
					exercise.instructions
				);
			case "es":
				return (
					exercise.instructionsEs ||
					exercise.instructionsEn ||
					exercise.instructions
				);
			case "de":
				return (
					exercise.instructionsDe ||
					exercise.instructionsEn ||
					exercise.instructions
				);
			case "en":
			default:
				return exercise.instructionsEn || exercise.instructions;
		}
	};

	// Translate category and subcategory
	const localizedCategory = translateTerm(
		exercise.category,
		categoryTranslations,
		language
	);
	const localizedSubcategory = exercise.subcategory
		? translateTerm(exercise.subcategory, subcategoryTranslations, language)
		: exercise.subcategory;

	// Translate muscle groups
	const localizedMuscleGroups = translateTerms(
		exercise.muscleGroups,
		muscleGroupTranslations,
		language
	);

	// Translate equipment
	const localizedEquipment = translateTerms(
		exercise.equipment,
		equipmentTranslations,
		language
	);

	// Translate exercise type
	const localizedExerciseType = translateTerm(
		exercise.exerciseType,
		exerciseTypeTranslations,
		language
	);

	// Translate movement pattern
	const localizedMovementPattern = exercise.movementPattern
		? translateTerm(
				exercise.movementPattern,
				movementPatternTranslations,
				language
			)
		: exercise.movementPattern;

	// Translate tags
	const localizedTags = exercise.tags
		? translateTerms(exercise.tags, tagTranslations, language)
		: exercise.tags;

	return {
		...exercise,
		name: getName(),
		description: getDescription(),
		instructions: getInstructions(),
		category: localizedCategory,
		subcategory: localizedSubcategory,
		muscleGroups: localizedMuscleGroups,
		equipment: localizedEquipment,
		exerciseType: localizedExerciseType,
		movementPattern: localizedMovementPattern,
		tags: localizedTags,
	};
}

/**
 * Get localized exercise data for multiple exercises
 */
export function getLocalizedExercises(
	exercises: Exercise[],
	language: SupportedLanguage = "en"
) {
	return exercises.map((exercise) => getLocalizedExercise(exercise, language));
}

/**
 * Validate if a language code is supported
 */
export function isSupportedLanguage(
	language: string
): language is SupportedLanguage {
	return ["en", "no", "es", "de"].includes(language);
}

/**
 * Get the user's language from their profile, with fallback to English
 */
export function getUserLanguage(
	userLanguage?: string | null
): SupportedLanguage {
	if (!userLanguage || !isSupportedLanguage(userLanguage)) {
		return "en";
	}
	return userLanguage;
}
