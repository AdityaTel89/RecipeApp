import { useState, useCallback, useRef } from 'react';
import { fetchRecipeFromGroq } from '../api/groq';
import { parseRecipeResponse } from '../utils/recipeParser';
import { MESSAGES, REQUEST_COOLDOWN_MS } from '../config/constants';

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
 *   generateRecipe(ingredients: string[]) — main trigger
 *   retryLast() — re-fires the last API call
 *   resetToInput() — clears recipe, goes back to input state
 *   dismissError() — clears the error toast
 */
export function useRecipeGenerator() {
  const [appState,  setAppState]  = useState('input');
  const [recipe,    setRecipe]    = useState(null);
  const [error,     setError]     = useState(null);

  const lastIngredientsRef = useRef([]);
  const lastRequestTimeRef = useRef(0);

  const _callAPI = useCallback(async (ingredients) => {
    setError(null);
    setAppState('loading');

    try {
      const rawJSON = await fetchRecipeFromGroq(ingredients);
      const parsed  = parseRecipeResponse(rawJSON);

      if (!parsed) {
        throw new Error(MESSAGES.API_ERROR);
      }

      setRecipe(parsed);
      setAppState('result');
    } catch (err) {
      setAppState('input');
      setError(err.message ?? MESSAGES.API_ERROR);
    }
  }, []);

  const generateRecipe = useCallback(async (ingredients) => {
    // Validation: must have at least 1 ingredient to call API
    if (!ingredients || ingredients.length === 0) {
      setError(MESSAGES.EMPTY_INPUT);
      return;
    }

    // Client-side cooldown
    const now = Date.now();
    const elapsed = now - lastRequestTimeRef.current;
    if (elapsed < REQUEST_COOLDOWN_MS) {
      const secsLeft = Math.ceil((REQUEST_COOLDOWN_MS - elapsed) / 1000);
      setError(`${MESSAGES.COOLDOWN} (${secsLeft}s remaining)`);
      return;
    }

    lastRequestTimeRef.current = now;
    lastIngredientsRef.current = ingredients;

    // §8.1 — 1 ingredient: show warning toast but still proceed with API call
    if (ingredients.length === 1) {
      setError(MESSAGES.ONE_INGREDIENT);
    }

    await _callAPI(ingredients);
  }, [_callAPI]);

  const retryLast = useCallback(() => {
    if (lastIngredientsRef.current.length > 0) {
      lastRequestTimeRef.current = 0; // Bypass cooldown on retry
      _callAPI(lastIngredientsRef.current);
    }
  }, [_callAPI]);

  const resetToInput = useCallback(() => {
    setRecipe(null);
    setError(null);
    setAppState('input');
  }, []);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  const loadSuggestedRecipe = useCallback((mockRecipe) => {
    setError(null);
    setRecipe(mockRecipe);
    setAppState('result');
  }, []);

  return {
    appState,
    recipe,
    error,
    generateRecipe,
    retryLast,
    resetToInput,
    dismissError,
    loadSuggestedRecipe,
  };
}