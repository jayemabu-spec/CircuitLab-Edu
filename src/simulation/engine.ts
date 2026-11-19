import type { Component, Wire, SimulationResult, ComponentType } from '../types/circuit';

const EPSILON = 1e-12;
const DEFAULT_VOLTAGE = 5;

/**
 * Get the resistance value of a component in ohms.
 * Returns null for non-resistive components (sources, meters, ground).
 */
function getResistance(comp: Component): number | null {
  switch (comp.type) {
    case 'resistor': {
      const r = Number(comp.properties.resistance);
      return isFinite(r) && r > 0 ? r : null;
    }
    case 'bulb':
    case 'led': {
      const r = Number(comp.properties.resistance);
      return isFinite(r) && r > 0 ? r : null;
    }
    case 'ammeter': {
      return 0.001;
    }
    case 'voltmeter':
    case 'ohmmeter':
    case 'multimeter': {
      return 1e9;
    }
    case 'switch': {
      const closed = comp.properties.closed !== false;
      return closed ? 0.001 : null; // near-zero when closed, open when open
    }
    default:
      return null;
  }
}

function getVoltageSource(comp: Component): number | null {
  if (comp.type === 'voltageSource') {
    const v = Number(comp.properties.voltage);
    return isFinite(v) ? v : DEFAULT_VOLTAGE;
  }
  return null;
}

function isGround(comp: Component): boolean {
  return comp.type === 'ground';
}

function isVoltageSource(comp: Component): boolean {
  return comp.type === 'voltageSource';
}

function isAmmeter(comp: Component): boolean {
  return comp.type === 'ammeter';
}

function isVoltmeter(comp: Component): boolean {
  return comp.type === 'voltmeter';
}

function isOhmmeter(comp: Component): boolean {
  return comp.type === 'ohmmeter';
}

/**
 * Build the circuit topology graph from components and wires.
 * Returns node assignments for each terminal and a list of supernodes.
 */
function buildTopology(
  components: Component[],
  wires: Wire[]
): {
  terminalNode: Record<string, string>; // terminalId -> nodeId
  nodes: Record<string, Set<string>>; // nodeId -> Set of terminalIds
  componentTerminals: Record<string, { a: string; b: string }>; // compId -> terminal ids
} {
  const terminalNode: Record<string, string> = {};
  const nodes: Record<string, Set<string>> = {};
  const componentTerminals: Record<string, { a: string; b: string }> = {};

  // Union-find for nodes
  const parent: Record<string, string> = {};

  function find(x: string): string {
    if (!parent[x]) parent[x] = x;
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }

  function union(a: string, b: string): void {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  }

  // Initialize each component's terminals
  for (const comp of components) {
    const t1 = comp.terminals[0];
    const t2 = comp.terminals[1];
    if (!t1) continue;
    // Single-terminal components (e.g. ground) map both ends to the same terminal
    const b = t2 ? t2.id : t1.id;
    componentTerminals[comp.id] = { a: t1.id, b };
    terminalNode[t1.id] = t1.id;
    if (t2) terminalNode[t2.id] = t2.id;
    if (!nodes[t1.id]) nodes[t1.id] = new Set();
    nodes[t1.id]!.add(t1.id);
    if (t2) {
      if (!nodes[t2.id]) nodes[t2.id] = new Set();
      nodes[t2.id]!.add(t2.id);
    }
  }

  // Union terminals connected by wires
  for (const wire of wires) {
    union(wire.sourceTerminalId, wire.targetTerminalId);
  }

  // Collapse into canonical node ids
  const canonicalMap: Record<string, string> = {};
  for (const termId of Object.keys(terminalNode)) {
    const root = find(termId);
    canonicalMap[termId] = root;
  }

  // Rebuild nodes keyed only by canonical root
  const cleanNodes: Record<string, Set<string>> = {};
  for (const [termId, root] of Object.entries(canonicalMap)) {
    if (!cleanNodes[root]) cleanNodes[root] = new Set();
    cleanNodes[root]!.add(termId);
  }

  for (const termId of Object.keys(terminalNode)) {
    terminalNode[termId] = canonicalMap[termId];
  }

  return { terminalNode, nodes: cleanNodes, componentTerminals };
}

/**
 * Nodal analysis solver using Modified Nodal Analysis (MNA) for voltage sources.
 * Solves for node voltages and branch currents.
 */
