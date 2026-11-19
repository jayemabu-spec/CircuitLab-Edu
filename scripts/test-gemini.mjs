import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.error('Set GEMINI_API_KEY (or VITE_GEMINI_API_KEY) env var.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1' });

console.log('Listing models...');
const pager = await ai.models.list();
const models = [];
for await (const m of pager) {
  const actions = m.supportedActions ?? [];
  if (actions.includes('generateContent')) {
    models.push(m.name?.replace(/^models\//, '') ?? '');
  }
}
console.log('Available generateContent models:', models);

const chosen = models.find((m) => /flash/i.test(m)) || models[0];
if (!chosen) {
  console.error('No generateContent models found.');
  process.exit(1);
}
console.log('Selected model:', chosen);

console.log('Sending test prompt...');
const res = await ai.models.generateContent({
  model: chosen,
  contents: 'Reply with the single word: OK',
});
console.log('Response:', res?.text ?? '(empty)');
console.log('SUCCESS');
