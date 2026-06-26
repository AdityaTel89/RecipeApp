import { useState, useCallback, useRef } from 'react';
import { fetchRecipeFromGroq }   from '../api/groq';
import { fetchRecipeFromGemini } from '../api/gemini';
import { fetchRecipeFromOpenAI } from '../api/openai';
import { fetchRecipeFromClaude } from '../api/claude';
import { parseRecipeResponse }   from '../utils/recipeParser';
import { MESSAGES, REQUEST_COOLDOWN_MS, PROVIDER_PRIORITY, PROVIDER_LABELS } from '../config/constants';

// ─── Provider key detection ───────────────────────────────────────────────────

/**
 * Returns true if the given provider has an API key configured in the environment.
 * @param {'openai'|'groq'|'gemini'|'claude'} provider
 */
function hasKeyForProvider(provider) {
  switch (provider) {
    case 'openai':
      return !!(process.env.EXPO_PUBLIC_OPENAI_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY);
    case 'groq':
      return !!(process.env.EXPO_PUBLIC_GROQ_KEY || process.env.EXPO_PUBLIC_GROQ_API_KEY);
    case 'gemini':
      return !!(process.env.EXPO_PUBLIC_GEMINI_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY);
    case 'claude':
      return !!(process.env.EXPO_PUBLIC_CLAUDE_KEY || process.env.EXPO_PUBLIC_CLAUDE_API_KEY);
    default:
      return false;
  }
}

/**
 * @returns {string[]} ordered provider names, e.g. ['openai', 'groq']
 */
export function getConfiguredProviders() {
  const override = process.env.EXPO_PUBLIC_LLM_PROVIDER?.toLowerCase()?.trim();
  const validProviders = ['openai', 'groq', 'gemini', 'claude'];

  // Explicit override — lock to that single provider
  if (override && validProviders.includes(override)) {
    return [override];
  }

  // Auto-detect: return all providers with keys, in priority order
  return PROVIDER_PRIORITY.filter(p => hasKeyForProvider(p));
}

/**
 * Legacy single-provider helper kept for components that only need
 * to know "the primary provider" for display/banner purposes.
 */
export function getActiveProvider() {
  const providers = getConfiguredProviders();
  return providers.length > 0 ? providers[0] : null;
}

// ─── Per-provider fetch dispatch ─────────────────────────────────────────────

/**
 * Calls the appropriate API for the given provider.
 *
 * @param {string} provider — one of 'openai' | 'groq' | 'gemini' | 'claude'
 * @param {string[]} ingredients
 * @param {number} servings
 * @returns {Promise<object>} raw recipe JSON from the API
 */
