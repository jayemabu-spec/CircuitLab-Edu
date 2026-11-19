import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { PCBData } from '../types/pcb';

interface PCB3DPreviewProps {
  pcb: PCBData;
}

function isResistorOrLed(name: string) {
  const n = name.toLowerCase();
  return n.includes('resistor') || n.includes('led');
}
function isCapacitor(name: string) {
  return name.toLowerCase().includes('capacitor');
}
function isIc(name: string) {
  const n = name.toLowerCase();
  return n.includes('ic') || n.includes('chip');
}

export function PCB3DPreview({ pcb }: PCB3DPreviewProps) {
  const boardW = pcb.boardWidth / 10; // scale mm -> scene units
  const boardH = pcb.boardHeight / 10;

  return (
    <div className="w-full h-full min-h-[400px]">
      <Canvas camera={{ position: [boardW, boardH, boardW], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1} />
        {/* Board */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[boardW, 0.2, boardH]} />
          <meshStandardMaterial color="#1a7f37" />
        </mesh>
        {/* Tracks */}
        {pcb.tracks.map((t) => {
          const pts = t.points;
          const elems = [];
          for (let i = 0; i + 3 < pts.length; i += 2) {
            const x1 = pts[i] / 10;
            const y1 = pts[i + 1] / 10;
            const x2 = pts[i + 2] / 10;
            const y2 = pts[i + 3] / 10;
            const cx = (x1 + x2) / 2;
            const cz = (y1 + y2) / 2;
            const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const angle = Math.atan2(y2 - y1, x2 - x1);
            elems.push(
              <mesh key={`${t.id}-${i}`} position={[cx, 0.12, cz]} rotation={[0, -angle, 0]}>
                <boxGeometry args={[len, 0.05, t.width / 10]} />
                <meshStandardMaterial color={t.layer === 'top' ? '#ef4444' : '#3b82f6'} />
              </mesh>
            );
          }
          return elems;
        })}
        {/* Footprints */}
        {pcb.footprints.map((fp) => {
          const x = fp.x / 10;
          const z = fp.y / 10;
          if (isCapacitor(fp.name)) {
            return (
              <mesh key={fp.id} position={[x, 0.2, z]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.15, 0.15, 0.3, 16]} />
                <meshStandardMaterial color="#334155" />
              </mesh>
            );
          }
          if (isIc(fp.name)) {
            return (
              <group key={fp.id} position={[x, 0.2, z]}>
                <mesh>
                  <boxGeometry args={[0.6, 0.15, 0.4]} />
                  <meshStandardMaterial color="#0f172a" />
                </mesh>
                {fp.pads.map((p) => (
                  <mesh key={p.id} position={[p.x / 10, -0.05, p.y / 10]}>
                    <boxGeometry args={[0.08, 0.05, 0.08]} />
                    <meshStandardMaterial color="#94a3b8" />
                  </mesh>
                ))}
              </group>
            );
          }
          // resistor / led default
          return (
            <group key={fp.id} position={[x, 0.2, z]}>
              <mesh>
                <boxGeometry args={[0.5, 0.12, 0.2]} />
                <meshStandardMaterial color={isResistorOrLed(fp.name) ? '#1f2937' : '#334155'} />
              </mesh>
              {fp.pads.map((p) => (
                <mesh key={p.id} position={[p.x / 10, -0.05, p.y / 10]}>
                  <boxGeometry args={[0.1, 0.05, 0.1]} />
                  <meshStandardMaterial color="#94a3b8" />
                </mesh>
              ))}
            </group>
          );
        })}
        <OrbitControls />
      </Canvas>
    </div>
  );
}
