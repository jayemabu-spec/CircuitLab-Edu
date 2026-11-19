import { useState, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Group, Line } from 'react-konva';
import { useCircuitStore } from '../stores/circuitStore';
import { usePCBStore, buildPCBFromCircuit } from '../stores/pcbStore';
import { autoRoute } from '../utils/autoRouter';
import { PCB3DPreview } from '../components/PCB3DPreview';
import { generateContent, listGeminiModels } from '../services/geminiService';

const SCALE = 5; // px per mm

export function PCBDesigner() {
  const circuit = useCircuitStore((s) => s.circuit);
  const wires = useCircuitStore((s) => s.circuit?.wires ?? []);
  const pcb = usePCBStore((s) => s.pcb);
  const setPCB = usePCBStore((s) => s.setPCB);
  const updateFootprint = usePCBStore((s) => s.updateFootprint);

  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
  });
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [fetchingModels, setFetchingModels] = useState(false);
  const [loading, setLoading] = useState(false);
  const [routing, setRouting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (apiKey.trim()) {
      fetchAvailableModels(apiKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  useEffect(() => {
    if (!pcb && circuit && circuit.components.length > 0) {
      setPCB(buildPCBFromCircuit(circuit.components));
    }
  }, [pcb, circuit, setPCB]);

  const handleAutoPlace = async () => {
    if (!pcb) return;
    if (!apiKey.trim()) {
      setError('Enter your Gemini API key first.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const desc = pcb.footprints.map((f) => `${f.id} (${f.name})`).join(', ');
      const prompt = `You are a PCB layout expert. Given these footprints: ${desc}. Board size: ${pcb.boardWidth}x${pcb.boardHeight} mm. Return ONLY raw JSON (no markdown) mapping each footprint id to {x, y} positions in mm, spread out, not overlapping, within board bounds. Format: {"placements":[{"id":"fp-...","x":10,"y":10},...]}`;
      const text = await generateContent({
        apiKey: apiKey.trim(),
        model: selectedModel || undefined,
        prompt,
      });
      const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      if (!parsed || !Array.isArray(parsed.placements)) throw new Error('Invalid placement JSON.');
      for (const p of parsed.placements) {
        const fp = pcb.footprints.find((f) => f.id === p.id);
        if (fp) {
          updateFootprint(p.id, { x: Number(p.x), y: Number(p.y) });
        }
      }
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

  const handleAutoRoute = () => {
    if (!pcb) return;
    setRouting(true);
    setError(null);
    try {
      const newTracks = autoRoute(pcb.footprints, wires);
      setPCB({ ...pcb, tracks: newTracks });
    } catch (e: any) {
      setError(e?.message || 'Auto-route failed.');
    } finally {
      setRouting(false);
    }
  };

  if (!pcb) {
    return (
      <div className="p-6 text-[#94a3b8]">
        No circuit loaded. Go to Dashboard and load an example circuit first, then open PCB Designer.
      </div>
    );
  }

  const stageW = pcb.boardWidth * SCALE;
  const stageH = pcb.boardHeight * SCALE;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-white">PCB Designer</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg overflow-hidden border border-[#475569]">
            <button
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1.5 text-sm ${viewMode === '2d' ? 'bg-[#38bdf8] text-[#0f172a]' : 'bg-[#1e293b] text-[#94a3b8]'}`}
            >
              2D Editor
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1.5 text-sm ${viewMode === '3d' ? 'bg-[#38bdf8] text-[#0f172a]' : 'bg-[#1e293b] text-[#94a3b8]'}`}
            >
              3D Preview
            </button>
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); if (e.target.value.trim()) localStorage.setItem('gemini_api_key', e.target.value); else localStorage.removeItem('gemini_api_key'); }}
            placeholder="Gemini API key"
            className="input-field w-40 text-xs"
          />
          <button
            type="button"
            onClick={() => fetchAvailableModels(apiKey)}
            disabled={fetchingModels}
            className="btn-secondary text-xs px-2 flex items-center gap-1"
            title="Fetch available models"
          >
            {fetchingModels ? <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
            Refresh Models
          </button>
          {availableModels.length > 0 && (
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="input-field w-44 text-xs"
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}
          <button onClick={handleAutoPlace} disabled={loading} className="btn-secondary text-sm">
            {loading ? 'Placing…' : 'AI Auto-Place'}
          </button>
          <button onClick={handleAutoRoute} disabled={routing} className="btn-primary text-sm flex items-center gap-2">
            {routing && <span className="inline-block w-4 h-4 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin" />}
            {routing ? 'Routing…' : 'Auto Route'}
          </button>
        </div>
      </div>
      {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded p-2">{error}</div>}
      {viewMode === '2d' ? (
        <div className="panel overflow-auto">
          <Stage width={stageW} height={stageH}>
            <Layer>
              <Rect x={0} y={0} width={stageW} height={stageH} fill="#1e293b" stroke="#475569" strokeWidth={2} />
              {pcb.tracks.map((t) => (
                <Line
                  key={t.id}
                  points={t.points.map((v) => v * SCALE)}
                  stroke={t.layer === 'top' ? '#38bdf8' : '#22d3ee'}
                  strokeWidth={Math.max(2, t.width * SCALE)}
                  lineCap="round"
                  lineJoin="round"
                />
              ))}
              {pcb.footprints.map((fp) => (
                <Group
                  key={fp.id}
                  x={fp.x * SCALE}
                  y={fp.y * SCALE}
                  rotation={fp.rotation}
                  draggable
                  onDragEnd={(e) => {
                    updateFootprint(fp.id, {
                      x: e.target.x() / SCALE,
                      y: e.target.y() / SCALE,
                    });
                  }}
                >
                  <Rect x={-12} y={-8} width={24} height={16} fill="#334155" stroke="#94a3b8" cornerRadius={2} />
                  {fp.pads.map((p) => (
                    <Rect
                      key={p.id}
                      x={(p.x - p.width / 2) * SCALE}
                      y={(p.y - p.height / 2) * SCALE}
                      width={p.width * SCALE}
                      height={p.height * SCALE}
                      fill="#fbbf24"
                    />
                  ))}
                  <Text text={fp.name} fontSize={9} fill="#f8fafc" x={-11} y={-4} />
                </Group>
              ))}
            </Layer>
          </Stage>
        </div>
      ) : (
        <div className="panel" style={{ height: 500 }}>
          <PCB3DPreview pcb={pcb} />
        </div>
      )}
      <p className="text-xs text-[#94a3b8]">Drag footprints to reposition. AI Auto-Place uses Gemini. Auto Route runs grid A*.</p>
    </div>
  );
}