export function solveCircuit(
  components: Component[],
  wires: Wire[]
): SimulationResult {
  const errors: string[] = [];
  const { terminalNode, nodes, componentTerminals } = buildTopology(components, wires);

  // Unique node IDs are the canonical roots (values of terminalNode)
  const nodeIds = [...new Set(Object.values(terminalNode))];
  if (nodeIds.length === 0) {
    return {
      valid: false,
      errors: ['No components in circuit.'],
      nodeVoltages: {},
      branchCurrents: {},
      componentVoltages: {},
      componentPowers: {},
      totalResistance: 0,
      totalCurrent: 0,
      shortCircuit: false,
      openCircuit: true,
      floatingNodes: [],
    };
  }

  // Check for ground
  let groundNode: string | null = null;
  for (const comp of components) {
    if (isGround(comp)) {
      const terms = componentTerminals[comp.id];
      if (terms) {
        groundNode = terminalNode[terms.a];
        break;
      }
    }
  }

  if (!groundNode) {
    errors.push('No ground reference in circuit. Add a ground component.');
  }

  // Check for voltage sources
  const voltageSources = components.filter(isVoltageSource);
  if (voltageSources.length === 0) {
    errors.push('No voltage source in circuit. Add a DC voltage source.');
  }

  // Check for short circuits: any component whose two distinct terminals are wired to the same node
  for (const comp of components) {
    const terms = componentTerminals[comp.id];
    if (!terms || terms.a === terms.b) continue;
    const na = terminalNode[terms.a];
    const nb = terminalNode[terms.b];
    if (na && nb && na === nb) {
      if (isVoltageSource(comp)) {
        errors.push(`Short circuit: voltage source "${comp.label}" terminals connected together.`);
      } else {
        errors.push(`Short circuit: ${comp.label} terminals connected together.`);
      }
    }
  }

  if (errors.length > 0) {
    return buildInvalidResult(errors, componentTerminals, components);
  }

  // Assign indices to non-ground nodes
  const nonGroundNodes = groundNode ? nodeIds.filter((n) => n !== groundNode) : nodeIds;
  const n = nonGroundNodes.length;
  const nodeIndex: Record<string, number> = {};
  nonGroundNodes.forEach((nodeId, i) => {
    nodeIndex[nodeId] = i;
  });

  // MNA matrix: [G B; B^T 0] * [V; I_src] = [I; V_src]
  // Size: (n + numVoltageSources) x (n + numVoltageSources)
  const m = n + voltageSources.length;
  const A: number[][] = Array.from({ length: m }, () => Array(m).fill(0));
  const z: number[] = Array(m).fill(0);

  const addConductance = (nodeA: string, nodeB: string, g: number): void => {
    if (g <= 0) return;
    const ia = nodeA === groundNode ? -1 : nodeIndex[nodeA];
    const ib = nodeB === groundNode ? -1 : nodeIndex[nodeB];
    if (ia >= 0 && ib >= 0) {
      A[ia][ia] += g;
      A[ib][ib] += g;
      A[ia][ib] -= g;
      A[ib][ia] -= g;
    } else if (ia >= 0) {
      A[ia][ia] += g;
    } else if (ib >= 0) {
      A[ib][ib] += g;
    }
  };

  // Add resistors (conductance between terminals)
  for (const comp of components) {
    const terms = componentTerminals[comp.id];
    if (!terms) continue;
    const r = getResistance(comp);
    if (r === null || r === 0) continue; // open or ideal wire
    const g = 1 / r;
    const na = terminalNode[terms.a];
    const nb = terminalNode[terms.b];
    addConductance(na, nb, g);
  }

  // Add voltage sources using MNA
  voltageSources.forEach((comp, srcIdx) => {
    const terms = componentTerminals[comp.id];
    if (!terms) return;
    const v = getVoltageSource(comp) ?? DEFAULT_VOLTAGE;
    const na = terminalNode[terms.a];
    const nb = terminalNode[terms.b];
    const srcRow = n + srcIdx;

    // V_na - V_nb = v  (row srcRow)
    if (na !== groundNode) A[srcRow][nodeIndex[na]] = 1;
    if (nb !== groundNode) A[srcRow][nodeIndex[nb]] = -1;
    z[srcRow] = v;

    // Coupling column: source current variable appears in KCL rows of na and nb
    if (na !== groundNode) A[nodeIndex[na]][srcRow] += 1;
    if (nb !== groundNode) A[nodeIndex[nb]][srcRow] -= 1;
  });

  // Solve linear system A * x = z using Gaussian elimination with partial pivoting
  const x = solveLinearSystem(A, z);
  if (x === null) {
    return {
      valid: false,
      errors: ['Circuit matrix is singular. Check for short circuits or floating nodes.'],
      nodeVoltages: {},
      branchCurrents: {},
      componentVoltages: {},
      componentPowers: {},
      totalResistance: 0,
      totalCurrent: 0,
      shortCircuit: true,
      openCircuit: false,
      floatingNodes: [],
    };
  }

  // Extract node voltages
  const nodeVoltages: Record<string, number> = {};
  if (groundNode) nodeVoltages[groundNode] = 0;
  nonGroundNodes.forEach((nodeId) => {
    nodeVoltages[nodeId] = x[nodeIndex[nodeId]] ?? 0;
  });

  // Extract voltage source currents
  const sourceCurrents: Record<string, number> = {};
  voltageSources.forEach((comp, srcIdx) => {
    sourceCurrents[comp.id] = x[n + srcIdx] ?? 0;
  });

  // Calculate branch currents through each component terminal
  const branchCurrents: Record<string, number> = {};
  const componentVoltages: Record<string, number> = {};
  const componentPowers: Record<string, number> = {};

  for (const comp of components) {
    const terms = componentTerminals[comp.id];
    if (!terms) continue;
    const va = nodeVoltages[terminalNode[terms.a]] ?? 0;
    const vb = nodeVoltages[terminalNode[terms.b]] ?? 0;
    const vDrop = va - vb;
    componentVoltages[comp.id] = Math.abs(vDrop);

    const r = getResistance(comp);
    if (r !== null && r > 0) {
      const current = vDrop / r;
      branchCurrents[terms.a] = current;
      branchCurrents[terms.b] = -current;
      componentPowers[comp.id] = (vDrop * vDrop) / r;
    } else if (isVoltageSource(comp)) {
      componentPowers[comp.id] = Math.abs(vDrop * (sourceCurrents[comp.id] ?? 0));
    } else if (isAmmeter(comp) || isVoltmeter(comp) || isOhmmeter(comp)) {
      // Meters are ideal - no power dissipation
      componentPowers[comp.id] = 0;
    } else {
      componentPowers[comp.id] = 0;
    }
  }

  // Total current from voltage sources
  let totalCurrent = 0;
  for (const comp of voltageSources) {
    totalCurrent += Math.abs(sourceCurrents[comp.id] ?? 0);
  }

  // Total equivalent resistance (V / I_total from sources)
  let totalResistance = 0;
  const totalVoltage = voltageSources.reduce((sum, c) => sum + (getVoltageSource(c) ?? 0), 0);
  if (totalCurrent > EPSILON) {
    totalResistance = totalVoltage / totalCurrent;
  }

  // Detect floating nodes (nodes with only one connection)
  const floatingNodes: string[] = [];
  for (const [nodeId, terminals] of Object.entries(nodes)) {
    if (nodeId === groundNode) continue;
    const compCount = new Set([...terminals].map((t) => {
      for (const comp of components) {
        const terms = componentTerminals[comp.id];
        if (terms && (terms.a === t || terms.b === t)) return comp.id;
      }
      return null;
    }).filter(Boolean));
    if (compCount.size <= 1) {
      floatingNodes.push(nodeId);
    }
  }

  // Detect open circuits: no complete path from source to ground
  const openCircuit = voltageSources.length === 0 || totalCurrent < EPSILON;

  return {
    valid: errors.length === 0,
    errors,
    nodeVoltages,
    branchCurrents,
    componentVoltages,
    componentPowers,
    totalResistance,
    totalCurrent,
    shortCircuit: errors.some((e) => e.includes('Short circuit')),
    openCircuit,
    floatingNodes,
  };
}

