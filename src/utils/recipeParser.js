/**
 * Parses and validates the structured JSON recipe returned by Groq.
 *
 * Expected shape (PRD §9.3):
 * {
 *   title: string,
 *   cook_time: string,
 *   servings: string,
 *   difficulty: string,
 *   ingredients: [{ quantity, unit, name }],
 *   steps: [{ step_number, title, instruction }],
 *   tips: string
 * }
 *
 * Handles graceful fallbacks if fields are missing or the AI
 * returns the non-food error sentinel.
 */
export function parseRecipeResponse(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  // AI returned the non-food sentinel
  if (raw.error) {
    throw new Error(raw.error);
  }

  // Normalise ingredients — accept both objects and plain strings
  const ingredients = Array.isArray(raw.ingredients)
    ? raw.ingredients.map(item => {
        if (typeof item === 'string') return item;
        return {
          quantity: item.quantity ?? '',
          unit:     item.unit     ?? '',
          name:     item.name     ?? item.toString(),
        };
      })
    : [];

  // Normalise steps — accept both objects and plain strings
  const steps = Array.isArray(raw.steps)
    ? raw.steps.map((step, i) => {
        if (typeof step === 'string') {
          return { step_number: i + 1, title: '', instruction: step };
        }
        return {
          step_number: step.step_number ?? i + 1,
          title:       step.title       ?? '',
          instruction: step.instruction ?? '',
        };
      })
    : [];

  return {
    title:       raw.title      ?? 'Recipe',
    cook_time:   raw.cook_time  ?? null,
    servings:    raw.servings   ?? null,
    difficulty:  raw.difficulty ?? null,
    ingredients,
    steps,
    tips:        raw.tips ?? null,
  };
}