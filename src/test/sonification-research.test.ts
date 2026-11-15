import { describe, expect, it } from "vitest";
import { createUmweltSnapshot, dixtralProbe, ERIE_SPECS, erieFor, evaluateErie, validateEvaluation, type EvaluationResponse } from "@/lib/sonification-spec";

describe("Erie declarative specification", () => {
  it("maps sea surface temperature monotonically from cold to warm", () => {
    const s = ERIE_SPECS.ocean;
    expect(evaluateErie(s, 0)).toBe(220);
    expect(evaluateErie(s, 0.5)).toBe(440);
    expect(evaluateErie(s, 1)).toBe(660);
  });

  it("maps lightning intervals inversely (more storm = faster booms)", () => {
    const s = ERIE_SPECS.storm;
    expect(evaluateErie(s, 0)).toBe(14);
    expect(evaluateErie(s, 1)).toBe(2.5);
    expect(evaluateErie(s, 1)).toBeLessThan(evaluateErie(s, 0));
  });

  it("clamps out-of-range and non-finite input", () => {
    const s = ERIE_SPECS.ocean;
    expect(evaluateErie(s, -5)).toBe(220);
    expect(evaluateErie(s, 9)).toBe(660);
    expect(evaluateErie(s, Number.NaN)).toBe(220);
  });

  it("supports quadratic and logarithmic scales", () => {
    const q = { ...ERIE_SPECS.ocean, scale: "quadratic" as const };
    const l = { ...ERIE_SPECS.ocean, scale: "logarithmic" as const };
    expect(evaluateErie(q, 0.5)).toBeCloseTo(220 + 440 * 0.25, 5);
    expect(evaluateErie(l, 0)).toBeCloseTo(220, 5);
    expect(evaluateErie(l, 1)).toBeCloseTo(660, 5);
  });

  it("has complete verbal rules for screen readers", () => {
    for (const spec of Object.values(ERIE_SPECS)) {
      expect(spec.legend.low.length).toBeGreaterThan(3);
      expect(spec.legend.high.length).toBeGreaterThan(3);
      expect(spec.legend.speechRule).toContain("means");
    }
  });

  it("resolves app layer ids to Erie specs", () => {
    expect(erieFor("thunder")?.id).toBe("storm");
    expect(erieFor("rain")).toBeNull();
  });
});

describe("Umwelt multisensory synchronization", () => {
  it("keeps reticle, audio frequency and caption in agreement", () => {
    const st = createUmweltSnapshot(60, -30, "North Atlantic Ocean", "ocean", 0.25, 1, "25 Mar 2007");
    expect(st.visualReticlePx.x).toBeCloseTo(((-30 + 180) / 360) * 1000, 1);
    expect(st.visualReticlePx.y).toBeCloseTo(((90 - 60) / 180) * 500, 1);
    expect(st.audioSynthParams.frequency).toBeCloseTo(330, 5);
    expect(st.ariaLiveCaption).toContain("Frame 1 (25 Mar 2007)");
    expect(st.ariaLiveCaption).toContain("North Atlantic Ocean");
    expect(st.ariaLiveCaption).toContain("Freezing polar sea");
  });

  it("omits the frame text when no frame is given", () => {
    const st = createUmweltSnapshot(0, 0, "Gulf of Guinea", "ocean", 0.9);
    expect(st.ariaLiveCaption).not.toContain("Frame");
  });
});

describe("DIXTRAL auditory probe", () => {
  it("generates correct instant probe readings", () => {
    const p = dixtralProbe(0, 0, "ocean", 0.9);
    expect(p.audioFrequencyHz).toBeCloseTo(616, 0);
    expect(p.spokenOutput).toContain("sea surface temp: Warm tropical ocean");
    expect(p.spokenOutput).toContain("0.0° North, 0.0° East");
  });

  it("uses latitude for the beacon on non-ocean layers", () => {
    expect(dixtralProbe(90, 0, "storm", 0.5).audioFrequencyHz).toBeCloseTo(880, 5);
  });
});

describe("A Universe of Sound evaluation", () => {
  const ok: EvaluationResponse = {
    enjoymentRating: 5,
    comprehension: "yes",
    scientificTrust: "high",
    visitorProfile: "blind",
  };
  it("accepts a valid response", () => expect(validateEvaluation(ok)).toBe(true));
  it("rejects an invalid visitor profile or rating", () => {
    expect(validateEvaluation({ ...ok, visitorProfile: "robot" as never })).toBe(false);
    expect(validateEvaluation({ ...ok, enjoymentRating: 6 as never })).toBe(false);
  });
});
