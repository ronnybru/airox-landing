import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// Zod schema for body scan analysis
export const bodyScanAnalysisSchema = z.object({
	bodyComposition: z.object({
		bodyFatPercentage: z
			.number()
			.min(5)
			.max(50)
			.describe("Estimated body fat percentage (5-50%)"),
		muscleMassKg: z
			.number()
			.min(20)
			.max(70)
			.describe(
				"Estimated realistic muscle mass based on height in kilograms (20-70kg)"
			),
		visceralFatRating: z
			.number()
			.min(1)
			.max(20)
			.describe(
				"Visceral fat rating scale 1-20 (1-9 healthy, 10-14 excessive, 15+ dangerous)"
			),
	}),

	measurements: z.object({
		shoulderWidthCm: z
			.number()
			.min(30)
			.max(60)
			.describe("Shoulder width measurement in centimeters"),
		waistCircumferenceCm: z
			.number()
			.min(50)
			.max(150)
			.describe("Waist circumference in centimeters"),
		chestCircumferenceCm: z
			.number()
			.min(70)
			.max(150)
			.describe("Chest circumference in centimeters"),
	}),

	physicalAssessment: z.object({
		postureScore: z
			.number()
			.min(1)
			.max(10)
			.describe("Posture quality score 1-10 (10 being perfect posture)"),
		muscleDefinition: z
			.enum(["low", "moderate", "high", "very_high"])
			.describe("Overall muscle definition visibility"),
		bodySymmetry: z
			.enum(["poor", "fair", "good", "excellent"])
			.describe("Body symmetry assessment"),
		overallFitnessLevel: z
			.enum(["beginner", "intermediate", "advanced", "elite"])
			.describe("Estimated overall fitness level"),
	}),

	healthIndicators: z.object({
		bmiCategory: z
			.enum(["underweight", "normal", "overweight", "obese"])
			.describe("BMI category based on visual assessment"),
		metabolicHealth: z
			.enum(["poor", "fair", "good", "excellent"])
			.describe("Estimated metabolic health based on body composition"),
		cardiovascularRisk: z
			.enum(["low", "moderate", "high"])
			.describe("Estimated cardiovascular risk based on body fat distribution"),
		estimatedAge: z
			.number()
			.min(18)
			.max(80)
			.describe(
				"Estimated biological age based on physical appearance, muscle tone, skin condition, and overall fitness level"
			),
	}),

	progressMetrics: z.object({
		transformationPotential: z
			.number()
			.min(1)
			.max(100)
			.describe("Transformation potential score 1-100"),
		strengthIndicators: z
			.array(z.string())
			.length(2)
			.describe("List of most visible strength indicators"),
		areasForImprovement: z
			.array(z.string())
			.length(2)
			.describe("Areas that could benefit most from targeted training"),
	}),

	confidence: z.object({
		overallConfidence: z
			.number()
			.min(0.1)
			.max(1.0)
			.describe("Overall analysis confidence (0.1-1.0)"),
		measurementAccuracy: z
			.enum(["low", "medium", "high"])
			.describe("Confidence in measurement accuracy"),
		limitingFactors: z
			.array(z.string())
			.describe(
				"Factors that may limit analysis accuracy (lighting, pose, clothing, etc.)"
			),
	}),

	recommendations: z.object({
		trainingFocus: z
			.array(z.string())
			.describe("Recommended training focus areas"),
		nutritionGuidance: z
			.array(z.string())
			.describe("General nutrition recommendations"),
		nextSteps: z
			.array(z.string())
			.describe("Suggested next steps for improvement"),
	}),
});

export type BodyScanAnalysis = z.infer<typeof bodyScanAnalysisSchema>;

