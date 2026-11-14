import { Link } from "@tanstack/react-router";
import { Disc3 } from "lucide-react";
import { SettingsPanel } from "./SettingsPanel";

const NAV = [
  { to: "/", label: "Explore" },
  { to: "/your-map", label: "Your map" },
  { to: "/about", label: "How it works" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 rounded-full pr-2" aria-label="Earth Jukebox home">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground">
            <Disc3 className="h-6 w-6 animate-[spin_8s_linear_infinite]" aria-hidden="true" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight sm:text-2xl">Earth Jukebox</span>
        </Link>
        <nav aria-label="Main" className="ml-auto">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link
                  to={n.to}
                  className="rounded-full px-3 py-2 text-base font-bold text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground sm:px-4"
                  activeOptions={{ exact: true }}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <SettingsPanel />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between">
        <p>
          Built for NASA Space Apps 2026 · Bucharest. Data and images: NASA Scientific Visualization Studio / Earth
          Information Center.
        </p>
        <p>NASA does not endorse this project.</p>
      </div>
    </footer>
  );
}
