import { STATION_SPECS } from "@/lib/station-parts";
import { createFileRoute } from "@tanstack/react-router";
import { Hand, Headphones, Keyboard, Monitor, School, Vibrate } from "lucide-react";
import { MuseumSimulator } from "@/components/jukebox/MuseumSimulator";
import { StationShowcase } from "@/components/jukebox/station/StationShowcase";
import { STATION_PARTS } from "@/lib/station-parts";

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

const PART_ICONS = { globe: Hand, panel: Keyboard, headphones: Headphones, feedback: Vibrate, tablet: Monitor } as const;
const PARTS = STATION_PARTS.map((p) => ({ ...p, icon: PART_ICONS[p.id] }));

const FLOW = [
  { t: "Put on the headphones", d: "Lift the headphones off the hook. High notes mean north, low notes mean south; west plays in the left ear, east in the right." },
  { t: "Choose a dataset", d: "Press one of the four Braille keys: Sea Temperature, Lightning, Forest Height or Night Lights. Each one plays its instrument." },
  { t: "Touch the globe", d: "Feel the raised continents. Under your fingers the globe turns warm or cool over the sea and buzzes softly where storms are." },
  { t: "Spin the Earth", d: "Push the joystick east or west. The North Pole stays on top while places move into daylight or into the glowing night side." },
  { t: "Ask “Where am I?”", d: "Press the pink key to hear the place you are touching and what the chosen dataset says about it." },
  { t: "Play the orchestra", d: "Turn all four instruments on together and hear the whole planet as music." },
];