async function callProvider(provider, ingredients, servings) {
  switch (provider) {
    case 'openai':  return fetchRecipeFromOpenAI(ingredients, servings);
    case 'groq':    return fetchRecipeFromGroq(ingredients, servings);
    case 'gemini':  return fetchRecipeFromGemini(ingredients, servings);
    case 'claude':  return fetchRecipeFromClaude(ingredients, servings);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}


function isHardError(errorMessage) {
  const msg = errorMessage?.toLowerCase() ?? '';
  return (
    msg.includes('invalid') && msg.includes('key') ||
    msg.includes('api key not configured') ||
    msg.includes('food ingredient') ||
    msg.includes('don\'t appear to be food') ||
    msg.includes('non-food') ||
    msg.includes('invalid_request_error')
  );
}



/**
 * @param {string[]} ingredients
 * @param {number} servings
 * @returns {Promise<object>} parsed recipe object
 */
async function fetchRecipeWithFallback(ingredients, servings) {
  const providers = getConfiguredProviders();

  if (providers.length === 0) {
    throw new Error(
      'No API key configured. Add at least one key to your .env file.\n' +
      '(EXPO_PUBLIC_OPENAI_KEY, EXPO_PUBLIC_GROQ_KEY, EXPO_PUBLIC_GEMINI_KEY, or EXPO_PUBLIC_CLAUDE_KEY)'
    );
  }

  let lastError = null;

  for (const provider of providers) {
    try {
      const rawJSON = await callProvider(provider, ingredients, servings);
      return parseRecipeResponse(rawJSON); // success — return immediately
    } catch (err) {
      lastError = err;
      const msg = err.message ?? '';

      // Hard errors — stop immediately, surface to user
      if (isHardError(msg)) {
        throw err;
      }

      // Soft error — log and try next provider
      if (__DEV__) {
        console.warn(`[RecipeApp] Provider "${PROVIDER_LABELS[provider] ?? provider}" failed (${msg}). Trying next…`);
      }
      // continue to next iteration
    }
  }

  // All providers exhausted
  if (providers.length > 1) {
    throw new Error('All configured providers are unavailable. Please wait a moment and try again.');
  }

  // Single provider failed — surface its own error message
  throw lastError ?? new Error(MESSAGES.API_ERROR);
}

export function useRecipeGenerator() {
  const [appState,  setAppState]      = useState('input');
  const [recipe,    setRecipe]        = useState(null);
  const [error,     setError]         = useState(null);
  const [isErrorRetryable, setIsRetryable] = useState(false);

  const lastIngredientsRef = useRef([]);
  const lastServingsRef    = useRef(2);
  const lastRequestTimeRef = useRef(0);

  const _callAPI = useCallback(async (ingredients, servings) => {
    // Fix Bug 3.1: Do not clear setError if it contains ONE_INGREDIENT warning
    setError(prev => prev === MESSAGES.ONE_INGREDIENT ? prev : null);
    setAppState('loading');

    try {
      const parsed = await fetchRecipeWithFallback(ingredients, servings);

      if (!parsed) {
        throw new Error(MESSAGES.API_ERROR);
      }

      setRecipe(parsed);
      setAppState('result');
    } catch (err) {
      setAppState('input');
      const msg = err.message ?? MESSAGES.API_ERROR;
      setError(msg);

      
      const isNonRetryable =
        isHardError(msg) ||
        msg === MESSAGES.NON_FOOD ||
        msg.includes('food') ||
        msg.includes('No API key configured');
      setIsRetryable(!isNonRetryable);
    }
  }, []);

  const generateRecipe = useCallback(async (ingredients, servings = 2) => {
    // Validation: must have at least 1 ingredient to call API
    if (!ingredients || ingredients.length === 0) {
      setError(MESSAGES.EMPTY_INPUT);
      setIsRetryable(false);
      return;
    }

    // Client-side cooldown
    const now = Date.now();
    const elapsed = now - lastRequestTimeRef.current;
    if (elapsed < REQUEST_COOLDOWN_MS) {
      const secsLeft = Math.ceil((REQUEST_COOLDOWN_MS - elapsed) / 1000);
      setError(`${MESSAGES.COOLDOWN} (${secsLeft}s remaining)`);
      setIsRetryable(false);
      return;
    }

    lastRequestTimeRef.current = now;
    lastIngredientsRef.current = ingredients;
    lastServingsRef.current    = servings;

    // 1 ingredient: show warning toast but still proceed with API call
    if (ingredients.length === 1) {
      setError(MESSAGES.ONE_INGREDIENT);
      setIsRetryable(false);
    }

    await _callAPI(ingredients, servings);
  }, [_callAPI]);

  const retryLast = useCallback(() => {
    if (lastIngredientsRef.current.length > 0) {
      lastRequestTimeRef.current = 0; // Bypass cooldown on retry
      _callAPI(lastIngredientsRef.current, lastServingsRef.current);
    }
  }, [_callAPI]);

  const resetToInput = useCallback(() => {
    setRecipe(null);
    setError(null);
    setIsRetryable(false);
    setAppState('input');
  }, []);

  const dismissError = useCallback(() => {
    setError(null);
    setIsRetryable(false);
  }, []);

  const loadSuggestedRecipe = useCallback((mockRecipe) => {
    setError(null);
    setIsRetryable(false);
    setRecipe(mockRecipe);
    setAppState('result');
  }, []);

  return {
    appState,
    recipe,
    error,
    isErrorRetryable,
    generateRecipe,
    retryLast,
    resetToInput,
    dismissError,
    loadSuggestedRecipe,
  };
}