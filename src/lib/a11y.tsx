import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { peekEngine } from "@/lib/audio/engine";

export interface A11ySettings {
  bigText: boolean;
  highContrast: boolean;
  narrate: boolean;
  vibrate: boolean;
  calmMotion: boolean;
  volume: number;
}

const DEFAULTS: A11ySettings = {
  bigText: false,
  highContrast: false,
  narrate: true,
  vibrate: true,
  calmMotion: false,
  volume: 0.85,
};

interface Ctx {
  settings: A11ySettings;
  set: <K extends keyof A11ySettings>(key: K, value: A11ySettings[K]) => void;
  /** Speak a sentence aloud when narration is on (and duck the music). */
  speak: (text: string, opts?: { force?: boolean }) => void;
  stopSpeaking: () => void;
  /** Send a message to screen readers. */
  announce: (text: string, assertive?: boolean) => void;
  buzz: (pattern: number | number[]) => void;
}

const A11yContext = createContext<Ctx | null>(null);
const KEY = "earth-jukebox-a11y";

export function A11yProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<A11ySettings>(DEFAULTS);
  const [politeMsg, setPolite] = useState("");
  const [assertiveMsg, setAssertive] = useState("");
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const parsed = raw ? (JSON.parse(raw) as Partial<A11ySettings>) : {};
      setSettings({ ...DEFAULTS, calmMotion: !!reduce, ...parsed });
    } catch {
      /* ignore */
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("big-text", settings.bigText);
    root.classList.toggle("hc", settings.highContrast);
    root.classList.toggle("reduce-motion", settings.calmMotion);
    if (loaded.current) localStorage.setItem(KEY, JSON.stringify(settings));
    peekEngine()?.setVolume(settings.volume);
  }, [settings]);

  const set = useCallback<Ctx["set"]>((key, value) => {
    setSettings((s) => ({ ...s, [key]: value }));
  }, []);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    peekEngine()?.duck(false);
  }, []);

  const speak = useCallback<Ctx["speak"]>((text, opts) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (!settingsRef.current.narrate && !opts?.force) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.pitch = 1.05;
    u.lang = "en-US";
    const voices = synth.getVoices();
    const preferred = voices.find((v) => /en/i.test(v.lang) && /female|samantha|google us|aria|jenny/i.test(v.name));
    if (preferred) u.voice = preferred;
    u.onstart = () => peekEngine()?.duck(true);
    u.onend = () => peekEngine()?.duck(false);
    u.onerror = () => peekEngine()?.duck(false);
    synth.speak(u);
  }, []);

  const announce = useCallback<Ctx["announce"]>((text, assertive) => {
    if (assertive) {
      setAssertive("");
      setTimeout(() => setAssertive(text), 30);
    } else {
      setPolite("");
      setTimeout(() => setPolite(text), 30);
    }
  }, []);

  const buzz = useCallback<Ctx["buzz"]>((pattern) => {
    if (!settingsRef.current.vibrate) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  }, []);

  const value = useMemo(
    () => ({ settings, set, speak, stopSpeaking, announce, buzz }),
    [settings, set, speak, stopSpeaking, announce, buzz],
  );

  return (
    <A11yContext.Provider value={value}>
      {children}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {politeMsg}
      </div>
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {assertiveMsg}
      </div>
    </A11yContext.Provider>
  );
}

export function useA11y() {
  const c = useContext(A11yContext);
  if (!c) throw new Error("useA11y must be used inside A11yProvider");
  return c;
}
