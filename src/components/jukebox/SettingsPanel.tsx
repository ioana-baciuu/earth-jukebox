import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useA11y, type A11ySettings } from "@/lib/a11y";

const TOGGLES: { key: keyof A11ySettings; label: string; hint: string }[] = [
  { key: "narrate", label: "Read aloud", hint: "A friendly voice tells you where you are and what you hear." },
  { key: "bigText", label: "Big text", hint: "Makes all words and buttons larger." },
  { key: "highContrast", label: "High contrast", hint: "Pure black and white with bright pink buttons." },
  { key: "vibrate", label: "Vibrate on thunder", hint: "Phones and tablets buzz when thunder booms." },
  { key: "calmMotion", label: "Calm motion", hint: "Stops spinning, flashes and moving rings." },
];

export function SettingsPanel() {
  const { settings, set, speak } = useA11y();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="soft" size="lg" aria-label="Open accessibility settings">
          <Settings2 aria-hidden="true" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto border-border bg-card sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Make it yours</SheetTitle>
          <SheetDescription className="text-base text-muted-foreground">
            Settings are saved on this device.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-5">
          {TOGGLES.map((t) => (
            <div key={t.key} className="flex items-start justify-between gap-4 rounded-2xl border border-border p-4">
              <div>
                <Label htmlFor={`set-${t.key}`} className="text-lg font-bold">
                  {t.label}
                </Label>
                <p id={`set-${t.key}-hint`} className="mt-1 text-sm text-muted-foreground">
                  {t.hint}
                </p>
              </div>
              <Switch
                id={`set-${t.key}`}
                aria-describedby={`set-${t.key}-hint`}
                checked={settings[t.key] as boolean}
                onCheckedChange={(v) => {
                  set(t.key, v as never);
                  if (t.key === "narrate" && v) speak("Read aloud is on.", { force: true });
                }}
              />
            </div>
          ))}
          <div className="rounded-2xl border border-border p-4">
            <Label id="vol-label" className="text-lg font-bold">
              Sound volume
            </Label>
            <Slider
              className="mt-4"
              aria-labelledby="vol-label"
              min={0}
              max={1}
              step={0.05}
              value={[settings.volume]}
              onValueChange={([v]) => set("volume", v ?? 0.85)}
            />
          </div>
          <div className="rounded-2xl border border-border p-4">
            <h3 className="text-lg font-bold">Keyboard</h3>
            <ul className="mt-2 space-y-1 text-base text-muted-foreground">
              <li>
                <kbd className="font-bold text-foreground">1</kbd> to <kbd className="font-bold text-foreground">7</kbd>: choose a sound layer
              </li>
              <li>
                <kbd className="font-bold text-foreground">Arrow keys</kbd> on the globe: travel
              </li>
              <li>
                <kbd className="font-bold text-foreground">Enter</kbd>: listen to this place
              </li>
              <li>
                <kbd className="font-bold text-foreground">S</kbd>: stop all sound
              </li>
              <li>
                <kbd className="font-bold text-foreground">O</kbd>: open the orchestra
              </li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
