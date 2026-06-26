# Smart Ingredient Recipe Generator 🍳

A premium single-screen React Native (Expo) mobile app that generates detailed, professional recipes from ingredients you already have in your kitchen — powered by your choice of **OpenAI, Groq, Google Gemini, or Anthropic Claude**.

All LLM API calls are made through a **secure Node.js backend proxy**. No API keys are ever embedded in the app bundle.

Built with performance, premium UX/UI, and accessibility at its core.

---

## 🌟 Key Features

*   **Multi-LLM Support:** Works with OpenAI (GPT-4o mini), Groq (Llama 3.3 70B), Google Gemini (1.5 Flash), and Anthropic Claude (Haiku). Add any combination of keys and the backend handles the rest.
*   **Secure Backend Proxy:** A dedicated Express.js server holds all API keys. The mobile app never touches LLM providers directly — zero credentials in the client bundle.
*   **Smart Auto-Failover:** When multiple API keys are configured on the server, it tries providers in priority order. If one hits a rate limit or server error, it silently retries with the next — no interruption to the user.
*   **Server-Side Rate Limiting:** 30 requests per 15 minutes per IP, enforced by `express-rate-limit` on the backend.
*   **Smart Ingredient Parsing:** Enter ingredients using commas (or spaces). The app automatically parses, de-duplicates, and displays them as animated pill tags.
*   **Pantry Staples Quick Add:** Frequently used kitchen staples (eggs, onion, pasta, cheese, etc.) can be toggled with a single tap to speed up input.
*   **Serving Size Selector:** Scale recipes dynamically. Select serving sizes from 1 to 8, and the AI adjusts quantities and instructions accordingly.
*   **Predefined Instant Recipes:** Access 3 high-quality predefined recipes immediately without waiting for API generation — works offline.
*   **Warm Kitchen UI Design:** Tailored design system built on parchment colors, spice-orange accents, serif headings (`Playfair Display`), and clean body text (`Inter`).
*   **Polished Loading Experience:** Custom wobbly pan animation with rising steam and shimmering skeleton placeholders that transition every 2 seconds.
*   **Detailed Structured Recipes:** Generates a structured JSON recipe with cook times, servings, difficulty level, bolded ingredient quantities, 8–12 detailed steps explaining the "why", and a chef's tip card.
*   **Robust Edge-Case Handling:** Client-side timeout via `AbortController`, network detection, rate limit warnings, character caps, and direct "Retry" controls inside notification banners.
*   **Haptic Feedback:** Interactive touches enhanced by light/heavy haptics using `expo-haptics`.
*   **Accessibility First:** Fully optimized with semantic labels, accessible live regions, tap targets, and support for system font scaling.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Mobile App** | React Native + Expo (SDK 54) |
| **Backend Proxy** | Node.js + Express.js |
| **Security** | `helmet`, `cors`, `express-rate-limit` |
| **Styling** | StyleSheet (Vanilla RN) |
| **AI Providers** | OpenAI · Groq · Google Gemini · Anthropic Claude |
| **Typography** | `Playfair Display` + `Inter` via `@expo-google-fonts` |
| **Haptics** | `expo-haptics` |
| **Safe Area** | `react-native-safe-area-context` |

---

## 🔑 Supported API Providers

