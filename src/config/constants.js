// Color Tokens
export const COLORS = {
  bgBase:          '#FFFAF4',   // Screen background — warm off-white
  bgCard:          '#FFFFFF',   // Recipe card surface
  accentPrimary:   '#E8531D',   // CTA button, active tags, step numbers
  accentSecondary: '#F7A25A',   // Tag border, subtle highlights
  textPrimary:     '#1A1208',   // Headlines, body
  textSecondary:   '#6B5E4E',   // Placeholders, meta text
  textOnAccent:    '#FFFFFF',   // Text on orange/red buttons
  borderSubtle:    '#EDE4D8',   // Input border, dividers
  tagBg:           '#FFF5EC',   // Ingredient tag fill
  tipBg:           '#FFF8EE',   // Chef's tip card fill
  error:           '#C0392B',   // Error toast background
  accentDark:      '#C94415',   // CTA button pressed state
  buttonDisabled:  '#D4C5B5',   // Disabled CTA fill
  buttonDisabledText: '#9E8F82',// Disabled CTA label
  skeletonBase:    '#EDE4D8',   // Skeleton shimmer start/end
  skeletonHighlight: '#F7F0E8', // Skeleton shimmer peak
};

// Typography Scale
export const TYPOGRAPHY = {
  heroSize:     28,
  recipeTitleSize: 22,
  sectionHeaderSize: 13,
  bodySize:     15,
  stepNumberSize: 13,
  tagSize:      13,
  buttonSize:   16,
  placeholderSize: 14,
  microSize:    12,
  smallSize:    11,
};

// Spacing Scale — 8pt grid
export const SPACING = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  xxl:  32,
  xxxl: 40,
  huge: 48,
};

// Border Radius
export const RADIUS = {
  button:     14,
  input:      14,
  tag:        100,
  card:       20,
  stepBubble: 50,
  toast:      12,
  tip:        10,
};

// Groq model configuration (OpenAI-compatible API)
export const GROQ = {
  MODEL:       'llama-3.3-70b-versatile',
  API_URL:     'https://api.groq.com/openai/v1',
  MAX_TOKENS:  1500,
  TEMPERATURE: 0.7,
};

// Gemini model configuration
export const GEMINI = {
  MODEL:       'gemini-1.5-flash',
  API_URL:     'https://generativelanguage.googleapis.com/v1beta/models',
  MAX_TOKENS:  1500,
  TEMPERATURE: 0.7,
};

// OpenAI model configuration
export const OPENAI = {
  MODEL:       'gpt-4o-mini',
  API_URL:     'https://api.openai.com/v1',
  MAX_TOKENS:  1500,
  TEMPERATURE: 0.7,
};

// Anthropic Claude model configuration
export const CLAUDE = {
  MODEL:       'claude-3-haiku-20240307',
  API_URL:     'https://api.anthropic.com/v1',
  API_VERSION: '2023-06-01',
  MAX_TOKENS:  1500,
};


export const PROVIDER_PRIORITY = ['openai', 'groq', 'gemini', 'claude'];

// Human-readable display labels for each provider
export const PROVIDER_LABELS = {
  openai: 'OpenAI',
  groq:   'Groq',
  gemini: 'Gemini',
  claude: 'Claude',
};


// Input Validation Rules
export const VALIDATION = {
  MIN_INGREDIENTS:       2,
  MAX_INGREDIENTS:       10,
  MAX_INPUT_LENGTH:      300,
  MIN_INGREDIENT_LENGTH: 2,
};

// User-facing Messages
export const MESSAGES = {
  EMPTY_INPUT:        'Enter at least 2 ingredients to start.',
  TOO_FEW:            'Add at least 2 ingredients for a recipe.',
  TOO_MANY:           "That's plenty! Using the first 10 ingredients.",
  INPUT_TOO_LONG:     'Keep your ingredients under 300 characters.',
  API_ERROR:          'Something went wrong on our end. Tap to retry.',
  NETWORK_ERROR:      'No internet connection. Check your Wi-Fi and try again.',
  INVALID_INGREDIENT: 'Each ingredient should be at least 2 characters.',
  RATE_LIMIT:         'We hit a limit. Please wait a moment and retry.',
  COOLDOWN:           'Please wait a moment before generating another recipe.',
  TIMEOUT:            'This is taking too long. Try again?',
  NON_FOOD:           "Those don't look like food ingredients. Try again?",
  SINGLE_WORD_HINT:   'Separate ingredients with commas — e.g. eggs, butter, flour',
  ONE_INGREDIENT:     'Try adding 1–2 more ingredients for a better recipe.',
  EMPTY_RESPONSE:     'No recipe was generated. Try different ingredients.',
};

// Loading Messages
export const LOADING_MESSAGES = [
  'Checking your pantry...',
  'Finding the perfect match...',
  'Writing step-by-step instructions...',
  'Almost ready to cook!',
];

// Client-side cooldown between requests
export const REQUEST_COOLDOWN_MS = 5000;

// API timeout
export const API_TIMEOUT_MS = 15000;

// Font Configuration
export const FONTS = {
  playfairBold: 'PlayfairDisplay_700Bold',
  playfairSemiBold: 'PlayfairDisplay_600SemiBold',
  interRegular: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  interSemiBold: 'Inter_600SemiBold',
  interBold: 'Inter_700Bold',
};

// Quick Add Pantry Ingredients
export const QUICK_ADD_INGREDIENTS = [
  'chicken',
  'eggs',
  'garlic',
  'onion',
  'rice',
  'tomato',
  'pasta',
  'potato',
  'cheese',
];

