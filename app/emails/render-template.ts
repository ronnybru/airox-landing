import fs from "fs";
import path from "path";

/**
 * Renders an email template with the provided data
 *
 * @param templateName - The name of the template file (without extension)
 * @param data - The data to be used in the template
 * @returns The rendered HTML content
 */
export async function renderTemplate(
	templateName: string,
	data: Record<string, unknown> = {}
): Promise<string> {
	try {
		// Get the template path
		const templatePath = path.join(
			process.cwd(),
			"app/emails/templates",
			`${templateName}.html`
		);

		// Read the template file
		let template = fs.readFileSync(templatePath, "utf8");

		// Process conditionals in the template
		// Handle {{#key}}...{{/key}} conditionals
		Object.keys(data).forEach((key) => {
			const value = data[key];
			const conditionalRegex = new RegExp(
				`{{#${key}}}([\\s\\S]*?){{/${key}}}`,
				"g"
			);

			if (value) {
				// If the value exists and is truthy, keep the content but remove the conditional tags
				template = template.replace(conditionalRegex, (_, content) => content);
			} else {
				// If the value doesn't exist or is falsy, remove the entire conditional block
				template = template.replace(conditionalRegex, "");
			}
		});

		// Replace variables in the template
		Object.entries(data).forEach(([key, value]) => {
			const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
			template = template.replace(regex, String(value || ""));
		});

		return template;
	} catch (error) {
		console.error(`Error rendering template ${templateName}:`, error);
		throw error;
	}
}
