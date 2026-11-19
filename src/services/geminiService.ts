import { GoogleGenAI } from '@google/genai';

export interface GeminiErrorInfo {
  status?: number;
  message: string;
}

function extractError(err: any): GeminiErrorInfo {
  const status = err?.status ?? err?.code ?? err?.response?.status;
  const message = err?.message ?? String(err ?? 'Unknown error');
  return { status, message };
}

function friendlyMessage(info: GeminiErrorInfo): string {
  const m = info.message.toLowerCase();
  if (info.status === 400 || m.includes('api key not valid') || m.includes('invalid api key')) {
    return 'Your API key is invalid. Please check it in Google AI Studio.';
  }
  if (info.status === 403) {
    return 'Access denied. Your API key may lack permissions for this model.';
  }
  if (info.status === 404 || m.includes('not found')) {
    return 'The selected AI model is currently unavailable. Please refresh the model list and try another.';
  }
  if (info.status === 429 || m.includes('quota') || m.includes('rate limit')) {
    return 'You have exceeded your free API quota or rate limit. Please wait a minute and try again.';
  }
  if (info.status && info.status >= 500) {
    return 'Google Gemini service is temporarily unavailable. Please try again later.';
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'Network error. Check your internet connection and try again.';
  }
  return info.message || 'Unknown error occurred.';
}

export async function listGeminiModels(apiKey: string): Promise<string[]> {
  if (!apiKey.trim()) throw new Error('API key is required.');
  const ai = new GoogleGenAI({ apiKey: apiKey.trim(), apiVersion: 'v1' });
  const pager = await ai.models.list();
  const names: string[] = [];
  for await (const m of pager) {
    const actions = (m as any).supportedActions ?? (m as any).supportedGenerationMethods ?? [];
    if (Array.isArray(actions) && actions.includes('generateContent')) {
      const name = String((m as any).name ?? '').replace(/^models\//, '');
      if (name) names.push(name);
    }
  }
  return names;
}

export interface GenerateOptions {
  apiKey: string;
  model?: string;
  prompt: string;
}

export async function generateContent(opts: GenerateOptions): Promise<string> {
  const { apiKey, prompt } = opts;
  if (!apiKey.trim()) throw new Error('API key is required.');
  if (!prompt.trim()) throw new Error('Prompt cannot be empty.');

  const ai = new GoogleGenAI({ apiKey: apiKey.trim(), apiVersion: 'v1' });

  // Prefer a user-selected model; otherwise try current free-tier flash models.
  const candidates: string[] = [];
  if (opts.model) candidates.push(opts.model);
  candidates.push('gemini-2.0-flash', 'gemini-1.5-flash');

  let lastError: any = null;
  for (const candidate of candidates) {
    // de-dupe
    if (candidates.indexOf(candidate) !== candidates.lastIndexOf(candidate)) continue;
    try {
      const response = await ai.models.generateContent({
        model: candidate,
        contents: prompt,
      });
      const text = response?.text ?? '';
      if (!text) throw new Error('The model returned an empty response.');
      return text;
    } catch (err: any) {
      lastError = err;
      const info = extractError(err);
      // If it's not a model-availability issue, don't try other models.
      if (!(info.status === 404 || /not found/i.test(info.message))) {
        throw new Error(friendlyMessage(info));
      }
      console.warn(`${candidate} unavailable, trying next model`, info.message);
    }
  }

  const info = extractError(lastError);
  throw new Error(friendlyMessage(info));
}
