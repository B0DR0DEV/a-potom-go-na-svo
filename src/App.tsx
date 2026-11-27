import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Backpack, DoorOpen, Gamepad2, Map, MessageCircle, Settings, Volume2, VolumeX, X, Maximize2, Minimize2, RotateCcw, Save, BookOpen, CheckCircle2 } from 'lucide-react';
import { WorldScene, type ControlsState } from './game/WorldScene';

type Stage = 0 | 1 | 2 | 3;
type Panel = 'none' | 'inventory' | 'map' | 'settings' | 'journal';
type SaveData = { stage: Stage; items: string[]; played: boolean };
const SAVE_KEY = 'apotom-save-v1';
const missions = [
  { title: 'Осмотрись вокруг', detail: 'Найди местного жителя у дороги и поговори с ним.', target: 'Местный житель', reward: 'Записка с адресом' },
  { title: 'Найди медпункт', detail: 'Доберись до дома с зелёной дверью и осмотри его.', target: 'Дом с зелёной дверью', reward: 'Старая фотография' },
  { title: 'Раскрой тайну фотографии', detail: 'Вернись к местному жителю и покажи ему найденную фотографию.', target: 'Местный житель', reward: 'Ключ от задней комнаты' },
  { title: 'Глава завершена', detail: 'Ты раскрыл первую часть истории. Исследуй посёлок и сохрани прогресс.', target: 'Посёлок', reward: 'Глава I' }
];
const initialSave: SaveData = { stage: 0, items: [], played: false };

function readSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return initialSave;
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return { stage: Math.max(0, Math.min(3, Number(parsed.stage) || 0)) as Stage, items: Array.isArray(parsed.items) ? parsed.items.filter((x): x is string => typeof x === 'string').slice(0, 20) : [], played: Boolean(parsed.played) };
  } catch { return initialSave; }
}