function KioskBlueprint() {
  return (
    <svg viewBox="0 0 640 520" role="img" aria-labelledby="kiosk-t kiosk-d" className="h-auto w-full">
      <title id="kiosk-t">Earth Jukebox exhibit station drawing</title>
      <desc id="kiosk-d">
        A child-height wooden pedestal (65 cm) holds a raised touch globe on top. In front of it is a sloped panel with four big
        round buttons and a joystick. The headphones are cabled to the station, touch sensations are built into the globe, and a screen
        stands beside it for teachers. A child stands at the front, touching the globe and wearing the headphones.
      </desc>
      <g fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted-foreground" strokeLinejoin="round">
        {/* floor */}
        <line x1="40" y1="480" x2="600" y2="480" strokeDasharray="6 8" />
        {/* screen */}
        <rect x="430" y="70" width="160" height="110" rx="10" />
        <line x1="510" y1="180" x2="510" y2="300" />
        {/* pedestal */}
        <path d="M150 347 L490 347 L470 480 L170 480 Z" />
        <path d="M130 300 L510 300 L490 347 L150 347 Z" />
      </g>
      {/* screen content */}
      <rect x="442" y="82" width="136" height="86" rx="6" className="fill-secondary" />
      <circle cx="510" cy="125" r="28" className="fill-primary/40" />
      {/* globe */}
      <g className="text-primary">
        <circle cx="330" cy="238" r="62" fill="none" stroke="currentColor" strokeWidth="4" />
        <ellipse cx="330" cy="238" rx="62" ry="21" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        <ellipse cx="330" cy="238" rx="26" ry="62" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        <path d="M295 212 q13 -16 29 -7 q10 13 -3 26 q-16 7 -26 -19Z M337 238 q20 -10 29 7 q-3 23 -20 26 q-13 -13 -9 -33Z" fill="currentColor" opacity="0.55" />
        <path d="M305 298 L355 298 L362 304 L298 304 Z" fill="currentColor" />
      </g>
      {/* buttons */}
      {[
        ["layer-ocean", 200],
        ["layer-storm", 255],
        ["layer-forest", 310],
        ["layer-lights", 365],
      ].map(([cls, x]) => (
        <g key={cls} className={String(cls)}>
          <circle cx={Number(x)} cy="323" r="16" className="fill-[var(--layer)]" />
        </g>
      ))}
      {/* Where am I? key */}
      <rect x="395" y="313" width="34" height="20" rx="5" className="fill-primary" />
      {/* joystick in an east/west slot */}
      <rect x="440" y="318" width="50" height="10" rx="5" className="fill-secondary" />
      <line x1="465" y1="323" x2="465" y2="302" stroke="currentColor" strokeWidth="4" className="text-foreground" />
      <circle cx="465" cy="300" r="8" className="fill-primary" />
      {/* child visitor, reaching the globe, wearing the headphones */}
      <g className="text-foreground" fill="currentColor">
        <circle cx="585" cy="268" r="24" />
        <path d="M565 300 q20 -10 40 0 l8 110 h-56 Z" />
        <rect x="565" y="405" width="14" height="75" rx="6" />
        <rect x="591" y="405" width="14" height="75" rx="6" />
        <path d="M568 310 Q470 290 392 250" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="4" className="text-primary" strokeLinecap="round">
        <path d="M560 262 a26 26 0 0 1 50 0" />
        <rect x="555" y="258" width="10" height="18" rx="4" fill="currentColor" />
        <path d="M560 276 Q540 360 495 340" strokeWidth="2" />
      </g>
      {/* headphones */}
      <g fill="none" stroke="currentColor" strokeWidth="5" className="text-foreground" strokeLinecap="round">
        <path d="M105 330 v20" />
        <line x1="105" y1="330" x2="150" y2="330" />
      </g>
      {/* height marks */}
      <g className="fill-muted-foreground" fontSize="14">
        <text x="40" y="352">65 cm</text>
        <text x="420" y="243">globe 96 cm</text>
      </g>
      {/* Touch feedback is integrated into the globe, not a separate hand rest. */}
      {/* labels */}
      <g className="fill-foreground font-display" fontSize="22" fontWeight="700">
        {[
          [1, 250, 170],
          [2, 175, 280],
          [3, 540, 240],
           [4, 365, 225],
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
    { cls: "layer-ocean", label: "Sea temp", braille: "⠕⠉⠑⠁" },
    { cls: "layer-storm", label: "Lightning", braille: "⠞⠓⠥⠝" },
    { cls: "layer-forest", label: "Forest", braille: "⠞⠗⠑⠑" },
    { cls: "layer-lights", label: "Night lights", braille: "⠇⠊⠛⠓" },
  ];
  return (
    <div className="surface p-6" role="img" aria-label="Control panel matching the 3D station, left to right: Sea temperature, Lightning, Forest height and Night lights keys, a pink Where am I key, and an east/west joystick. Braille is illustrative and requires review.">
      <div className="flex flex-wrap items-end justify-center gap-4 sm:gap-6" aria-hidden="true">
        {keys.map((k) => (
          <div key={k.label} className={`${k.cls} flex flex-col items-center gap-2`}>
            <span className="layer-chip h-12 w-12 rounded-full shadow-[var(--shadow-glow)] sm:h-16 sm:w-16" />
            <span className="text-sm font-bold">{k.label}</span>
            <span className="text-xl tracking-widest text-muted-foreground">{k.braille}</span>
          </div>
        ))}
        <div className="flex flex-col items-center gap-2">
          <span className="h-10 w-14 rounded-xl bg-primary sm:h-12 sm:w-16" />
          <span className="text-sm font-bold">Where am I?</span>
          <span className="text-xl text-muted-foreground">&nbsp;</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="relative flex h-12 w-24 items-center justify-center">
            <span className="absolute h-3 w-24 rounded-full bg-secondary" />
            <span className="relative h-9 w-9 rounded-full bg-primary" />
          </span>
          <span className="text-sm font-bold">◀ West · East ▶</span>
          <span className="text-xl text-muted-foreground">&nbsp;</span>
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

      <StationShowcase />

      <section aria-labelledby="station-title" className="mt-10 grid items-start gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="surface p-4 sm:p-6">
          <h2 id="station-title" className="sr-only">
            The station
          </h2>
          <KioskBlueprint />
          <dl className="mt-4 grid gap-2 border-t border-border pt-4 text-sm">
            {STATION_SPECS.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[7rem_1fr] gap-2">
                <dt className="font-bold">{k}</dt>
                <dd className="text-muted-foreground">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">Proposed specification for the hackathon prototype; final sizes follow accessibility testing with partner museums.</p>
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
    </div>
  );
}
