import { GROQ, MESSAGES } from '../config/constants';

// API key pulled from environment — never hardcoded
const API_KEY = process.env.EXPO_PUBLIC_GROQ_KEY;

/**
 * Builds the chat prompt sent to Groq.
 * Keeping it here means you can iterate on prompt
 * quality without touching any other file.
 */
function buildMessages(ingredients) {
  return [
    {
      role: 'system',
      content:
        'You are a helpful home cook. When given a list of ingredients, you generate one simple, practical, easy-to-follow recipe using ONLY those ingredients.',
    },
    {
      role: 'user',
      content: `Generate one simple recipe using ONLY these ingredients: ${ingredients}.

Respond in this exact format:
TITLE: [recipe name]
INGREDIENTS:
- [ingredient and amount]
- [ingredient and amount]
STEPS:
1. [step]
2. [step]

Keep it practical. No extra commentary outside this format.`,
    },
  ];
}

/**
 * Calls the Groq API (OpenAI-compatible) and returns the raw text response.
 * Throws a typed error so the caller can handle it meaningfully.
 *
 * @param {string} ingredients - cleaned, comma-separated ingredients
 * @returns {Promise<string>} raw text from Groq
 */
export async function fetchRecipeFromGroq(ingredients) {
  const endpoint = `${GROQ.API_URL}/chat/completions`;

  const body = {
    model:       GROQ.MODEL,
    messages:    buildMessages(ingredients),
    max_tokens:  GROQ.MAX_TOKENS,
    temperature: GROQ.TEMPERATURE,
  };

  let response;

  try {
    response = await fetch(endpoint, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    // fetch itself threw — almost always a network issue
    throw new Error(MESSAGES.NETWORK_ERROR);
  }

  if (!response.ok) {
    if (response.status === 429) {
      // Rate limit or quota exhausted
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

  // Safely dig into Groq's OpenAI-compatible response structure
  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error(MESSAGES.API_ERROR);
  }

  return text;
}