| Provider | Model Used | Get API Key |
|---|---|---|
| **OpenAI** | `gpt-4o-mini` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **Groq** | `llama-3.3-70b-versatile` | [console.groq.com/keys](https://console.groq.com/keys) |
| **Google Gemini** | `gemini-1.5-flash` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| **Anthropic Claude** | `claude-3-haiku-20240307` | [console.anthropic.com/settings/api-keys](https://console.anthropic.com/settings/api-keys) |

**You only need one key to use the app.** Adding multiple keys enables automatic server-side failover.

---

## 🚀 Setup & Installation

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [Git](https://git-scm.com/)
*   At least one API key from the table above
*   A physical device with [Expo Go](https://expo.dev/go), or an emulator (Xcode Simulator / Android Studio)

---

### Step 1 — Clone & Install

```bash
git clone https://github.com/AdityaTel89/RecipeApp.git
cd RecipeApp
```

Install Expo app dependencies:
```bash
npm install
```

Install backend proxy dependencies:
```bash
cd backend
npm install
cd ..
```

---

### Step 2 — Configure the Backend

Copy the backend env template and add your API keys:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
# Add one or more keys — the server uses all configured keys with auto-failover

GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here

PORT=3001

# Origins allowed to call the proxy (Expo dev server addresses)
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006,http://YOUR-LAN-IP:8081
```

> [!IMPORTANT]
> `backend/.env` is gitignored and **never committed**. Your keys stay on your machine only.

---

### Step 3 — Configure the Expo App

Copy the app env template:
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Point the app at your local backend proxy
EXPO_PUBLIC_API_URL=http://localhost:3001
```

> [!IMPORTANT]
> **Physical device or Android Emulator?** Replace `localhost` with your computer's LAN IP address.
> Run `ipconfig` (Windows) or `ifconfig` (macOS/Linux) to find it.
> ```env
> EXPO_PUBLIC_API_URL=http://192.168.1.x:3001
> ```
> Also add that IP to `ALLOWED_ORIGINS` in `backend/.env`.

| Device type | URL to use |
|---|---|
| iOS Simulator (same Mac) | `http://localhost:3001` |
| Android Emulator | `http://10.0.2.2:3001` |
| Physical device (Wi-Fi) | `http://<your-computer-LAN-IP>:3001` |

---

### Step 4 — Start the Backend Proxy

Open a dedicated terminal and run:
```bash
cd backend
npm start
```

You should see:
```
🍳  RecipeApp Proxy running
   Local:             http://localhost:3001
   On your network:   http://<your-LAN-IP>:3001
   Configured providers: groq, gemini
   Rate limit:           30 req / 15 min per IP
```

> For development with auto-restart on file changes:
> ```bash
> npm run dev
> ```

---

### Step 5 — Start the Expo App

In a **second terminal**:
```bash
npm run start        # Scan QR code with Expo Go
npm run android      # Launch on Android emulator
npm run ios          # Launch on iOS simulator
```

---
## 📂 Project Structure

```
RecipeApp/
├── .env                          # Expo app env — proxy URL only (gitignored)
├── .env.example                  # Template for Expo app env vars
├── App.js                        # Root entry component, loads fonts
├── app.json                      # Expo configuration
├── package.json                  # Expo app dependencies & scripts
│
├── backend/                      # ← Secure backend proxy server
│   ├── .env                      # API keys — NEVER committed (gitignored)
│   ├── .env.example              # Template for backend env vars
│   ├── package.json              # Backend dependencies (express, helmet, etc.)
│   └── server.js                 # Express proxy — all LLM calls happen here
│
└── src/
    ├── api/
    │   └── recipeApi.js          # Thin client — calls backend proxy, no keys
    ├── components/
    │   ├── Header.jsx            # Branding header with custom SVG kitchen pan
    │   ├── IngredientInput.jsx   # Text field, live parsing, counter, quick-add staples
    │   ├── IngredientTag.jsx     # Individual pill tag with spring entrance and close action
    │   ├── GenerateButton.jsx    # Primary CTA button with haptics and warning badge
    │   ├── LoadingSkeleton.jsx   # Shimmer bars, wobbly pan animation, rotating phrases
    │   ├── RecipeCard.jsx        # Scrollable recipe display card with meta row & refresh
    │   ├── RecipeStep.jsx        # Individual numbered recipe step
    │   ├── ErrorToast.jsx        # Floating dismissible top toast with Retry logic
    │   └── TipCard.jsx           # Chef's tip highlighted card
    ├── config/
    │   └── constants.js          # Color tokens, typography, UI constants
    ├── hooks/
    │   └── useRecipeGenerator.js # Core state machine — calls proxy, handles errors
    ├── screens/
    │   └── HomeScreen.jsx        # State router & layout container
    └── utils/
        └── recipeParser.js       # Sanitizes and normalizes LLM JSON output
```

---

## 🔐 Architecture & Security

```
┌─────────────────────────────────────────────────────┐
│                  Expo Mobile App                    │
│                                                     │
│  src/api/recipeApi.js                               │
│  POST /api/recipe { ingredients, servings }         │
│  ← No API keys anywhere in this bundle →            │
└────────────────────────┬────────────────────────────┘
                         │ HTTP (localhost / LAN)
                         ▼
┌─────────────────────────────────────────────────────┐
│            backend/server.js  (Node.js)             │
│                                                     │
│  ✅ helmet        — security HTTP headers           │
│  ✅ cors          — whitelist-only origins          │
│  ✅ rate-limit    — 30 req / 15 min / IP            │
│  ✅ input validation — sanitised before LLM call    │
│  ✅ API keys      — loaded from backend/.env only   │
│                                                     │
│  Fallback chain:  Groq → Gemini → OpenAI → Claude  │
└───┬──────────┬────────────┬──────────────┬──────────┘
    ▼          ▼            ▼              ▼
  Groq      Gemini       OpenAI         Claude
```


## 📄 License

Distributed under the MIT License. See [LICENSE](./LICENSE) for more details.
