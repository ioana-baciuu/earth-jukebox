import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, Grid2X2, Maximize, Minimize, NotebookPen, Pause, Play, Printer, RotateCcw, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScaledSlide } from "@/components/presentation/ScaledSlide";
import { JurySlide } from "@/components/presentation/JurySlide";
import { JURY_SLIDES, PROJECT_URL, slideIndex } from "@/lib/jury-deck";
export const Route = createFileRoute("/slides")({
  validateSearch: (search: Record<string, unknown>): { slide?: number; print?: boolean; presenter?: boolean } => ({ slide: slideIndex(search.slide ?? 1), ...(search.print ? { print: true } : {}), ...(search.presenter ? { presenter: true } : {}) }),
  head: () => ({ meta: [
    { title: "Earth Jukebox — CYSA Sphere jury presentation" },
    { name: "description", content: "Seven slides, three minutes: an accessible NASA Earth-science museum prototype by CYSA Sphere." },
    { property: "og:title", content: "Earth Jukebox — CYSA Sphere jury presentation" },
    { property: "og:description", content: "Touch, listen and discover NASA Earth imagery. Explore our seven-slide jury presentation." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: PresentationPage,
});
function PresentationPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const index = (search.slide ?? 1) - 1;
  const [grid, setGrid] = useState(false);
  const [notes, setNotes] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [overrides, setOverrides] = useState<Record<number, string>>({});
  const [storageReady, setStorageReady] = useState(false);
  const channel = useRef<BroadcastChannel | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const go = useCallback((next: number) => { void navigate({ to: "/slides", search: { ...search, slide: slideIndex(next + 1) }, replace: true }); }, [navigate, search]);
  useEffect(() => {
    document.title = `${index + 1}/7 — ${JURY_SLIDES[index]?.title} · Earth Jukebox`;
    if (!search.presenter) channel.current?.postMessage({ index });
  }, [index, search.presenter]);
  useEffect(() => {
    const bus = new BroadcastChannel("earth-jukebox-jury");
    channel.current = bus;
    bus.onmessage = (event) => {
      if (search.presenter && Number.isInteger(event.data?.index)) go(event.data.index);
    };
    return () => { bus.close(); channel.current = null; };
  }, [go, search.presenter]);
  useEffect(() => {
    try { const value = JSON.parse(localStorage.getItem("earth-jukebox-jury-notes") ?? "{}"); if (value && typeof value === "object") setOverrides(value); } catch { /* Browser storage may be disabled. */ }
    setStorageReady(true);
  }, []);
  useEffect(() => { if (storageReady) { try { localStorage.setItem("earth-jukebox-jury-notes", JSON.stringify(overrides)); } catch { /* Notes remain available this session. */ } } }, [overrides, storageReady]);
  useEffect(() => {
    if (!running) return;
    const start = Date.now() - elapsed * 1000;
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 250);
    return () => window.clearInterval(timer);
  }, [running]);
  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const toggleFullscreen = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else { setGrid(false); await document.documentElement.requestFullscreen(); } } catch { setFullscreen(false); }
  };
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) return;
      if (["ArrowRight", " ", "PageDown"].includes(event.key)) { event.preventDefault(); go(index + 1); }
      if (["ArrowLeft", "PageUp"].includes(event.key)) { event.preventDefault(); go(index - 1); }
      if (event.key === "Home") go(0);
      if (event.key === "End") go(6);
      if (event.key.toLowerCase() === "g") setGrid(v => !v);
      if (event.key === "F5") { event.preventDefault(); void toggleFullscreen(); }
      if (event.key === "Escape") { setGrid(false); setFullscreen(false); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [go, index]);
  useEffect(() => {
    if (!search.print) return;
    const timer = window.setTimeout(() => { void document.fonts.ready.then(() => window.print()); }, 1200);
    return () => window.clearTimeout(timer);
  }, [search.print]);
  const time = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
  if (search.print) return <div className="jury-print">{JURY_SLIDES.map((s, i) => <div className="jury-print-page" key={s.title}><JurySlide index={i} /></div>)}</div>;
  return <div className={`jury-app ${fullscreen ? "jury-fullscreen" : ""} ${search.presenter ? "jury-presenter" : ""}`}>
    <header className="jury-toolbar"><Button asChild variant="ghost" size="icon" title="Back to Earth Jukebox"><a href="/"><ArrowLeft /><span className="sr-only">Back to Earth Jukebox</span></a></Button><div className="jury-toolbar-title"><strong>Earth Jukebox</strong><span>CYSA Sphere · Jury presentation</span></div><span className="jury-duration">7 slides · 3 minutes</span><div className="jury-tools">
      <Button variant="ghost" size="icon" aria-label="Slide overview" title="Slide overview" aria-pressed={grid} onClick={() => setGrid(v => !v)}><Grid2X2 /></Button>
      <Button variant="ghost" size="icon" aria-label="Speaker notes" title="Speaker notes" aria-pressed={notes} onClick={() => setNotes(v => !v)}><NotebookPen /></Button>
      <Button variant="ghost" size="icon" aria-label="Open presenter view" title="Open presenter view" onClick={() => window.open(`/slides?slide=${index + 1}&presenter=true`, "jury-presenter")}><Monitor /></Button>
      <Button variant="ghost" size="icon" aria-label="Export PDF" title="Export PDF — select Save as PDF in the print dialog" onClick={() => window.open("/slides?print=true", "_blank")}><Printer /></Button>
      <Button onClick={() => void toggleFullscreen()}><Maximize />Present</Button>
    </div></header>
    <div className="jury-workspace">{!fullscreen && !search.presenter && <aside className="jury-sidebar" aria-label="Slides">{JURY_SLIDES.map((s, i) => <Button key={s.title} variant="ghost" className="jury-thumbnail" aria-label={`Go to slide ${i + 1}: ${s.title}`} aria-current={index === i ? "step" : undefined} onClick={() => go(i)}><div className="jury-thumbnail-preview"><ScaledSlide><JurySlide index={i} /></ScaledSlide></div><span>{i + 1}. {s.title}</span></Button>)}</aside>}
    <div className="jury-center">{grid ? <div className="jury-overview">{JURY_SLIDES.map((s, i) => <Button key={s.title} variant="ghost" className="jury-overview-item" onClick={() => { go(i); setGrid(false); }}><div><ScaledSlide><JurySlide index={i} /></ScaledSlide></div><span>{i + 1}. {s.title}</span></Button>)}</div> : <div className="jury-canvas" onTouchStart={e => { const point = e.touches[0]; if (point) touch.current = { x: point.clientX, y: point.clientY }; }} onTouchEnd={e => { const point = e.changedTouches[0]; const start = touch.current; if (point && start && Math.abs(point.clientX - start.x) > 50 && Math.abs(point.clientX - start.x) > Math.abs(point.clientY - start.y)) go(index + (point.clientX < start.x ? 1 : -1)); touch.current = null; }}><ScaledSlide><JurySlide index={index} /></ScaledSlide></div>}
    <div className="jury-controls"><div className="jury-timer" data-overtime={elapsed > 180}><Button variant="ghost" size="icon" aria-label={running ? "Pause timer" : "Start timer"} onClick={() => setRunning(v => !v)}>{running ? <Pause /> : <Play />}</Button><span>{time} / 3:00</span><Button variant="ghost" size="icon" aria-label="Reset timer" onClick={() => { setElapsed(0); setRunning(false); }}><RotateCcw /></Button></div><div className="flex items-center gap-2"><Button variant="ghost" size="icon" aria-label="Previous slide" disabled={index === 0} onClick={() => go(index - 1)}><ArrowLeft /></Button><span aria-live="polite">{index + 1} / 7</span><Button variant="ghost" size="icon" aria-label="Next slide" disabled={index === 6} onClick={() => go(index + 1)}><ArrowRight /></Button>{fullscreen && <Button variant="ghost" size="icon" aria-label="Exit presentation" onClick={() => void toggleFullscreen()}><Minimize /></Button>}</div><Button asChild variant="link" className="jury-live-link"><a href={PROJECT_URL} target="_blank" rel="noreferrer">Live project <ExternalLink /></a></Button></div>
    {(notes || search.presenter) && <section className="jury-notes"><div className="flex flex-wrap items-center justify-between gap-2"><label htmlFor="speaker-notes" className="font-bold">Speaker notes · {JURY_SLIDES[index]?.seconds} seconds</label><span className="text-sm text-muted-foreground">{JURY_SLIDES[index]?.criterion}</span></div><textarea id="speaker-notes" value={overrides[index] ?? JURY_SLIDES[index]?.notes ?? ""} onChange={e => setOverrides(previous => ({ ...previous, [index]: e.target.value }))} /><p className="jury-confirmation">Before submission: confirm the fourth member’s name and the official challenge title. PDF export: choose “Save as PDF”.</p></section>}
    </div>{search.presenter && <aside className="jury-next"><p className="font-bold">Next slide</p><div><ScaledSlide><JurySlide index={Math.min(6, index + 1)} /></ScaledSlide></div></aside>}</div>
  </div>;
}