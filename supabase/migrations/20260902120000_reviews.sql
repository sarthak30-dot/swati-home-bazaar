-- Real customer reviews, replacing the fabricated per-SKU rating/rating_count
-- that catalog_variants previously computed via md5(sku_id) (see
-- 20260806175903_...sql). A review can only be left by a customer who
-- actually received the product being reviewed — enforced in the INSERT
-- policy below, not just in the UI, since RLS is the real boundary. Reviews
-- are per-product (not per-variant): a shopper reviews "the 1L bottle", not
-- "the blue 1L bottle", and every size/colour of a product shares one
-- rating, same as Myntra/Meesho.

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_item_id uuid NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text CHECK (title IS NULL OR length(title) <= 120),
  body text CHECK (body IS NULL OR length(body) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- One review per customer per product, regardless of which order or which
  -- variant/size they bought. Editing an existing review is an UPDATE, not a
  -- second row.
  UNIQUE (customer_id, product_id)
);

GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER reviews_updated BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX reviews_product_id_idx ON public.reviews (product_id);
CREATE INDEX reviews_customer_id_idx ON public.reviews (customer_id);

-- Reviews are storefront content: anyone can read them, same as products.
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT USING (true);

-- The purchase-verification core of this feature: a customer may only insert
-- a review for a product they have an order_item for, on an order that has
-- actually reached 'delivered'. Without the delivered check this reduces to
-- "did you ever add it to an order", which costs an attacker nothing — they
-- could place and immediately cancel an order purely to unlock a review.
CREATE POLICY "reviews verified purchase insert" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    reviews.customer_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.order_items oi
      JOIN public.product_variants pv ON pv.id = oi.product_variant_id
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.id = reviews.order_item_id
        AND pv.product_id = reviews.product_id
        AND o.customer_id = auth.uid()
        AND o.status = 'delivered'
    )
  );

-- Editing your own review's rating/title/body doesn't need to re-prove the
-- purchase — that was already established when the row was inserted.
CREATE POLICY "reviews owner update" ON public.reviews
  FOR UPDATE TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "reviews owner delete" ON public.reviews
  FOR DELETE TO authenticated
  USING (customer_id = auth.uid());

-- Admin moderation: take down a review without needing the author's account.
CREATE POLICY "reviews admin delete" ON public.reviews
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- --- catalog_variants: swap the fabricated rating for a real aggregate -----
-- CREATE OR REPLACE VIEW cannot change an existing column's type (numeric(2,1)
-- NOT NULL -> nullable numeric), so this drops and recreates rather than
-- replacing in place. Grants do not survive a drop and must be reissued.
DROP VIEW IF EXISTS public.catalog_variants;

CREATE VIEW public.catalog_variants WITH (security_invoker = on) AS
SELECT v.id, v.sku_id, v.variant_code, v.capacity_or_size, v.color, v.mrp, v.selling_price,
       v.stock_qty, v.pack_or_carton_qty, v.image_url, v.created_at,
       ROUND((v.mrp - v.selling_price) / NULLIF(v.mrp,0) * 100)::int AS discount_pct,
       p.id AS product_id, p.name AS product_name, p.slug AS product_slug, p.description, p.specifications, p.is_active,
       b.id AS brand_id, b.name AS brand_name, b.slug AS brand_slug, b.color_hex, b.light_color_hex,
       c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
       -- NULL (not 0, not a fabricated number) when the product has no
       -- reviews yet — the UI must treat "no rating" as its own state.
       r.avg_rating::numeric(2,1) AS rating,
       COALESCE(r.review_count, 0)::int AS rating_count
FROM public.product_variants v
JOIN public.products p ON p.id = v.product_id
JOIN public.brands b ON b.id = p.brand_id
LEFT JOIN public.categories c ON c.id = p.category_id
LEFT JOIN (
  SELECT product_id, ROUND(AVG(rating)::numeric, 1) AS avg_rating, COUNT(*) AS review_count
  FROM public.reviews
  GROUP BY product_id
) r ON r.product_id = p.id;

GRANT SELECT ON public.catalog_variants TO anon, authenticated;
GRANT ALL ON public.catalog_variants TO service_role;
