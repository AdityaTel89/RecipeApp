import { GROQ, MESSAGES, API_TIMEOUT_MS } from '../config/constants';

const API_KEY = process.env.EXPO_PUBLIC_GROQ_KEY;

// ─── System Prompt (PRD §10.1) ───────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a professional chef and recipe writer. Your job is to create clear, detailed, easy-to-follow recipes based on a list of ingredients a home cook has available.

STRICT RULES:
1. Only use the ingredients provided. You may add water, salt, pepper, and basic cooking oil without being asked — these are pantry staples.
2. Return ONLY valid JSON. No markdown, no preamble, no explanation outside the JSON object.
3. Write a minimum of 8 steps and a maximum of 12 steps.
4. Each step must be 2–4 sentences long. Explain the "why" behind each action — not just "do this" but "do this because...". This helps beginner cooks understand the process.
5. Include a clear step title for each step (e.g., "Season the chicken").
6. Include realistic quantities for each ingredient, not vague amounts.
7. The recipe must be realistically cookable in a standard home kitchen.
8. If the ingredients cannot form a real recipe (e.g., non-food items), return: { "error": "These don't appear to be food ingredients." }
9. Always include a "tips" field with one useful cooking tip.
10. Estimate cook_time honestly. Do not say "10 minutes" if it takes 30.`;

// ─── User Prompt Builder (PRD §10.2) ─────────────────────────────────────────
function buildUserPrompt(ingredients) {
  const list = Array.isArray(ingredients) ? ingredients.join(', ') : ingredients;
  return `Create a complete recipe using these ingredients: ${list}.

Follow this JSON schema exactly:
{
  "title": string,
  "cook_time": string,
  "servings": string,
  "difficulty": "Easy" | "Medium" | "Hard",
  "ingredients": [{ "quantity": string, "unit": string, "name": string }],
  "steps": [{ "step_number": number, "title": string, "instruction": string }],
  "tips": string
}`;
}

/**
 * Calls the Groq API with a structured JSON prompt.
 * Uses AbortController for a 15-second timeout.
 *
 * @param {string|string[]} ingredients — cleaned ingredient list
 * @returns {Promise<object>} parsed recipe JSON
 */
export async function fetchRecipeFromGroq(ingredients) {
  if (!API_KEY) {
    throw new Error('Groq API key not configured. Check your .env file.');
  }

  const endpoint = `${GROQ.API_URL}/chat/completions`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  const body = {
    model:           GROQ.MODEL,
    temperature:     GROQ.TEMPERATURE,
    max_tokens:      GROQ.MAX_TOKENS,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: buildUserPrompt(ingredients) },
    ],
  };

  let response;

  try {
    response = await fetch(endpoint, {
      method:  'POST',
      signal:  controller.signal,
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${API_KEY}`,
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
  const raw = data?.choices?.[0]?.message?.content;

  if (!raw) {
    throw new Error(MESSAGES.EMPTY_RESPONSE);
  }

  // Parse the JSON content returned by Groq
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Couldn't read the recipe. Tap to try again.");
  }

  return parsed;
}
