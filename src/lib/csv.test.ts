/**
 * Run with: npm run test
 *
 * The admin importer used to split on "," and "\n", which silently shifted
 * every column after a quoted comma — writing the wrong price against the
 * wrong SKU. Each case below is a shape real spreadsheet exports produce.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { parseCsv, readTable } from "./csv.ts";

test("a quoted field may contain a comma", () => {
  assert.deepEqual(parseCsv('product_name,mrp\n"Inox Cooker 5L, Outer Lid",3245'), [
    ["product_name", "mrp"],
    ["Inox Cooker 5L, Outer Lid", "3245"],
  ]);
});

test('"" inside a quoted field is a literal quote', () => {
  assert.deepEqual(parseCsv('a,b\n"He said ""hi""",2'), [
    ["a", "b"],
    ['He said "hi"', "2"],
  ]);
});

test("a quote mid-field stays literal (inches)", () => {
  assert.deepEqual(parseCsv('name\n12" pan'), [["name"], ['12" pan']]);
});

test("CRLF line endings", () => {
  assert.deepEqual(parseCsv("a,b\r\n1,2\r\n"), [
    ["a", "b"],
    ["1", "2"],
  ]);
});

test("a UTF-8 BOM is stripped", () => {
  assert.deepEqual(parseCsv("﻿brand,mrp\nPigeon,100"), [
    ["brand", "mrp"],
    ["Pigeon", "100"],
  ]);
});

test("a quoted field may contain a newline", () => {
  assert.deepEqual(parseCsv('a,b\n"line1\nline2",x'), [
    ["a", "b"],
    ["line1\nline2", "x"],
  ]);
});

test("blank lines are dropped but empty cells are kept", () => {
  assert.deepEqual(parseCsv("a,b\n1,2\n\n\n3,\n"), [
    ["a", "b"],
    ["1", "2"],
    ["3", ""],
  ]);
});

test("readTable normalises headers and tolerates missing columns", () => {
  const t = readTable('Brand,Product_Name,MRP\nPigeon,"Kadai, 240mm",1749');
  assert.deepEqual(t.header, ["brand", "product_name", "mrp"]);
  const row = t.rows[0];
  assert.ok(row);
  assert.equal(t.cell(row, "product_name"), "Kadai, 240mm");
  assert.equal(t.cell(row, "cost_price"), "");
  assert.equal(t.index("nope"), -1);
});

test("a row shorter than the header does not throw", () => {
  assert.equal(readTable("a,b,c\n1,2").cell(["1", "2"], "c"), "");
});
