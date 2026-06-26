import { MESSAGES, API_TIMEOUT_MS } from '../config/constants';


const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';

/**

 * @param {string[]} ingredients  - List of ingredient strings
 * @param {number}   servings     - Number of servings (1–20)
 * @param {string}   [provider]   - Optional provider override ('groq'|'gemini'|'openai'|'claude')
 * @returns {Promise<{ recipe: object, provider: string }>}
 */
export async function fetchRecipeFromProxy(ingredients, servings = 2, provider) {
  const endpoint = `${API_BASE_URL}/api/recipe`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  const body = {
    ingredients,
    servings,
    ...(provider ? { provider } : {}),
  };

  let response;

  try {
    response = await fetch(endpoint, {
      method:  'POST',
      signal:  controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(MESSAGES.TIMEOUT);
    }
    throw new Error(MESSAGES.NETWORK_ERROR);
  }

  clearTimeout(timeoutId);

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Surface the server's error message directly when it's a known hard error
    if (response.status === 422 || response.status === 400) {
      throw new Error(data?.error ?? MESSAGES.API_ERROR);
    }
    if (response.status === 429) {
      throw new Error(MESSAGES.RATE_LIMIT);
    }
    if (response.status === 503) {
      throw new Error('Server is not configured yet. Check backend/.env');
    }
    throw new Error(data?.error ?? MESSAGES.API_ERROR);
  }

  if (!data?.recipe) {
    throw new Error(MESSAGES.EMPTY_RESPONSE);
  }

  return data; // { recipe, provider }
}

/**
 * @returns {Promise<{ status: string, providers: string[], timestamp: string }>}
 */
export async function fetchServerHealth() {
  const endpoint = `${API_BASE_URL}/api/health`;
  try {
    const res  = await fetch(endpoint, { method: 'GET' });
    const data = await res.json();
    return data;
  } catch {
    return { status: 'unreachable', providers: [] };
  }
}
