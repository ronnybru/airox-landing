export type SupportedLanguage = "en" | "no" | "es" | "de";

// Exercise category translations
export const categoryTranslations: Record<
	string,
	Record<SupportedLanguage, string>
> = {
	chest: {
		en: "Chest",
		no: "Bryst",
		es: "Pecho",
		de: "Brust",
	},
	back: {
		en: "Back",
		no: "Rygg",
		es: "Espalda",
		de: "Rücken",
	},
	legs: {
		en: "Legs",
		no: "Ben",
		es: "Piernas",
		de: "Beine",
	},
	shoulders: {
		en: "Shoulders",
		no: "Skuldre",
		es: "Hombros",
		de: "Schultern",
	},
	arms: {
		en: "Arms",
		no: "Armer",
		es: "Brazos",
		de: "Arme",
	},
	core: {
		en: "Core",
		no: "Mage",
		es: "Core",
		de: "Rumpf",
	},
	cardio: {
		en: "Cardio",
		no: "Kondisjon",
		es: "Cardio",
		de: "Cardio",
	},
};

// Subcategory translations
export const subcategoryTranslations: Record<
	string,
	Record<SupportedLanguage, string>
> = {
	upper_chest: {
		en: "Upper Chest",
		no: "Øvre bryst",
		es: "Pecho Superior",
		de: "Obere Brust",
	},
	lower_chest: {
		en: "Lower Chest",
		no: "Nedre bryst",
		es: "Pecho Inferior",
		de: "Untere Brust",
	},
	lower_back: {
		en: "Lower Back",
		no: "Nedre rygg",
		es: "Espalda Baja",
		de: "Unterer Rücken",
	},
	mid_back: {
		en: "Mid Back",
		no: "Midtre rygg",
		es: "Espalda Media",
		de: "Mittlerer Rücken",
	},
	lats: {
		en: "Lats",
		no: "Latissimus",
		es: "Dorsales",
		de: "Latissimus",
	},
	quads: {
		en: "Quadriceps",
		no: "Quadriceps",
		es: "Cuádriceps",
		de: "Quadrizeps",
	},
	hamstrings: {
		en: "Hamstrings",
		no: "Hamstrings",
		es: "Isquiotibiales",
		de: "Beinbeuger",
	},
	glutes: {
		en: "Glutes",
		no: "Rumpe",
		es: "Glúteos",
		de: "Gesäß",
	},
	calves: {
		en: "Calves",
		no: "Legger",
		es: "Pantorrillas",
		de: "Waden",
	},
	front_delts: {
		en: "Front Delts",
		no: "Fremre skulder",
		es: "Deltoides Anterior",
		de: "Vordere Schulter",
	},
	side_delts: {
		en: "Side Delts",
		no: "Side skulder",
		es: "Deltoides Lateral",
		de: "Seitliche Schulter",
	},
	rear_delts: {
		en: "Rear Delts",
		no: "Bakre skulder",
		es: "Deltoides Posterior",
		de: "Hintere Schulter",
	},
	biceps: {
		en: "Biceps",
		no: "Biceps",
		es: "Bíceps",
		de: "Bizeps",
	},
	triceps: {
		en: "Triceps",
		no: "Triceps",
		es: "Tríceps",
		de: "Trizeps",
	},
	abs: {
		en: "Abs",
		no: "Magemuskulatur",
		es: "Abdominales",
		de: "Bauchmuskeln",
	},
	obliques: {
		en: "Obliques",
		no: "Skrå magemuskulatur",
		es: "Oblicuos",
		de: "Schräge Bauchmuskeln",
	},
	functional: {
		en: "Functional",
		no: "Funksjonell",
		es: "Funcional",
		de: "Funktional",
	},
};

// Muscle group translations
export const muscleGroupTranslations: Record<
	string,
	Record<SupportedLanguage, string>
