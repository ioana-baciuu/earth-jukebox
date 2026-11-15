<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- NASA animations are offline-extracted into 48-frame image atlases with source manifests; only flat global sequences support geographic frame probing, because rotating camera films cannot be sampled by latitude/longitude.
- The museum simulator and tablet share one geographic selection; joystick movement preserves latitude, and thermal feedback is a qualitative simulation rather than hardware or a safety specification.
- Sound is synthesized live with Web Audio in `src/lib/audio/engine.ts` (one voice per Earth layer); keep pure value→sound rules in `src/lib/sonify-map.ts` so they stay unit-tested.
- Earth data comes from offline-extracted 2.5° grids in `src/data/earth-grids.ts` (generated from NASA SVS frames); regenerate rather than hand-edit.
- The globe (`globe.gl`) is imported dynamically inside useEffect because WebGL cannot run during SSR.
- WebGL ring colours in `EarthGlobe.tsx` mirror the `--layer-*` tokens in `src/styles.css`; update both together.
- Keep the museum station scene lazily client-loaded, with its five parts defined by the shared station-parts list, so drawings and descriptions stay aligned.
- Model the fourth station part as a globe-surface feedback overlay sharing the globe camera target, not as a separate mesh on the pedestal, so the prototype illustrates integrated touch hardware.
- Project 3D station hotspots into buttons owned by the page's React root; avoid separate Html roots that race during React 19 cleanup.
- Research-inspired sonification rules (Erie specs, DIXTRAL probe, Umwelt snapshot, evaluation validator) live in `src/lib/sonification-spec.ts` with tests in `src/test/`; route files only export `Route`, so never embed helpers or in-source tests there.
- The Explore page's Particle Earth (`src/components/jukebox/particle/ParticleEarth.tsx`) is lazy-loaded behind ClientOnly and samples the same NASA grids as the photo globe, so both views pick the same places.
