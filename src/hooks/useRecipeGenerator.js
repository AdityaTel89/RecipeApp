import { useState, useCallback, useRef } from 'react';
import { fetchRecipeFromGroq } from '../api/groq';
import { fetchRecipeFromGemini } from '../api/gemini';
import { parseRecipeResponse } from '../utils/recipeParser';
import { MESSAGES, REQUEST_COOLDOWN_MS } from '../config/constants';

/**
 * Detects the active provider based on environment configuration.
 * Prioritizes EXPO_PUBLIC_LLM_PROVIDER, then falls back based on key presence.
 */
export function getActiveProvider() {
  const envProvider = process.env.EXPO_PUBLIC_LLM_PROVIDER?.toLowerCase()?.trim();
  if (envProvider === 'gemini') return 'gemini';
  if (envProvider === 'groq') return 'groq';

  const hasGroqKey = !!(process.env.EXPO_PUBLIC_GROQ_KEY || process.env.EXPO_PUBLIC_GROQ_API_KEY);
  const hasGeminiKey = !!(process.env.EXPO_PUBLIC_GEMINI_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY);

  if (hasGroqKey) return 'groq';
  if (hasGeminiKey) return 'gemini';
  return 'groq'; // default fallback
}

/**
 * useRecipeGenerator — the brain of the app.
 *
 * Manages three visual states: 'input' | 'loading' | 'result'
 * Stores lastIngredients for one-tap retry from the error toast.
 *
 * Returns:
 *   appState: 'input' | 'loading' | 'result'
 *   recipe: object | null
 *   error: string | null
 *   isErrorRetryable: boolean
 *   generateRecipe(ingredients: string[]) — main trigger
 *   retryLast() — re-fires the last API call
 *   resetToInput() — clears recipe, goes back to input state
 *   dismissError() — clears the error toast
 */
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
      const provider = getActiveProvider();
      let rawJSON;
      
      if (provider === 'gemini') {
        rawJSON = await fetchRecipeFromGemini(ingredients, servings);
      } else {
        rawJSON = await fetchRecipeFromGroq(ingredients, servings);
      }

      const parsed = parseRecipeResponse(rawJSON);

      if (!parsed) {
        throw new Error(MESSAGES.API_ERROR);
      }

      setRecipe(parsed);
      setAppState('result');
    } catch (err) {
      setAppState('input');
      const msg = err.message ?? MESSAGES.API_ERROR;
      setError(msg);
      
      // Determine if error is retryable (validation/non-food errors are not retryable)
      const isNonFood = msg === MESSAGES.NON_FOOD || msg.includes('food') || msg.includes('ingredients');
      setIsRetryable(!isNonFood);
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