export default function App() {
  const [save, setSave] = useState<SaveData>(readSave);
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  const [sound, setSound] = useState(true);
  const [panel, setPanel] = useState<Panel>('none');
  const [toast, setToast] = useState('');
  const [nearNpc, setNearNpc] = useState(false);
  const [nearHouse, setNearHouse] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controls = useRef<ControlsState>({ forward: 0, strafe: 0, lookX: 0, lookY: 0, sprint: 0, jump: 0 });
  const lookPointer = useRef<{x:number;y:number}|null>(null);
  const mission = missions[save.stage];

  useEffect(() => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* storage can be disabled */ } }, [save]);
  useEffect(() => {
    const update = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);
  useEffect(() => {
    const check = () => setPortrait(window.innerWidth < 760 && window.innerHeight > window.innerWidth);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(current => current === message ? '' : current), 3800);
  }, []);
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.querySelector('.app-shell')?.requestFullscreen?.();
    } catch { notify('Полный экран недоступен в этом браузере.'); }
  };
  const saveProgress = () => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); notify('Прогресс сохранён на этом устройстве.'); }
    catch { notify('Браузер запретил сохранение.'); }
  };
  const interact = useCallback(() => {
    if (save.stage === 0 && nearNpc) {
      setSave(s => ({ ...s, stage: 1, items: [...new Set([...s.items, 'Записка с адресом'])], played: true }));
      notify('Местный: «Медпункт дальше по дороге. Ищи дом с зелёной дверью». Получен предмет: записка.');
    } else if (save.stage === 1 && nearHouse) {
      setSave(s => ({ ...s, stage: 2, items: [...new Set([...s.items, 'Старая фотография'])] }));
      notify('Ты нашёл старую фотографию. На обороте есть дата и короткая надпись.');
    } else if (save.stage === 2 && nearNpc) {
      setSave(s => ({ ...s, stage: 3, items: [...new Set([...s.items, 'Ключ от задней комнаты'])] }));
      notify('Житель узнаёт фотографию и отдаёт тебе старый ключ. Первая глава завершена!');
    } else if (save.stage === 3) {
      notify('Глава I завершена. Ты можешь продолжить исследовать посёлок.');
    } else notify('Подойди к персонажу или дому, отмеченному текущей задачей.');
  }, [save.stage, nearNpc, nearHouse, notify]);

  useEffect(() => {
    if (screen !== 'game' || panel !== 'none') return;
    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' ','shift'].includes(key)) e.preventDefault();
      if (key === 'w' || key === 'arrowup') controls.current.forward = 1;
      if (key === 's' || key === 'arrowdown') controls.current.forward = -1;
      if (key === 'a' || key === 'arrowleft') controls.current.strafe = -1;
      if (key === 'd' || key === 'arrowright') controls.current.strafe = 1;
      if (key === 'shift') controls.current.sprint = 1;
      if (key === ' ') controls.current.jump = 1;
      if (key === 'e') interact();
      if (key === 'm') setPanel('map');
      if (key === 'i') setPanel('inventory');
      if (key === 'escape') setPanel(p => p === 'none' ? 'settings' : 'none');
    };
    const up = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 's' || key === 'arrowup' || key === 'arrowdown') controls.current.forward = 0;
      if (key === 'a' || key === 'd' || key === 'arrowleft' || key === 'arrowright') controls.current.strafe = 0;
      if (key === 'shift') controls.current.sprint = 0;
      if (key === ' ') controls.current.jump = 0;
    };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [screen, panel, interact]);

  const canInteract = (save.stage === 0 && nearNpc) || (save.stage === 1 && nearHouse) || (save.stage === 2 && nearNpc) || (save.stage === 3 && (nearNpc || nearHouse));
  const start = () => { setSave(s => ({ ...s, played: true })); setScreen('game'); };
  const reset = () => { if (window.confirm('Начать историю заново? Текущий прогресс будет удалён.')) { setSave(initialSave); setPanel('none'); notify('Новая игра начата.'); } };

  return <main className="app-shell">
    <div className="world-backdrop"><Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 1.7, 9], fov: 72 }} gl={{ antialias: true, powerPreference: 'high-performance' }}><WorldScene controls={controls} onNearby={(npc, house) => { setNearNpc(npc); setNearHouse(house); }} /></Canvas></div>
    {screen === 'menu' ? <section className="menu-screen">
      <div className="topline"><span className="status-dot" /><span>СЮЖЕТНОЕ ПРИКЛЮЧЕНИЕ</span><span className="topline-right">ГЛАВА I · ВЕРСИЯ 1.0</span></div>
      <div className="menu-content">
        <div className="eyebrow">ИСТОРИЯ НАЧИНАЕТСЯ С МАЛЕНЬКОЙ НАХОДКИ</div>
        <h1>A POTOM<br/><em>GO NA SVO</em></h1>
        <p className="subtitle">Незнакомый посёлок. Старые тайны. Твой выбор — куда идти дальше.</p>
        <div className="menu-actions">
          <button className="primary-button" onClick={start}><Gamepad2 size={18}/> {save.played ? 'ПРОДОЛЖИТЬ ИСТОРИЮ' : 'НАЧАТЬ ИСТОРИЮ'}</button>
          <button className="secondary-button" onClick={() => { setScreen('game'); setPanel('journal'); }}><BookOpen size={18}/> ЖУРНАЛ ИСТОРИИ</button>
          <button className="secondary-button" onClick={reset}><RotateCcw size={16}/> НОВАЯ ИГРА</button>
        </div>
        <div className="save-note"><Save size={14}/> Прогресс сохраняется автоматически на этом устройстве</div>
      </div>
      <div className="bottomline"><span>ОДИНОЧНОЕ ПРИКЛЮЧЕНИЕ · ИССЛЕДОВАНИЕ МИРА</span><span>WASD / TOUCH · 3D</span></div>
    </section> : <section className="game-hud">
      <header><div className="hud-brand">A POTOM <b>GO NA SVO</b></div><div className="hud-location">ОКРАИНА ПОСЁЛКА <span>·</span> ГЛАВА I</div>
        <button className="icon-button" onClick={() => setPanel('inventory')} aria-label="Инвентарь"><Backpack/></button>
        <button className="icon-button" onClick={() => setPanel('map')} aria-label="Карта"><Map/></button>
        <button className="icon-button" onClick={() => setPanel('journal')} aria-label="Журнал"><BookOpen/></button>
        <button className="icon-button" onClick={() => setSound(!sound)} aria-label="Звук">{sound ? <Volume2/> : <VolumeX/>}</button>
        <button className="icon-button" onClick={() => setPanel('settings')} aria-label="Настройки"><Settings/></button>
        <button className="icon-button" onClick={toggleFullscreen} aria-label="Полный экран">{isFullscreen ? <Minimize2/> : <Maximize2/>}</button>
      </header>
      <div className="crosshair">+</div>
      <div className="objective"><small>ТЕКУЩАЯ ЗАДАЧА · {Math.min(save.stage + 1, 3)}/3</small><strong>{mission.title}</strong><span>{mission.detail}</span><div className="quest-progress"><i style={{width: (save.stage / 3 * 100) + '%'}}/></div></div>
      <div className="interaction-hint">WASD — движение · Shift — бег · Space — прыжок · E — действие</div>
      {canInteract && <button className="interact-button" onClick={interact}><MessageCircle size={17}/> ВЗАИМОДЕЙСТВОВАТЬ <kbd>E</kbd></button>}
      <div className="touch-left" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); const r=e.currentTarget.getBoundingClientRect(); controls.current.strafe=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/(r.width/2))); controls.current.forward=Math.max(-1,Math.min(1,-(e.clientY-r.top-r.height/2)/(r.height/2))); }} onPointerMove={e => { if(e.buttons){const r=e.currentTarget.getBoundingClientRect();controls.current.strafe=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/(r.width/2)));controls.current.forward=Math.max(-1,Math.min(1,-(e.clientY-r.top-r.height/2)/(r.height/2)));}}} onPointerUp={() => {controls.current.forward=0;controls.current.strafe=0;}} onPointerCancel={() => {controls.current.forward=0;controls.current.strafe=0;}}><span>MOVE</span></div>
      <div className="touch-look" onPointerDown={e => {e.currentTarget.setPointerCapture(e.pointerId);lookPointer.current={x:e.clientX,y:e.clientY};}} onPointerMove={e => {if(lookPointer.current){controls.current.lookX+=e.clientX-lookPointer.current.x;controls.current.lookY+=e.clientY-lookPointer.current.y;lookPointer.current={x:e.clientX,y:e.clientY};}}} onPointerUp={() => {lookPointer.current=null;}} onPointerCancel={() => {lookPointer.current=null;}}><span>LOOK</span></div>
      <div className="touch-actions">
        <button onPointerDown={e => {e.preventDefault(); controls.current.sprint=1;}} onPointerUp={() => {controls.current.sprint=0;}} onPointerCancel={() => {controls.current.sprint=0;}}>RUN</button>
        <button onPointerDown={e => {e.preventDefault(); controls.current.jump=1;}}>JUMP</button>
      </div>
      {panel !== 'none' && <div className="panel-shade"><div className="game-panel"><button className="panel-close" onClick={() => setPanel('none')} aria-label="Закрыть"><X/></button><small>МЕНЮ ИГРОКА</small>
        <h2>{panel === 'inventory' ? 'Инвентарь' : panel === 'map' ? 'Карта местности' : panel === 'journal' ? 'Журнал истории' : 'Настройки'}</h2>
        {panel === 'inventory' ? <>{save.items.length ? <ul className="item-list">{save.items.map(item => <li key={item}><CheckCircle2 size={16}/>{item}</li>)}</ul> : <p>Рюкзак пока пуст. Исследуй посёлок, чтобы найти первые предметы.</p>}</> :
        panel === 'map' ? <div className="map-card"><div className="map-road"/><span className="map-pin player-pin">● Ты</span><span className="map-pin npc-pin">● Житель</span><span className="map-pin house-pin">● Медпункт</span><small>СХЕМА ОКРЕСТНОСТЕЙ · НЕ В МАСШТАБЕ</small></div> :
        panel === 'journal' ? <><p>Ты оказался на окраине небольшого посёлка. Местный житель знает дорогу к старому медпункту. Найденные предметы могут помочь восстановить события прошлого.</p><div className="journal-step"><b>{mission.title}</b><span>{mission.detail}</span></div><p className="muted">Выполнено этапов: {save.stage} из 3</p></> :
        <><p>Звук интерфейса: {sound ? 'включён' : 'выключен'}<br/>Графика: адаптивная<br/>Управление: клавиатура / сенсорный экран</p><div className="panel-actions"><button onClick={saveProgress}><Save size={15}/> Сохранить сейчас</button><button onClick={() => { setPanel('none'); setScreen('menu'); }}><DoorOpen size={15}/> В главное меню</button><button onClick={reset}><RotateCcw size={15}/> Начать заново</button></div></>}
      </div></div>}
      {toast && <div className="toast"><MessageCircle size={16}/>{toast}</div>}
      {portrait && <div className="rotate-hint">Для удобной игры поверни устройство горизонтально.</div>}
    </section>}
  </main>;
}
