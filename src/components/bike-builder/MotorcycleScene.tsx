import { ContactShadows, Html, OrbitControls } from '@react-three/drei';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { Suspense, useMemo } from 'react';
import * as THREE from 'three';

export type BikePart = 'escape' | 'ruedas' | 'manubrio' | 'luces' | 'frenos' | 'carroceria';

type SceneProps = {
  activePart: BikePart | null;
  onSelectPart: (part: BikePart) => void;
  configuredParts: Partial<Record<BikePart, string>>;
  bodyColor: string;
};

const partLabels: Record<BikePart, string> = {
  escape: 'Escape',
  ruedas: 'Ruedas',
  manubrio: 'Manubrio',
  luces: 'Luces',
  frenos: 'Frenos',
  carroceria: 'Carrocería',
};

function Part({
  part,
  activePart,
  onSelect,
  children,
}: {
  part: BikePart;
  activePart: BikePart | null;
  onSelect: (part: BikePart) => void;
  children: React.ReactNode;
}) {
  const active = activePart === part;
  const click = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(part);
  };

  return (
    <group onClick={click} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = ''; }}>
      {children}
      {active ? (
        <Html center position={[0, 0.55, 0]} distanceFactor={7}>
          <span className="pointer-events-none whitespace-nowrap rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black shadow-lg">
            {partLabels[part]}
          </span>
        </Html>
      ) : null}
    </group>
  );
}

function Wheel({ x, active }: { x: number; active: boolean }) {
  return (
    <group position={[x, 0.72, 0]}>
      <mesh castShadow>
        <torusGeometry args={[0.62, 0.15, 18, 48]} />
        <meshStandardMaterial color={active ? '#55e600' : '#161616'} roughness={0.78} metalness={0.2} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.09, 32]} />
        <meshStandardMaterial color="#8d9296" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.16, 24]} />
        <meshStandardMaterial color="#101010" />
      </mesh>
    </group>
  );
}

function Motorcycle({ activePart, onSelectPart, configuredParts, bodyColor }: SceneProps) {
  const configured = (part: BikePart) => Boolean(configuredParts[part]);
  const highlight = (part: BikePart, normal: string) => activePart === part ? '#55e600' : configured(part) ? '#c800e8' : normal;
  const frameMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#272727', metalness: 0.75, roughness: 0.32 }), []);

  return (
    <group rotation={[0, -0.22, 0]} position={[0, -0.15, 0]} scale={1.08}>
      <Part part="ruedas" activePart={activePart} onSelect={onSelectPart}>
        <Wheel x={-1.55} active={activePart === 'ruedas' || configured('ruedas')} />
        <Wheel x={1.55} active={activePart === 'ruedas' || configured('ruedas')} />
      </Part>

      <mesh position={[0, 0.9, 0]} rotation={[0, 0, -0.1]} material={frameMaterial} castShadow>
        <boxGeometry args={[2.45, 0.14, 0.16]} />
      </mesh>
      <mesh position={[-0.9, 1.25, 0]} rotation={[0, 0, -0.5]} material={frameMaterial} castShadow>
        <boxGeometry args={[1.2, 0.12, 0.12]} />
      </mesh>
      <mesh position={[1.16, 1.25, 0]} rotation={[0, 0, 0.43]} material={frameMaterial} castShadow>
        <boxGeometry args={[1.4, 0.11, 0.11]} />
      </mesh>

      <Part part="carroceria" activePart={activePart} onSelect={onSelectPart}>
        <mesh position={[-0.15, 1.45, 0]} scale={[1.45, 0.62, 0.7]} castShadow>
          <sphereGeometry args={[0.72, 40, 24]} />
          <meshStandardMaterial color={highlight('carroceria', bodyColor)} metalness={0.32} roughness={0.3} />
        </mesh>
        <mesh position={[-0.9, 1.42, 0]} rotation={[0, 0, -0.08]} castShadow>
          <boxGeometry args={[1.25, 0.24, 0.72]} />
          <meshStandardMaterial color="#151515" roughness={0.82} />
        </mesh>
        <mesh position={[0.55, 1.22, 0]} scale={[0.8, 0.58, 0.65]} castShadow>
          <sphereGeometry args={[0.58, 32, 20]} />
          <meshStandardMaterial color={highlight('carroceria', bodyColor)} metalness={0.25} roughness={0.34} />
        </mesh>
      </Part>

      <Part part="escape" activePart={activePart} onSelect={onSelectPart}>
        <group position={[-0.35, 0.68, -0.58]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.15, 0.2, 1.5, 24]} />
            <meshStandardMaterial color={highlight('escape', '#aab0b4')} metalness={0.92} roughness={0.18} />
          </mesh>
          <mesh position={[0, -0.78, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.08, 24]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
      </Part>

      <Part part="manubrio" activePart={activePart} onSelect={onSelectPart}>
        <mesh position={[1.28, 2.02, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 1.38, 18]} />
          <meshStandardMaterial color={highlight('manubrio', '#bbbbbb')} metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[1.2, 1.65, 0]} rotation={[0, 0, 0.18]}>
          <cylinderGeometry args={[0.06, 0.06, 0.72, 16]} />
          <meshStandardMaterial color="#6c7175" metalness={0.8} />
        </mesh>
      </Part>

      <Part part="luces" activePart={activePart} onSelect={onSelectPart}>
        <mesh position={[1.48, 1.72, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.26, 0.18, 32]} />
          <meshStandardMaterial color={highlight('luces', '#f4f1d7')} emissive={activePart === 'luces' ? '#55e600' : '#d5d2a0'} emissiveIntensity={0.7} />
        </mesh>
      </Part>

      <Part part="frenos" activePart={activePart} onSelect={onSelectPart}>
        <mesh position={[1.55, 0.72, -0.11]}>
          <torusGeometry args={[0.29, 0.035, 12, 32]} />
          <meshStandardMaterial color={highlight('frenos', '#d7d7d7')} metalness={0.9} roughness={0.2} />
        </mesh>
      </Part>

      <mesh position={[0, 0.74, 0]} castShadow>
        <boxGeometry args={[0.78, 0.72, 0.58]} />
        <meshStandardMaterial color="#64686b" metalness={0.78} roughness={0.3} />
      </mesh>
    </group>
  );
}

export default function MotorcycleScene(props: SceneProps) {
  return (
    <Canvas camera={{ position: [2.5, 2.8, 7.2], fov: 38 }} dpr={[1, 1.7]} shadows>
      <color attach="background" args={['#090909']} />
      <fog attach="fog" args={['#090909', 9, 14]} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[4, 7, 5]} intensity={2.8} castShadow />
      <pointLight position={[-4, 2, -3]} color="#b900e6" intensity={22} distance={7} />
      <pointLight position={[4, 2, 3]} color="#55e600" intensity={18} distance={7} />
      <Suspense fallback={null}>
        <Motorcycle {...props} />
        <ContactShadows position={[0, 0.1, 0]} opacity={0.55} scale={8} blur={2.5} far={4} />
      </Suspense>
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={5.2}
        maxDistance={9}
        minPolarAngle={Math.PI / 3.3}
        maxPolarAngle={Math.PI / 2.05}
        autoRotate={!props.activePart}
        autoRotateSpeed={0.45}
      />
    </Canvas>
  );
}
