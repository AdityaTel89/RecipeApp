import { GEMINI, MESSAGES, API_TIMEOUT_MS } from '../config/constants';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// System Prompt
const SYSTEM_PROMPT = `You are a professional chef and recipe writer. Your job is to create clear, detailed, easy-to-follow recipes based on a list of ingredients a home cook has available.

STRICT RULES:
1. Only use the ingredients provided. You may add water, salt, pepper, and basic cooking oil without being asked — these are pantry staples.
2. Return ONLY valid JSON matching the requested schema. Do not include markdown block formatting (like \`\`\`json).
3. Write a minimum of 8 steps and a maximum of 12 steps.
4. Each step must be 2–4 sentences long. Explain the "why" behind each action — not just "do this" but "do this because...". This helps beginner cooks understand the process.
5. Include a clear step title for each step (e.g., "Season the chicken").
6. Include realistic quantities for each ingredient, not vague amounts.
7. The recipe must be realistically cookable in a standard home kitchen.
8. If the ingredients cannot form a real recipe (e.g., non-food items), return: { "error": "These don't appear to be food ingredients." }
9. Always include a "tips" field with one useful cooking tip.
10. Estimate cook_time honestly. Do not say "10 minutes" if it takes 30.`;

// User Prompt Builder
function buildUserPrompt(ingredients, servings = 2) {
  const list = Array.isArray(ingredients) ? ingredients.join(', ') : ingredients;
  return `Create a complete recipe using these ingredients: ${list}.
The recipe MUST be scaled exactly for ${servings} serving${servings === 1 ? '' : 's'}. Adjust the ingredient quantities, cooking times, and cooking process/instructions to suit this serving size.

Follow this JSON schema exactly:
{
  "title": string,
  "cook_time": string,
  "servings": "${servings}",
  "difficulty": "Easy" | "Medium" | "Hard",
  "ingredients": [{ "quantity": string, "unit": string, "name": string }],
  "steps": [{ "step_number": number, "title": string, "instruction": string }],
  "tips": string
}`;
}

/**
 * Calls the Gemini API with structured JSON output enabled.
 * Uses AbortController for a 15-second timeout.
 *
 * @param {string|string[]} ingredients — cleaned ingredient list
 * @param {number} servings — number of servings requested
 * @returns {Promise<object>} parsed recipe JSON
 */
export async function fetchRecipeFromGemini(ingredients, servings = 2) {
  if (!API_KEY) {
    throw new Error('Gemini API key not configured. Check your .env file.');
  }

  const endpoint = `${GEMINI.API_URL}/${GEMINI.MODEL}:generateContent?key=${API_KEY}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  const body = {
    contents: [{ parts: [{ text: buildUserPrompt(ingredients, servings) }] }],
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    generationConfig: {
      maxOutputTokens: GEMINI.MAX_TOKENS,
      temperature:     GEMINI.TEMPERATURE,
      responseMimeType: "application/json",
    },
  };

  let response;

  try {
    response = await fetch(endpoint, {
      method:  'POST',
      signal:  controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(MESSAGES.TIMEOUT);
    }
    throw new Error(MESSAGES.NETWORK_ERROR);
  }

  clearTimeout(timeoutId);

  if (!response.ok) {
    if (response.status === 429) throw new Error(MESSAGES.RATE_LIMIT);
    if (response.status === 401 || response.status === 403) {
      throw new Error('Invalid API key. Please check your configuration.');
    }
    if (response.status >= 500) throw new Error(MESSAGES.API_ERROR);
    throw new Error(MESSAGES.API_ERROR);
  }

  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!raw) {
    throw new Error(MESSAGES.EMPTY_RESPONSE);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Couldn't read the recipe. Tap to try again.");
  }

  return parsed;
}