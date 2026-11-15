import { describe, expect, it } from "vitest";
import { simulate } from "@/lib/sans/simulate";
import { compareSchedules, fixedSchedule, MINUTES_PER_SCAN, planScans } from "@/lib/sans/planner";
import { eyeSummary } from "@/lib/sans/metrics";

const ds = simulate({ astronautId: "ASTRO001", scenario: "progressive", onsetRate: 1, noise: 1, uploads: [] });

describe("adaptive vs fixed scheduling", () => {
  it("compares both schedules with the same number of scans and crew minutes", () => {
    const c = compareSchedules(ds, 60);
    expect(c.fixed.scans).toBe(c.adaptive.scans);
    expect(c.fixed.minutes).toBe(c.adaptive.minutes);
    expect(c.adaptive.minutes).toBeLessThanOrEqual(60);
  });

  it("never schedules more crew time than the budget at 12 minutes per scan", () => {
    const recs = planScans(ds, 30);
    expect(MINUTES_PER_SCAN).toBe(12);
    expect(recs.length).toBeLessThanOrEqual(2);
  });

  it("fixed schedule alternates eyes, right eye first", () => {
    const f = fixedSchedule(ds, 3);
    expect(f.OD.length).toBe(2);
    expect(f.OS.length).toBe(1);
  });
});

describe("offline sync", () => {
  it("blackout scans are excluded until downlinked, then included", () => {
    const before = simulate({ astronautId: "ASTRO001", scenario: "blackout", onsetRate: 1, noise: 1, uploads: [] });
    const pending = before.scans.filter((s) => !s.synced);
    expect(pending.length).toBeGreaterThan(0);
    const after = simulate({ astronautId: "ASTRO001", scenario: "blackout", onsetRate: 1, noise: 1, uploads: [], downlinked: pending.map((s) => s.id) });
    expect(after.scans.filter((s) => !s.synced).length).toBe(0);
  });
});

describe("eye summary", () => {
  it("reports change from baseline as estimate minus pre-flight baseline", () => {
    const s = eyeSummary(ds, "OD");
    expect(s.delta).toBeCloseTo(s.estimate - ds.astronaut.baseline.OD, 6);
    expect(s.baseline).toBe(98.4);
  });
});
