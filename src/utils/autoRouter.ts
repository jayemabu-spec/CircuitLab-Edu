import type { PCBFootprint, PCBTrack } from '../types/pcb';
import type { Wire } from '../types/circuit';

interface Cell {
  x: number;
  y: number;
}

function key(c: Cell) {
  return `${c.x},${c.y}`;
}

function heuristic(a: Cell, b: Cell) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function neighbors(c: Cell, w: number, h: number): Cell[] {
  const out: Cell[] = [];
  if (c.x > 0) out.push({ x: c.x - 1, y: c.y });
  if (c.x < w - 1) out.push({ x: c.x + 1, y: c.y });
  if (c.y > 0) out.push({ x: c.x, y: c.y - 1 });
  if (c.y < h - 1) out.push({ x: c.x, y: c.y + 1 });
  return out;
}

function terminalToPadCell(fp: PCBFootprint, terminalId: string): Cell | null {
  // terminal ids like "compId-a" / "compId-b"
  const suffix = terminalId.split('-').pop();
  const idx = suffix === 'b' ? 1 : 0;
  const pad = fp.pads[idx] ?? fp.pads[0];
  if (!pad) return null;
  return { x: Math.round(fp.x + pad.x), y: Math.round(fp.y + pad.y) };
}

function findFootprint(footprints: PCBFootprint[], terminalId: string): PCBFootprint | null {
  const compId = terminalId.split('-').slice(0, -1).join('-');
  return footprints.find((f) => f.componentId === compId) || null;
}

export function autoRoute(footprints: PCBFootprint[], wires: Wire[]): PCBTrack[] {
  if (footprints.length === 0) return [];

  const maxX = Math.max(100, ...footprints.map((f) => Math.ceil(f.x + 20)));
  const maxY = Math.max(80, ...footprints.map((f) => Math.ceil(f.y + 20)));
  const W = maxX;
  const H = maxY;

  // Build obstacle grid (footprint bodies blocked)
  const blocked = new Set<string>();
  for (const fp of footprints) {
    for (let dx = -6; dx <= 6; dx++) {
      for (let dy = -4; dy <= 4; dy++) {
        const cx = Math.round(fp.x + dx);
        const cy = Math.round(fp.y + dy);
        if (cx >= 0 && cx < W && cy >= 0 && cy < H) {
          blocked.add(`${cx},${cy}`);
        }
      }
    }
    // pads are routable
    for (const pad of fp.pads) {
      const cx = Math.round(fp.x + pad.x);
      const cy = Math.round(fp.y + pad.y);
      blocked.delete(`${cx},${cy}`);
    }
  }

  const tracks: PCBTrack[] = [];

  for (let wi = 0; wi < wires.length; wi++) {
    const wire = wires[wi];
    const srcFp = findFootprint(footprints, wire.sourceTerminalId);
    const tgtFp = findFootprint(footprints, wire.targetTerminalId);
    if (!srcFp || !tgtFp) continue;

    const start = terminalToPadCell(srcFp, wire.sourceTerminalId);
    const end = terminalToPadCell(tgtFp, wire.targetTerminalId);
    if (!start || !end) continue;

    // A*
    const open: Cell[] = [start];
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    gScore.set(key(start), 0);
    fScore.set(key(start), heuristic(start, end));

    let found = false;
    while (open.length > 0) {
      open.sort((a, b) => (fScore.get(key(a)) ?? Infinity) - (fScore.get(key(b)) ?? Infinity));
      const current = open.shift()!;
      if (key(current) === key(end)) {
        found = true;
        break;
      }
      for (const nb of neighbors(current, W, H)) {
        if (blocked.has(key(nb)) && key(nb) !== key(end)) continue;
        const tentative = (gScore.get(key(current)) ?? Infinity) + 1;
        if (tentative < (gScore.get(key(nb)) ?? Infinity)) {
          cameFrom.set(key(nb), key(current));
          gScore.set(key(nb), tentative);
          fScore.set(key(nb), tentative + heuristic(nb, end));
          if (!open.some((c) => key(c) === key(nb))) {
            open.push(nb);
          }
        }
      }
    }

    if (!found) continue;

    // reconstruct
    const path: Cell[] = [];
    let cur: string | undefined = key(end);
    while (cur) {
      const [x, y] = cur.split(',').map(Number);
      path.unshift({ x, y });
      const prev = cameFrom.get(cur);
      if (!prev || prev === cur) break;
      cur = prev;
      if (cur === key(start)) {
        // add start
        break;
      }
    }
    // ensure start included
    if (path.length === 0 || key(path[0]) !== key(start)) {
      path.unshift(start);
    }

    const points: number[] = [];
    for (const c of path) {
      points.push(c.x, c.y);
    }

    tracks.push({
      id: `track-${wi}-${Date.now()}`,
      points,
      width: 0.5,
      layer: 'top',
      netId: wire.id,
    });
  }

  return tracks;
}
