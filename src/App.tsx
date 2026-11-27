import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PointerLockControls, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { Compass, DoorOpen, Gamepad2, Settings, Volume2, VolumeX } from 'lucide-react';

type Vec3 = [number, number, number];

function Building({ position, scale = 1, color = '#77766b' }: { position: Vec3; scale?: number; color?: string }) {
  return <group position={position} scale={scale}>
    <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
      <boxGeometry args={[4, 2.7, 3.6]} />
      <meshStandardMaterial color={color} roughness={0.92} />
    </mesh>
    <mesh position={[0, 2.95, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
      <coneGeometry args={[3.05, 1.25, 4]} />
      <meshStandardMaterial color="#373b36" roughness={1} />
    </mesh>
    {[-1.15, 1.15].map((x) => <mesh key={x} position={[x, 1.55, 1.82]}>
      <boxGeometry args={[0.72, 0.9, 0.08]} />
      <meshStandardMaterial color="#293d42" metalness={0.18} roughness={0.3} />
    </mesh>)}
    <mesh position={[0, 0.9, 1.86]}>
      <boxGeometry args={[0.9, 1.8, 0.12]} />
      <meshStandardMaterial color="#42382c" roughness={0.9} />
    </mesh>
  </group>;
}

function Pine({ position, height }: { position: Vec3; height: number }) {
  return <group position={position}>
    <mesh position={[0, height * 0.25, 0]} castShadow>
      <cylinderGeometry args={[0.13, 0.2, height * 0.5, 7]} />
      <meshStandardMaterial color="#493b2b" roughness={1} />
    </mesh>
    {[0.48, 0.68, 0.86].map((level, i) => <mesh key={level} position={[0, height * level, 0]} castShadow>
      <coneGeometry args={[height * (0.24 - i * 0.045), height * 0.48, 7]} />
      <meshStandardMaterial color={i === 1 ? '#34483b' : '#263b32'} roughness={1} />
    </mesh>)}
  </group>;
}

function World({ onReady }: { onReady: () => void }) {
  const player = useRef<THREE.Group>(null);
  const clock = useRef(0);
  const trees = useMemo(() => Array.from({ length: 90 }, (_, i) => {
    const angle = i * 2.399;
    const radius = 15 + (i % 11) * 2.7;
    return { position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as Vec3, height: 5 + (i % 5) * 0.7 };
  }), []);
  useFrame((_, delta) => {
    clock.current += delta;
    if (player.current) player.current.position.y = Math.sin(clock.current * 1.6) * 0.018;
  });
  return <>
    <color attach="background" args={['#aab7b6']} />
    <fog attach="fog" args={['#aab7b6', 28, 105]} />
    <Sky sunPosition={[30, 12, -20]} turbidity={8} rayleigh={1.7} />
    <ambientLight intensity={0.75} />
    <directionalLight position={[25, 35, 12]} intensity={2.1} castShadow shadow-mapSize={[2048, 2048]} />
    <Environment preset="forest" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[240, 240]} />
      <meshStandardMaterial color="#66745d" roughness={1} />
    </mesh>
    <gridHelper args={[240, 80, '#77816e', '#707a68']} position={[0, 0.015, 0]} />
    <Building position={[-8, 0, -11]} scale={1.2} color="#77756a" />
    <Building position={[7, 0, -22]} scale={0.9} color="#777e78" />
    <Building position={[19, 0, -5]} scale={1.05} color="#686d68" />
    <Building position={[-22, 0, 2]} scale={0.85} color="#817a6a" />
    {trees.map((tree, i) => <Pine key={i} position={tree.position} height={tree.height} />)}
    <group ref={player} onUpdate={() => { if (clock.current < 0.1) onReady(); }} />
    <PointerLockControls />
  </>;
}

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  const [sound, setSound] = useState(true);
  const [loading, setLoading] = useState(true);
  return <main className="app-shell">
    <div className="world-backdrop"><Canvas shadows camera={{ position: [0, 2.1, 7], fov: 68 }} dpr={[1, 1.6]}>
      <World onReady={() => setLoading(false)} />
    </Canvas></div>
    {screen === 'menu' ? <section className="menu-screen">
      <div className="topline"><span className="status-dot" /> <span>ПРОЕКТ В РАЗРАБОТКЕ</span><span className="topline-right">BUILD 0.1.0 · PRE-ALPHA</span></div>
      <div className="menu-content">
        <div className="eyebrow">АТМОСФЕРНОЕ СЮЖЕТНОЕ ПРИКЛЮЧЕНИЕ</div>
        <h1>A POTOM<br/><em>GO NA SVO</em></h1>
        <p className="subtitle">История начинается с одного неправильного клика.</p>
        <div className="menu-actions">
          <button className="primary-button" onClick={() => setScreen('game')}><Gamepad2 size={18}/> НАЧАТЬ ИССЛЕДОВАНИЕ</button>
          <button className="secondary-button" onClick={() => setScreen('game')}><DoorOpen size={18}/> ПРОДОЛЖИТЬ</button>
          <button className="secondary-button" onClick={() => setScreen('game')}><Compass size={18}/> СОВМЕСТНАЯ ИГРА <span className="soon">СКОРО</span></button>
        </div>
      </div>
      <div className="bottomline"><span>ОДИНОЧНАЯ ИСТОРИЯ · ОТКРЫТЫЙ МИР</span><span>WASD / TOUCH · 3D</span></div>
    </section> : <section className="game-hud">
      <header><div className="hud-brand">A POTOM <b>GO NA SVO</b></div><div className="hud-location">НЕИЗВЕСТНАЯ МЕСТНОСТЬ <span>·</span> 08:42</div><button className="icon-button" onClick={() => setSound(!sound)} aria-label="Звук">{sound ? <Volume2/> : <VolumeX/>}</button><button className="icon-button" onClick={() => setScreen('menu')} aria-label="Настройки"><Settings/></button></header>
      <div className="crosshair">+</div>
      <div className="objective"><small>ТЕКУЩАЯ ЗАДАЧА</small><strong>Осмотрись вокруг</strong><span>Исследуй территорию и найди дорогу.</span></div>
      <div className="interaction-hint">Кликни по экрану, чтобы захватить курсор · WASD — перемещение</div>
      <div className="mobile-controls"><button onClick={() => {}}>▲</button><button onClick={() => {}}>◀</button><button onClick={() => {}}>▼</button><button onClick={() => {}}>▶</button></div>
    </section>}
    {loading && <div className="loading-label">ЗАГРУЗКА ОКРУЖЕНИЯ…</div>}
  </main>;
}