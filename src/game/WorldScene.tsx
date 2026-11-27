import { useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';

export type ControlsState = { forward: number; strafe: number; lookX: number; lookY: number; sprint: number; jump: number };
type Props = { controls: MutableRefObject<ControlsState>; onNearby: (npc: boolean, house: boolean) => void };

const HOUSES = [
  { x: -10, z: -12, s: 1.05 }, { x: 10, z: -24, s: 1.15 },
  { x: 19, z: -5, s: .85 }, { x: -22, z: 3, s: .92 },
  { x: -18, z: -38, s: 1.2 }, { x: 24, z: -43, s: 1.05 }
];
const FENCES = [{ x: -15, z: -6, length: 13 }, { x: 13, z: -30, length: 12 }, { x: -27, z: 9, length: 10 }];

function House({ position, scale = 1, tone = '#827e70', greenDoor = false }: { position: [number,number,number]; scale?: number; tone?: string; greenDoor?: boolean }) {
  return <group position={position} scale={scale}>
    <mesh position={[0,1.48,0]} castShadow receiveShadow><boxGeometry args={[5,2.96,4.4]}/><meshStandardMaterial color={tone} roughness={.96}/></mesh>
    <mesh position={[0,3.05,0]} rotation={[0,Math.PI/4,0]} castShadow receiveShadow><coneGeometry args={[3.9,1.35,4]}/><meshStandardMaterial color="#343b35" roughness={1}/></mesh>
    <mesh position={[0,2.25,2.24]}><boxGeometry args={[1.3,.12,.12]}/><meshStandardMaterial color="#665d4b"/></mesh>
    {[-1.55,1.55].map(x=><group key={x} position={[x,1.85,2.22]}><mesh castShadow><boxGeometry args={[1.02,1.12,.1]}/><meshStandardMaterial color="#393b34"/></mesh><mesh position={[0,0,.07]}><boxGeometry args={[.82,.91,.05]}/><meshStandardMaterial color="#8ca7a5" metalness={.12} roughness={.28}/></mesh><mesh position={[0,0,.11]}><boxGeometry args={[.035,.9,.03]}/><meshStandardMaterial color="#d0c7aa"/></mesh><mesh position={[0,0,.12]}><boxGeometry args={[.8,.035,.03]}/><meshStandardMaterial color="#d0c7aa"/></mesh></group>)}
    <mesh position={[0,1,2.28]} castShadow><boxGeometry args={[.92,2,.14]}/><meshStandardMaterial color={greenDoor?'#526f4c':'#4b3d30'} roughness={.9}/></mesh>
    <mesh position={[.32,1,.37+2.28]}><sphereGeometry args={[.055,10,8]}/><meshStandardMaterial color="#c7aa67" metalness={.55}/></mesh>
    <mesh position={[0,3.5,2.29]}><boxGeometry args={[1.35,.16,.12]}/><meshStandardMaterial color="#625b4d"/></mesh>
    <mesh position={[0,.12,2.34]} receiveShadow><boxGeometry args={[1.25,.18,.28]}/><meshStandardMaterial color="#777064"/></mesh>
    <mesh position={[-2.25,.12,0]}><boxGeometry args={[.35,.24,4.65]}/><meshStandardMaterial color="#625c50"/></mesh>
    <mesh position={[2.25,.12,0]}><boxGeometry args={[.35,.24,4.65]}/><meshStandardMaterial color="#625c50"/></mesh>
  </group>;
}
function Pine({ position, height }: { position: [number,number,number]; height: number }) {
  return <group position={position}>
    <mesh position={[0,height*.22,0]} castShadow><cylinderGeometry args={[.12,.24,height*.44,8]}/><meshStandardMaterial color="#59402d" roughness={1}/></mesh>
    {[.43,.63,.82].map((v,i)=><mesh key={v} position={[0,height*v,0]} castShadow><coneGeometry args={[height*(.3-i*.045),height*.48,8]}/><meshStandardMaterial color={['#203b2e','#2b4937','#3a5941'][i]} roughness={1}/></mesh>)}
  </group>;
}
function Road() {
  return <group position={[0,.025,-17]}>
    <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[10,110]}/><meshStandardMaterial color="#77776a" roughness={1}/></mesh>
    <mesh position={[-3,.012,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.12,110]}/><meshStandardMaterial color="#b4a98d"/></mesh>
    <mesh position={[3,.012,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.12,110]}/><meshStandardMaterial color="#b4a98d"/></mesh>
    {Array.from({length:90},(_,i)=><mesh key={i} position={[(i%5-2)*1.7,.035,-52+i*1.1]} rotation={[-Math.PI/2,0,Math.sin(i)*.2]}><circleGeometry args={[.08+(i%4)*.035,7]}/><meshStandardMaterial color={i%2?'#aaa08b':'#8c897b'} roughness={1}/></mesh>)}
  </group>;
}
function Fence({ from, length }: { from: [number,number,number]; length: number }) {
 return <group position={from}>{Array.from({length:Math.floor(length/2)+1},(_,i)=><group key={i} position={[i*2,0,0]}><mesh position={[0,.65,0]} castShadow><boxGeometry args={[.13,1.3,.13]}/><meshStandardMaterial color="#594936" roughness={1}/></mesh>{i<Math.floor(length/2)&&<><mesh position={[1,.85,0]} castShadow><boxGeometry args={[2,.12,.12]}/><meshStandardMaterial color="#705b40"/></mesh><mesh position={[1,.35,0]}><boxGeometry args={[2,.12,.12]}/><meshStandardMaterial color="#705b40"/></mesh></>}</group>)}</group>;
}
function Person({ position }: { position: [number,number,number] }) {
 return <group position={position}>
   <mesh position={[0,1.35,0]} castShadow><capsuleGeometry args={[.32,.85,5,10]}/><meshStandardMaterial color="#4b5146" roughness={1}/></mesh>
   <mesh position={[0,2.05,0]} castShadow><sphereGeometry args={[.24,16,12]}/><meshStandardMaterial color="#b18f73" roughness={.9}/></mesh>
   <mesh position={[-.38,1.42,0]} rotation={[0,0,-.12]} castShadow><capsuleGeometry args={[.11,.68,4,8]}/><meshStandardMaterial color="#4b5146"/></mesh>
   <mesh position={[.38,1.42,0]} rotation={[0,0,.12]} castShadow><capsuleGeometry args={[.11,.68,4,8]}/><meshStandardMaterial color="#4b5146"/></mesh>
   <mesh position={[0,.83,0]}><boxGeometry args={[.48,.12,.34]}/><meshStandardMaterial color="#302d28"/></mesh>
 </group>;
}
function Lamp({position}:{position:[number,number,number]}) {
 return <group position={position}>
   <mesh position={[0,2.4,0]} castShadow><cylinderGeometry args={[.07,.11,4.8,8]}/><meshStandardMaterial color="#3e443e" metalness={.5}/></mesh>
   <mesh position={[.55,4.7,0]} rotation={[0,0,-.18]}><boxGeometry args={[1.2,.09,.09]}/><meshStandardMaterial color="#3e443e"/></mesh>
   <mesh position={[1.05,4.58,0]}><boxGeometry args={[.35,.14,.3]}/><meshStandardMaterial color="#d5c99c" emissive="#8d8053" emissiveIntensity={.5}/></mesh>
   <pointLight position={[1.05,4.4,0]} color="#f0d9a2" intensity={.65} distance={10} decay={2}/>
 </group>;
}
function Bush({position,scale=1}:{position:[number,number,number];scale?:number}) {
 return <group position={position} scale={scale}>
   {[[0,.35,0],[-.35,.25,.08],[.3,.27,-.12],[.08,.48,-.18]].map((p,i)=><mesh key={i} position={p as [number,number,number]} castShadow><dodecahedronGeometry args={[.48,1]}/><meshStandardMaterial color={i%2?'#405b3d':'#526b43'} roughness={1}/></mesh>)}
 </group>;
}
function Rock({position,scale=1}:{position:[number,number,number];scale?:number}) {
 return <mesh position={position} scale={[scale*1.35,scale,scale]} rotation={[.1,scale,.3]} castShadow receiveShadow><dodecahedronGeometry args={[1,1]}/><meshStandardMaterial color="#77796f" roughness={1}/></mesh>;
}
function Cloud({position,scale=1}:{position:[number,number,number];scale?:number}) {
 return <group position={position} scale={scale}>
   {[[0,0,0],[1.1,.12,0],[-.9,.05,.1],[.35,.38,0]].map((p,i)=><mesh key={i} position={p as [number,number,number]}><sphereGeometry args={[1,12,10]}/><meshBasicMaterial color="#eef0e9" transparent opacity={.48}/></mesh>)}
 </group>;
}
export function WorldScene({controls,onNearby}:Props) {
 const {camera}=useThree();
 const yaw=useRef(0); const pitch=useRef(0); const lastNear=useRef(''); const verticalVelocity=useRef(0); const grounded=useRef(true);
 const trees=useMemo(()=>Array.from({length:125},(_,i)=>{const a=i*2.399;const r=25+(i%13)*2.8;return {p:[Math.cos(a)*r,0,Math.sin(a)*r] as [number,number,number],h:5+(i%6)*.55};}),[]);
 const bushes=useMemo(()=>Array.from({length:52},(_,i)=>({p:[Math.sin(i*12.7)*31,0,Math.cos(i*8.3)*38] as [number,number,number],s:.65+(i%4)*.18})),[]);
 const rocks=useMemo(()=>Array.from({length:75},(_,i)=>({p:[Math.sin(i*7.1)*39,.1,Math.cos(i*3.7)*43] as [number,number,number],s:.18+(i%4)*.13})),[]);
 const clouds=useMemo(()=>Array.from({length:9},(_,i)=>({p:[-75+i*19,28+(i%3)*3,-65+(i%4)*24] as [number,number,number],s:2.5+(i%3)})),[]);
 const collides=(x:number,z:number)=>{
   const radius=.48;
   for(const h of HOUSES){
     const hx=h.s*2.5+radius, hz=h.s*2.2+radius;
     if(Math.abs(x-h.x)<hx && Math.abs(z-h.z)<hz) return true;
   }
   for(const t of trees){
     const dx=x-t.p[0], dz=z-t.p[2];
     if(dx*dx+dz*dz<.72*.72) return true;
   }
   for(const f of FENCES){
     if(x>=f.x-radius && x<=f.x+f.length+radius && Math.abs(z-f.z)<.32) return true;
   }
   for(const rock of rocks){
     const dx=x-rock.p[0], dz=z-rock.p[2];
     const rr=rock.s+.38;
     if(dx*dx+dz*dz<rr*rr) return true;
   }
   // The NPC and lamp posts are solid world objects too.
   if(Math.hypot(x-2,z+8)<.62) return true;
   for(const lamp of [[-5,-18],[6,-36]]){
     if(Math.hypot(x-lamp[0],z-lamp[1])<.42) return true;
   }
   return false;
 };
 useFrame((_,rawDelta)=>{
   const delta=Math.min(rawDelta,.05);
   const c=controls.current;
   yaw.current-=c.lookX*.0022;
   pitch.current=THREE.MathUtils.clamp(pitch.current-c.lookY*.0022,-1.2,1.2);
   c.lookX=0;c.lookY=0;
   camera.rotation.order='YXZ';camera.rotation.y=yaw.current;camera.rotation.x=pitch.current;
   const speed=(c.sprint ? 10.2 : 6.2)*delta, forward=c.forward, strafe=c.strafe;
   const dx=(Math.sin(yaw.current)*forward+Math.cos(yaw.current)*strafe)*speed;
   const dz=(-Math.cos(yaw.current)*forward+Math.sin(yaw.current)*strafe)*speed;
   const nextX=THREE.MathUtils.clamp(camera.position.x+dx,-82,82);
   const nextZ=THREE.MathUtils.clamp(camera.position.z+dz,-88,65);
   // Resolve each axis separately so the player can slide along walls and fences.
   if(!collides(nextX,camera.position.z)) camera.position.x=nextX;
   if(!collides(camera.position.x,nextZ)) camera.position.z=nextZ;
   if(c.jump && grounded.current){verticalVelocity.current=6.2;grounded.current=false;}\n   verticalVelocity.current-=17*delta;\n   camera.position.y+=verticalVelocity.current*delta;\n   if(camera.position.y<=1.7){camera.position.y=1.7;verticalVelocity.current=0;grounded.current=true;}\n   c.jump=0;
   const npc=Math.hypot(camera.position.x-2,camera.position.z+8)<3.2;
   const house=Math.hypot(camera.position.x-10,camera.position.z+24)<4.4;
   const signature=(npc?'n':'')+(house?'h':'');
   if(signature!==lastNear.current){lastNear.current=signature;onNearby(npc,house);}
 });
 return <>
  <color attach="background" args={['#b9c9c8']}/><fog attach="fog" args={['#b9c9c8',48,155]}/>
  <Sky sunPosition={[35,14,-20]} turbidity={7.2} rayleigh={1.8} mieCoefficient={.004} mieDirectionalG={.82}/>
  <ambientLight intensity={.62}/><hemisphereLight args={['#dce8e7','#59634f',1.05]}/>
  <directionalLight position={[25,38,15]} intensity={2.5} castShadow shadow-mapSize={[1536,1536]} shadow-camera-far={120} shadow-camera-left={-55} shadow-camera-right={55} shadow-camera-top={55} shadow-camera-bottom={-55}/>
  <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[220,220]}/><meshStandardMaterial color="#718361" roughness={1}/></mesh>\n  {Array.from({length:180},(_,i)=><mesh key={'grass'+i} position={[Math.sin(i*17.3)*78,.035,Math.cos(i*11.7)*78]} rotation={[-Math.PI/2,0,(i%7)*.4]}><circleGeometry args={[.07+(i%3)*.035,5]}/><meshStandardMaterial color={i%2?'#87936b':'#596e4e'} roughness={1}/></mesh>)}
  <Road/>
  <House position={[-10,0,-12]} scale={1.05} tone="#77776d"/>
  <House position={[10,0,-24]} scale={1.15} tone="#817b6b" greenDoor/>
  <House position={[19,0,-5]} scale={.85} tone="#666e68"/>
  <House position={[-22,0,3]} scale={.92} tone="#827d70"/>
  <House position={[-18,0,-38]} scale={1.2} tone="#777d72"/>
  <House position={[24,0,-43]} scale={1.05} tone="#746f62"/>
  <Fence from={[-15,0,-6]} length={13}/><Fence from={[13,0,-30]} length={12}/><Fence from={[-27,0,9]} length={10}/>
  {trees.map((t,i)=><Pine key={i} position={t.p} height={t.h}/>)}
  {bushes.map((b,i)=><Bush key={i} position={b.p} scale={b.s}/>)}
  {rocks.map((r,i)=><Rock key={i} position={r.p} scale={r.s}/>)}
  {clouds.map((c,i)=><Cloud key={i} position={c.p} scale={c.s}/>)}
  <Lamp position={[-5,0,-18]}/><Lamp position={[6,0,-36]}/>
  <Bush position={[-4,0,-10]} scale={1.2}/><Bush position={[5,0,-12]} scale={.9}/>
  <group position={[2,0,-8]}><Person position={[0,0,0]}/><mesh position={[0,2.6,0]}><sphereGeometry args={[.06,8,8]}/><meshBasicMaterial color="#c8d2a8"/></mesh></group>
 </>;
}