// Instant Suggested Recipes
export const SUGGESTED_RECIPES = [
  {
    title: "Quick Tomato Pasta",
    cook_time: "15 minutes",
    servings: "2",
    difficulty: "Easy",
    description: "Rich and comforting classic pasta made with simple pantry staples.",
    ingredients: [
      { quantity: "200", unit: "g", name: "pasta (spaghetti or penne)" },
      { quantity: "1", unit: "can", name: "crushed tomatoes" },
      { quantity: "3", unit: "cloves", name: "garlic, minced" },
      { quantity: "2", unit: "tbsp", name: "olive oil" },
      { quantity: "50", unit: "g", name: "parmesan cheese, grated" }
    ],
    steps: [
      {
        step_number: 1,
        title: "Boil the pasta",
        instruction: "Bring a large pot of salted water to a boil. Add the pasta and cook according to package instructions until al dente. Drain, reserving 1/4 cup of pasta water."
      },
      {
        step_number: 2,
        title: "Sauté garlic",
        instruction: "While pasta cooks, heat olive oil in a large skillet over medium heat. Add the minced garlic and sauté for 1-2 minutes until fragrant but not browned."
      },
      {
        step_number: 3,
        title: "Simmer tomatoes",
        instruction: "Pour in the canned crushed tomatoes. Stir well and bring to a gentle simmer. Cook for 8-10 minutes, letting the sauce thicken slightly."
      },
      {
        step_number: 4,
        title: "Combine pasta & sauce",
        instruction: "Toss the drained pasta directly into the skillet with the tomato sauce. Mix well, adding a splash of reserved pasta water if the sauce is too thick."
      },
      {
        step_number: 5,
        title: "Garnish and serve",
        instruction: "Divide pasta onto plates, sprinkle generously with grated parmesan cheese and fresh black pepper. Serve hot."
      }
    ],
    tips: "Add fresh basil at the end for an extra burst of freshness!"
  },
  {
    title: "Garlic Butter Fried Rice",
    cook_time: "12 minutes",
    servings: "1",
    difficulty: "Easy",
    description: "Quick, fragrant, and highly satisfying fried rice coated in garlic butter.",
    ingredients: [
      { quantity: "2", unit: "cups", name: "cooked rice (preferably day-old)" },
      { quantity: "4", unit: "cloves", name: "garlic, finely minced" },
      { quantity: "2", unit: "tbsp", name: "butter" },
      { quantity: "1", unit: "tbsp", name: "soy sauce" },
      { quantity: "2", unit: "large", name: "eggs, beaten" }
    ],
    steps: [
      {
        step_number: 1,
        title: "Sauté garlic in butter",
        instruction: "Melt butter in a large skillet or wok over medium heat. Add the minced garlic and fry for 2-3 minutes until golden brown and aromatic."
      },
      {
        step_number: 2,
        title: "Scramble the eggs",
        instruction: "Push the garlic to one side of the skillet. Pour the beaten eggs into the empty space and scramble gently until just cooked through."
      },
      {
        step_number: 3,
        title: "Add the rice",
        instruction: "Add the cold cooked rice to the skillet, breaking up any clumps with a spatula. Turn the heat to high and stir-fry for 3-4 minutes."
      },
      {
        step_number: 4,
        title: "Season with soy sauce",
        instruction: "Drizzle the soy sauce around the edges of the pan so it caramelizes slightly, then toss everything together until evenly coated."
      },
      {
        step_number: 5,
        title: "Garnish and serve",
        instruction: "Season with black pepper to taste. Garnish with chopped green onions if available and serve immediately."
      }
    ],
    tips: "Using cold, day-old rice prevents it from becoming mushy when fried."
  },
  {
    title: "Easy Garlic Butter Chicken",
    cook_time: "20 minutes",
    servings: "2",
    difficulty: "Medium",
    description: "Juicy chicken breast bites tossed in a rich, citrusy garlic butter sauce.",
    ingredients: [
      { quantity: "2", unit: "large", name: "chicken breasts, cubed" },
      { quantity: "4", unit: "cloves", name: "garlic, minced" },
      { quantity: "3", unit: "tbsp", name: "butter" },
      { quantity: "1", unit: "tbsp", name: "olive oil" },
      { quantity: "0.5", unit: "lemon", name: "juiced" }
    ],
    steps: [
      {
        step_number: 1,
        title: "Sear the chicken",
        instruction: "Heat olive oil and 1 tbsp butter in a large skillet over medium-high heat. Season chicken cubes with salt and pepper, then sear for 5-6 minutes until browned."
      },
      {
        step_number: 2,
        title: "Add garlic & butter",
        instruction: "Reduce heat to medium. Melt the remaining 2 tbsp butter in the skillet, then stir in the minced garlic. Sauté for 1-2 minutes."
      },
      {
        step_number: 3,
        title: "Coat chicken in sauce",
        instruction: "Toss the chicken cubes in the garlic butter sauce, ensuring every piece is well coated. Let simmer for 2-3 minutes until chicken is cooked through."
      },
      {
        step_number: 4,
        title: "Finish with lemon juice",
        instruction: "Squeeze the fresh lemon juice over the chicken to cut through the richness of the butter and add brightness. Stir well."
      },
      {
        step_number: 5,
        title: "Rest and serve",
        instruction: "Remove from heat and let rest for 2 minutes. Garnish with chopped parsley if desired and serve hot."
      }
    ],
    tips: "Make sure not to burn the garlic; cook it on medium or low heat for the best sweet garlic flavor."
  }
];