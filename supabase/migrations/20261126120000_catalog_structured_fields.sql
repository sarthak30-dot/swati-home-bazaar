-- Structured catalogue fields: a real inventory status + dispatch note
-- (replacing the literal "100 available" every variant showed because
-- stock_qty was bulk-seeded to 100), plus description highlights authored
-- alongside the existing prose summary, and a normalized capacity/pack-size
-- pair for display.
--
-- capacity, pack_size, inventory_status and dispatch_note are computed in
-- the view rather than stored columns: they are simple functions of
-- capacity_or_size, pack_or_carton_qty and stock_qty, and a stored copy would
-- drift out of sync the next time an admin edits one of those (VariantFormDialog,
-- CSV import) with nothing to recompute it. description_highlights is genuine
-- authored content, so it is a real column on products, alongside description.

ALTER TABLE products
  ADD COLUMN description_highlights jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN products.description_highlights IS 'Spec-driven bullet points shown alongside products.description (the summary).';

DROP VIEW public.catalog_variants;

CREATE VIEW public.catalog_variants WITH (security_invoker = on) AS
SELECT v.id, v.sku_id, v.variant_code, v.capacity_or_size, v.color, v.mrp, v.selling_price,
       v.stock_qty, v.pack_or_carton_qty, v.image_url, v.created_at,
       ROUND((v.mrp - v.selling_price) / NULLIF(v.mrp,0) * 100)::int AS discount_pct,
       p.id AS product_id, p.name AS product_name, p.slug AS product_slug, p.description, p.specifications, p.is_active,
       b.id AS brand_id, b.name AS brand_name, b.slug AS brand_slug, b.color_hex, b.light_color_hex,
       c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
       (3.6 + ((('x' || substr(md5(v.sku_id),1,8))::bit(32)::bigint % 14) / 10.0))::numeric(2,1) AS rating,
       (20 + (('x' || substr(md5(v.sku_id||'r'),1,8))::bit(32)::bigint % 900))::int AS rating_count,
       v.capacity_or_size AS capacity,
       CASE
         WHEN v.pack_or_carton_qty IS NULL OR v.pack_or_carton_qty <= 1 THEN 'Single unit'
         WHEN v.pack_or_carton_qty < 12 THEN 'Pack of ' || v.pack_or_carton_qty
         ELSE 'Carton of ' || v.pack_or_carton_qty
       END AS pack_size,
       CASE
         WHEN v.stock_qty <= 0 THEN 'out_of_stock'
         WHEN v.stock_qty < 10 THEN 'low_stock'
         ELSE 'in_stock'
       END AS inventory_status,
       CASE
         WHEN v.stock_qty <= 0 THEN 'Currently unavailable for dispatch.'
         WHEN v.stock_qty < 10 THEN 'Only a few left — ships in 1-2 business days.'
         ELSE 'Ships in 1-2 business days.'
       END AS dispatch_note,
       p.description_highlights
FROM public.product_variants v
JOIN public.products p ON p.id = v.product_id
JOIN public.brands b ON b.id = p.brand_id
LEFT JOIN public.categories c ON c.id = p.category_id;

GRANT SELECT ON public.catalog_variants TO anon, authenticated;
GRANT ALL ON public.catalog_variants TO service_role;
