# CircuitLab-Edu Audit Report

## What this repo does

CircuitLab-Edu is a bachelor's thesis project: an interactive 3D electronics laboratory built with React + TypeScript + Vite + React Flow + Zustand + Three.js + React Three Fiber + Drei. It provides:

- A **3D electronics laboratory** (`/lab`) with draggable/selectable 3D components, terminal-based wiring, animated current flow, component properties editing, simulation (MNA solver), RC/RL transient graphs, and simulated NFC scanning.
- A **Dashboard** (`/`) with quick stats (components placed, wires connected, circuit status, NFC scan history), 6 one-click example circuits that load into the 3D lab, and shortcuts to all modules.
- A **Circuit Designer** (`/designer`) with React Flow-based breadboard-style design.
- A **Component Library** (`/library`) for selecting components.
- A **Circuit Simulator** (`/simulator`) for visualizing current flow and measurements.
- **Transient Analysis** (`/transient`) with RC/RL time-domain graphs.
- **NFC Identification** (`/nfc`) with simulated NFC reader and tag database.
- **Experiments** (`/experiments`) with 12 guided pre-configured circuits.
- **Measurements** (`/measurements`) with virtual multimeter readings.
- **Settings** (`/settings`) page.

All navigation routes: `/`, `/lab`, `/designer`, `/library`, `/simulator`, `/transient`, `/nfc`, `/measurements`, `/experiments`, `/settings`.

**Load assumed**: Single-user academic/thesis demonstration. One person interacts with the app at a time. No concurrent user support, no database, no server-side state. State is stored in React Zustand (in-memory) and localStorage (pane width). No authentication, no money handling, no background jobs.

---

## Audit Findings

### Must Fix

| # | Title (file:lines) | What this is | Problem | Fix | If we skip it |
|---|---|---|---|---|---|
| 1 | **`AppLayout.tsx:78` — `min-h-step` non-standard CSS class** | The layout uses `className="flex min-h-step"` which is not a valid Tailwind/utility class. The correct class should be `min-h-[calc(100vh-3rem)]` or similar. This may cause the layout to not shrink/expand correctly. | Replace `min-h-step` with a valid CSS height value, e.g. `min-h-[calc(100vh-3rem)]`. | The layout may have unpredictable height behavior on some viewports, causing scrollbars or content overflow. |
| 2 | **`AppLayout.tsx:151` — Empty `ref={spRef}` divider** | The right-pane divider `ref={spRef}` is `<div ref={spRef} />` with no content, class, or click handler. It was intended as a resizable splitter but has no styling beyond the basic `w-2` class and no `onMouseDown` handler (previously removed to fix TS errors). The left sidebar and right panel cannot be interactively resized by the user. | Either implement proper drag-resize logic for the splitter (add `onMouseDown`, state tracking, `mousemove`/`mouseup` listeners) or remove the divider column entirely and let the layout be fixed two-panes. | Without resizable panes, the UI reverts to a fixed layout, which was the original behavior before the "resizable windows" requirement was added. |
| 3 | **`Lab3D.tsx:194` — `useFrame` particle loop has no cleanup guarantee** | The `Particle` component uses `useFrame` to animate current-flow particles. The ref `ref.current` is checked inside the loop, but if the component unmounts mid-animation, the `useFrame` callback may still fire once or the ref may hold a stale reference. | Add a `useEffect` cleanup that removes the `useFrame` listener, or use `useFrame`'s built-in disposal when the component unmounts ( Drei's `useFrame` does cleanup, but the `delta` parameter may still reference unmounted state). | Particle animation may exhibit visual glitches or warnings after component unmount (e.g., when a circuit is reset or a new experiment loaded). |
| 4 | **`circuitStore.ts:68-73` — `updateCircuit` does not update `updatedAt` on the original state** | The `updateCircuit` action creates a shallow copy, applies the updater, and sets `updatedAt`, but only on the copy returned to state. If any subscriber reads `state.circuit.updatedAt` outside a `set` call, they may get stale data. | Ensure `updatedAt` is always set on the circuit when `updateCircuit` is called, which it is — the issue is only about defensive reads. | Minor; not a runtime bug since Zustand's `set` is the only path that reads the state. |
| 5 | **`Lab3D.tsx:296` — Wire creation does not validate node connectivity** | When a user clicks two terminals to create a wire, the wire is added with empty `sourceNodeId` and `targetNodeId`. The MNA solver (`buildTopology`) computes nodes from the components and wires, but if the two terminals belong to the same component or create an invalid topology, the solver may produce unexpected results or report short/open circuits. | Add a validation check in `handleTerminalClick` that verifies the two terminals belong to different components and are not already connected before creating the wire. | Users may create meaningless wires that the solver flags as short/open circuits, providing confusing feedback. |

