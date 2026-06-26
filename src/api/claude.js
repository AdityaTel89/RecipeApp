import { CLAUDE, MESSAGES, API_TIMEOUT_MS } from '../config/constants';

const API_KEY = process.env.EXPO_PUBLIC_CLAUDE_KEY || process.env.EXPO_PUBLIC_CLAUDE_API_KEY;

const SYSTEM_PROMPT = `You are a professional chef and recipe writer. Your job is to create clear, detailed, easy-to-follow recipes based on a list of ingredients a home cook has available.

STRICT RULES:
1. Only use the ingredients provided. You may add water, salt, pepper, and basic cooking oil without being asked — these are pantry staples.
2. Return ONLY valid JSON matching the requested schema. Do NOT include markdown formatting (no \`\`\`json fences), no preamble, no explanation — ONLY the raw JSON object.
3. Write a minimum of 8 steps and a maximum of 12 steps.
4. Each step must be 2–4 sentences long. Explain the "why" behind each action — not just "do this" but "do this because...". This helps beginner cooks understand the process.
5. Include a clear step title for each step (e.g., "Season the chicken").
6. Include realistic quantities for each ingredient, not vague amounts.
7. The recipe must be realistically cookable in a standard home kitchen.
8. If the ingredients cannot form a real recipe (e.g., non-food items), return: { "error": "These don't appear to be food ingredients." }
9. Always include a "tips" field with one useful cooking tip.
10. Estimate cook_time honestly. Do not say "10 minutes" if it takes 30.
11. Your entire response must be a single, valid JSON object — nothing before or after it.`;

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


function stripMarkdownFences(text) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

/**
 * @param {string|string[]} ingredients — cleaned ingredient list
 * @param {number} servings — number of servings requested
 * @returns {Promise<object>} parsed recipe JSON
 */
export async function fetchRecipeFromClaude(ingredients, servings = 2) {
  if (!API_KEY) {
    throw new Error('Claude API key not configured. Add EXPO_PUBLIC_CLAUDE_KEY to your .env file.');
  }

  const endpoint = `${CLAUDE.API_URL}/messages`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  const body = {
    model:      CLAUDE.MODEL,
    max_tokens: CLAUDE.MAX_TOKENS,
    system:     SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: buildUserPrompt(ingredients, servings) },
    ],
  };

  let response;

  try {
    response = await fetch(endpoint, {
      method:  'POST',
      signal:  controller.signal,
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         API_KEY,
        'anthropic-version': CLAUDE.API_VERSION,
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
    // Claude returns error details in the body — try to read them
    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch { /* ignore parse errors */ }

    if (response.status === 429) throw new Error(MESSAGES.RATE_LIMIT);
    if (response.status === 401 || response.status === 403) {
      throw new Error('Invalid Claude API key. Please check your .env configuration.');
    }
    if (response.status === 400 && errorBody?.error?.type === 'invalid_request_error') {
      throw new Error(`Claude request error: ${errorBody.error.message}`);
    }
    if (response.status >= 500) throw new Error(MESSAGES.API_ERROR);
    throw new Error(MESSAGES.API_ERROR);
  }

  const data = await response.json();

  const raw = data?.content?.[0]?.text;

  if (!raw) {
    throw new Error(MESSAGES.EMPTY_RESPONSE);
  }

  // Strip any markdown fences Claude may have added
  const cleaned = stripMarkdownFences(raw);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Couldn't read the recipe. Tap to try again.");
  }

  return parsed;
}
