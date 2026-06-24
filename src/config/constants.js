// Gemini model configuration
export const GEMINI = {
  MODEL:       'gemini-2.0-flash',
  API_URL:     'https://generativelanguage.googleapis.com/v1beta/models',
  MAX_TOKENS:  1024,
  TEMPERATURE: 0.7,
};

// Groq model configuration (OpenAI-compatible API)
export const GROQ = {
  MODEL:       'llama-3.3-70b-versatile',   // fast, generous free tier
  API_URL:     'https://api.groq.com/openai/v1',
  MAX_TOKENS:  1024,
  TEMPERATURE: 0.7,
};

// Input validation rules
export const VALIDATION = {
  MIN_INGREDIENTS:       1,
  MAX_INGREDIENTS:       10,
  MAX_INPUT_LENGTH:      200,
  MIN_INGREDIENT_LENGTH: 2,
};

// User-facing messages — all strings live here, not scattered in components
export const MESSAGES = {
  EMPTY_INPUT:        'Please enter at least one ingredient.',
  TOO_MANY:           `You can enter up to ${VALIDATION.MAX_INGREDIENTS} ingredients.`,
  INPUT_TOO_LONG:     `Keep it under ${VALIDATION.MAX_INPUT_LENGTH} characters.`,
  API_ERROR:          'Something went wrong. Please try again.',
  NETWORK_ERROR:      'No internet connection. Check your network and retry.',
  INVALID_INGREDIENT: 'Each ingredient should be at least 2 characters.',
  RATE_LIMIT:         'API quota exceeded. Please wait a moment before trying again.',
  COOLDOWN:           'Please wait a few seconds before generating another recipe.',
};

// Client-side cooldown between requests (ms) to avoid hammering the API
export const REQUEST_COOLDOWN_MS = 5000;