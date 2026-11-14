import { describe, expect, it } from "vitest";
import { LAYER_IDS } from "@/lib/layers";
import { joystickMove, mapCoordinates, reticlePosition, solarPosition, isDaylight, museumSnapshot } from "@/lib/museum-model";
describe("Museum rules", () => {
  it("offers only the four requested datasets", () => expect(LAYER_IDS).toEqual(["ocean", "storm", "forest", "lights"]));
  it("joystick rotates east/west without changing latitude", () => expect(joystickMove({lat:35,lng:175},1)).toEqual({lat:35,lng:-175}));
  it("tablet top and bottom represent north and south", () => { expect(mapCoordinates(0.5,0)).toEqual({lat:90,lng:0}); expect(mapCoordinates(0.5,1)).toEqual({lat:-90,lng:0}); });
  it("synchronizes geographic reticle and latitude beacon", () => { const s=museumSnapshot("ocean",0,0,0.5); expect(reticlePosition(s.lat,s.lng)).toEqual({x:0.5,y:0.5}); expect(s.pitch).toBe(440); expect(s.pan).toBe(0); });
  it("places local noon on the day side and midnight on the night side", () => { const sun=solarPosition(new Date("2026-03-20T12:00:00Z")); expect(sun.lng).toBe(0); expect(isDaylight(0,0,sun)).toBe(true); expect(isDaylight(0,180,sun)).toBe(false); });
  it("never simulates warming for a non-temperature dataset", () => expect(museumSnapshot("forest",0,0,1).thermal).toBe("Neutral"));
});