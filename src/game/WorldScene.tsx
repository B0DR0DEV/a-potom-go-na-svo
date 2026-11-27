import { useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';

export type ControlsState = { forward: number; strafe: number; lookX: number; lookY: number };
type Props = { controls: MutableRefObject<ControlsState>; onNearby: (npc: boolean, house: boolean) => void };

function House({ position, scale = 1, tone = '#827e70', greenDoor = false }: { position: [number,number,number]; scale?: number; tone?: string; greenDoor?: boolean }) {
  return <group position={position} scale={scale}>
    <mesh position={[0,1.5,0]} castShadow receiveShadow><boxGeometry args={[5,3,4.4]}/><meshStandardMaterial color={tone} roughness={.95}/></mesh>
    <mesh position={[0,3.15,0]} rotation={[0,Math.PI/4,0]} castShadow><coneGeometry args={[3.9,1.35,4]}/><meshStandardMaterial color="#393d37" roughness={1}/></mesh>
    {[-1.55,1.55].map(x=><group key={x} position={[x,1.85,2.22]}><mesh><boxGeometry args={[1.02,1.12,.1]}/><meshStandardMaterial color="#393b34"/></mesh><mesh position={[0,0,.07]}><boxGeometry args={[.82,.91,.05]}/><meshStandardMaterial color="#789095" metalness={.2} roughness={.25}/></mesh><mesh position={[0,0,.11]}><boxGeometry args={[.035,.9,.03]}/><meshStandardMaterial color="#d0c7aa"/></mesh></group>)}
    <mesh position={[0,1,2.28]} castShadow><boxGeometry args={[.92,2,.14]}/><meshStandardMaterial color={greenDoor?'#52664c':'#4b3d30'} roughness={.9}/></mesh>
    <mesh position={[.32,1,.37+2.28]}><sphereGeometry args={[.055,8,8]}/><meshStandardMaterial color="#b5a16b" metalness={.6}/></mesh>
    <mesh position={[0,3.5,2.29]}><boxGeometry args={[1.35,.16,.12]}/><meshStandardMaterial color="#625b4d"/></mesh>
  </group>;
}
function Pine({ position, height }: { position: [number,number,number]; height: number }) {
  return <group position={position}><mesh position={[0,height*.22,0]} castShadow><cylinderGeometry args={[.12,.22,height*.44,7]}/><meshStandardMaterial color="#55402e"/></mesh>{[.46,.67,.86].map((v,i)=><mesh key={v} position={[0,height*v,0]} castShadow><coneGeometry args={[height*(.27-i*.045),height*.48,7]}/><meshStandardMaterial color={['#23372d','#304739','#3b4c3b'][i]} roughness={1}/></mesh>)}</group>;
}
function Road() {
  return <group position={[0,.025,-17]}><mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={[10,100]}/><meshStandardMaterial color="#77776a" roughness={1}/></mesh><mesh position={[-3,.01,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.12,100]}/><meshStandardMaterial color="#aaa28b"/></mesh><mesh position={[3,.01,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.12,100]}/><meshStandardMaterial color="#aaa28b"/></mesh>{Array.from({length:34},(_,i)=><mesh key={i} position={[(i%3-1)*2.7,.035,-48+i*2.1]} rotation={[-Math.PI/2,0,Math.sin(i)*.2]}><circleGeometry args={[.12+(i%4)*.05,7]}/><meshStandardMaterial color="#aaa08b" roughness={1}/></mesh>)}</group>;
}
function Fence({ from, length }: { from: [number,number,number]; length: number }) {
 return <group position={from}>{Array.from({length:Math.floor(length/2)+1},(_,i)=><group key={i} position={[i*2,0,0]}><mesh position={[0,.65,0]} castShadow><boxGeometry args={[.13,1.3,.13]}/><meshStandardMaterial color="#594936"/></mesh>{i<Math.floor(length/2)&&<><mesh position={[1,.85,0]}><boxGeometry args={[2,.12,.12]}/><meshStandardMaterial color="#705b40"/></mesh><mesh position={[1,.35,0]}><boxGeometry args={[2,.12,.12]}/><meshStandardMaterial color="#705b40"/></mesh></>}</group>)}</group>;
}
function Person({ position }: { position: [number,number,number] }) {
 return <group position={position}><mesh position={[0,1.35,0]} castShadow><capsuleGeometry args={[.32,.85,5,8]}/><meshStandardMaterial color="#4b5146" roughness={1}/></mesh><mesh position={[0,2.05,0]} castShadow><sphereGeometry args={[.24,12,10]}/><meshStandardMaterial color="#b18f73" roughness={.9}/></mesh><mesh position={[-.38,1.42,0]} rotation={[0,0,-.12]}><capsuleGeometry args={[.11,.68,4,6]}/><meshStandardMaterial color="#4b5146"/></mesh><mesh position={[.38,1.42,0]} rotation={[0,0,.12]}><capsuleGeometry args={[.11,.68,4,6]}/><meshStandardMaterial color="#4b5146"/></mesh></group>;
}
function Lamp({position}:{position:[number,number,number]}) {
 return <group position={position}><mesh position={[0,2.4,0]}><cylinderGeometry args={[.07,.11,4.8,7]}/><meshStandardMaterial color="#3e443e" metalness={.5}/></mesh><mesh position={[.55,4.7,0]} rotation={[0,0,-.18]}><boxGeometry args={[1.2,.09,.09]}/><meshStandardMaterial color="#3e443e"/></mesh><mesh position={[1.05,4.58,0]}><boxGeometry args={[.35,.14,.3]}/><meshStandardMaterial color="#d5c99c" emissive="#8d8053" emissiveIntensity={.35}/></mesh></group>;
}
export function WorldScene({controls,onNearby}:Props) {
 const {camera}=useThree(); const yaw=useRef(0); const pitch=useRef(0); const lastNear=useRef('');
 const trees=useMemo(()=>Array.from({length:145},(_,i)=>{const a=i*2.399;const r=23+(i%13)*3.1;return {p:[Math.cos(a)*r,0,Math.sin(a)*r] as [number,number,number],h:5+(i%6)*.55};}),[]);
 const stones=useMemo(()=>Array.from({length:90},(_,i)=>({p:[Math.sin(i*7.1)*35,.12,Math.cos(i*3.7)*40] as [number,number,number],s:.15+(i%4)*.12})),[]);
 useFrame((_,delta)=>{
   const c=controls.current; yaw.current-=c.lookX*.0022; pitch.current=Math.max(-1.25,Math.min(1.25,pitch.current-c.lookY*.0022)); c.lookX=0;c.lookY=0;
   camera.rotation.order='YXZ';camera.rotation.y=yaw.current;camera.rotation.x=pitch.current;
   const speed=7.2*delta, forward=c.forward, strafe=c.strafe;
   const dx=(Math.sin(yaw.current)*forward+Math.cos(yaw.current)*strafe)*speed;
   const dz=(-Math.cos(yaw.current)*forward+Math.sin(yaw.current)*strafe)*speed;
   camera.position.x=THREE.MathUtils.clamp(camera.position.x+dx,-82,82);
   camera.position.z=THREE.MathUtils.clamp(camera.position.z+dz,-88,65);
   camera.position.y=1.7;
   const npc=Math.hypot(camera.position.x-2,camera.position.z+8)<3.2;
   const house=Math.hypot(camera.position.x-10,camera.position.z+24)<4.2;
   const signature=(npc?'n':'')+(house?'h':'');
   if(signature!==lastNear.current){lastNear.current=signature;onNearby(npc,house);}
 });
 return <>
  <color attach="background" args={['#aebbb8']}/><fog attach="fog" args={['#aebbb8',42,145]}/>
  <Sky sunPosition={[35,14,-20]} turbidity={8.5} rayleigh={1.6}/><ambientLight intensity={.72}/><hemisphereLight args={['#c7d4d0','#59634f',.75]}/>
  <directionalLight position={[25,38,15]} intensity={2} castShadow shadow-mapSize={[1024,1024]}/>
  <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[220,220]}/><meshStandardMaterial color="#66735b" roughness={1}/></mesh>
  <Road/><House position={[-10,0,-12]} scale={1.05} tone="#77776d"/><House position={[10,0,-24]} scale={1.15} tone="#817b6b" greenDoor/><House position={[19,0,-5]} scale={.85} tone="#666e68"/><House position={[-22,0,3]} scale={.92} tone="#827d70"/><House position={[-18,0,-38]} scale={1.2} tone="#777d72"/><House position={[24,0,-43]} scale={1.05} tone="#746f62"/>
  <Fence from={[-15,0,-6]} length={13}/><Fence from={[13,0,-30]} length={12}/><Fence from={[-27,0,9]} length={10}/>
  {trees.map((t,i)=><Pine key={i} position={t.p} height={t.h}/>)}
  {stones.map((s,i)=><mesh key={i} position={s.p} scale={[s.s*1.5,s.s,s.s]} rotation={[0,i*.7,0]} castShadow><dodecahedronGeometry args={[1,0]}/><meshStandardMaterial color="#77796c" roughness={1}/></mesh>)}
  <Lamp position={[-5,0,-18]}/><Lamp position={[6,0,-36]}/>
  <group position={[2,0,-8]}><Person position={[0,0,0]}/><mesh position={[0,2.6,0]}><sphereGeometry args={[.06,8,8]}/><meshBasicMaterial color="#c8d2a8"/></mesh></group>
 </>;
}