export async function analyzeBodyScanImage(
	imageUrl: string,
	userHeight?: number // height in centimeters
): Promise<BodyScanAnalysis> {
	const prompt = `
	   Analyze this body scan image and provide a comprehensive fitness and body composition assessment.
	   Please examine the image carefully and provide detailed analysis including:
	   
	   1. Body Composition: Estimate body fat percentage, muscle mass, and visceral fat rating
	      ${userHeight ? `- Use the provided height (${userHeight}cm) to scale muscle mass estimates appropriately` : "- Estimate based on visual proportions"}
	   2. Physical Measurements: Estimate shoulder width, waist circumference, and chest circumference
	   3. Physical Assessment: Evaluate posture, muscle definition, body symmetry, and fitness level
	   4. Health Indicators: Assess BMI category, metabolic health, cardiovascular risk factors, and estimated biological age
	   5. Progress Metrics: Identify transformation potential and areas for improvement
	   6. Analysis Confidence: Rate the confidence of your analysis and note any limiting factors
	   7. Recommendations: Provide actionable training and nutrition guidance
	   
	   Base your analysis on visible indicators such as:
	   - Muscle definition and size
	   - Body fat distribution patterns
	   - Posture and alignment
	   - Overall body proportions ${userHeight ? `(considering ${userHeight}cm height)` : ""}
	   - Visible fitness markers
	   - For estimated age: skin condition, muscle tone, overall fitness level, and physical appearance. Skin condition should be heavily weighted in this assessment.
	   
	   Be realistic and evidence-based in your assessments. If certain aspects are difficult to determine from the image, note this in the limiting factors and adjust confidence accordingly.
	   
	   IMPORTANT: The estimated age should be based on biological/fitness age rather than chronological age, considering factors like muscle tone, skin condition, and overall physical condition.
	   
	   Provide specific, actionable recommendations that would be helpful for someone looking to improve their fitness and body composition.
	 `;

	try {
		console.log("Generating object with prompt:", prompt);
		const { object } = await generateObject({
			model: openai("gpt-4.1-2025-04-14"),
			schema: bodyScanAnalysisSchema,
			messages: [
				{
					role: "user",
					content: [
						{
							type: "text",
							text: prompt,
						},
						{
							type: "image",
							image: imageUrl,
						},
					],
				},
			],
			schemaName: "BodyScanAnalysis",
			schemaDescription:
				"Comprehensive body scan analysis with fitness and health metrics",
		});

		return object;
	} catch (error) {
		console.error("Error analyzing body scan image:", error);
		throw new Error("Failed to analyze body scan image");
	}
}

// Jack Score Configuration - easily adjustable weights for different categories
interface JackScoreWeights {
	bodyFatWeight: number; // How important low body fat is (higher = more important)
	muscleMassWeight: number; // How important high muscle mass is
	visceralFatWeight: number; // How important low visceral fat is
	postureWeight: number; // How important good posture is
	muscleDefinitionWeight: number; // How important muscle definition is
	bodySymmetryWeight: number; // How important body symmetry is
	shoulderToWaistRatioWeight: number; // How important V-taper is
}

// Default weights optimized for classic physique bodybuilding
const DEFAULT_JACK_SCORE_WEIGHTS: JackScoreWeights = {
	bodyFatWeight: 0.3, // 30% - Very important for stage-ready physique
	muscleMassWeight: 0.25, // 25% - High muscle mass is crucial
	visceralFatWeight: 0.15, // 15% - Low visceral fat for tight waist
	postureWeight: 0.1, // 10% - Good posture for presentation
	muscleDefinitionWeight: 0.1, // 10% - Muscle separation and definition
	bodySymmetryWeight: 0.05, // 5% - Balanced development
	shoulderToWaistRatioWeight: 0.05, // 5% - V-taper aesthetic
};

/**
 * Calculate Jack Score (0-1000) for classic physique bodybuilding potential
 * Emphasizes low body fat percentage and high muscle mass with configurable weights
 */
