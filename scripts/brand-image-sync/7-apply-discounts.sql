-- Set selling_price to MRP minus 10-30%, which the project brief specifies
-- but which had never been applied: before this, selling_price = mrp on all
-- 920 variants, so every discount badge, the strikethrough MRP, the
-- 10%/20%/30% filter chips and the "discount" sort rendered nothing at all.
--
-- The percentage comes from md5(product_id), so it is deterministic and every
-- variant of one product carries the SAME discount; a 3L and a 5L of one
-- cooker showing 12% and 28% off would read as a pricing error.
--
-- No cost_price is populated anywhere in the catalogue, so there is no margin
-- floor to clear. To undo: UPDATE product_variants SET selling_price = mrp;
UPDATE public.product_variants v
SET selling_price = GREATEST(
      1,
      ROUND(v.mrp * (1 - (10 + (('x' || substr(md5(v.product_id::text), 1, 8))::bit(32)::bigint % 21)) / 100.0))
    )
WHERE v.mrp > 0;