function buildInvalidResult(
  errors: string[],
  componentTerminals: Record<string, { a: string; b: string }>,
  components: Component[]
): SimulationResult {
  const nodeVoltages: Record<string, number> = {};
  const branchCurrents: Record<string, number> = {};
  const componentVoltages: Record<string, number> = {};
  const componentPowers: Record<string, number> = {};

  for (const comp of components) {
    const terms = componentTerminals[comp.id];
    if (!terms) continue;
    componentVoltages[comp.id] = 0;
    componentPowers[comp.id] = 0;
    branchCurrents[terms.a] = 0;
    branchCurrents[terms.b] = 0;
  }

  return {
    valid: false,
    errors,
    nodeVoltages,
    branchCurrents,
    componentVoltages,
    componentPowers,
    totalResistance: 0,
    totalCurrent: 0,
    shortCircuit: errors.some((e) => e.includes('Short circuit')),
    openCircuit: true,
    floatingNodes: [],
  };
}

/**
 * Gaussian elimination with partial pivoting.
 * Returns solution vector or null if singular.
 */
function solveLinearSystem(A: number[][], z: number[]): number[] | null {
  const n = z.length;
  // Augmented matrix
  const M: number[][] = A.map((row, i) => [...row, z[i]]);

  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let maxRow = col;
    let maxVal = Math.abs(M[col][col]);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > maxVal) {
        maxVal = Math.abs(M[row][col]);
        maxRow = row;
      }
    }

    if (maxVal < EPSILON) return null;

    // Swap rows
    if (maxRow !== col) {
      [M[col], M[maxRow]] = [M[maxRow], M[col]];
    }

    // Eliminate below
    for (let row = col + 1; row < n; row++) {
      const factor = M[row][col] / M[col][col];
      for (let k = col; k <= n; k++) {
        M[row][k] -= factor * M[col][k];
      }
    }
  }

  // Back substitution
  const x: number[] = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = M[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= M[i][j] * x[j];
    }
    x[i] = sum / M[i][i];
  }

  return x;
}

