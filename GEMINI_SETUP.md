# Gemini Setup

## Required Dependencies

- `@google/genai` (official SDK). Remove the deprecated `@google/generative-ai`.

```bash
npm install @google/genai
npm uninstall @google/generative-ai
```

## Environment Variables

Local development (`.env.local`, never committed):

```
VITE_GEMINI_API_KEY=your_api_key_here
```

Production: do NOT expose the key to the browser. Route requests through a backend/serverless endpoint and store the key in server-side env vars (e.g. `GEMINI_API_KEY`).

## Local Development

1. Copy `.env.example` to `.env.local` and fill in your key from https://aistudio.google.com/app/apikey
2. `npm run dev`
3. Open the 3D Lab → "AI Build", or PCB Designer → "AI Auto-Place". Use "Refresh Models" to fetch models for your key.

## Production Deployment

- Do not ship `VITE_GEMINI_API_KEY` to the client.
- Implement a backend proxy (e.g. Express/Cloud Function) that holds `GEMINI_API_KEY` and forwards generateContent requests.
- The current BYOK (Bring Your Own Key) flow stores the user's key in `localStorage` and calls Google directly from the browser; acceptable for a demo, not for production secrets.

## Selected Model

- Dynamic: the app fetches available models for the user's key and prefers one containing "flash".
- Fallback chain: `gemini-2.0-flash` → `gemini-1.5-flash`.
- API version: `v1`.

## Testing Connectivity

```bash
GEMINI_API_KEY=your_key node scripts/test-gemini.mjs
```

Lists generateContent-capable models, selects a flash model, sends a test prompt, prints the response.

## Common Errors

- `API key not valid` → regenerate the key in Google AI Studio.
- `quota` / 429 → wait and retry; free tier has rate limits.
- 404 model not found → refresh the model list; the app falls back automatically.
- Network/fetch errors → check connectivity and HTTPS (Web NFC requires HTTPS too).
