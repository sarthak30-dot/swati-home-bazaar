/**
 * Run with: npm run test
 *
 * The bulk price tool rewrites hundreds of selling prices in one click with no
 * undo, so the arithmetic is pinned here.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { nextSellingPrice } from "./pricing.ts";

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
