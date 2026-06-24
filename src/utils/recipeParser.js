/**
 * Parses raw Gemini text into a clean, predictable recipe object.
 * The UI never touches raw AI text — it always gets this shape:
 * { title: string, ingredients: string[], steps: string[] }
 *
 * Gemini is prompted to follow a strict format but AI responses
 * can drift. Each parser function handles that gracefully.
 */

/**
 * Extracts the recipe title from raw text.
 * Looks for "TITLE:" prefix, falls back to first non-empty line.
 */
function extractTitle(rawText) {
  const titleMatch = rawText.match(/TITLE:\s*(.+)/i);
  if (titleMatch?.[1]) {
    return titleMatch[1].trim();
  }

  // Fallback: use the first non-empty line as the title
  const firstLine = rawText.split('\n').find(line => line.trim());
  return firstLine?.trim() ?? 'Recipe';
}

/**
 * Extracts the ingredients list.
 * Finds everything between "INGREDIENTS:" and "STEPS:" sections.
 * Each line starting with "-" or "*" is treated as one ingredient.
 */
function extractIngredients(rawText) {
  const sectionMatch = rawText.match(
    /INGREDIENTS:\s*([\s\S]*?)(?=STEPS:|$)/i
  );

  if (!sectionMatch?.[1]) return [];

  return sectionMatch[1]
    .split('\n')
    .map(line => line.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean);
}

/**
 * Extracts the step-by-step instructions.
 * Finds everything after "STEPS:" and cleans numbering.
 */
function extractSteps(rawText) {
  const sectionMatch = rawText.match(/STEPS:\s*([\s\S]*?)$/i);

  if (!sectionMatch?.[1]) return [];

  return sectionMatch[1]
    .split('\n')
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);
}

/**
 * Main parser — orchestrates all three extractors.
 * Returns a safe fallback object if parsing fails entirely,
 * so the UI always has something to render.
 *
 * @param {string} rawText - raw response text from Gemini
 * @returns {{ title: string, ingredients: string[], steps: string[] }}
 */
export function parseRecipeResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { title: 'Recipe', ingredients: [], steps: [] };
  }

  const title       = extractTitle(rawText);
  const ingredients = extractIngredients(rawText);
  const steps       = extractSteps(rawText);

  return { title, ingredients, steps };
}