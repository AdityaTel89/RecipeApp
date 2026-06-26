import { useState, useCallback, useRef } from 'react';
import { fetchRecipeFromProxy } from '../api/recipeApi';
import { parseRecipeResponse }  from '../utils/recipeParser';
import { MESSAGES, REQUEST_COOLDOWN_MS } from '../config/constants';



function isHardError(message) {
  const msg = message?.toLowerCase() ?? '';
  return (
    msg.includes('food ingredient') ||
    msg.includes("don't appear to be food") ||
    msg.includes('non-food') ||
    msg.includes('server is not configured') ||
    msg.includes('no api keys')
  );
}

let _lastProvider = null;

export function getActiveProvider() {
  return _lastProvider;
}

export function getConfiguredProviders() {
  return ['proxy'];
}


// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRecipeGenerator() {
  const [appState,         setAppState]   = useState('input');
  const [recipe,           setRecipe]     = useState(null);
  const [error,            setError]      = useState(null);
  const [isErrorRetryable, setIsRetryable] = useState(false);
  const [activeProvider,   setActiveProvider] = useState(null);

  const lastIngredientsRef = useRef([]);
  const lastServingsRef    = useRef(2);
  const lastRequestTimeRef = useRef(0);

  const _callAPI = useCallback(async (ingredients, servings) => {
    // Preserve ONE_INGREDIENT warning across the loading state
    setError(prev => prev === MESSAGES.ONE_INGREDIENT ? prev : null);
    setAppState('loading');

    try {
      const { recipe: rawRecipe, provider } = await fetchRecipeFromProxy(ingredients, servings);

      const parsed = parseRecipeResponse(rawRecipe);

      if (!parsed) {
        throw new Error(MESSAGES.API_ERROR);
      }

      // Track which provider the server used
      _lastProvider = provider ?? null;
      setActiveProvider(provider ?? null);

      setRecipe(parsed);
      setAppState('result');
    } catch (err) {
      setAppState('input');
      const msg = err.message ?? MESSAGES.API_ERROR;
      setError(msg);

      const isNonRetryable =
        isHardError(msg) ||
        msg === MESSAGES.NON_FOOD ||
        msg.includes('food');
      setIsRetryable(!isNonRetryable);
    }
  }, []);

  const generateRecipe = useCallback(async (ingredients, servings = 2) => {
    if (!ingredients || ingredients.length === 0) {
      setError(MESSAGES.EMPTY_INPUT);
      setIsRetryable(false);
      return;
    }

    // Client-side cooldown
    const now     = Date.now();
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
    activeProvider,
    generateRecipe,
    retryLast,
    resetToInput,
    dismissError,
    loadSuggestedRecipe,
  };
}