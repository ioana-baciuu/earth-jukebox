import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Ear, Hand, Headphones, Keyboard, Monitor, Repeat, School, Vibrate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MuseumSimulator } from "@/components/jukebox/MuseumSimulator";

export const Route = createFileRoute("/museum")({
  head: () => ({
    meta: [
      { title: "Museum exhibit prototype — Earth Jukebox" },
      {
        name: "description",
        content:
          "How Earth Jukebox works as a hands-on museum and school station for blind and low-vision children: tactile globe, big buttons, headphones and NASA data.",
      },
      { property: "og:title", content: "Earth Jukebox museum exhibit prototype" },
      { property: "og:description", content: "A touch-and-listen NASA Earth station for blind and low-vision children." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MuseumPage,
});

const PARTS = [
  { n: 1, icon: Hand, title: "Touch globe", text: "3D-printed raised continents and mountains. Touch sensors under the surface tell the app which place a child is touching." },
  { n: 2, icon: Keyboard, title: "Four-button panel", text: "Sea temperature, lightning, forest height and night lights. Raised symbols and professionally checked Braille identify the buttons. A one-axis joystick rotates east and west; north stays upright." },
  { n: 3, icon: Headphones, title: "Headphones", text: "Stereo headphones: places in the west sound in the left ear, east in the right. Higher notes mean north, lower notes mean south." },
  { n: 4, icon: Vibrate, title: "Thermal and vibration pad", text: "Proposed touch feedback: gentle warmth or coolness for sea temperature, vibration for thunder and coastlines. No physical temperature control is connected to this web demo." },
  { n: 5, icon: Monitor, title: "Companion tablet", text: "Plays extracted NASA image sequences. Touching a flat map selects the same place on the globe and changes the sound. The rotating GEDI movie is a visual explanation, not a geographic touch map." },
];

const FLOW = [
  { t: "Welcome", d: "Choose a dataset and press Where am I? to hear the selected location." },
  { t: "Meet the sounds", d: "Each button plays ‘a little’ and ‘a lot’ so children learn one rule: more of something means more sound." },
  { t: "Explore", d: "Touch the globe or move the east/west joystick. Ocean waves, thunder, birds and bells respond to illustrative image-derived values." },
  { t: "Compare", d: "Guided lessons: Amazon vs Sahara, Congo vs Pacific, Gulf Stream vs Arctic, Tokyo vs open ocean." },
  { t: "Orchestra", d: "Turn every dataset on at once and hear the whole planet spin as music." },
  { t: "Reset", d: "Stop silences the headphones. Reset returns the station to its starting place." },
];

const FEATURES = [
  "Real 3D Earth with NASA skins for each dataset",
  "Tap or touch a place: NASA picture pops up and its sound starts",
  "Spoken description of what each NASA picture looks like",
  "Coastline sounds and vibration when you step onto land or into the sea",
  "North–south pitch beacon and west–east stereo for a mental map",
  "Keyboard, number pad and screen-reader support",
  "Big text, high contrast and calm-motion settings",
  "Orchestra mode: every dataset as an instrument",
  "48 extracted NASA frames per dataset with original source links",
];

function KioskBlueprint() {
  return (
    <svg viewBox="0 0 640 520" role="img" aria-labelledby="kiosk-t kiosk-d" className="h-auto w-full">
      <title id="kiosk-t">Earth Jukebox exhibit station drawing</title>
      <desc id="kiosk-d">
        A waist-high wooden pedestal holds a raised touch globe on top. In front of it is a sloped panel with four big
        round buttons and a joystick. Headphones hang on the left, a vibrating hand rest sits in front, and a screen
        stands behind for teachers.
      </desc>
      <g fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted-foreground" strokeLinejoin="round">
        {/* floor */}
        <line x1="40" y1="480" x2="600" y2="480" strokeDasharray="6 8" />
        {/* screen */}
        <rect x="430" y="70" width="160" height="110" rx="10" />
        <line x1="510" y1="180" x2="510" y2="250" />
        {/* pedestal */}
        <path d="M150 300 L490 300 L470 480 L170 480 Z" />
        <path d="M130 250 L510 250 L490 300 L150 300 Z" />
      </g>
      {/* screen content */}
      <rect x="442" y="82" width="136" height="86" rx="6" className="fill-secondary" />
      <circle cx="510" cy="125" r="28" className="fill-primary/40" />
      {/* globe */}
      <g className="text-primary">
        <circle cx="320" cy="150" r="95" fill="none" stroke="currentColor" strokeWidth="4" />
        <ellipse cx="320" cy="150" rx="95" ry="32" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        <ellipse cx="320" cy="150" rx="40" ry="95" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        <path d="M265 110 q20 -25 45 -10 q15 20 -5 40 q-25 10 -40 -30Z M330 150 q30 -15 45 10 q-5 35 -30 40 q-20 -20 -15 -50Z" fill="currentColor" opacity="0.55" />
        <path d="M290 245 L350 245 L360 255 L280 255 Z" fill="currentColor" />
      </g>
      {/* buttons */}
      {[
        ["layer-rain", 220],
        ["layer-storm", 285],
        ["layer-ocean", 350],
        ["layer-lights", 415],
      ].map(([cls, x]) => (
        <g key={cls} className={String(cls)}>
          <circle cx={Number(x)} cy="275" r="20" className="fill-[var(--layer)]" />
        </g>
      ))}
      {/* joystick */}
      <circle cx="470" cy="275" r="10" className="fill-foreground" />
      <line x1="470" y1="275" x2="470" y2="258" stroke="currentColor" strokeWidth="5" className="text-foreground" />
      {/* headphones */}
      <g fill="none" stroke="currentColor" strokeWidth="5" className="text-foreground" strokeLinecap="round">
        <path d="M70 320 a35 35 0 0 1 70 0" />
        <rect x="62" y="318" width="16" height="28" rx="6" fill="currentColor" />
        <rect x="132" y="318" width="16" height="28" rx="6" fill="currentColor" />
        <path d="M140 330 Q150 300 170 280" strokeWidth="2" />
      </g>
      {/* rumble pad */}
      <rect x="260" y="315" width="120" height="22" rx="11" className="fill-secondary" stroke="currentColor" strokeWidth="2" />
      {/* labels */}
      <g className="fill-foreground font-display" fontSize="22" fontWeight="700">
        {[
          [1, 205, 70],
          [2, 320, 225],
          [3, 105, 300],
          [4, 400, 335],
          [5, 600, 60],
        ].map(([n, x, y]) => (
          <g key={n}>
            <circle cx={x} cy={y} r="16" className="fill-primary" />
            <text x={x} y={Number(y) + 7} textAnchor="middle" className="fill-primary-foreground">
              {n}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function ControlPanelBlueprint() {
  const keys = [
    { cls: "layer-forest", label: "Forest", braille: "⠞⠗⠑⠑" },
    { cls: "layer-storm", label: "Thunder", braille: "⠞⠓⠥⠝" },
    { cls: "layer-ocean", label: "Ocean", braille: "⠕⠉⠑⠁" },
    { cls: "layer-lights", label: "Lights", braille: "⠇⠊⠛⠓" },
  ];
  return (
    <div className="surface p-6" role="img" aria-label="Control panel: four big round buttons labelled Rain, Thunder, Ocean and Lights in print and Braille, a joystick, a Where am I button and a Stop button.">
      <div className="grid grid-cols-4 gap-4" aria-hidden="true">
        {keys.map((k) => (
          <div key={k.label} className={`${k.cls} flex flex-col items-center gap-2`}>
            <span className="layer-chip h-20 w-20 rounded-full shadow-[var(--shadow-glow)]" />
            <span className="text-lg font-bold">{k.label}</span>
            <span className="text-2xl tracking-widest text-muted-foreground">{k.braille}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-around" aria-hidden="true">
        <div className="flex flex-col items-center gap-2">
          <span className="grid h-20 w-20 place-items-center rounded-full border-4 border-border">
            <span className="h-8 w-8 rounded-full bg-foreground" />
          </span>
          <span className="font-bold">Joystick</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="h-14 w-32 rounded-2xl bg-primary" />
          <span className="font-bold">Where am I?</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="h-14 w-14 rounded-xl border-4 border-border bg-secondary" />
          <span className="font-bold">Stop</span>
        </div>
      </div>
    </div>
  );
}

function MuseumPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm font-bold text-muted-foreground">
        <School className="h-4 w-4 text-primary" aria-hidden="true" /> Prototype for museums and schools
      </p>
       <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">Earth Jukebox museum station</h1>
      <p className="mt-4 max-w-3xl text-xl text-muted-foreground">
         CYSA Sphere · A working digital prototype for blind and low-vision explorers.
      </p>

       <div className="mt-8"><MuseumSimulator /></div>

      <section aria-labelledby="station-title" className="mt-10 grid items-start gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="surface p-4 sm:p-6">
          <h2 id="station-title" className="sr-only">
            The station
          </h2>
          <KioskBlueprint />
        </div>
        <ol className="space-y-4">
          {PARTS.map((p) => (
            <li key={p.n} className="surface flex gap-4 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
                {p.n}
              </span>
              <div>
                <h3 className="flex items-center gap-2 text-xl font-bold">
                  <p.icon className="h-5 w-5 text-primary" aria-hidden="true" /> {p.title}
                </h3>
                <p className="mt-1 text-base text-muted-foreground">{p.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="panel-title" className="mt-14 grid items-center gap-8 lg:grid-cols-2">
        <div>
          <h2 id="panel-title" className="font-display text-4xl font-bold">The control panel</h2>
          <p className="mt-3 text-lg text-muted-foreground">
             Four NASA datasets, four buttons. The physical panel proposes raised symbols and Braille; the web demo uses labelled controls. The joystick stays on one axis so the North Pole never tips over.
          </p>
        </div>
        <ControlPanelBlueprint />
      </section>

      <section aria-labelledby="flow-title" className="mt-14">
        <h2 id="flow-title" className="font-display text-4xl font-bold">A visit, step by step</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FLOW.map((f, i) => (
            <li key={f.t} className="surface p-5">
              <span className="font-display text-4xl font-bold text-primary">{i + 1}</span>
              <h3 className="mt-1 text-2xl font-bold">{f.t}</h3>
              <p className="mt-1 text-lg text-muted-foreground">{f.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="feat-title" className="mt-14 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 id="feat-title" className="font-display text-4xl font-bold">What the app already does</h2>
          <ul className="mt-6 space-y-3 text-lg">
            {FEATURES.map((f) => (
              <li key={f} className="flex gap-3">
                <Ear className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" /> {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="surface flex flex-col gap-4 p-8">
          <h2 className="font-display text-3xl font-bold">Three ways to bring it in</h2>
          <p className="text-lg"><strong>Museum station</strong> — the full exhibit with touch globe and panel.</p>
          <p className="text-lg"><strong>Classroom kit</strong> — laptop, headphones and a printed tactile map.</p>
          <p className="text-lg"><strong>Web app</strong> — free in any browser, with a screen reader or the built-in voice.</p>
          <p className="flex items-center gap-2 text-base text-muted-foreground">
            <Repeat className="h-5 w-5" aria-hidden="true" /> Data from NASA SVS / Earth Information Center.
          </p>
          <Button asChild size="xl" variant="hero" className="self-start">
            <Link to="/">
              Try the app <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
