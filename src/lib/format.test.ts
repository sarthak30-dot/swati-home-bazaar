/**
 * Run with: npm run test
 *
 * These two helpers encode judgements about messy supplier data, so the
 * reasoning is pinned here rather than left in a reviewer's head.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { formatCapacity, isRetailPack, MAX_RETAIL_PACK_QTY } from "./format.ts";

test("bare Yera and Dubblin capacities are millilitres", () => {
  // 241 of 250 Yera and 91 of 105 Dubblin rows store a bare number; both are
  // liquid-capacity ranges, so "350" on a card means 350ml.
  assert.equal(formatCapacity("350", "yera"), "350 ml");
  assert.equal(formatCapacity("1000", "dubblin"), "1000 ml");
  assert.equal(formatCapacity("2.5", "yera"), "2.5 ml");
});

test("Pigeon sizes are never relabelled", () => {
  // Pigeon stores zero bare numbers — always a unit or null — so a cookware
  // "280" (millimetres) must never be rendered as 280ml.
  assert.equal(formatCapacity("280", "pigeon"), "280");
  assert.equal(formatCapacity("5L", "pigeon"), "5L");
  assert.equal(formatCapacity("260mm", "pigeon"), "260mm");
  assert.equal(formatCapacity("1800W", "pigeon"), "1800W");
});

test("a value that already carries a unit is left alone", () => {
  assert.equal(formatCapacity("750ml", "yera"), "750ml");
  assert.equal(formatCapacity("Mixed", "yera"), "Mixed");
  assert.equal(formatCapacity("7pc", "yera"), "7pc");
});

test("empty capacities return null so the caller can fall back", () => {
  assert.equal(formatCapacity(null, "yera"), null);
  assert.equal(formatCapacity(undefined, "yera"), null);
  assert.equal(formatCapacity("", "yera"), null);
  assert.equal(formatCapacity("   ", "yera"), null);
});

test("an unknown or missing brand is passed through unchanged", () => {
  assert.equal(formatCapacity("350", null), "350");
  assert.equal(formatCapacity("350", undefined), "350");
  assert.equal(formatCapacity("350", "someone-else"), "350");
});

test("only a plausible retail pack is shown to shoppers", () => {
  // The column also holds wholesale carton quantities, up to 160. "Pack of
  // 124" against a Rs. 125 bowl reads as 124 bowls for Rs. 125.
  assert.equal(isRetailPack(6), true);
  assert.equal(isRetailPack(MAX_RETAIL_PACK_QTY), true);
  assert.equal(isRetailPack(MAX_RETAIL_PACK_QTY + 1), false);
  assert.equal(isRetailPack(124), false);
  assert.equal(isRetailPack(160), false);
});

test("a pack of one, or none, is not worth a line of its own", () => {
  assert.equal(isRetailPack(1), false);
  assert.equal(isRetailPack(0), false);
  assert.equal(isRetailPack(null), false);
  assert.equal(isRetailPack(undefined), false);
});
