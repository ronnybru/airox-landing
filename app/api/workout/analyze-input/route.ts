import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// Zod schema for input analysis
const inputAnalysisSchema = z.object({
	energyLevel: z
		.number()
		.min(1)
		.max(5)
		.describe("Energy level from 1 (very tired) to 5 (very energetic)"),
	shouldShowTimePicker: z
		.boolean()
		.describe("Whether to show the time picker based on user input"),
	response: z
		.string()
		.describe("Jack AI's response to the user in their language"),
});

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { input, userLanguage } = await request.json();

		if (!input || typeof input !== "string") {
			return NextResponse.json({ error: "Input is required" }, { status: 400 });
		}

		// Language mapping for AI responses
		const languageInstructions = {
			en: "Respond in English",
			no: "Respond in Norwegian (Norsk)",
			es: "Respond in Spanish (Español)",
			de: "Respond in German (Deutsch)",
		};

		const language = userLanguage || "en";
		const languageInstruction =
			languageInstructions[language as keyof typeof languageInstructions] ||
			languageInstructions.en;

		const prompt = `
You are Jack AI, a friendly and motivating personal trainer. Analyze the user's input and determine:

1. Their energy level (1-5 scale)
2. Whether they want to proceed with workout planning (show time picker)
3. Provide an appropriate response

IMPORTANT: ${languageInstruction}. Your response should be natural, encouraging, and in the user's language.

USER INPUT: "${input}"

ANALYSIS GUIDELINES:
- If user says "go" or similar short commands, they want to proceed → set shouldShowTimePicker to true
- Energy level indicators:
  * "tired", "exhausted", "low energy", "sore" → 1-2
  * "okay", "normal", "fine" → 3
  * "good", "energetic", "ready" → 4
  * "pumped", "amazing", "let's crush it" → 5
- If they mention specific body parts (sore back, want to train legs), acknowledge it
- If they want to proceed, respond positively and mention setting workout time
- If they share how they feel, acknowledge and ask if they want to proceed

RESPONSE STYLE:
- Keep responses short and conversational (1-2 sentences)
- Be encouraging and motivating
- Use the user's language
- Match their energy level in your response
`;

		const { object } = await generateObject({
			model: openai("gpt-4.1-2025-04-14"),
			schema: inputAnalysisSchema,
			messages: [
				{
					role: "user",
					content: prompt,
				},
			],
			schemaName: "InputAnalysis",
			schemaDescription: "Analysis of user input for workout planning",
		});

		return NextResponse.json(object);
	} catch (error) {
		console.error("Error analyzing user input:", error);
		return NextResponse.json(
			{ error: "Failed to analyze input" },
			{ status: 500 }
		);
	}
}
