import { GEMINI, MESSAGES } from '../config/constants';

// API key pulled from environment — never hardcoded
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY;

/**
 * Builds the prompt sent to Gemini.
 * Keeping it here means you can iterate on prompt
 * quality without touching any other file.
 */
function buildPrompt(ingredients) {
  return `You are a helpful home cook. Generate one simple, easy-to-follow recipe using ONLY these ingredients: ${ingredients}.

Respond in this exact format:
TITLE: [recipe name]
INGREDIENTS:
- [ingredient and amount]
- [ingredient and amount]
STEPS:
1. [step]
2. [step]

Keep it practical. No extra commentary outside this format.`;
}

/**
 * Calls the Gemini API and returns the raw text response.
 * Throws a typed error so the caller can handle it meaningfully.
 *
 * @param {string} ingredients - cleaned, comma-separated ingredients
 * @returns {Promise<string>} raw text from Gemini
 */
export async function fetchRecipeFromGemini(ingredients) {
  const endpoint = `${GEMINI.API_URL}/${GEMINI.MODEL}:generateContent?key=${API_KEY}`;

  const body = {
    contents: [{ parts: [{ text: buildPrompt(ingredients) }] }],
    generationConfig: {
      maxOutputTokens: GEMINI.MAX_TOKENS,
      temperature:     GEMINI.TEMPERATURE,
    },
  };

  let response;

  try {
    response = await fetch(endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
  } catch {
    // fetch itself threw — almost always a network issue
    throw new Error(MESSAGES.NETWORK_ERROR);
  }

  if (!response.ok) {
    if (response.status === 429) {
      // Rate limit or quota exhausted — tell the user clearly
      throw new Error(MESSAGES.RATE_LIMIT);
    }
    if (response.status === 401 || response.status === 403) {
      // Bad or missing API key
      throw new Error('Invalid API key. Please check your configuration.');
    }
    // All other HTTP errors (500, etc.)
    throw new Error(MESSAGES.API_ERROR);
  }

  const data = await response.json();

  // Safely dig into nested Gemini response structure
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error(MESSAGES.API_ERROR);
  }

  return text;
}