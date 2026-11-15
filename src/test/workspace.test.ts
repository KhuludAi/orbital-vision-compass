import { describe, expect, it } from "vitest";
import { can, canAccess, lockedAstronaut, resolveSource, WORKSPACES } from "@/lib/sans/workspace";
import { acceptLive } from "@/lib/sans/api";
import { simulate } from "@/lib/sans/simulate";

describe("workspaces", () => {
  it("uses the demo IDs ASTRO001, OBS001 and VIEW001", () => {
    expect(WORKSPACES.astronaut.demoId).toBe("ASTRO001");
    expect(WORKSPACES.monitor.demoId).toBe("OBS001");
    expect(WORKSPACES.viewer.demoId).toBe("VIEW001");
  });

  it("astronauts only see their own profile", () => {
    expect(lockedAstronaut("astronaut")).toBe("ASTRO001");
    expect(lockedAstronaut("monitor")).toBeUndefined();
    expect(can("astronaut", "browseCrew")).toBe(false);
    expect(canAccess("astronaut", "/app/crew")).toBe(false);
  });

  it("mission monitors can browse every crew profile and manage scheduling", () => {
    expect(can("monitor", "browseCrew")).toBe(true);
    expect(can("monitor", "manageSchedule")).toBe(true);
    expect(canAccess("monitor", "/app/crew")).toBe(true);
  });

  it("viewers are read-only", () => {
    for (const a of ["ackAlert", "manageSchedule", "uploadScan", "syncData", "switchSource", "dailyCheckin"] as const) expect(can("viewer", a)).toBe(false);
  });

  it("viewers can open every main page", () => {
    for (const p of ["/app", "/app/me", "/app/monitoring", "/app/planner", "/app/alerts", "/app/demo/"]) expect(canAccess("viewer", p)).toBe(true);
  });
});

describe("data source", () => {
  it("falls back to demo when no verified live source exists", () => {
    expect(resolveSource("live", false)).toBe("demo");
    expect(resolveSource("live", true)).toBe("live");
    expect(resolveSource("demo", true)).toBe("demo");
  });

  it("rejects live data without verified provenance", () => {
    const ds = simulate({ astronautId: "ASTRO001", scenario: "nominal", onsetRate: 1, noise: 1, uploads: [] });
    expect(() => acceptLive({ ...ds, provenance: undefined })).toThrow();
    expect(() => acceptLive({ ...ds, provenance: { verified: false } })).toThrow();
    expect(acceptLive({ ...ds, source: "demo", provenance: { verified: true } }).source).toBe("live");
  });

  it("labels simulated data as demo", () => {
    expect(simulate({ astronautId: "ASTRO002", scenario: "nominal", onsetRate: 1, noise: 1, uploads: [] }).source).toBe("demo");
  });
});
