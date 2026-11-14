import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ImageUp, Pause, Play } from "lucide-react";
import nasaSst from "@/assets/earth/nasa-sst.jpg.asset.json";
import skinDust from "@/assets/earth/skin-dust.jpg.asset.json";
import skinLights from "@/assets/earth/skin-lights.jpg.asset.json";
import skinCo2 from "@/assets/earth/skin-co2.jpg.asset.json";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getEngine, peekEngine } from "@/lib/audio/engine";
import { useA11y } from "@/lib/a11y";
import { pentatonicFreq } from "@/lib/sonify-map";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/your-map")({
  head: () => ({
    meta: [
      { title: "Play your own map — Earth Jukebox" },
      {
        name: "description",
        content: "Upload a NASA Earth Information Center frame or any data map and hear it played from west to east.",
      },
      { property: "og:title", content: "Play your own map — Earth Jukebox" },
      { property: "og:description", content: "Turn any satellite picture or data map into a melody, one slice at a time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: YourMap,
});

const COLS = 64;
const BANDS = 6;
interface Analysis {
  bright: number[][]; // [col][band]
  warm: boolean[]; // per column
  threshold: number;
  summary: string;
}

const SAMPLES = [
  { name: "Ocean temperature", url: nasaSst.url },
  { name: "Dust and smoke", url: skinDust.url },
  { name: "City lights at night", url: skinLights.url },
  { name: "Carbon dioxide", url: skinCo2.url },
];

function analyse(img: HTMLImageElement): Analysis {
  const w = COLS * 4;
  const h = BANDS * 8;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const bright: number[][] = [];
  const warm: boolean[] = [];
  let total = 0;
  let warmCols = 0;
  for (let col = 0; col < COLS; col++) {
    const bands: number[] = [];
    let warmScore = 0;
    for (let b = 0; b < BANDS; b++) {
      let sum = 0;
      let n = 0;
      for (let y = b * 8; y < b * 8 + 8; y++)
        for (let x = col * 4; x < col * 4 + 4; x++) {
          const i = (y * w + x) * 4;
          const r = d[i] ?? 0, g = d[i + 1] ?? 0, bl = d[i + 2] ?? 0;
          sum += (0.3 * r + 0.59 * g + 0.11 * bl) / 255;
          warmScore += (r - bl) / 255;
          n++;
        }
      bands.push(sum / n);
      total += sum / n;
    }
    bright.push(bands);
    warm.push(warmScore > 0);
    if (warmScore > 0) warmCols++;
  }
  const mean = total / (COLS * BANDS);
  const brightest = bright.flat().reduce((a, b) => Math.max(a, b), 0);
  const tone = mean < 0.2 ? "mostly dark" : mean < 0.45 ? "medium bright" : "mostly bright";
  const colour = warmCols > COLS * 0.6 ? "warm colours like red and orange" : warmCols < COLS * 0.3 ? "cool colours like blue and green" : "a mix of warm and cool colours";
  return {
    bright,
    warm,
    threshold: Math.min(brightest * 0.8, mean + 0.08),
    summary: `This picture is ${tone}, with ${colour}.`,
  };
}

function YourMap() {
  const { announce, speak } = useA11y();
  const [src, setSrc] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [playing, setPlaying] = useState(false);
  const [col, setCol] = useState(0);
  const [tempo, setTempo] = useState(0.5);
  const colRef = useRef(0);

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const a = analyse(img);
      setAnalysis(a);
      setCol(0);
      colRef.current = 0;
      announce(`Picture ready. ${a.summary} Press Play to hear it.`);
    };
    img.src = src;
  }, [src, announce]);

  useEffect(() => {
    if (!playing || !analysis) return;
    const stepMs = 380 - tempo * 280;
    const id = setInterval(() => {
      const e = peekEngine();
      if (!e) return;
      const c = colRef.current;
      const bands = analysis.bright[c] ?? [];
      const minor = !analysis.warm[c];
      const pan = (c / (COLS - 1)) * 2 - 1;
      bands.forEach((v, b) => {
        if (v > analysis.threshold) {
          const step = (BANDS - 1 - b) * 2;
          e.marimba(pentatonicFreq(minor ? 57 : 60, step, minor), 0.06 + 0.22 * Math.min(1, v), pan);
        }
      });
      const next = (c + 1) % COLS;
      colRef.current = next;
      setCol(next);
      if (next === 0) {
        setPlaying(false);
        announce("Finished. Press Play to hear it again.");
      }
    }, stepMs);
    return () => clearInterval(id);
  }, [playing, analysis, tempo, announce]);

  const toggle = async () => {
    if (playing) return setPlaying(false);
    await getEngine();
    setPlaying(true);
  };

  const onFile = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      announce("That file is not a picture. Please choose a PNG, JPG or WebP.", true);
      return;
    }
    setPlaying(false);
    setSrc(URL.createObjectURL(f));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-5xl font-bold">Play your own map</h1>
      <p className="mt-3 max-w-2xl text-xl text-muted-foreground">
        Bring a frame from NASA's Earth Information Center, or any satellite picture. A playhead sweeps from west to east and
        every slice becomes notes: bright parts ring out, high parts play high, warm colours sound happy, cool colours sound
        calm.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="surface overflow-hidden p-4">
          {src ? (
            <div className="relative">
              <img src={src} alt={analysis ? `Your picture. ${analysis.summary}` : "Your picture"} className="w-full rounded-2xl" />
              <div
                aria-hidden="true"
                className="absolute inset-y-0 w-1.5 rounded-full bg-primary shadow-[0_0_20px_var(--primary)]"
                style={{ left: `${(col / COLS) * 100}%` }}
              />
            </div>
          ) : (
            <label
              htmlFor="map-file"
              className="flex min-h-72 cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-4 border-dashed border-border p-8 text-center hover:border-primary"
            >
              <ImageUp className="h-14 w-14 text-primary" aria-hidden="true" />
              <span className="font-display text-2xl font-bold">Choose a picture</span>
              <span className="text-muted-foreground">PNG, JPG or WebP of an Earth map or satellite view</span>
            </label>
          )}
          <input
            id="map-file"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </div>

        <div className="space-y-5">
          <div className="surface space-y-4 p-5">
            <Button size="xl" variant="hero" className="w-full" disabled={!analysis} onClick={toggle} aria-pressed={playing}>
              {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              {playing ? "Pause" : "Play the picture"}
            </Button>
            <Button size="xl" variant="soft" className="w-full" asChild>
              <label htmlFor="map-file" className="cursor-pointer">
                <ImageUp aria-hidden="true" /> {src ? "Choose another" : "Upload a picture"}
              </label>
            </Button>
            <div>
              <p id="tempo-label" className="font-bold">
                Speed
              </p>
              <Slider className="mt-3" aria-labelledby="tempo-label" min={0} max={1} step={0.1} value={[tempo]} onValueChange={([v]) => setTempo(v ?? 0.5)} />
            </div>
            {analysis && (
              <Button variant="link" className="px-0 text-base" onClick={() => speak(analysis.summary, { force: true })}>
                Describe the picture aloud
              </Button>
            )}
          </div>
          <div className="surface p-5">
            <h2 className="text-xl font-bold">Try a NASA picture</h2>
            <ul className="mt-3 grid gap-2">
              {SAMPLES.map((s) => (
                <li key={s.name}>
                  <button
                    type="button"
                    onClick={() => {
                      setPlaying(false);
                      setSrc(s.url);
                    }}
                    className={cn("layer-tile w-full rounded-xl px-4 py-3 text-left text-lg font-bold", src === s.url && "border-primary")}
                  >
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
