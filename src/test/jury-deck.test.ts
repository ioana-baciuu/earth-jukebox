import { describe, expect, it } from "vitest";
import { JURY_SLIDES, PROJECT_URL, slideIndex } from "@/lib/jury-deck";
describe("Jury presentation requirements", () => {
  it("fits the seven-slide limit", () => { expect(JURY_SLIDES).toHaveLength(7); });
  it("allocates exactly three minutes", () => { expect(JURY_SLIDES.reduce((sum, slide) => sum + slide.seconds, 0)).toBe(180); });
  it("links the QR code to the actual project", () => { expect(PROJECT_URL).toBe("https://earth-orchestra-globe.lovable.app"); });
  it("keeps shared slide coordinates within the deck", () => { expect(slideIndex(0)).toBe(1); expect(slideIndex(99)).toBe(7); expect(slideIndex("bad")).toBe(1); expect(slideIndex(4)).toBe(4); });
});