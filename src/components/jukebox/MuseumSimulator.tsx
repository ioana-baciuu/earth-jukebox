import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Headphones, RotateCcw, Square, Sun, Moon, Thermometer, Volume2, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import skinDay from "@/assets/earth/skin-day.jpg.asset.json";
import skinLights from "@/assets/earth/skin-lights.jpg.asset.json";
import { EarthGlobe, type GlobeHandle } from "./EarthGlobe";
import { NasaTablet } from "./NasaTablet";
import { LayerIcon } from "./layer-icon";
import { useA11y } from "@/lib/a11y";
import { getEngine, peekEngine } from "@/lib/audio/engine";
import { MUSEUM_LAYERS, museumSnapshot, joystickMove, solarPosition, isDaylight, type MuseumLayer } from "@/lib/museum-model";
import { frameValue } from "@/lib/nasa-sequences";
import { LAYERS } from "@/lib/layers";
import { formatCoords } from "@/lib/places";
import { coastCrossing } from "@/lib/sonify-map";
import { cn } from "@/lib/utils";

const BRAILLE = { ocean:"⠎⠑⠁", storm:"⠎⠞⠕⠗⠍", forest:"⠞⠗⠑⠑", lights:"⠇⠊⠛⠓⠞" };
export function MuseumSimulator() {
  const { settings, speak, stopSpeaking, announce, buzz } = useA11y();
  const globe = useRef<GlobeHandle>(null);
  const [layer, setLayer] = useState<MuseumLayer>("ocean");
  const [position, setPosition] = useState({lat:30,lng:-75});
  const [value, setValue] = useState<number | undefined>();
  const [listening, setListening] = useState(false);
  const [orchestra, setOrchestra] = useState(false);
  const [clock, setClock] = useState<Date | null>(null);
  const [controller, setController] = useState(false);
  const state = useMemo(()=>museumSnapshot(layer,position.lat,position.lng,value),[layer,position,value]);
  const sun = useMemo(()=>clock ? solarPosition(clock) : undefined,[clock]);
  const daylight = sun ? isDaylight(position.lat,position.lng,sun) : true;
  const stateRef = useRef(state); stateRef.current=state;
  const listeningRef=useRef(listening);listeningRef.current=listening;
  const generation=useRef(0);
  useEffect(()=>{setClock(new Date());const t=setInterval(()=>setClock(new Date()),60000);return()=>clearInterval(t);},[]);
  useEffect(()=>()=>{generation.current++;peekEngine()?.stopAll(0.2);},[]);
  const play = useCallback(async (next = stateRef.current, narrate = true) => {
    const request=++generation.current;
    const e=await getEngine(); if(request!==generation.current)return;
    e.setVolume(settings.volume); e.setSample(next.sample);
    e.setMix(orchestra ? Object.fromEntries(MUSEUM_LAYERS.map(id=>[id,0.55])) : {[layer]:0.15+0.85*next.amount});
    e.marimba(next.pitch,0.12,next.pan);setListening(true);
    if(narrate){speak(next.caption);announce(next.caption);}
  },[layer,orchestra,settings.volume,speak,announce]);
  const probe=useCallback((lat:number,lng:number,v?:number,narrate=true)=>{
    const next=museumSnapshot(layer,lat,lng,v);
    const crossing=coastCrossing(stateRef.current.sample.land,next.sample.land);
    if(crossing){peekEngine()?.coast(crossing==="to-land",next.pan);buzz(crossing==="to-land"?[40,30,80]:[100]);}
    setPosition({lat,lng});setValue(v);if(narrate)globe.current?.flyTo(lat,lng,2.1,450);void play(next,narrate);
  },[layer,play,buzz]);
  const move=useCallback((direction:number)=>{
    const next=joystickMove(stateRef.current,direction);
    globe.current?.flyTo(next.lat,next.lng,2.1,450);
    probe(next.lat,next.lng,undefined,true);
  },[probe]);
  const choose=(id:MuseumLayer)=>{generation.current++;setLayer(id);setValue(undefined);setListening(false);peekEngine()?.stopAll(0.2);announce(`${LAYERS[id].name} selected.`);};
  const stop=()=>{generation.current++;setListening(false);peekEngine()?.stopAll(0.2);stopSpeaking();announce("Sound stopped.");};
  useEffect(()=>{ if(!listening)return;const e=peekEngine();e?.setSample(state.sample);e?.setMix(orchestra?Object.fromEntries(MUSEUM_LAYERS.map(id=>[id,0.55])):{[layer]:0.15+0.85*state.amount}); },[state,listening,layer,orchestra]);
  const moveRef=useRef(move);moveRef.current=move;
  useEffect(()=>{let last=0;const timer=setInterval(()=>{
    const pad=Array.from(navigator.getGamepads?.()??[]).find(Boolean);setController(Boolean(pad));
    const axis=pad?.axes[0]??0;
    if(Math.abs(axis)>0.4&&Date.now()-last>400){last=Date.now();moveRef.current(Math.sign(axis));}
  },100);return()=>clearInterval(timer);},[]);
  return <section className={cn(`layer-${layer}`,"museum-simulator")} aria-label="Functional museum kiosk">
    <div className="museum-console">
      <div className="museum-globe-zone">
        <div className="flex items-center justify-between gap-2 px-5 pt-4 text-sm"><span className="flex items-center gap-2 font-bold"><Headphones className="h-4 w-4"/>Touch globe</span><span className="text-muted-foreground">North stays upright</span></div>
        <div className="museum-globe-stage">
          <EarthGlobe ref={globe} skinUrl={skinDay.url} layer={layer} cursor={position} autoRotate={false} calmMotion={settings.calmMotion}
            lockedAxis sunPosition={sun} nightSkinUrl={skinLights.url} label="Museum Earth globe. Left and right rotate longitude. Enter speaks the selected place."
            onPick={(lat,lng)=>probe(lat,lng)} onKeyDown={e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();move(e.key==="ArrowLeft"?-1:1);}else if(e.key==="Enter"||e.key===" "){e.preventDefault();void play();}}}/>
        </div>
        <div className="museum-plinth" aria-hidden="true"><span>EARTH JUKEBOX</span><span className="text-xs">CYSA SPHERE</span></div>
      </div>
      <div className="museum-tablet-zone">
        <NasaTablet layer={layer} lat={position.lat} lng={position.lng} onProbe={probe} onFrame={v=>setValue(v)} />
      </div>
      <div className="museum-controls">
        <fieldset className="min-w-0"><legend className="mb-3 text-xs font-bold uppercase text-muted-foreground">Four discoveries</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{MUSEUM_LAYERS.map((id,i)=><Button key={id} variant="ghost" aria-pressed={layer===id} aria-label={`${i+1}. ${LAYERS[id].name}`} onClick={()=>choose(id)} className={cn(`layer-${id}`,"museum-dataset-button h-auto flex-col whitespace-normal px-2 py-3")}>
            <span className="museum-dataset-symbol"><LayerIcon id={id} className="h-7 w-7"/></span><span className="text-sm">{LAYERS[id].name}</span><span aria-hidden="true" className="text-lg text-muted-foreground">{BRAILLE[id]}</span>
          </Button>)}</div>
        </fieldset>
        <div className="museum-joystick" role="group" aria-label="East west joystick" onKeyDown={e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();move(e.key==="ArrowLeft"?-1:1);}}}>
          <p className="text-xs font-bold uppercase text-muted-foreground">Longitude joystick</p><div className="mt-3 flex items-center justify-center gap-3">
            <Button size="iconLg" variant="soft" aria-label="Rotate west" onClick={()=>move(-1)}><ArrowLeft/></Button><span className="joystick-stick" aria-hidden="true"/><Button size="iconLg" variant="soft" aria-label="Rotate east" onClick={()=>move(1)}><ArrowRight/></Button>
          </div><p className="mt-2 flex justify-center gap-1 text-xs text-muted-foreground"><Gamepad2 className="h-4 w-4"/>{controller?"Controller connected":"East / west only"}</p>
        </div>
      </div>
    </div>
    <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_auto]">
      <div><p className="text-xs font-bold uppercase text-layer">Headphone channel · {listening?"Listening":"Ready"}</p><h2 className="mt-1 font-display text-3xl">{state.name}</h2><p className="text-muted-foreground">{formatCoords(position.lat,position.lng)}</p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm"><span className="flex items-center gap-1"><Thermometer className="h-4 w-4"/>Globe touch sensation (simulation): {state.thermal}</span><span className="flex items-center gap-1">{daylight?<Sun className="h-4 w-4"/>:<Moon className="h-4 w-4"/>}{clock?daylight?"Day side now":"Night side now":"Calculating daylight"}</span><span>{state.word}</span></div>
      </div>
      <div className="flex flex-wrap items-center gap-2 lg:max-w-sm">
        <Button size="xl" variant="layer" onClick={()=>void play()}><Volume2/>Where am I?</Button>
        <Button size="iconLg" variant="soft" aria-label="Stop kiosk sound" onClick={stop}><Square/></Button>
        <Button size="iconLg" variant="soft" aria-label="Reset museum kiosk" onClick={()=>{stop();setLayer("ocean");setPosition({lat:30,lng:-75});setValue(undefined);setOrchestra(false);globe.current?.flyTo(30,-75);}}><RotateCcw/></Button>
      </div>
    </div>
    <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">Software demonstrator · Touch sensors, raised relief, physical LEDs and heating, cooling and vibration beneath the globe’s surface are proposed hardware, not connected devices. Sensations would be felt at the globe touch point, not on a separate pad, and require child-safe engineering and testing. Daylight is calculated from the current clock; NASA frames are historical.</p>
  </section>;
}