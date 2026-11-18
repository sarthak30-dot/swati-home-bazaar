// Runs every migration in order against an in-memory Postgres (PGlite) and
// exercises the money paths: server-side pricing, stock, coupons, cancellation
// and the post-lock permissions.
//
//   npm i --no-save @electric-sql/pglite && node supabase/tests/order-integrity.test.mjs
//
// Supabase-specific pieces (auth schema, roles, storage.objects) are stubbed.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import assert from "node:assert/strict";

const dir = join(dirname(fileURLToPath(import.meta.url)), "../migrations");
const db = new PGlite();

await db.exec(`
create role anon; create role authenticated; create role service_role;
create schema auth; create schema storage;
create table auth.users(id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
create table storage.objects(id uuid, bucket_id text, name text);
alter table storage.objects enable row level security;
`);
for (const f of readdirSync(dir).sort()) await db.exec(readFileSync(join(dir, f), "utf8"));

const U1 = "11111111-1111-1111-1111-111111111111";
const U2 = "22222222-2222-2222-2222-222222222222";
const V1 = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const V2 = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
await db.exec(`
insert into auth.users(id,email) values ('${U1}','a@x.com'),('${U2}','b@x.com');
insert into public.products(id,brand_id,name,slug) select '99999999-9999-9999-9999-999999999999', id,'Test Cooker','test-cooker' from public.brands where slug='pigeon';
insert into public.product_variants(id,product_id,mrp,selling_price,stock_qty,sku_id) values
 ('${V1}','99999999-9999-9999-9999-999999999999',1000,800,5,'S1'),
 ('${V2}','99999999-9999-9999-9999-999999999999',200,200,1,'S2');
insert into public.coupons(code,type,value,min_order_value,usage_limit) values ('SAVE10','percent',10,500,1),('FLAT50','flat',50,0,null);
`);
const as = (u) => db.exec(`select set_config('request.jwt.claim.sub','${u}',false)`);
const addr = `'{"full_name":"Test User","phone":"9876543210","line1":"12 Main Road","city":"Delhi","state":"Delhi","pincode":"110006"}'::jsonb`;
const items = (...l) => `'${JSON.stringify(l.map(([v, q]) => ({ variant_id: v, qty: q })))}'::jsonb`;
const place = (u, its, coupon = "null") => `select * from place_order(${its}, ${addr}, 'cod', ${coupon})`;
const rejects = async (sql, re, label) => {
  await assert.rejects(() => db.query(sql), re, label);
};
const stock = async () => Object.fromEntries((await db.query("select sku_id, stock_qty from product_variants")).rows.map((r) => [r.sku_id, r.stock_qty]));

await as(U1);
const o1 = (await db.query(place(U1, items([V1, 2]), "'SAVE10'"))).rows[0];
assert.equal(Number(o1.total), 1440, "2x800 - 10% coupon, free shipping");
assert.deepEqual(await stock(), { S1: 3, S2: 1 }, "stock decremented");
const row = (await db.query("select subtotal,discount_amount,shipping_fee from orders")).rows[0];
assert.deepEqual([Number(row.subtotal), Number(row.discount_amount), Number(row.shipping_fee)], [1600, 160, 0]);

await as(U2);
await rejects(place(U2, items([V1, 1]), "'SAVE10'"), /fully redeemed/, "single-use coupon cannot be reused");
await rejects(place(U2, items([V1, 9])), /Only 3 left/, "oversell blocked");
await rejects(place(U2, items([V2, 1], [V2, 1])), /Only 1 left/, "duplicate lines are summed before the stock check");
await rejects(place(U2, items([V1, -1])), /Invalid cart/, "negative qty rejected");
await rejects(`select * from place_order(${items([V1, 1])}, '{"full_name":"x","phone":"1","line1":"a","city":"d","state":"d","pincode":"560001"}'::jsonb, 'cod')`, /Check your delivery address/, "bad address rejected");
await rejects(`select * from place_order(${items([V1, 1])}, '{"full_name":"Test User","phone":"9876543210","line1":"12 Main Road","city":"Mumbai","state":"MH","pincode":"400001"}'::jsonb, 'cod')`, /retail-deliver/, "non-serviceable PIN rejected");
const o2 = (await db.query(place(U2, items([V2, 1]), "'FLAT50'"))).rows[0];
assert.equal(Number(o2.total), 229, "200 + 79 shipping - 50 coupon");
await rejects("select * from validate_coupon('FLAT50', 300)", /already used/, "per-customer coupon limit");

await as(U1);
await db.query(`select cancel_order('${o1.order_number}')`);
assert.deepEqual(await stock(), { S1: 5, S2: 0 }, "cancel returns stock");
assert.equal((await db.query("select times_used from coupons where code='SAVE10'")).rows[0].times_used, 0, "cancel releases coupon");
await rejects(`select cancel_order('${o1.order_number}')`, /can no longer be cancelled/, "double cancel");
const hist = (await db.query("select to_status from order_status_history where order_id = $1 order by created_at", [o1.order_id])).rows.map((r) => r.to_status);
assert.deepEqual(hist, ["placed", "cancelled"], "status history recorded");

// After 20261118120000_lock_client_order_writes.sql
await db.exec("set role authenticated");
await rejects(`insert into orders(customer_id,payment_method,subtotal,total) values ('${U1}','cod',1,1)`, /permission denied/, "browser can no longer insert orders");
await db.exec("reset role; set role anon");
await rejects("select * from coupons", /permission denied/, "coupons are no longer public");

console.log("order-integrity: all checks passed");
