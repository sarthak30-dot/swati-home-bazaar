/**
 * Run with: npm run test
 *
 * The bulk price tool rewrites hundreds of selling prices in one click with no
 * undo, so the arithmetic is pinned here.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { nextSellingPrice, parseCount, parseMoney } from "./pricing.ts";

test("a percentage off MRP", () => {
  // Deluxe Pressure Cooker 3L, MRP 1795.
  assert.deepEqual(nextSellingPrice({ mrp: 1795, selling_price: 1600 }, "discount_off_mrp", 20), {
    price: 1436,
    clamped: false,
  });
});

test("numeric columns arriving as strings are coerced, not concatenated", () => {
  // PostgREST returns Postgres `numeric` as a JSON string.
  assert.deepEqual(
    nextSellingPrice({ mrp: "1795", selling_price: "1600" }, "discount_off_mrp", 20),
    { price: 1436, clamped: false },
  );
});

test("0% off MRP sells at MRP and is not reported as clamped", () => {
  assert.deepEqual(nextSellingPrice({ mrp: 500, selling_price: 400 }, "discount_off_mrp", 0), {
    price: 500,
    clamped: false,
  });
});

test("a rise past MRP is capped at MRP and reported", () => {
  assert.deepEqual(nextSellingPrice({ mrp: 1000, selling_price: 900 }, "adjust_current", 50), {
    price: 1000,
    clamped: true,
  });
});

test("a rise that stays under MRP is left alone", () => {
  assert.deepEqual(nextSellingPrice({ mrp: 1000, selling_price: 900 }, "adjust_current", 5), {
    price: 945,
    clamped: false,
  });
});

test("a negative percentage cuts the current price", () => {
  assert.deepEqual(nextSellingPrice({ mrp: 1000, selling_price: 900 }, "adjust_current", -10), {
    price: 810,
    clamped: false,
  });
});

test("nothing is ever priced at zero", () => {
  assert.deepEqual(nextSellingPrice({ mrp: 1000, selling_price: 900 }, "discount_off_mrp", 100), {
    price: 1,
    clamped: false,
  });
});

test("prices round to whole rupees", () => {
  // 295 * 0.85 = 250.75
  assert.deepEqual(nextSellingPrice({ mrp: 295, selling_price: 295 }, "discount_off_mrp", 15), {
    price: 251,
    clamped: false,
  });
});

test("a fractional MRP is compared against its rounded self", () => {
  assert.deepEqual(
    nextSellingPrice({ mrp: "1795.50", selling_price: "1795.50" }, "adjust_current", 0),
    { price: 1796, clamped: false },
  );
});

test('"Rs." does not turn a price into paise', () => {
  // Regression: stripping all non-[0-9.-] left ".1749", so "Rs. 1,749"
  // imported as 0.17 — found by importing a real catalogue row.
  assert.equal(parseMoney("Rs. 1,749"), 1749);
  assert.equal(parseMoney("Rs.1,749"), 1749);
  assert.equal(parseMoney("Rs 1749"), 1749);
});

test("money cells in the shapes Indian catalogues use", () => {
  assert.equal(parseMoney("1749"), 1749);
  assert.equal(parseMoney("1,234.50"), 1234.5);
  assert.equal(parseMoney("Rs. 1,234.50"), 1234.5);
  assert.equal(parseMoney("\u20b91234"), 1234);
  assert.equal(parseMoney("  2,095  "), 2095);
  assert.equal(parseMoney("0.5"), 0.5);
  assert.equal(parseMoney("-50"), -50);
});

test("a blank or non-numeric cell is null, not zero", () => {
  // null means "leave this column alone"; 0 would wipe a real price.
  assert.equal(parseMoney(""), null);
  assert.equal(parseMoney("   "), null);
  assert.equal(parseMoney("N/A"), null);
  assert.equal(parseMoney("Rs."), null);
  assert.equal(parseMoney("-"), null);
});

test("quantity cells round to whole units", () => {
  assert.equal(parseCount("40"), 40);
  assert.equal(parseCount("1,200"), 1200);
  assert.equal(parseCount("6.4"), 6);
  assert.equal(parseCount("6.6"), 7);
  assert.equal(parseCount(""), null);
});
