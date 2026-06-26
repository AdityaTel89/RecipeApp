'use strict';

require('dotenv').config();

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const rateLimit    = require('express-rate-limit');

// ─── Configuration ────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '3001', 10);

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

// API Keys (server-side only — never sent to client)
const KEYS = {
  groq:   process.env.GROQ_API_KEY   ?? '',
  gemini: process.env.GEMINI_API_KEY ?? '',
  openai: process.env.OPENAI_API_KEY ?? '',
  claude: process.env.CLAUDE_API_KEY ?? '',
};

// LLM provider settings
const PROVIDERS = {
  groq: {
    model:       'llama-3.3-70b-versatile',
    apiUrl:      'https://api.groq.com/openai/v1/chat/completions',
    maxTokens:   1500,
    temperature: 0.7,
  },
  gemini: {
    model:       'gemini-1.5-flash',
    apiUrl:      'https://generativelanguage.googleapis.com/v1beta/models',
    maxTokens:   1500,
    temperature: 0.7,
  },
  openai: {
    model:       'gpt-4o-mini',
    apiUrl:      'https://api.openai.com/v1/chat/completions',
    maxTokens:   1500,
    temperature: 0.7,
  },
  claude: {
    model:       'claude-3-haiku-20240307',
    apiUrl:      'https://api.anthropic.com/v1/messages',
    apiVersion:  '2023-06-01',
    maxTokens:   1500,
  },
};

const API_TIMEOUT_MS = 20_000; // 20 s — slightly more generous server-side

// ─── Shared Prompts ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a professional chef and recipe writer. Your job is to create clear, detailed, easy-to-follow recipes based on a list of ingredients a home cook has available.

STRICT RULES:
1. Only use the ingredients provided. You may add water, salt, pepper, and basic cooking oil without being asked — these are pantry staples.
2. Return ONLY valid JSON matching the requested schema. Do NOT include markdown formatting (no \`\`\`json fences), no preamble, no explanation — ONLY the raw JSON object.
3. Write a minimum of 8 steps and a maximum of 12 steps.
4. Each step must be 2–4 sentences long. Explain the "why" behind each action — not just "do this" but "do this because...". This helps beginner cooks understand the process.
5. Include a clear step title for each step (e.g., "Season the chicken").
6. Include realistic quantities for each ingredient, not vague amounts.
7. The recipe must be realistically cookable in a standard home kitchen.
8. If the ingredients cannot form a real recipe (e.g., non-food items), return: { "error": "These don't appear to be food ingredients." }
9. Always include a "tips" field with one useful cooking tip.
10. Estimate cook_time honestly. Do not say "10 minutes" if it takes 30.
11. Your entire response must be a single, valid JSON object — nothing before or after it.`;

function buildUserPrompt(ingredients, servings) {
  const list = Array.isArray(ingredients) ? ingredients.join(', ') : ingredients;
  return `Create a complete recipe using these ingredients: ${list}.
The recipe MUST be scaled exactly for ${servings} serving${servings === 1 ? '' : 's'}. Adjust the ingredient quantities, cooking times, and cooking process/instructions to suit this serving size.

Follow this JSON schema exactly:
{
  "title": string,
  "cook_time": string,
  "servings": "${servings}",
  "difficulty": "Easy" | "Medium" | "Hard",
  "ingredients": [{ "quantity": string, "unit": string, "name": string }],
  "steps": [{ "step_number": number, "title": string, "instruction": string }],
  "tips": string
}`;
}

// ─── Provider Callers ─────────────────────────────────────────────────────────

/**
 * Calls the Groq (OpenAI-compatible) API.
 */
async function callGroq(ingredients, servings) {
  const cfg = PROVIDERS.groq;
  const body = {
    model:           cfg.model,
    temperature:     cfg.temperature,
    max_tokens:      cfg.maxTokens,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: buildUserPrompt(ingredients, servings) },
    ],
  };

  const res = await fetchWithTimeout(cfg.apiUrl, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${KEYS.groq}`,
    },
    body: JSON.stringify(body),
  });

  await assertOk(res, 'Groq');
  const data = await res.json();
  return extractAndParse(data?.choices?.[0]?.message?.content, 'Groq');
}

/**
 * Calls the Google Gemini API.
 */
async function callGemini(ingredients, servings) {
  const cfg = PROVIDERS.gemini;
  const url = `${cfg.apiUrl}/${cfg.model}:generateContent?key=${KEYS.gemini}`;
  const body = {
    contents: [{ parts: [{ text: buildUserPrompt(ingredients, servings) }] }],
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    generationConfig: {
      maxOutputTokens: cfg.maxTokens,
      temperature:     cfg.temperature,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetchWithTimeout(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  await assertOk(res, 'Gemini');
  const data = await res.json();
  return extractAndParse(data?.candidates?.[0]?.content?.parts?.[0]?.text, 'Gemini');
}

/**
 * Calls the OpenAI API.
 */
async function callOpenAI(ingredients, servings) {
  const cfg = PROVIDERS.openai;
  const body = {
    model:           cfg.model,
    temperature:     cfg.temperature,
    max_tokens:      cfg.maxTokens,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: buildUserPrompt(ingredients, servings) },
    ],
  };

  const res = await fetchWithTimeout(cfg.apiUrl, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${KEYS.openai}`,
    },
    body: JSON.stringify(body),
  });

  await assertOk(res, 'OpenAI');
  const data = await res.json();
  return extractAndParse(data?.choices?.[0]?.message?.content, 'OpenAI');
}