> = {
	chest: {
		en: "Chest",
		no: "Bryst",
		es: "Pecho",
		de: "Brust",
	},
	triceps: {
		en: "Triceps",
		no: "Triceps",
		es: "Tríceps",
		de: "Trizeps",
	},
	shoulders: {
		en: "Shoulders",
		no: "Skuldre",
		es: "Hombros",
		de: "Schultern",
	},
	back: {
		en: "Back",
		no: "Rygg",
		es: "Espalda",
		de: "Rücken",
	},
	glutes: {
		en: "Glutes",
		no: "Rumpe",
		es: "Glúteos",
		de: "Gesäß",
	},
	hamstrings: {
		en: "Hamstrings",
		no: "Hamstrings",
		es: "Isquiotibiales",
		de: "Beinbeuger",
	},
	traps: {
		en: "Traps",
		no: "Trapezius",
		es: "Trapecios",
		de: "Trapezmuskel",
	},
	quads: {
		en: "Quads",
		no: "Quadriceps",
		es: "Cuádriceps",
		de: "Quadrizeps",
	},
	core: {
		en: "Core",
		no: "Mage",
		es: "Core",
		de: "Rumpf",
	},
	lats: {
		en: "Lats",
		no: "Latissimus",
		es: "Dorsales",
		de: "Latissimus",
	},
	biceps: {
		en: "Biceps",
		no: "Biceps",
		es: "Bíceps",
		de: "Bizeps",
	},
	rhomboids: {
		en: "Rhomboids",
		no: "Rhomboideus",
		es: "Romboides",
		de: "Rhomboideus",
	},
	rear_delts: {
		en: "Rear Delts",
		no: "Bakre skulder",
		es: "Deltoides Posterior",
		de: "Hintere Schulter",
	},
	upper_back: {
		en: "Upper Back",
		no: "Øvre rygg",
		es: "Espalda Superior",
		de: "Oberer Rücken",
	},
	abs: {
		en: "Abs",
		no: "Magemuskulatur",
		es: "Abdominales",
		de: "Bauchmuskeln",
	},
	obliques: {
		en: "Obliques",
		no: "Skrå magemuskulatur",
		es: "Oblicuos",
		de: "Schräge Bauchmuskeln",
	},
	forearms: {
		en: "Forearms",
		no: "Underarmer",
		es: "Antebrazos",
		de: "Unterarme",
	},
	calves: {
		en: "Calves",
		no: "Legger",
		es: "Pantorrillas",
		de: "Waden",
	},
	legs: {
		en: "Legs",
		no: "Ben",
		es: "Piernas",
		de: "Beine",
	},
};

// Equipment translations
export const equipmentTranslations: Record<
	string,
	Record<SupportedLanguage, string>
