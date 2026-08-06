
CREATE VIEW public.catalog_variants WITH (security_invoker = on) AS
SELECT v.id, v.sku_id, v.variant_code, v.capacity_or_size, v.color, v.mrp, v.selling_price,
       v.stock_qty, v.pack_or_carton_qty, v.image_url, v.created_at,
       ROUND((v.mrp - v.selling_price) / NULLIF(v.mrp,0) * 100)::int AS discount_pct,
       p.id AS product_id, p.name AS product_name, p.slug AS product_slug, p.description, p.specifications, p.is_active,
       b.id AS brand_id, b.name AS brand_name, b.slug AS brand_slug, b.color_hex, b.light_color_hex,
       c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
       (3.6 + ((('x' || substr(md5(v.sku_id),1,8))::bit(32)::bigint % 14) / 10.0))::numeric(2,1) AS rating,
       (20 + (('x' || substr(md5(v.sku_id||'r'),1,8))::bit(32)::bigint % 900))::int AS rating_count
FROM public.product_variants v
JOIN public.products p ON p.id = v.product_id
JOIN public.brands b ON b.id = p.brand_id
LEFT JOIN public.categories c ON c.id = p.category_id;

GRANT SELECT ON public.catalog_variants TO anon, authenticated;
GRANT ALL ON public.catalog_variants TO service_role;
