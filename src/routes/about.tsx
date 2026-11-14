import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LayerIcon } from "@/components/jukebox/layer-icon";
import { LAYER_IDS, LAYERS } from "@/lib/layers";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "How Earth Jukebox works — sound from NASA data" },
      {
        name: "description",
        content:
          "How Earth Jukebox reads NASA Earth Information Center images and turns them into child-friendly sounds, plus notes for museums and schools.",
      },
      { property: "og:title", content: "How Earth Jukebox works" },
      { property: "og:description", content: "From NASA pixels to raindrops, thunder and birdsong: the method behind the sound globe." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

const SOURCES: Record<string, string> = {
  rain: "Estimated from NASA Blue Marble vegetation and ocean temperature, shaped like real atmospheric rivers and the tropical rain belt.",
  storm: "Lightning flashes counted from the ISS Lightning Imaging Sensor frame (SVS 5011), smoothed over each area.",
  ocean: "Colour of the ECCO2 sea-surface temperature map (SVS 3912), read from blue (cold) to red (warm).",
  lights: "Brightness of NASA Black Marble night lights.",
  forest: "Darkness and greenness of forests in NASA Blue Marble, matching GEDI forest-height patterns.",
  dust: "Colour strength in the GEOS aerosol map (SVS 5572): pink dust, orange smoke, blue sea salt, green pollution.",
  co2: "Brightness of the DYAMOND carbon dioxide frame (SVS 5436).",
};

function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-5xl font-bold">How it works</h1>
      <p className="mt-4 max-w-3xl text-xl text-muted-foreground">
        NASA's Earth Information Center makes beautiful pictures of our changing planet. Earth Jukebox turns those pictures
        into sound, so children who cannot see them can still explore them.
      </p>

      <section aria-labelledby="steps" className="mt-12">
        <h2 id="steps" className="font-display text-3xl font-bold">
          From pixels to sound
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Read the picture", "Each NASA frame is split into a grid of small squares, 2.5 degrees wide, covering the whole globe."],
            ["Measure it", "In every square we measure brightness, colour and how much of the picture is lit up."],
            ["Play it", "That number drives a natural sound: one drop or pouring rain, a far rumble or a thunder crack."],
          ].map(([t, d], i) => (
            <li key={t} className="surface p-6">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-primary font-bold text-primary-foreground">{i + 1}</span>
              <h3 className="mt-3 text-xl font-bold">{t}</h3>
              <p className="mt-2 text-lg text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-lg">
          One rule to learn: <strong className="text-primary">more of something means more sound.</strong> Melodies always use a
          five-note scale, so every place on Earth sounds pleasant together.
        </p>
      </section>

      <section aria-labelledby="key" className="mt-14">
        <h2 id="key" className="font-display text-3xl font-bold">
          The sound key
        </h2>
        <ul className="mt-6 grid gap-4">
          {LAYER_IDS.map((id) => {
            const l = LAYERS[id];
            return (
              <li key={id} className={cn(`layer-${id}`, "layer-tile grid gap-4 rounded-2xl p-5 md:grid-cols-[14rem_1fr]")}>
                <div className="flex items-center gap-3">
                  <span className="layer-chip grid h-12 w-12 shrink-0 place-items-center rounded-full">
                    <LayerIcon id={id} className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold leading-tight">{l.name}</h3>
                    <p className="text-sm text-muted-foreground">{l.instrument}</p>
                  </div>
                </div>
                <div className="space-y-2 text-base">
                  <p>
                    <strong>You hear:</strong> {l.sound}
                  </p>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Data:</strong> {SOURCES[id]}{" "}
                    <a href={l.creditUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-foreground underline">
                      NASA source <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="museums" className="mt-14 grid gap-6 md:grid-cols-2">
        <div className="surface p-6">
          <h2 id="museums" className="font-display text-3xl font-bold">
            For museums and schools
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-lg">
            <li>Use headphones: sounds move left and right as you travel around the globe.</li>
            <li>Kiosk tip: open the page full screen and turn on Read aloud in Settings.</li>
            <li>Everything works with a keyboard, a switch device or a screen reader.</li>
            <li>Big text, high contrast and calm motion are one tap away.</li>
            <li>Lightning flashes are soft and slow, and can be switched off with Calm motion.</li>
          </ul>
        </div>
        <div className="surface p-6">
          <h2 className="font-display text-3xl font-bold">Honest notes</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-lg">
            <li>The grids are read from single NASA frames, so they show one moment, not a long-term average.</li>
            <li>The rain layer is an estimate built from other NASA layers, not a direct rain measurement.</li>
            <li>The sounds are made live in your browser, so it keeps working without extra downloads.</li>
          </ul>
        </div>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Button asChild size="xl" variant="hero">
          <Link to="/">Go explore the globe</Link>
        </Button>
        <Button asChild size="xl" variant="soft">
          <Link to="/your-map">Play your own map</Link>
        </Button>
      </div>

      <p className="mt-12 text-sm text-muted-foreground">
        NASA does not endorse any non-U.S. Government entity. Images and data: NASA Scientific Visualization Studio, Earth
        Information Center, Blue Marble and Black Marble.
      </p>
    </div>
  );
}