> = {
	barbell: {
		en: "Barbell",
		no: "Stang",
		es: "Barra",
		de: "Langhantel",
	},
	bench: {
		en: "Bench",
		no: "Benk",
		es: "Banco",
		de: "Bank",
	},
	dumbbells: {
		en: "Dumbbells",
		no: "Manualer",
		es: "Mancuernas",
		de: "Kurzhanteln",
	},
	dumbbell: {
		en: "Dumbbell",
		no: "Manual",
		es: "Mancuerna",
		de: "Kurzhantel",
	},
	squat_rack: {
		en: "Squat Rack",
		no: "Knebøystativ",
		es: "Rack de Sentadillas",
		de: "Kniebeugenständer",
	},
	pull_up_bar: {
		en: "Pull-up Bar",
		no: "Pullup-stang",
		es: "Barra de Dominadas",
		de: "Klimmzugstange",
	},
	bodyweight: {
		en: "Bodyweight",
		no: "Kroppsvekt",
		es: "Peso Corporal",
		de: "Körpergewicht",
	},
	dip_bars: {
		en: "Dip Bars",
		no: "Dip-stenger",
		es: "Barras de Fondos",
		de: "Dip-Barren",
	},
	weight_belt: {
		en: "Weight Belt",
		no: "Vektbelte",
		es: "Cinturón de Peso",
		de: "Gewichtsgürtel",
	},
	leg_curl_machine: {
		en: "Leg Curl Machine",
		no: "Leg curl-maskin",
		es: "Máquina de Curl de Piernas",
		de: "Beinbeuger-Maschine",
	},
	calf_raise_block: {
		en: "Calf Raise Block",
		no: "Leggheving-blokk",
		es: "Bloque para Pantorrillas",
		de: "Wadenblock",
	},
	incline_bench: {
		en: "Incline Bench",
		no: "Skrå benk",
		es: "Banco Inclinado",
		de: "Schrägbank",
	},
	t_bar: {
		en: "T-Bar",
		no: "T-stang",
		es: "Barra T",
		de: "T-Stange",
	},
	plates: {
		en: "Plates",
		no: "Vektskiver",
		es: "Discos",
		de: "Gewichtsscheiben",
	},
	cable_machine: {
		en: "Cable Machine",
		no: "Kabelmaskin",
		es: "Máquina de Cables",
		de: "Kabelzugmaschine",
	},
	rope_attachment: {
		en: "Rope Attachment",
		no: "Tau-tilkobling",
		es: "Accesorio de Cuerda",
		de: "Seilzug",
	},
	hip_thrust_pad: {
		en: "Hip Thrust Pad",
		no: "Hip thrust-pute",
		es: "Almohadilla para Hip Thrust",
		de: "Hip-Thrust-Polster",
	},
	farmer_walk_handles: {
		en: "Farmer Walk Handles",
		no: "Farmer walk-håndtak",
		es: "Asas para Farmer Walk",
		de: "Farmer-Walk-Griffe",
	},
	medicine_ball: {
		en: "Medicine Ball",
		no: "Medisinball",
		es: "Balón Medicinal",
		de: "Medizinball",
	},
	weight_plate: {
		en: "Weight Plate",
		no: "Vektskive",
		es: "Disco de Peso",
		de: "Gewichtsscheibe",
	},
};

// Exercise type translations
export const exerciseTypeTranslations: Record<
	string,
	Record<SupportedLanguage, string>
> = {
	compound: {
		en: "Compound",
		no: "Sammensatt",
		es: "Compuesto",
		de: "Verbund",
	},
	isolation: {
		en: "Isolation",
		no: "Isolasjon",
		es: "Aislamiento",
		de: "Isolation",
	},
	cardio: {
		en: "Cardio",
		no: "Kondisjon",
		es: "Cardio",
		de: "Cardio",
	},
	plyometric: {
		en: "Plyometric",
		no: "Plyometrisk",
		es: "Pliométrico",
		de: "Plyometrisch",
	},
};

// Movement pattern translations
export const movementPatternTranslations: Record<
	string,
	Record<SupportedLanguage, string>
> = {
	push: {
		en: "Push",
		no: "Dytt",
		es: "Empuje",
		de: "Drücken",
	},
	pull: {
		en: "Pull",
		no: "Trekk",
		es: "Tirón",
		de: "Ziehen",
	},
	squat: {
		en: "Squat",
		no: "Knebøy",
		es: "Sentadilla",
		de: "Kniebeuge",
	},
	hinge: {
		en: "Hinge",
		no: "Hengsel",
		es: "Bisagra",
		de: "Hüftgelenk",
	},
	lunge: {
		en: "Lunge",
		no: "Utfall",
		es: "Zancada",
		de: "Ausfallschritt",
	},
	carry: {
		en: "Carry",
		no: "Bær",
		es: "Carga",
		de: "Tragen",
	},
};

// Tags translations
export const tagTranslations: Record<
	string,
	Record<SupportedLanguage, string>
