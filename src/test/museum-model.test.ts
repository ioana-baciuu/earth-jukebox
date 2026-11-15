import { describe, expect, it } from "vitest";
import { LAYER_IDS } from "@/lib/layers";
import { joystickMove, mapCoordinates, reticlePosition, solarPosition, isDaylight, museumSnapshot } from "@/lib/museum-model";
import { SEQUENCES, frameValue } from "@/lib/nasa-sequences";
describe("Museum rules", () => {
  it("offers only the four requested datasets", () => expect(LAYER_IDS).toEqual(["ocean", "storm", "forest", "lights"]));
  it("joystick rotates east/west without changing latitude", () => expect(joystickMove({lat:35,lng:175},1)).toEqual({lat:35,lng:-175}));
  it("tablet top and bottom represent north and south", () => { expect(mapCoordinates(0.5,0)).toEqual({lat:90,lng:0}); expect(mapCoordinates(0.5,1)).toEqual({lat:-90,lng:0}); });
  it("synchronizes geographic reticle and latitude beacon", () => { const s=museumSnapshot("ocean",0,0,0.5); expect(reticlePosition(s.lat,s.lng)).toEqual({x:0.5,y:0.5}); expect(s.pitch).toBe(440); expect(s.pan).toBe(0); });
  it("places local noon on the day side and midnight on the night side", () => { const sun=solarPosition(new Date("2026-03-20T12:00:00Z")); expect(sun.lng).toBe(0); expect(isDaylight(0,0,sun)).toBe(true); expect(isDaylight(0,180,sun)).toBe(false); });
  it("never simulates warming for a non-temperature dataset", () => expect(museumSnapshot("forest",0,0,1).thermal).toBe("Neutral"));
  it("bundles 48 extracted frames for each of the four datasets", () => { for(const seq of Object.values(SEQUENCES)){expect(seq.frameCount).toBe(48);expect(seq.grids).toHaveLength(48);expect(seq.columns*seq.rows).toBe(48);} });
  it("does not interpret rotating GEDI movie pixels as geographic height", () => expect(frameValue("forest",12,0,0)).toBeUndefined());
});
import { dayPhase, nightShare, DAY_PHASE_LABEL } from "@/lib/museum-model";
describe("day/night globe label", () => {
  const sun = { lat: 0, lng: 0 };
  it("labels the point opposite the Sun as the night side with city lights", () => {
    expect(dayPhase(0, 180, sun)).toBe("night");
    expect(DAY_PHASE_LABEL.night).toBe("Night Side — City Lights Active");
  });
  it("labels the point under the Sun as day", () => expect(dayPhase(0, 0, sun)).toBe("day"));
  it("labels the 90° line as the sunrise/sunset band", () => expect(dayPhase(0, 90, sun)).toBe("twilight"));
  it("reports how much of the view is night", () => {
    expect(nightShare(0, 0, sun)).toBe(0);
    expect(nightShare(0, 180, sun)).toBe(100);
    expect(nightShare(0, 90, sun)).toBe(50);
  });
});

import { childLine } from "@/lib/museum-model";
describe("spoken line matches the place", () => {
  it("never mentions waves on land", () => expect(childLine("ocean","x",0,true)).not.toMatch(/listen to the .*waves/i));
  it("never mentions trees birds at sea", () => expect(childLine("forest","x",0.8,false)).toMatch(/no trees/));
  it("says the sea has no city lights", () => expect(childLine("lights","x",0,false)).toMatch(/no city lights/));
});
