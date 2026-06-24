import { useState, useCallback, useRef } from 'react';
import { fetchRecipeFromGroq } from '../api/groq';
import { validateIngredients, sanitiseIngredients } from '../utils/validators';
import { parseRecipeResponse } from '../utils/recipeParser';
import { MESSAGES, REQUEST_COOLDOWN_MS } from '../config/constants';

/**
 * useRecipeGenerator — the brain of the app.
 *
 * Wires together: validation → cooldown check → API call → parsing → state.
 * The screen stays completely dumb — it just calls generateRecipe()
 * and reads back { recipe, isLoading, error }.
 *
 * useCallback ensures generateRecipe doesn't get recreated on
 * every render, which matters if it's passed as a prop.
 */
export function useRecipeGenerator() {
  const [recipe,    setRecipe]    = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState(null);

  // Tracks the timestamp of the last successful API call
  const lastRequestTimeRef = useRef(0);

  const generateRecipe = useCallback(async (rawInput) => {
    // Always reset state before a new attempt
    setError(null);
    setRecipe(null);

    // Layer 1 — validate before touching the network
    const { isValid, message } = validateIngredients(rawInput);
    if (!isValid) {
      setError(message);
      return;
    }

    // Layer 2 — client-side cooldown to prevent quota abuse
    const now = Date.now();
    const timeSinceLast = now - lastRequestTimeRef.current;
    if (timeSinceLast < REQUEST_COOLDOWN_MS) {
      const secondsLeft = Math.ceil((REQUEST_COOLDOWN_MS - timeSinceLast) / 1000);
      setError(`${MESSAGES.COOLDOWN} (${secondsLeft}s remaining)`);
      return;
    }

    setIsLoading(true);
    lastRequestTimeRef.current = now;

    try {
      // Clean the input before sending to API
      const cleanedIngredients = sanitiseIngredients(rawInput);

      // Layer 3 — API call (throws on network or HTTP error)
      const rawText = await fetchRecipeFromGroq(cleanedIngredients);

      // Layer 4 — parse raw AI text into clean structured object
      const parsed = parseRecipeResponse(rawText);

      setRecipe(parsed);
    } catch (err) {
      // err.message is always a user-friendly string (set in gemini.js)
      setError(err.message);
    } finally {
      // Always stop loading whether it succeeded or failed
      setIsLoading(false);
    }
  }, []);

  return { recipe, isLoading, error, generateRecipe };
}