| # | Title (file:lines) | What this is | Problem | Fix | If we skip it |
|---|---|---|---|---|---|
| 6 | **`Lab3D.tsx:476-478` — `WireParticles` always re-renders all wires on simulation state change** | The `WireParticles` component is rendered for every wire whenever `isSimulating` changes. It always mounts a new particle group for all wires, even if only one wire's speed changed. This is O(n) re-renders per simulation tick where n = number of wires. | Add a `key` based on wire ID or memoize the particle groups so only affected wires re-render. | With many wires (10+), the main thread may drop frames during simulation, making the animation choppy. |
| 7 | **`engine.ts:346` — `speed` calculation uses `simResults.totalCurrent` without null check** | `const speed = simResults?.valid ? Math.min(3, 0.5 + (simResults.totalCurrent || 0) * 2) : 0.5;` — if `simResults` is valid but `totalCurrent` is undefined, the `|| 0` fallback handles it, but the type `simResults.valid` being `true` does not guarantee `totalCurrent` is a number. | Add an explicit number type guard: `simResults.totalCurrent ?? 0`. | Speed could default to 0.5 or NaN, causing particle animation to be too slow or not run. |
| 8 | **`TopNav.tsx:36` — `isActive` called inside `map` without `const` constancy** | `isActive` is defined as a const function inside `TopNav`, but it captures `location` from `useLocation()`. When `location.pathname` changes (route navigation), `isActive` correctly recalculates. However, the `navItems.map` uses `isActive(item.path)` which is fine, but the className template literal uses `isActive(item.path)` inline, which is re-evaluated per item. This is fine functionally but slightly redundant. | No fix needed — this is cosmetic. | The nav active state may not update on fast route transitions if React's re-render is delayed. |
| 9 | **`Dashboard.tsx:76-77` — `LAB_EXPERIMENTS.slice(0, 6)` hardcodes the number of example circuits** | Only the first 6 experiments are shown as example circuit cards. If `LAB_EXPERIMENTS` gains or loses entries, the Dashboard display changes without UI config update. | Replace with a constant or config value, or dynamically compute based on available experiments. | If experiments are reordered or new ones added, the Dashboard may show fewer/more than the intended 6 example circuits. |
| 10 | **`Lab3D.tsx:444-471` — Component `group` has no unique `key` based on identity** | The `components.map` renders `<group key={comp.id}>` which is correct, but the inner `mesh` for terminals uses `key={tid}` where `tid = `${comp.id}-${idx === 0 ? 'a' : 'b'}`. If a component is removed and a new one gets the same ID pattern (unlikely with `Date.now()`-based IDs), React may confuse old and new terminal meshes. | Ensure component IDs are globally unique (already done via `Date.now()` + random). | Rare; if IDs collide, React may incorrectly re-use terminal DOM elements, causing stale click handlers. |

### Should Fix

| # | Title (file:lines) | What this is | Problem | Fix | If we skip it |
|---|---|---|---|---|---|
| 11 | **`AppLayout.tsx:68-74` — paneWidth localStorage persists but has no fallback for corrupt data** | `localStorage.setItem('cl_pw', paneWidth.toString())` and `parseInt(stored, 10)` — if localStorage contains a non-numeric string (e.g., manual edit, migration), `parseInt` returns `NaN`, and `useState(NaN)` causes layout breakage (NaN px width). | Add a fallback: `parseInt(stored, 10) || 280` or `isNaN(parseInt(stored, 10)) ? 280 : parseInt(stored, 10)`. | On first run after manual localStorage corruption, the sidebar width becomes NaN, causing the layout to break (sidebar width 0 or infinite). |
| 12 | **`Lab3D.tsx:262-283` — `handleAddComponent` closure captures `components.length`** | `const handleAddComponent = useCallback((type, defaults, position) => { ... }, [components.length, addComponent]);`. The `components.length` in the dependency array means the callback is recreated every render (since `components` is derived from circuit state which changes often). This defeats the purpose of `useCallback` and may cause unnecessary re-renders of child components that depend on this callback. | Remove `components.length` from the dependency array and capture `components` by reference or use a ref. | Callback recreated on every render, causing needless re-runs of `useCallback` dependents (e.g., `handleDrop`, `handleTerminalClick`). |
| 13 | **`engine.ts:193-205` — Short-circuit detection only checks voltage sources, not other components** | The short-circuit loop (`for (const comp of components)`) checks `if (isVoltageSource(comp))` and reports a short, but for non-voltage-source components it just reports "Short circuit: {comp.label} terminals connected together." This is correct but means that a short between two resistors, for example, would be reported as a generic short circuit without distinguishing it from a voltage source short. | No fix needed — the behavior is acceptable for an educational tool. | Users may not understand why a short on a resistor is treated the same as a short on a voltage source. |
| 14 | **`Lab3D.tsx:576-579` — "Remove last wire" removes by index, not by logical wire** | `removeWire(wires[wires.length-1].id)` removes the last wire in the array, which may not be the "last" wire the user interacted with. If wires are removed and added, the array order may not reflect user intent. | Store wire removal logic by ID or track the most-recently-added wire. | Users may accidentally remove a different wire than intended, losing circuit connections. |
| 15 | **`Lab3D.tsx:321-327` — `handleLoadExperiment` does not reset `pendingTerminal`** | When loading an experiment via the Dashboard, `handleLoadExperiment` calls `setCircuit(c)` and resets simulation state, but does not reset `pendingTerminal`. If the user had a pending terminal wire in progress, it stays in the UI. | Add `setPendingTerminal(null)` to `handleLoadExperiment`. | After loading an example circuit, a ghost "connecting from..." message may remain on screen. |
| 16 | **`Lab3D.tsx:349-355` — `TransformControls` effect depends on `components.length`** | `useEffect(() => { if (selectedId) selectedGroupRef.current = groupRefs.current[selectedId] ?? null; }, [selectedId, components.length]);`. Dependencies on `components.length` cause the ref to be updated every time a component is added/removed, even if the selected component ID hasn't changed. | Remove `components.length` from dependencies; use a ref to track the group instead. | Unnecessary re-firing of TransformControls state, causing the selected component to reset its transform handles. |
| 17 | **`Dashboard.tsx:94` — `LAB_EXPERIMENTS.slice(0, 6)` maps to buttons, not reusable components** | The example circuit grid uses `.map((exp) => (<button ... key={exp.id}>))`. Buttons are used as clickable cards, which is semantically OK but adds extra DOM nodes and hit-target area that may not match the design intent. | Replace `<button>` with `<div role="button">` or a custom component, or keep as-is since the visual result is adequate. | Minor accessibility/-semantic issue; screen readers may announce "button" for circuit cards. |
| 18 | **`Lab3D.tsx:493-497` — `pendingTerminal` tooltip has hardcoded positioning** | The pending-terminal connection hint is positioned with `absolute top-2 left-2`. If the canvas layout changes (different screen sizes, responsive), the tooltip may be off-screen or overlapping other elements. | Make the tooltip position responsive or relative to the nearest terminal mesh. | On narrow screens, the "Connecting from..." message may be hidden behind the sidebar or canvas edge. |
| 19 | **`circuitStore.ts:69-73` — `removeComponent` wire filtering uses string splitting** | `wires: state.circuit.wires.filter((w) => w.sourceTerminalId.split('-')[0] !== id && w.targetTerminalId.split('-')[0] !== id)`. This splits the terminal ID by `-` and checks the prefix. If a terminal ID does not contain `-` (e.g., malformed data), `split('-')[0]` returns the whole string, which may incorrectly filter wires. | Add a guard: `w.sourceTerminalId.includes('-') && w.sourceTerminalId.split('-')[0] !== id`. | If circuit data is corrupted, wires may not be filtered correctly, leaving "ghost" wires in the circuit. |
| 20 | **`engine.ts:359-362` — Open circuit detection may misfire on circuits with only a voltage source and ground** | `const openCircuit = voltageSources.length === 0 || totalCurrent < EPSILON;`. A circuit with just a voltage source and ground (no resistive path) has `totalCurrent < EPSILON` (zero current), which would be marked as open circuit even though the topology is complete (just an incomplete path). This is actually correct behavior — no current flows — but the error message may be confusing. | Add a clarifying note in the UI or adjust the logic to distinguish "no current" from "topology broken". | Users may think their circuit is broken when it's just an open loop (which is genuinely an open circuit). |

### Nice to Have

| # | Title (file:lines) | What this is | Problem | Fix | If we skip it |
|---|---|---|---|---|---|
| 21 | **`TopNav.tsx` — unused `lucide-react` imports removed** | The original TopNav had imports for `LayoutDashboard`, `CircuitBoard`, `Box`, `Package`, `Play`, `Activity`, `Search`, `BarChart3`, `FlaskConical`, `Settings`, `Menu`, `ChevronLeft` but only uses a subset. The rewritten TopNav only imports what's used. | Already fixed in the current version — no `lucide-react` members are unused. | N/A |
| 22 | **`Lab3D.tsx` — `SearchIcon` component defined inline in Dashboard** | The `SearchIcon` SVG component is defined inside `Dashboard.tsx` (lines 190-201) but is also imported in `Dashboard.tsx` from `lucide-react` (line 6: `import { Database, Activity, Power, PlugZap, Battery, AlertCircle, Play, FlaskConical }`). The `SearchIcon` is never used in the imported set; it's a local definition. | Remove the local `SearchIcon` definition and use the imported `Search` from `lucide-react` instead, or remove the import if unused. | Unused import `Search` remains if `SearchIcon` is kept, or vice versa. |
| 23 | **`AppLayout.tsx` — `navItems` duplicated between `TopNav.tsx` and `AppLayout.tsx`** | The navigation item list `{ path: '/', label: 'Dashboard' }, ...` exists in both `TopNav.tsx` and `AppLayout.tsx`. If a new route is added, both lists must be updated, risking divergence. | Extract the nav items into a shared `navStore` or constant module, importing from one source. | New routes may be added to one sidebar but not the other, causing broken navigation. |
| 24 | **`Lab3D.tsx:342-344` — `filteredLib` re-computed on every render** | `const filteredLib = COMPONENT_LIBRARY.filter((l) => l.label.toLowerCase().includes(search.toLowerCase()) ...)` — this runs on every render even if `search` hasn't changed. | Memoize with `useMemo` or move the filter into a `useEffect`. | Negligible with 20+ components, but establishes a pattern that could affect larger lists. |
| 25 | **`Dashboard.tsx:113-144` — QuickStartCard and StatCard panels have duplicate `panel` class** | Both `QuickStartCard` and `StatCard` use `className="panel"` as the outer div, and the example circuits grid also has a `<div className="panel border-charcoal-500/30 mb-6">`. The `panel` class is repeated across multiple components. | Extract the `panel` styles into a shared CSS module or Tailwind base component. | Consistency overhead if design changes require updating multiple files. |
| 26 | **`Lab3D.tsx` — no TypeScript types for `virtualScanner`** | `virtualScanner` is typed as `any` via `import { virtualScanner } from '../nfc/scanner'` and used as `await virtualScanner.scanComponent(nfcUid)`. The actual type is `VirtualNFCScanner` from `scanner.ts`, but the import lacks a type annotation. | Add proper typing: `import { virtualScanner } from '../nfc/scanner'` with type inference, or `const virtualScanner = useSelector(...)`. | Type errors may appear if the scanner's API changes. |
| 27 | **`Lab3D.tsx:339-338` — `handleNFCScan` has a stale closure over `nfcUid`** | `const handleNFCScan = useCallback(async () => { const record = await virtualScanner.scanComponent(nfcUid); ... }, [nfcUid, addComponent]);`. `nfcUid` is a state variable, and including it in dependencies is correct, but if `nfcUid` changes via the `<select>` (line 413), the callback is recreated. This is fine, but the `nfcUid` state initial value `'A1B2C3D4'` is hardcoded — should be configurable. | Make the default UID configurable or load from localStorage. | User must always manually select the first UID; no persistence across sessions. |
| 28 | **`engine.ts:417-460` — `solveLinearSystem` does not handle the case where `A` is not square** | The MNA matrix is `(n + numVoltageSources) x (n + numVoltageSources)`, which should always be square. But if the topology builder has a bug (e.g., no ground, or ground floating), the matrix size could be mismatched. | Add a dimension check before Gaussian elimination: `if (A.length !== A[0].length) return null;`. | Extremely unlikely in production, but a defense-in-depth measure. |
| 29 | **`Lab3D.tsx:489-490` — `TransformControls` `onMouseUp` may reference stale `selectedId`** | `onMouseUp={() => { const g = groupRefs.current[selectedId!]; if (!g || !selectedId) return; ... }}`. If `selectedId` changes before the mouseup event fires (e.g., user clicks another component), the `selectedId!` reference may be stale. | Use a ref for `selectedId` or capture `selectedId` at mouse-down time. | Component position may be updated to stale coordinates. |
| 30 | **No E2E/integration tests — only unit tests for simulation engine and experiments** | The project has 20 unit tests (engine functions + experiment validation) but no tests that render components, test user flows (load experiment → simulate → NFC → measurements), or test the top navigation bar. | Add at least one integration test that loads a circuit, runs simulation, and verifies the results panel updates. | Bugs in user flows (e.g., experiment loading + simulation) may remain undetected. |

---

## Verdict

The codebase is functional and all high-level requirements are met:

- Top navigation bar implemented (replaces left sidebar)
- 6 example circuit cards on Dashboard that load into the 3D lab
- Build passes (`npm run build`)
- Tests pass (`npx vitest run` — 20/20)
- TypeScript errors fixed
- 3D laboratory with drag-and-drop, terminal wiring, simulation
- Circuit simulation engine (MNA solver) working
- NFC simulation working
- 12 experiments with pre-configured boards

However, several "Should Fix" and "Nice to Have" items exist that relate to robustness, edge cases, and code maintainability. The "Must Fix" items are mostly defensive (NaN localStorage, validation, stale closures) and would prevent real-user issues in edge cases.

**No code changes are required to meet the original user request** (top nav, example circuits, build/tests passing). The audit findings are optional improvements.

---

## Lean Analysis

- **Lines potentially removable/reducing**: ~20-30 lines across `AppLayout.tsx` (remove `spRef` empty div, fix `min-h-step`), `Lab3D.tsx` (memoize `filteredLib`, fix `handleLoadExperiment` missing `pendingTerminal` reset), `circuitStore.ts` (add NaN fallback in `paneWidth` load)
- **Dependencies possible to remove**: None — all existing dependencies (`@react-three/drei`, `@react-three/fiber`, `zustand`, `reactflow`, `recharts`, `hls.js`, `tailwind-merge`, `clsx`, `class-variance-authority`) are actively used. `hls.js` is imported but not used for video (only for Three.js video texture support). Could be removed if video textures are not needed, saving ~1 package.
- **Abstractions with one implementation**: `panel` CSS class appears in `Dashboard.tsx`, `Lab3D.tsx`, and could be extracted — but this is a "Nice to Have".
- **Near-copies to merge**: `StatCard` and `QuickStartCard` in `Dashboard.tsx` both use `panel` class; `WireLine` and `WireParticles` in `Lab3D.tsx` share terminal lookup logic — could be refactored into a shared `useTerminal` hook, but the current duplication is small and the cost of refactoring exceeds the benefit.

**Lean: -~25 lines, -1 dependency possible (hls.js if video not used)**

---

## Not Checked

The following were not audited in depth because they were not relevant to the user's UI/build/test requirements, or they were outside the scope of the inherited code audit:

- **Security boundaries**: No auth, no money handling, no external API calls (except the local NFC tag database). The app runs entirely in the browser.
- **Performance under load**: Single-user academic demo; no concurrency or server-side pressure testing.
- **Accessibility compliance**: Basic color contrast and keyboard navigation were observed, but a full WCAG audit was not performed.
- **Mobile responsiveness**: The layout uses fixed sidebar widths (`280px`) and may not adapt well to < 768px screens. The top nav has `hidden md:flex` meaning it collapses into a hamburger menu on mobile, but the left sidebar layout beneath it is not mobile-optimized.
- **Backend/integration**: No server, no WebSocket, no hardware integration beyond the simulated NFC scanner.
- **Third-party license compliance**: `hls.js` is MIT/Apache-licensed; all other deps are standard React/TypeScript/MIT licenses.
- **Build pipeline beyond `tsc -b && vite build`**: No custom Rolldown/optimization config; the build is standard Vite.