> = {
	compound: {
		en: "Compound",
		no: "Sammensatt",
		es: "Compuesto",
		de: "Verbund",
	},
	strength: {
		en: "Strength",
		no: "Styrke",
		es: "Fuerza",
		de: "Kraft",
	},
	upper_body: {
		en: "Upper Body",
		no: "Overkropp",
		es: "Tren Superior",
		de: "Oberkörper",
	},
	full_body: {
		en: "Full Body",
		no: "Helkropp",
		es: "Cuerpo Completo",
		de: "Ganzkörper",
	},
	lower_body: {
		en: "Lower Body",
		no: "Underkropp",
		es: "Tren Inferior",
		de: "Unterkörper",
	},
	bodyweight: {
		en: "Bodyweight",
		no: "Kroppsvekt",
		es: "Peso Corporal",
		de: "Körpergewicht",
	},
	beginner_friendly: {
		en: "Beginner Friendly",
		no: "Nybegynnervennlig",
		es: "Apto para Principiantes",
		de: "Anfängerfreundlich",
	},
	home_workout: {
		en: "Home Workout",
		no: "Hjemmetrening",
		es: "Entrenamiento en Casa",
		de: "Heimtraining",
	},
	isometric: {
		en: "Isometric",
		no: "Isometrisk",
		es: "Isométrico",
		de: "Isometrisch",
	},
	advanced: {
		en: "Advanced",
		no: "Avansert",
		es: "Avanzado",
		de: "Fortgeschritten",
	},
	posterior_chain: {
		en: "Posterior Chain",
		no: "Bakre kjede",
		es: "Cadena Posterior",
		de: "Hintere Kette",
	},
	pulling: {
		en: "Pulling",
		no: "Trekk",
		es: "Tirón",
		de: "Ziehen",
	},
	pushing: {
		en: "Pushing",
		no: "Dytt",
		es: "Empuje",
		de: "Drücken",
	},
	machine: {
		en: "Machine",
		no: "Maskin",
		es: "Máquina",
		de: "Maschine",
	},
	unilateral: {
		en: "Unilateral",
		no: "Ensidig",
		es: "Unilateral",
		de: "Einseitig",
	},
	balance: {
		en: "Balance",
		no: "Balanse",
		es: "Equilibrio",
		de: "Balance",
	},
	posture: {
		en: "Posture",
		no: "Holdning",
		es: "Postura",
		de: "Haltung",
	},
	cable: {
		en: "Cable",
		no: "Kabel",
		es: "Cable",
		de: "Kabel",
	},
	hip_thrust: {
		en: "Hip Thrust",
		no: "Hip thrust",
		es: "Hip Thrust",
		de: "Hip Thrust",
	},
	functional: {
		en: "Functional",
		no: "Funksjonell",
		es: "Funcional",
		de: "Funktional",
	},
	grip: {
		en: "Grip",
		no: "Grep",
		es: "Agarre",
		de: "Griff",
	},
	neutral_grip: {
		en: "Neutral Grip",
		no: "Nøytralt grep",
		es: "Agarre Neutro",
		de: "Neutraler Griff",
	},
	close_grip: {
		en: "Close Grip",
		no: "Smalt grep",
		es: "Agarre Cerrado",
		de: "Enger Griff",
	},
	pressing: {
		en: "Pressing",
		no: "Press",
		es: "Prensa",
		de: "Drücken",
	},
	thickness: {
		en: "Thickness",
		no: "Tykkelse",
		es: "Grosor",
		de: "Dicke",
	},
	dynamic: {
		en: "Dynamic",
		no: "Dynamisk",
		es: "Dinámico",
		de: "Dynamisch",
	},
	rotation: {
		en: "Rotation",
		no: "Rotasjon",
		es: "Rotación",
		de: "Rotation",
	},
};

// Helper function to translate a single term
export function translateTerm(
	term: string,
	translationMap: Record<string, Record<SupportedLanguage, string>>,
	language: SupportedLanguage
): string {
	const translation = translationMap[term];
	if (!translation) {
		return term; // Return original if no translation found
	}
	return translation[language] || translation.en || term;
}

// Helper function to translate an array of terms
export function translateTerms(
	terms: string[],
	translationMap: Record<string, Record<SupportedLanguage, string>>,
	language: SupportedLanguage
): string[] {
	return terms.map((term) => translateTerm(term, translationMap, language));
}