/**
 * Calls the Anthropic Claude API.
 */
async function callClaude(ingredients, servings) {
  const cfg = PROVIDERS.claude;
  const body = {
    model:      cfg.model,
    max_tokens: cfg.maxTokens,
    system:     SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: buildUserPrompt(ingredients, servings) },
    ],
  };

  const res = await fetchWithTimeout(cfg.apiUrl, {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         KEYS.claude,
      'anthropic-version': cfg.apiVersion,
    },
    body: JSON.stringify(body),
  });

  await assertOk(res, 'Claude');
  const data  = await res.json();
  const raw   = data?.content?.[0]?.text ?? '';
  const clean = raw.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  return extractAndParse(clean, 'Claude');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * fetch() with an AbortController-based timeout.
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/**
 * Throws a standardised error if the upstream response is not 2xx.
 */
async function assertOk(res, providerName) {
  if (res.ok) return;

  let detail = '';
  try {
    const body = await res.json();
    detail = body?.error?.message ?? body?.message ?? '';
  } catch { /* ignore */ }

  if (res.status === 429) throw new ProviderError('rate_limit', providerName, detail);
  if (res.status === 401 || res.status === 403) throw new ProviderError('auth', providerName, detail);
  throw new ProviderError('upstream', providerName, detail || `HTTP ${res.status}`);
}

/**
 * Parse a raw JSON string from the LLM; throw a structured error on failure.
 */
function extractAndParse(raw, providerName) {
  if (!raw) throw new ProviderError('empty', providerName, 'Empty response body');
  try {
    return JSON.parse(raw);
  } catch {
    throw new ProviderError('parse', providerName, 'Could not parse JSON from response');
  }
}

class ProviderError extends Error {
  /**
   * @param {'rate_limit'|'auth'|'upstream'|'empty'|'parse'} code
   * @param {string} provider
   * @param {string} detail
   */
  constructor(code, provider, detail = '') {
    super(`[${provider}] ${code}: ${detail}`);
    this.code     = code;
    this.provider = provider;
  }
}

// ─── Fallback Logic ───────────────────────────────────────────────────────────

const PROVIDER_ORDER = ['groq', 'gemini', 'openai', 'claude'];

const CALLERS = {
  groq:   callGroq,
  gemini: callGemini,
  openai: callOpenAI,
  claude: callClaude,
};

/**
 * Returns providers that have a non-empty API key.
 */
function configuredProviders(requestedProvider) {
  if (requestedProvider && CALLERS[requestedProvider]) {
    // Honour an explicit provider if the key exists; otherwise fall back to auto
    if (KEYS[requestedProvider]) return [requestedProvider];
  }
  return PROVIDER_ORDER.filter(p => KEYS[p]);
}

/**
 * Try each configured provider in order, returning on the first success.
 * Hard errors (auth, food-ingredient validation) stop the chain immediately.
 */
