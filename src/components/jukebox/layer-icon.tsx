import { CloudLightning, CloudRain, Factory, Sparkles, Trees, Waves, Wind, type LucideProps } from "lucide-react";
import type { LayerId } from "@/lib/layers";

const ICONS = {
  rain: CloudRain,
  storm: CloudLightning,
  ocean: Waves,
  lights: Sparkles,
  forest: Trees,
  dust: Wind,
  co2: Factory,
} satisfies Record<LayerId, unknown>;

export function LayerIcon({ id, ...props }: { id: LayerId } & LucideProps) {
  const Icon = ICONS[id];
  return <Icon aria-hidden="true" {...props} />;
}
