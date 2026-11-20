/**
 * Run with: npm run test
 *
 * These boundaries decide which orders count toward a reported revenue
 * figure, so they are pinned rather than eyeballed. The suite assumes
 * TZ=Asia/Kolkata (set by the npm script): the whole point is that a range is
 * resolved in the admin's local zone, not UTC.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { resolveRange } from "./date-range.ts";

const at = (iso: string) => new Date(iso);

test("all time has no bounds", () => {
  assert.deepEqual(resolveRange("all"), { fromISO: null, toISO: null });
});

test("custom dates anchor to local midnight, not UTC", () => {
  // IST is UTC+5:30, so a local day starts at 18:30 UTC the day before.
  assert.equal(
    resolveRange("custom", { from: "2026-11-20", to: "" }).fromISO,
    "2026-11-19T18:30:00.000Z",
  );
});

test("the to-bound is inclusive of the whole local day", () => {
  assert.equal(
    resolveRange("custom", { from: "", to: "2026-11-20" }).toISO,
    "2026-11-20T18:29:59.999Z",
  );
});

test("blank or malformed custom dates are unbounded, never Invalid Date", () => {
  assert.deepEqual(resolveRange("custom", { from: "", to: "" }), {
    fromISO: null,
    toISO: null,
  });
  assert.equal(resolveRange("custom", { from: "not-a-date", to: "" }).fromISO, null);
});

test("financial year starts 1 April in the admin's zone", () => {
  // November 2026 -> FY began 1 Apr 2026.
  assert.equal(
    resolveRange("fy", undefined, at("2026-11-20T10:00:00+05:30")).fromISO,
    "2026-03-31T18:30:00.000Z",
  );
  // February 2026 -> still the FY that began 1 Apr 2025.
  assert.equal(
    resolveRange("fy", undefined, at("2026-02-10T10:00:00+05:30")).fromISO,
    "2025-03-31T18:30:00.000Z",
  );
});

test("financial year flips on 1 April, not 31 March", () => {
  assert.equal(
    resolveRange("fy", undefined, at("2026-03-31T09:00:00+05:30")).fromISO,
    "2025-03-31T18:30:00.000Z",
  );
  assert.equal(
    resolveRange("fy", undefined, at("2026-04-01T09:00:00+05:30")).fromISO,
    "2026-03-31T18:30:00.000Z",
  );
});

test("day presets include today, so 7d spans 7 local days", () => {
  const now = at("2026-11-20T10:00:00+05:30");
  assert.equal(resolveRange("7d", undefined, now).fromISO, "2026-11-13T18:30:00.000Z");
  assert.equal(resolveRange("30d", undefined, now).fromISO, "2026-10-21T18:30:00.000Z");
  assert.equal(resolveRange("90d", undefined, now).fromISO, "2026-08-22T18:30:00.000Z");
});

test("presets leave the upper bound open", () => {
  assert.equal(resolveRange("30d", undefined, at("2026-11-20T10:00:00+05:30")).toISO, null);
});
