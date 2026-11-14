import { useEffect, useRef } from "react";
import { peekEngine } from "@/lib/audio/engine";

/** A small live equaliser that shows the sound is playing (decorative). */
export function SoundBars({ playing, calm }: { playing: boolean; calm: boolean }) {
  const barsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!playing || calm) return;
    let raf = 0;
    const data = new Uint8Array(128);
    const loop = () => {
      const e = peekEngine();
      const el = barsRef.current;
      if (e && el) {
        e.analyser.getByteFrequencyData(data);
        const kids = el.children;
        for (let i = 0; i < kids.length; i++) {
          const v = (data[2 + i * 5] ?? 0) / 255;
          (kids[i] as HTMLElement).style.transform = `scaleY(${0.12 + v * 0.88})`;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, calm]);
  return (
    <div ref={barsRef} aria-hidden="true" className="flex h-10 items-end gap-1">
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="meter-fill block h-full w-2 origin-bottom rounded-full transition-transform duration-75"
          style={{ transform: "scaleY(0.12)" }}
        />
      ))}
    </div>
  );
}
