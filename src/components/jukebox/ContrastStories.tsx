import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LayerId } from "@/lib/layers";
import type { Place } from "@/lib/places";
import { cn } from "@/lib/utils";
import { LayerIcon } from "./layer-icon";

const STORIES: { title: string; question: string; layer: LayerId; a: Place; b: Place }[] = [
  {
    title: "Forest or desert?",
    question: "Compare the forest sound with a place that has few trees.",
    layer: "forest",
    a: { name: "Amazon Rainforest", lat: -3.5, lng: -62, blurb: "" },
    b: { name: "Sahara Desert", lat: 23, lng: 12, blurb: "" },
  },
  {
    title: "Stormy or calm?",
    question: "Lightning loves warm land. Hear Africa's storms, then the quiet ocean.",
    layer: "storm",
    a: { name: "Congo Basin", lat: -1, lng: 23, blurb: "" },
    b: { name: "South Pacific Ocean", lat: -30, lng: -130, blurb: "" },
  },
  {
    title: "Warm or cold sea?",
    question: "The ocean has warm and cold rivers. Compare the Gulf Stream with the Arctic.",
    layer: "ocean",
    a: { name: "Gulf Stream", lat: 30, lng: -75, blurb: "" },
    b: { name: "Arctic Ocean", lat: 78, lng: 0, blurb: "" },
  },
  {
    title: "Bright or dark night?",
    question: "Where do people live? Hear Tokyo glow, then the empty Pacific.",
    layer: "lights",
    a: { name: "Tokyo", lat: 35.7, lng: 139.7, blurb: "" },
    b: { name: "Middle of the Pacific", lat: 5, lng: -150, blurb: "" },
  },
];

export function ContrastStories({ onVisit }: { onVisit: (p: Place, layer: LayerId) => void }) {
  return (
    <section aria-labelledby="stories-title" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h2 id="stories-title" className="font-display text-4xl font-bold">
        Compare two places
      </h2>
      <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
        Short listening lessons. Play one place, then the other, and hear the difference.
      </p>
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {STORIES.map((s) => (
          <li key={s.title} className={cn(`layer-${s.layer}`, "surface p-5")}>
            <h3 className="flex items-center gap-3 text-2xl font-bold">
              <LayerIcon id={s.layer} className="h-6 w-6 text-layer" />
              {s.title}
            </h3>
            <p className="mt-2 text-lg text-muted-foreground">{s.question}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button size="xl" variant="layer" onClick={() => onVisit(s.a, s.layer)}>
                {s.a.name}
              </Button>
              <ArrowLeftRight className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              <Button size="xl" variant="soft" onClick={() => onVisit(s.b, s.layer)}>
                {s.b.name}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
