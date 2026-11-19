import { useState, useEffect } from 'react';
import { useCircuitStore } from '../stores/circuitStore';
import { listGeminiModels, generateContent } from '../services/geminiService';
import type { Circuit, Component, Wire } from '../types/circuit';

interface AICircuitBuilderProps {
  onClose: () => void;
}

const SYSTEM_PROMPT = `You are an electronics expert. The user will describe a circuit. You must output a JSON object that represents this circuit.

RULES:
- Output ONLY the raw JSON string. Do NOT wrap it in markdown blocks (no \`\`\`json, no \`\`\`). No explanation, no prose.
- The JSON must match this exact shape:

{
  "components": [
    {
      "id": "string (random 6-char alphanumeric)",
      "type": "one of: resistor | bulb | led | switch | capacitor | inductor | voltageSource | ground | voltmeter | ammeter | ohmmeter | multimeter | breadboard",
      "label": "string",
      "properties": { "resistance": 220, "voltage": 5 },
      "position": { "x": 0, "y": 0 }
    }
  ],
  "wires": [
    {
      "id": "string",
      "sourceTerminalId": "componentId-a",
      "targetTerminalId": "componentId-b"
    }
  ]
}

- Position components apart so they do not overlap, e.g. x: -4, -2, 0, 2, 4 (y is usually 0).
- Always include a "ground" component if there is a battery/voltage source.
- Terminals are suffixed with "-a" and "-b". A ground component has only one terminal "-a".
- Wire sourceTerminalId/targetTerminalId must reference existing component terminals (e.g. "R1-a").
- Only include numeric/string/boolean values in "properties". Common keys: resistance (ohms), voltage (volts), capacitance, inductance, current.
- If a component type is unknown, use "resistor".
- If the circuit is complex, do not attempt to create tracks; leave "wires" as the logical connections and let the PCB auto-router handle routing. (wires are still required for connectivity.)

Return ONLY the JSON.`;

export function AICircuitBuilder({ onClose }: AICircuitBuilderProps) {
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
  });
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [fetchingModels, setFetchingModels] = useState(false);
  const setCircuit = useCircuitStore((s) => s.setCircuit);

  const fetchAvailableModels = async (key: string) => {
    if (!key.trim()) {
      setError('Please enter your Gemini API key first.');
      return;
    }
    setFetchingModels(true);
    setError(null);
    try {
      const supported = await listGeminiModels(key.trim());
      setAvailableModels(supported);
      const preferred = supported.find((m) => m.includes('flash')) || supported[0] || '';
      setSelectedModel(preferred);
      if (supported.length === 0) {
        setError('No models supporting generateContent were found for this key.');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch models.');
      setAvailableModels([]);
    } finally {
      setFetchingModels(false);
    }
  };

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    if (value.trim()) {
      localStorage.setItem('gemini_api_key', value);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  };

  const handleClearKey = () => {
    setApiKey(import.meta.env.VITE_GEMINI_API_KEY || '');
    localStorage.removeItem('gemini_api_key');
  };

  useEffect(() => {
    if (apiKey.trim()) {
      fetchAvailableModels(apiKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    setError(null);
    if (!apiKey.trim()) {
      setError('Please enter your Gemini API key.');
      return;
    }
    if (!prompt.trim()) {
      setError('Please describe a circuit.');
      return;
    }
    setLoading(true);
    try {
      const text = await generateContent({
        apiKey: apiKey.trim(),
        model: selectedModel || undefined,
        prompt: `${SYSTEM_PROMPT}\n\nUser description: ${prompt}`,
      });

      let cleaned = text.trim();
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        throw new Error('The AI returned invalid JSON. Try a more specific prompt.');
      }

      if (!parsed || !Array.isArray(parsed.components) || !Array.isArray(parsed.wires)) {
        throw new Error('The AI response is missing components or wires. Try again.');
      }

      const components: Component[] = parsed.components.map((c: any, idx: number) => {
        const id = (typeof c?.id === 'string' && c.id.trim()) ? c.id.trim() : `c${idx}${Math.random().toString(36).slice(2, 6)}`;
        const type = (typeof c?.type === 'string' && c.type) ? c.type : 'resistor';
        const terminals =
          type === 'ground'
            ? [{ id: `${id}-a`, componentId: id, position: 'bottom' as const, nodeId: null }]
            : [
                { id: `${id}-a`, componentId: id, position: 'left' as const, nodeId: null },
                { id: `${id}-b`, componentId: id, position: 'right' as const, nodeId: null },
              ];
        return {
          id,
          type: type as Component['type'],
          label: typeof c?.label === 'string' ? c.label : type,
          position: { x: Number(c?.position?.x ?? 0), y: Number(c?.position?.y ?? 0) },
          rotation: Number(c?.rotation ?? 0),
          properties: (c?.properties && typeof c.properties === 'object') ? c.properties : {},
          terminals,
        };
      });

      const wires: Wire[] = parsed.wires.map((w: any, idx: number) => ({
        id: (typeof w?.id === 'string' && w.id.trim()) ? w.id.trim() : `w${idx}`,
        sourceTerminalId: String(w?.sourceTerminalId ?? ''),
        targetTerminalId: String(w?.targetTerminalId ?? ''),
        sourceNodeId: '',
        targetNodeId: '',
      }));

      const circuit: Circuit = {
        id: `circuit-${Date.now()}`,
        name: 'AI Generated Circuit',
        components,
        wires,
        nodes: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setCircuit(circuit);
      onClose();
    } catch (error: any) {
      console.error('FULL GEMINI ERROR:', error);

      let errorMessage = error?.message || 'Unknown error occurred';

      if (errorMessage.includes('API key not valid')) {
        errorMessage = 'Your API key is invalid. Please check it in Google AI Studio.';
      } else if (errorMessage.includes('quota')) {
        errorMessage = 'You have exceeded your free API quota. Please wait a minute and try again.';
      }

      setError(`Gemini Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="panel w-full max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">AI Circuit Builder</h2>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-white text-xl leading-none" aria-label="Close">
            ×
          </button>
        </div>
        <div>
          <label className="text-xs text-[#94a3b8]">Gemini API Key</label>
          <div className="flex gap-2 mt-1">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="AIza..."
              className="input-field flex-1"
            />
            <button
              type="button"
              onClick={() => fetchAvailableModels(apiKey)}
              disabled={fetchingModels}
              className="btn-secondary text-xs px-2 flex items-center gap-1"
              title="Fetch available models"
            >
              {fetchingModels ? (
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              Refresh Models
            </button>
            <button type="button" onClick={handleClearKey} className="btn-secondary text-xs px-2" title="Remove saved key">
              Clear
            </button>
          </div>
          {availableModels.length > 0 && (
            <div className="mt-2">
              <label className="text-xs text-[#94a3b8]">Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="input-field mt-1"
              >
                {availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}
          <p className="text-[10px] text-[#94a3b8] mt-1">
            Get a free key at{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[#38bdf8] hover:underline">
              aistudio.google.com/app/apikey
            </a>
            . Stored locally in your browser.
          </p>
        </div>
        <div>
          <label className="text-xs text-[#94a3b8]">Circuit description</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A 5V battery connected to a 220 ohm resistor and an LED"
            rows={4}
            className="input-field mt-1 resize-none"
          />
        </div>
        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded p-2">{error}</div>
        )}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin" />
              Generating…
            </>
          ) : (
            'Generate Circuit'
          )}
        </button>
      </div>
    </div>
  );
}