async function generateRecipeWithFallback(ingredients, servings, requestedProvider) {
  const providers = configuredProviders(requestedProvider);

  if (providers.length === 0) {
    const err = new Error('No API keys configured on the server. Add at least one key to backend/.env');
    err.statusCode = 503;
    throw err;
  }

  let lastError = null;

  for (const provider of providers) {
    try {
      const recipe = await CALLERS[provider](ingredients, servings);

      // If the LLM returned a structured error about non-food ingredients, surface it immediately
      if (recipe?.error) {
        const err = new Error(recipe.error);
        err.statusCode = 422;
        err.isHard     = true;
        throw err;
      }

      return { recipe, provider };
    } catch (err) {
      lastError = err;

      // Hard errors — stop the chain
      if (err.isHard || err.code === 'auth') throw err;

      // Rate limit on a single provider — log and try next
      console.warn(`[RecipeProxy] Provider "${provider}" failed (${err.message}). Trying next…`);
    }
  }

  throw lastError ?? new Error('All providers failed');
}

// ─── Express App ──────────────────────────────────────────────────────────────

const app = express();

// Security headers
app.use(helmet());

// CORS — only accept requests from Expo dev server origins
app.use(cors({
  origin(origin, callback) {
    // Allow requests with no Origin header (e.g. curl, same-machine requests)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin "${origin}" not allowed`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
}));

// Body parsing
app.use(express.json({ limit: '16kb' }));

// Rate limiting — 30 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutes
  max:              30,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: 'Too many requests. Please wait a moment and try again.' },
});
app.use('/api/', limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/health
 * Returns server status and which providers are configured (keys present).
 */
app.get('/api/health', (_req, res) => {
  res.json({
    status:    'ok',
    providers: PROVIDER_ORDER.filter(p => KEYS[p]),
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/recipe
 * Body: { ingredients: string[], servings: number, provider?: string }
 * Returns: { recipe: RecipeObject, provider: string }
 */
app.post('/api/recipe', async (req, res) => {
  const { ingredients, servings = 2, provider: requestedProvider } = req.body ?? {};

  // ── Input validation ──────────────────────────────────────────────────────
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: 'ingredients must be a non-empty array.' });
  }
  if (ingredients.length > 10) {
    return res.status(400).json({ error: 'Maximum 10 ingredients allowed.' });
  }
  if (typeof servings !== 'number' || servings < 1 || servings > 20) {
    return res.status(400).json({ error: 'servings must be a number between 1 and 20.' });
  }
  for (const item of ingredients) {
    if (typeof item !== 'string' || item.trim().length < 2) {
      return res.status(400).json({ error: `Invalid ingredient: "${item}". Each ingredient must be at least 2 characters.` });
    }
  }

  // ── Call LLMs ─────────────────────────────────────────────────────────────
  try {
    const { recipe, provider } = await generateRecipeWithFallback(
      ingredients.map(i => i.trim()),
      servings,
      requestedProvider
    );
    return res.json({ recipe, provider });
  } catch (err) {
    const statusCode = err.statusCode ?? 502;
    const msg        = err.isHard ? err.message : mapErrorToMessage(err);
    console.error('[RecipeProxy] Error:', err.message);
    return res.status(statusCode).json({ error: msg });
  }
});

// 404 handler for unknown routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[RecipeProxy] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Error Message Mapping ────────────────────────────────────────────────────

function mapErrorToMessage(err) {
  if (!err) return 'Something went wrong. Please try again.';
  const code = err.code;
  if (code === 'rate_limit') return 'We hit a provider rate limit. Please wait a moment and retry.';
  if (code === 'auth')       return 'A provider API key is invalid. Check your backend/.env file.';
  if (code === 'empty' || code === 'parse') return 'No valid recipe was generated. Try different ingredients.';
  if (err.name === 'AbortError') return 'The request timed out. Please try again.';
  return 'Something went wrong on our end. Please try again.';
}

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  const configured = PROVIDER_ORDER.filter(p => KEYS[p]);
  console.log(`\n🍳  RecipeApp Proxy running`);
  console.log(`   Local:             http://localhost:${PORT}`);
  console.log(`   On your network:   http://<your-LAN-IP>:${PORT}  (use this for physical devices)`);
  console.log(`   Configured providers: ${configured.length > 0 ? configured.join(', ') : 'NONE — add keys to backend/.env'}`);
  console.log(`   Allowed origins:      ${ALLOWED_ORIGINS.join(', ') || '(all — add ALLOWED_ORIGINS to backend/.env)'}`);
  console.log(`   Rate limit:           30 req / 15 min per IP\n`);
});