export function calculateJackScore(
	analysis: BodyScanAnalysis,
	weights: JackScoreWeights = DEFAULT_JACK_SCORE_WEIGHTS
): number {
	// Body Fat Score (0-100) - Lower is better for bodybuilding
	// Optimal range: 5-8% for men, 12-16% for women (assuming male for classic physique)
	const bodyFatScore = Math.max(
		0,
		Math.min(
			100,
			100 -
				Math.pow((analysis.bodyComposition.bodyFatPercentage - 6) / 20, 2) * 100
		)
	);

	// Muscle Mass Score (0-100) - Higher is better
	// Scale based on typical range: 40-80kg, with 70kg+ being excellent
	const muscleMassScore = Math.max(
		0,
		Math.min(100, ((analysis.bodyComposition.muscleMassKg - 40) / 40) * 100)
	);

	// Visceral Fat Score (0-100) - Lower is better
	// Optimal: 1-5, anything above 10 is concerning
	const visceralFatScore = Math.max(
		0,
		Math.min(
			100,
			100 - ((analysis.bodyComposition.visceralFatRating - 1) / 14) * 100
		)
	);

	// Posture Score (0-100) - Direct mapping from 1-10 scale
	const postureScore = (analysis.physicalAssessment.postureScore / 10) * 100;

	// Muscle Definition Score (0-100)
	const muscleDefinitionMap = {
		low: 25,
		moderate: 50,
		high: 75,
		very_high: 100,
	};
	const muscleDefinitionScore =
		muscleDefinitionMap[analysis.physicalAssessment.muscleDefinition];

	// Body Symmetry Score (0-100)
	const bodySymmetryMap = {
		poor: 25,
		fair: 50,
		good: 75,
		excellent: 100,
	};
	const bodySymmetryScore =
		bodySymmetryMap[analysis.physicalAssessment.bodySymmetry];

	// Shoulder to Waist Ratio Score (0-100) - V-taper aesthetic
	const shoulderToWaistRatio =
		analysis.measurements.shoulderWidthCm /
		analysis.measurements.waistCircumferenceCm;
	// Ideal ratio is around 1.6+ for classic physique
	const shoulderToWaistScore = Math.max(
		0,
		Math.min(100, ((shoulderToWaistRatio - 1.2) / 0.6) * 100)
	);

	// Calculate weighted total
	const weightedScore =
		bodyFatScore * weights.bodyFatWeight +
		muscleMassScore * weights.muscleMassWeight +
		visceralFatScore * weights.visceralFatWeight +
		postureScore * weights.postureWeight +
		muscleDefinitionScore * weights.muscleDefinitionWeight +
		bodySymmetryScore * weights.bodySymmetryWeight +
		shoulderToWaistScore * weights.shoulderToWaistRatioWeight;

	// Scale to 0-1000 and round
	return Math.round(weightedScore * 10);
}

// Helper function to convert analysis to database format
export function convertAnalysisToDbFormat(analysis: BodyScanAnalysis) {
	// Calculate Jack Score
	const jackScore = calculateJackScore(analysis);

	return {
		bodyFatPercentage: Math.round(
			analysis.bodyComposition.bodyFatPercentage * 100
		), // Store as percentage * 100 (e.g., 15.5% = 1550)
		muscleMass: Math.round(analysis.bodyComposition.muscleMassKg * 1000), // Store in grams
		visceralFat: analysis.bodyComposition.visceralFatRating,
		progressScore: analysis.progressMetrics.transformationPotential,
		transformationRating: Math.round(
			analysis.physicalAssessment.postureScore * 10
		), // Convert 1-10 to 1-100 scale
		jackScore: jackScore, // Classic physique bodybuilding score 0-1000
		analysisResults: {
			overallConfidence: Math.round(
				analysis.confidence.overallConfidence * 100
			),
			detectedFeatures: [
				"body_composition",
				"muscle_definition",
				"posture_analysis",
				"body_measurements",
				"health_indicators",
			],
			measurements: {
				shoulderWidth: analysis.measurements.shoulderWidthCm,
				waistCircumference: analysis.measurements.waistCircumferenceCm,
				chestCircumference: analysis.measurements.chestCircumferenceCm,
			},
			physicalAssessment: {
				postureScore: analysis.physicalAssessment.postureScore,
				muscleDefinition: analysis.physicalAssessment.muscleDefinition,
				bodySymmetry: analysis.physicalAssessment.bodySymmetry,
				fitnessLevel: analysis.physicalAssessment.overallFitnessLevel,
			},
			healthIndicators: {
				bmiCategory: analysis.healthIndicators.bmiCategory,
				metabolicHealth: analysis.healthIndicators.metabolicHealth,
				cardiovascularRisk: analysis.healthIndicators.cardiovascularRisk,
				estimatedAge: analysis.healthIndicators.estimatedAge,
			},
			confidenceDetails: {
				overall: analysis.confidence.overallConfidence,
				measurementAccuracy: analysis.confidence.measurementAccuracy,
				limitingFactors: analysis.confidence.limitingFactors,
			},
			recommendations: {
				trainingFocus: analysis.recommendations.trainingFocus,
				nutritionGuidance: analysis.recommendations.nutritionGuidance,
				nextSteps: analysis.recommendations.nextSteps,
			},
			strengthIndicators: analysis.progressMetrics.strengthIndicators,
			areasForImprovement: analysis.progressMetrics.areasForImprovement,
		},
	};
}