/**
 * Calculate equivalent resistance for series resistors.
 */
export function seriesResistance(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0);
}

/**
 * Calculate equivalent resistance for parallel resistors.
 */
export function parallelResistance(values: number[]): number {
  if (values.length === 0) return 0;
  if (values.some((v) => v <= 0)) return 0;
  const invSum = values.reduce((sum, v) => sum + 1 / v, 0);
  return 1 / invSum;
}

/**
 * Voltage divider: V_out = V_in * R2 / (R1 + R2)
 */
export function voltageDivider(vin: number, r1: number, r2: number): number {
  const total = r1 + r2;
  if (total <= 0) return 0;
  return vin * (r2 / total);
}

/**
 * Current divider: I2 = I_total * R1 / (R1 + R2)
 */
export function currentDivider(itotal: number, r1: number, r2: number): number {
  const total = r1 + r2;
  if (total <= 0) return 0;
  return itotal * (r1 / total);
}

/**
 * Power: P = V * I = I^2 * R = V^2 / R
 */
export function powerFromVI(v: number, i: number): number {
  return v * i;
}

export function powerFromVR(v: number, r: number): number {
  if (r <= 0) return 0;
  return (v * v) / r;
}

export function powerFromIR(i: number, r: number): number {
  return i * i * r;
}

/**
 * RC time constant: tau = R * C
 */
export function rcTimeConstant(r: number, c: number): number {
  return r * c;
}

/**
 * RC charging voltage: V(t) = V_source * (1 - e^(-t/tau))
 */
export function rcChargingVoltage(t: number, vsource: number, r: number, c: number): number {
  const tau = rcTimeConstant(r, c);
  if (tau <= 0) return vsource;
  return vsource * (1 - Math.exp(-t / tau));
}

/**
 * RC discharging voltage: V(t) = V_initial * e^(-t/tau)
 */
export function rcdischargingVoltage(t: number, vinitial: number, r: number, c: number): number {
  const tau = rcTimeConstant(r, c);
  if (tau <= 0) return 0;
  return vinitial * Math.exp(-t / tau);
}

/**
 * RL time constant: tau = L / R
 */
export function rlTimeConstant(r: number, l: number): number {
  return l / r;
}

/**
 * RL current rise: I(t) = (V/R) * (1 - e^(-t/tau))
 */
export function rlCurrentRise(t: number, v: number, r: number, l: number): number {
  const tau = rlTimeConstant(r, l);
  if (tau <= 0) return v / r;
  return (v / r) * (1 - Math.exp(-t / tau));
}

/**
 * RL current decay: I(t) = I_initial * e^(-t/tau)
 */
export function rlCurrentDecay(t: number, iinitial: number, r: number, l: number): number {
  const tau = rlTimeConstant(r, l);
  if (tau <= 0) return 0;
  return iinitial * Math.exp(-t / tau);
}

export type { ComponentType };
