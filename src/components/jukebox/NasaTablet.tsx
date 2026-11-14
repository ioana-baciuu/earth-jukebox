import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useA11y } from "@/lib/a11y";
import { SEQUENCES, frameValue } from "@/lib/nasa-sequences";
import { isMuseumLayer, mapCoordinates, reticlePosition } from "@/lib/museum-model";
import { LAYERS, type LayerId } from "@/lib/layers";

export function NasaTablet({ layer, lat, lng, onProbe, onFrame }: {
  layer: LayerId; lat: number; lng: number;
  onProbe: (lat: number, lng: number, value?: number, narrate?: boolean) => void;
  onFrame?: (value: number | undefined) => void;
}) {
  const id = isMuseumLayer(layer) ? layer : "ocean";
  const seq = SEQUENCES[id];
  const { settings, set, speak } = useA11y();
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const image = useRef<HTMLImageElement | null>(null);
  const onFrameRef = useRef(onFrame); onFrameRef.current = onFrame;
  const probeRef = useRef(onProbe); probeRef.current = onProbe;
  const pos = reticlePosition(lat, lng);
  useEffect(() => { setFrame(0); setPlaying(false); setLoaded(false); setError(false);
    const img = new Image(); let cancelled = false;
    img.onload = () => { if (!cancelled) { image.current = img; setLoaded(true); } };
    img.onerror = () => { if (!cancelled) setError(true); }; img.src = seq.atlas;
    return () => { cancelled = true; image.current = null; };
  }, [seq.atlas]);
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx || !loaded || !image.current) return;
    const w = image.current.width / seq.columns, h = image.current.height / seq.rows;
    ctx.drawImage(image.current, (frame % seq.columns)*w, Math.floor(frame/seq.columns)*h,w,h,0,0,768,384);
    onFrameRef.current?.(frameValue(id,frame,lat,lng));
  }, [frame, loaded, seq, id, lat, lng]);
  useEffect(() => { if (!playing) return; const timer = setInterval(() => setFrame(f => (f+1)%seq.frameCount), 250/speed); return () => clearInterval(timer); }, [playing,speed,seq.frameCount]);
  const probe = (e: PointerEvent<HTMLCanvasElement>, narrate = false) => {
    if (!seq.georeferenced) return;
    const r = e.currentTarget.getBoundingClientRect();
    const p = mapCoordinates((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);
    probeRef.current(p.lat,p.lng,frameValue(id,frame,p.lat,p.lng),narrate);
  };
  return <div className="tablet-shell">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
      <span className="font-bold">NASA companion tablet</span><span className="text-xs uppercase text-layer">48 extracted frames · archived</span>
    </div>
    <div className="relative aspect-[2/1] overflow-hidden bg-space">
      <canvas ref={canvas} width={768} height={384} tabIndex={seq.georeferenced ? 0 : -1}
        role="application" aria-label={`${LAYERS[id].name} image probe. Arrow keys move; Enter describes the selected place.`}
        className="h-full w-full touch-none cursor-crosshair"
        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); probe(e,true); }}
        onPointerMove={e => { if (e.buttons) probe(e); }} onPointerUp={e => probe(e,true)}
        onKeyDown={e => { let a=lat,b=lng; if(e.key==="ArrowUp")a+=5;else if(e.key==="ArrowDown")a-=5;else if(e.key==="ArrowLeft")b-=5;else if(e.key==="ArrowRight")b+=5;else if(e.key!=="Enter"&&e.key!==" ")return;e.preventDefault(); a=Math.max(-90,Math.min(90,a));b=((b+540)%360)-180;onProbe(a,b,frameValue(id,frame,a,b),true); }} />
      {seq.georeferenced && loaded && <span className="map-reticle" aria-hidden="true" style={{left:`${pos.x*100}%`,top:`${pos.y*100}%`}} />}
      {!loaded && <p className="absolute inset-0 grid place-items-center text-sm">{error ? "NASA image unavailable" : "Loading NASA frames…"}</p>}
    </div>
    <div className="space-y-3 px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="layer" size="iconLg" aria-label={playing ? "Pause NASA animation" : "Play NASA animation"} disabled={!loaded} onClick={() => setPlaying(p=>!p)}>{playing?<Pause/>:<Play/>}</Button>
        <Button variant="ghost" size="icon" aria-label="Previous NASA frame" onClick={()=>setFrame(f=>(f+47)%48)}><SkipBack/></Button>
        <Button variant="ghost" size="icon" aria-label="Next NASA frame" onClick={()=>setFrame(f=>(f+1)%48)}><SkipForward/></Button>
        <span className="text-sm tabular-nums" data-testid="frame-label">Frame {frame+1}/48</span>
        <label className="ml-auto text-sm">Speed <select aria-label="Animation speed" className="rounded border border-border bg-secondary p-1" value={speed} onChange={e=>setSpeed(Number(e.target.value))}>{[0.5,1,2].map(s=><option key={s} value={s}>{s}×</option>)}</select></label>
      </div>
      <input className="w-full accent-[var(--primary)]" aria-label="NASA frame" type="range" min={0} max={47} value={frame} onChange={e=>setFrame(Number(e.target.value))}/>
      <div className="flex items-center gap-3"><Volume2 aria-hidden="true" className="h-4 w-4"/><input className="w-full accent-[var(--primary)]" type="range" aria-label="Tablet sound volume" min={0} max={1} step={0.05} value={settings.volume} onChange={e=>set("volume",Number(e.target.value))}/></div>
      <p className="text-xs text-muted-foreground">{seq.label}{!seq.georeferenced ? ". Movie view only; globe sound uses a separate vegetation proxy." : ". Sound follows normalized frame colours, not calibrated measurements."}</p>
      <div className="flex flex-wrap justify-between gap-2 text-xs"><a href={seq.creditUrl} target="_blank" rel="noreferrer" className="underline">Official NASA source ↗</a><Button variant="link" size="sm" onClick={()=>speak(`${seq.label}. ${LAYERS[id].sound}`,{force:true})}>Describe this dataset</Button></div>
    </div>
  </div>;
}