import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Compass, DoorOpen, Gamepad2, Settings, Volume2, VolumeX, Backpack, MessageCircle, Map, X } from 'lucide-react';
import { WorldScene, type ControlsState } from './game/WorldScene';

type Stage = 0 | 1 | 2;
const missions = [
  { title: 'Осмотрись вокруг', detail: 'Подойди к человеку возле старого дома.' },
  { title: 'Поговори с местным', detail: 'Узнай, где находится медицинский пункт.' },
  { title: 'Доберись до пункта', detail: 'Найди дом с зелёной дверью и осмотри его.' }
];

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  const [sound, setSound] = useState(true);
  const [stage, setStage] = useState<Stage>(0);
  const [nearNpc, setNearNpc] = useState(false);
  const [nearHouse, setNearHouse] = useState(false);
  const [panel, setPanel] = useState<'none' | 'inventory' | 'map' | 'settings'>('none');
  const [toast, setToast] = useState('');
  const controls = useRef<ControlsState>({ forward: 0, strafe: 0, lookX: 0, lookY: 0 });
  const lookPointer = useRef<{x:number;y:number}|null>(null);
  const [portrait, setPortrait] = useState(false);

  useEffect(() => {
    const check = () => setPortrait(window.innerWidth < 760 && window.innerHeight > window.innerWidth);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  function interact() {
    if (stage === 0 && nearNpc) { setStage(1); setToast('Местный: «Медпункт дальше по дороге. Ищи дом с зелёной дверью.»'); }
    else if (stage === 1 && nearHouse) { setStage(2); setToast('Ты нашёл нужное место. Осмотрись внутри — продолжение истории появится в следующей главе.'); }
    else if (stage === 2 && nearHouse) setToast('Ты осмотрел помещение. Следующая глава появится в обновлении.');
    else setToast('Подойди ближе к отмеченному персонажу или зданию.');
    window.setTimeout(() => setToast(''), 3800);
  }

  useEffect(() => {
    if (screen !== 'game') return;
    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)) e.preventDefault();
      if (key === 'w' || key === 'arrowup') controls.current.forward = 1;
      if (key === 's' || key === 'arrowdown') controls.current.forward = -1;
      if (key === 'a' || key === 'arrowleft') controls.current.strafe = -1;
      if (key === 'd' || key === 'arrowright') controls.current.strafe = 1;
      if (key === 'e') interact();
      if (key === 'escape') setPanel(p => p === 'none' ? 'settings' : 'none');
    };
    const up = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 's' || key === 'arrowup' || key === 'arrowdown') controls.current.forward = 0;
      if (key === 'a' || key === 'd' || key === 'arrowleft' || key === 'arrowright') controls.current.strafe = 0;
    };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [screen, stage, nearNpc, nearHouse]);

  const canInteract = (stage === 0 && nearNpc) || (stage > 0 && nearHouse);
  return <main className="app-shell">
    <div className="world-backdrop"><Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 1.7, 9], fov: 72 }}>
      <WorldScene controls={controls} stage={stage} onNearby={(npc, house) => { setNearNpc(npc); setNearHouse(house); }} />
    </Canvas></div>
    {screen === 'menu' ? <section className="menu-screen">
      <div className="topline"><span className="status-dot" /><span>СЮЖЕТНОЕ ПРИКЛЮЧЕНИЕ</span><span className="topline-right">BUILD 0.2.0 · EARLY ACCESS</span></div>
      <div className="menu-content">
        <div className="eyebrow">НЕОБЫЧНАЯ ИСТОРИЯ В НЕОБЫЧНОМ МЕСТЕ</div>
        <h1>A POTOM<br/><em>GO NA SVO</em></h1>
        <p className="subtitle">Один клик. Незнакомое место. Очень странный день.</p>
        <div className="menu-actions">
          <button className="primary-button" onClick={() => setScreen('game')}><Gamepad2 size={18}/> НАЧАТЬ ИСТОРИЮ</button>
          <button className="secondary-button" onClick={() => setScreen('game')}><DoorOpen size={18}/> ПРОДОЛЖИТЬ</button>
          <button className="secondary-button" onClick={() => setToast('Совместные комнаты появятся после подключения серверной части.')}><Compass size={18}/> СОВМЕСТНАЯ ИГРА <span className="soon">СКОРО</span></button>
        </div>
      </div>
      <div className="bottomline"><span>ОДИНОЧНАЯ ИСТОРИЯ · ИССЛЕДОВАНИЕ МИРА</span><span>WASD / TOUCH · 3D</span></div>
    </section> : <section className="game-hud">
      <header><div className="hud-brand">A POTOM <b>GO NA SVO</b></div><div className="hud-location">ОКРАИНА ПОСЁЛКА <span>·</span> 08:42</div>
        <button className="icon-button" onClick={() => setPanel('inventory')} aria-label="Инвентарь"><Backpack/></button>
        <button className="icon-button" onClick={() => setPanel('map')} aria-label="Карта"><Map/></button>
        <button className="icon-button" onClick={() => setSound(!sound)} aria-label="Звук">{sound ? <Volume2/> : <VolumeX/>}</button>
        <button className="icon-button" onClick={() => setPanel('settings')} aria-label="Настройки"><Settings/></button>
      </header>
      <div className="crosshair">+</div>
      <div className="objective"><small>ТЕКУЩАЯ ЗАДАЧА · {stage + 1}/3</small><strong>{missions[stage].title}</strong><span>{missions[stage].detail}</span></div>
      <div className="interaction-hint">WASD — движение · мышь / свайп — обзор</div>
      {canInteract && <button className="interact-button" onClick={interact}><MessageCircle size={17}/> ВЗАИМОДЕЙСТВОВАТЬ <kbd>E</kbd></button>}
      <div className="touch-left" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); const r=e.currentTarget.getBoundingClientRect(); controls.current.strafe=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/(r.width/2))); controls.current.forward=Math.max(-1,Math.min(1,-(e.clientY-r.top-r.height/2)/(r.height/2))); }} onPointerMove={e => { if(e.buttons){const r=e.currentTarget.getBoundingClientRect();controls.current.strafe=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/(r.width/2)));controls.current.forward=Math.max(-1,Math.min(1,-(e.clientY-r.top-r.height/2)/(r.height/2)));}}} onPointerUp={() => {controls.current.forward=0;controls.current.strafe=0;}} onPointerCancel={() => {controls.current.forward=0;controls.current.strafe=0;}}><span>MOVE</span></div>
      <div className="touch-look" onPointerDown={e => {e.currentTarget.setPointerCapture(e.pointerId);lookPointer.current={x:e.clientX,y:e.clientY};}} onPointerMove={e => {if(lookPointer.current){controls.current.lookX+=e.clientX-lookPointer.current.x;controls.current.lookY+=e.clientY-lookPointer.current.y;lookPointer.current={x:e.clientX,y:e.clientY};}}} onPointerUp={() => {lookPointer.current=null;}} onPointerCancel={() => {lookPointer.current=null;}}><span>LOOK</span></div>
      {panel !== 'none' && <div className="panel-shade"><div className="game-panel"><button className="panel-close" onClick={() => setPanel('none')}><X/></button><small>МЕНЮ ИГРОКА</small><h2>{panel === 'inventory' ? 'Инвентарь' : panel === 'map' ? 'Карта местности' : 'Настройки'}</h2>{panel === 'inventory' ? <p>Пока что рюкзак пуст. Найденные предметы будут появляться здесь.</p> : panel === 'map' ? <p>Ты находишься на окраине небольшого посёлка. Исследуй дорогу и ближайшие здания.</p> : <p>Звук: {sound ? 'включён' : 'выключен'}<br/>Графика: сбалансированная<br/>Управление: клавиатура / сенсорный экран</p>}</div></div>}
      {toast && <div className="toast"><MessageCircle size={16}/>{toast}</div>}
      {portrait && <div className="rotate-hint">Для удобной игры поверни устройство горизонтально.</div>}
    </section>}
  </main>;
}