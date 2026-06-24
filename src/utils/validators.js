import { VALIDATION, MESSAGES } from '../config/constants';

/**
 * Validates raw ingredient input from the user.
 * Returns { isValid, message } — never throws.
 * Pure function: same input always gives same output.
 */
export function validateIngredients(rawInput) {
  const trimmed = rawInput?.trim() ?? '';

  if (!trimmed) {
    return { isValid: false, message: MESSAGES.EMPTY_INPUT };
  }

  if (trimmed.length > VALIDATION.MAX_INPUT_LENGTH) {
    return { isValid: false, message: MESSAGES.INPUT_TOO_LONG };
  }

  // Split by comma, clean up each item
  const ingredients = trimmed
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

  if (ingredients.length > VALIDATION.MAX_INGREDIENTS) {
    return { isValid: false, message: MESSAGES.TOO_MANY };
  }

  // Each individual ingredient must meet minimum length
  const hasShortIngredient = ingredients.some(
    item => item.length < VALIDATION.MIN_INGREDIENT_LENGTH
  );

  if (hasShortIngredient) {
    return { isValid: false, message: MESSAGES.INVALID_INGREDIENT };
  }

  return { isValid: true, message: null };
}

/**
 * Cleans and normalises the raw input string before
 * sending it to the API. Removes extra spaces and
 * standardises comma separation.
 */
export function sanitiseIngredients(rawInput) {
  return rawInput
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .join(', ');
}