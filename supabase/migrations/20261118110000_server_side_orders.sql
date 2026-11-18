-- Server-side order placement, coupon validation, stock control and order
-- history.  ADDITIVE: nothing here removes an existing capability, so it can be
-- applied before the new storefront is deployed.  The companion migration
-- 20261118120000_lock_client_order_writes.sql removes the old browser-side
-- write path and MUST be applied only after the new checkout is live.
--
-- Why: the browser used to compute subtotal / discount / shipping / total and
-- insert them into `orders` directly, so any customer could set their own
-- prices, reuse single-use coupons, and oversell stock.  Now the browser sends
-- only (variant, qty) pairs + an address; every price, discount and stock
-- decision is made here, in one transaction.

-- ---------------------------------------------------------------------------
-- Coupon redemptions (per-customer limits) and order status history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id   uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  order_id    uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, customer_id)          -- one redemption per customer per coupon
);
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.coupon_redemptions TO authenticated;
GRANT ALL ON public.coupon_redemptions TO service_role;
CREATE POLICY "own redemptions read" ON public.coupon_redemptions
  FOR SELECT TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "admin redemptions read" ON public.coupon_redemptions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status public.order_status,
  to_status   public.order_status NOT NULL,
  changed_by  uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_status_history_order_idx ON public.order_status_history (order_id, created_at);
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.order_status_history TO authenticated;
GRANT ALL ON public.order_status_history TO service_role;
CREATE POLICY "own order history read" ON public.order_status_history
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid()));
CREATE POLICY "admin order history read" ON public.order_status_history
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Status changes: write an audit row, and return stock when an order is cancelled.
CREATE OR REPLACE FUNCTION public.orders_status_side_effects()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by)
    VALUES (NEW.id, NULL, NEW.status, auth.uid());
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());

    -- Goods that never shipped go back on the shelf (and the coupon is released).
    IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
      UPDATE public.product_variants v
         SET stock_qty = v.stock_qty + oi.qty
        FROM public.order_items oi
       WHERE oi.order_id = NEW.id AND oi.product_variant_id = v.id;

      UPDATE public.coupons c
         SET times_used = GREATEST(0, c.times_used - 1)
        FROM public.coupon_redemptions r
       WHERE r.order_id = NEW.id AND r.coupon_id = c.id;
      DELETE FROM public.coupon_redemptions WHERE order_id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS orders_status_side_effects ON public.orders;
CREATE TRIGGER orders_status_side_effects
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.orders_status_side_effects();
REVOKE ALL ON FUNCTION public.orders_status_side_effects() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Shared pricing helpers
-- ---------------------------------------------------------------------------
-- Keep in step with FREE_DELIVERY_THRESHOLD / SHIPPING_FEE in src/lib/format.ts.
CREATE OR REPLACE FUNCTION public.shipping_for(p_subtotal numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN p_subtotal >= 999 OR p_subtotal = 0 THEN 0 ELSE 79 END::numeric
$$;

-- Discount a coupon gives on a subtotal for a given customer, or raises a
-- readable error (message is the customer-facing reason).
CREATE OR REPLACE FUNCTION public._coupon_discount(
  p_code text, p_subtotal numeric, p_customer uuid, p_lock boolean DEFAULT false
) RETURNS TABLE (coupon_id uuid, code text, discount numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.coupons%ROWTYPE;
  d numeric;
BEGIN
  IF p_lock THEN
    SELECT * INTO c FROM public.coupons WHERE upper(coupons.code) = upper(trim(p_code)) FOR UPDATE;
  ELSE
    SELECT * INTO c FROM public.coupons WHERE upper(coupons.code) = upper(trim(p_code));
  END IF;

  IF NOT FOUND OR NOT c.is_active THEN RAISE EXCEPTION 'Coupon not found'; END IF;
  IF c.valid_from > now() THEN RAISE EXCEPTION 'This coupon is not active yet'; END IF;
  IF c.valid_to IS NOT NULL AND c.valid_to < now() THEN RAISE EXCEPTION 'This coupon has expired'; END IF;
  IF c.usage_limit IS NOT NULL AND c.times_used >= c.usage_limit THEN
    RAISE EXCEPTION 'This coupon has been fully redeemed';
  END IF;
  IF p_subtotal < c.min_order_value THEN
    RAISE EXCEPTION 'Valid on orders above Rs. %', round(c.min_order_value);
  END IF;
  IF p_customer IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.coupon_redemptions r WHERE r.coupon_id = c.id AND r.customer_id = p_customer
  ) THEN
    RAISE EXCEPTION 'You have already used this coupon';
  END IF;

  d := CASE c.type WHEN 'percent' THEN round(p_subtotal * c.value / 100) ELSE c.value END;
  RETURN QUERY SELECT c.id, c.code, least(d, p_subtotal);
END; $$;
REVOKE ALL ON FUNCTION public._coupon_discount(text, numeric, uuid, boolean) FROM PUBLIC, anon, authenticated;

-- Customer-facing coupon check: returns the discount for the one code typed,
-- never the coupon table.  This replaces the public SELECT on `coupons`.
CREATE OR REPLACE FUNCTION public.validate_coupon(p_code text, p_subtotal numeric)
RETURNS TABLE (code text, discount numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to apply a coupon'; END IF;
  RETURN QUERY SELECT cd.code, cd.discount FROM public._coupon_discount(p_code, p_subtotal, auth.uid(), false) cd;
END; $$;
REVOKE ALL ON FUNCTION public.validate_coupon(text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO authenticated;

-- ---------------------------------------------------------------------------
-- place_order: the only way an order should come into existence.
--   p_items   [{"variant_id": "<uuid>", "qty": 2}, ...]
--   p_address {"full_name","phone","line1","line2","city","state","pincode"}
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.place_order(
  p_items jsonb,
  p_address jsonb,
  p_payment_method text DEFAULT 'cod',
  p_coupon_code text DEFAULT NULL,
  p_address_id uuid DEFAULT NULL
) RETURNS TABLE (order_id uuid, order_number text, total numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user      uuid := auth.uid();
  v_subtotal  numeric := 0;
  v_discount  numeric := 0;
  v_shipping  numeric;
  v_total     numeric;
  v_coupon_id uuid;
  v_coupon    text;
  v_pin       text;
  v_addr_id   uuid;
  v_order     public.orders%ROWTYPE;
  r           record;
  tries       int := 0;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Sign in to place an order'; END IF;
  IF p_payment_method NOT IN ('cod') THEN RAISE EXCEPTION 'Unsupported payment method'; END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Your cart is empty';
  END IF;
  IF jsonb_array_length(p_items) > 100 THEN RAISE EXCEPTION 'Too many items in one order'; END IF;

  -- Address: validate server-side; never trust the form.
  IF p_address IS NULL OR jsonb_typeof(p_address) <> 'object' THEN RAISE EXCEPTION 'Add a delivery address'; END IF;
  IF length(trim(coalesce(p_address->>'full_name', ''))) NOT BETWEEN 2 AND 100
     OR coalesce(p_address->>'phone', '') !~ '^[6-9][0-9]{9}$'
     OR length(trim(coalesce(p_address->>'line1', ''))) NOT BETWEEN 5 AND 200
     OR length(trim(coalesce(p_address->>'city', ''))) NOT BETWEEN 2 AND 80
     OR length(trim(coalesce(p_address->>'state', ''))) NOT BETWEEN 2 AND 80
     OR coalesce(p_address->>'pincode', '') !~ '^[1-9][0-9]{5}$' THEN
    RAISE EXCEPTION 'Check your delivery address';
  END IF;
  v_pin := p_address->>'pincode';

  -- Retail delivery is limited to the serviceable PIN list.
  IF EXISTS (SELECT 1 FROM public.serviceable_pins)
     AND NOT EXISTS (SELECT 1 FROM public.serviceable_pins WHERE pin = v_pin) THEN
    RAISE EXCEPTION 'We do not retail-deliver to PIN % yet. Please send a bulk enquiry.', v_pin;
  END IF;

  IF p_address_id IS NOT NULL THEN
    SELECT id INTO v_addr_id FROM public.addresses WHERE id = p_address_id AND customer_id = v_user;
  END IF;

  -- Validate every line before touching anything: a malformed cart is rejected
  -- outright rather than having bad lines silently dropped.
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_items) e
     WHERE coalesce(e->>'variant_id', '') !~ '^[0-9a-fA-F-]{36}$'
        OR coalesce(e->>'qty', '') !~ '^[0-9]{1,3}$'
        OR (e->>'qty')::int NOT BETWEEN 1 AND 50
  ) THEN
    RAISE EXCEPTION 'Invalid cart';
  END IF;

  -- Collapse duplicate lines.
  DROP TABLE IF EXISTS _po_lines;
  CREATE TEMP TABLE _po_lines ON COMMIT DROP AS
  SELECT (e->>'variant_id')::uuid AS variant_id, sum((e->>'qty')::int)::int AS qty
    FROM jsonb_array_elements(p_items) e
   GROUP BY 1;

  IF EXISTS (SELECT 1 FROM _po_lines WHERE qty > 50) THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;

  FOR r IN
    SELECT l.variant_id, l.qty, v.sku_id, v.selling_price, v.stock_qty, p.name AS product_name,
           p.is_active, b.name AS brand_name
      FROM _po_lines l
      JOIN public.product_variants v ON v.id = l.variant_id
      JOIN public.products p ON p.id = v.product_id
      JOIN public.brands b ON b.id = p.brand_id
     ORDER BY v.id
       FOR UPDATE OF v
  LOOP
    IF NOT r.is_active THEN RAISE EXCEPTION '% is no longer available', r.product_name; END IF;
    IF r.stock_qty < r.qty THEN
      RAISE EXCEPTION 'Only % left of %', r.stock_qty, r.product_name;
    END IF;
    v_subtotal := v_subtotal + r.selling_price * r.qty;
  END LOOP;

  IF (SELECT count(*) FROM _po_lines l JOIN public.product_variants v ON v.id = l.variant_id) <> (SELECT count(*) FROM _po_lines) THEN
    RAISE EXCEPTION 'An item in your cart is no longer available';
  END IF;

  IF p_coupon_code IS NOT NULL AND length(trim(p_coupon_code)) > 0 THEN
    SELECT cd.coupon_id, cd.code, cd.discount INTO v_coupon_id, v_coupon, v_discount
      FROM public._coupon_discount(p_coupon_code, v_subtotal, v_user, true) cd;
  END IF;

  v_shipping := public.shipping_for(v_subtotal);
  v_total := greatest(0, v_subtotal - v_discount) + v_shipping;

  -- order_number has a random default; retry on the (rare) collision.
  LOOP
    BEGIN
      INSERT INTO public.orders (customer_id, status, payment_status, payment_method, subtotal,
                                 shipping_fee, discount_amount, total, coupon_code,
                                 shipping_address_id, shipping_address)
      VALUES (v_user, 'placed', 'pending', p_payment_method, v_subtotal, v_shipping, v_discount,
              v_total, v_coupon, v_addr_id,
              jsonb_build_object(
                'full_name', trim(p_address->>'full_name'), 'phone', p_address->>'phone',
                'line1', trim(p_address->>'line1'), 'line2', nullif(trim(coalesce(p_address->>'line2', '')), ''),
                'city', trim(p_address->>'city'), 'state', trim(p_address->>'state'), 'pincode', v_pin))
      RETURNING * INTO v_order;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      tries := tries + 1;
      IF tries > 5 THEN RAISE; END IF;
    END;
  END LOOP;

  INSERT INTO public.order_items (order_id, product_variant_id, product_name, sku_id, brand_name, qty, unit_price, line_total)
  SELECT v_order.id, l.variant_id, p.name, v.sku_id, b.name, l.qty, v.selling_price, v.selling_price * l.qty
    FROM _po_lines l
    JOIN public.product_variants v ON v.id = l.variant_id
    JOIN public.products p ON p.id = v.product_id
    JOIN public.brands b ON b.id = p.brand_id;

  UPDATE public.product_variants v SET stock_qty = v.stock_qty - l.qty
    FROM _po_lines l WHERE v.id = l.variant_id;

  IF v_coupon_id IS NOT NULL THEN
    UPDATE public.coupons SET times_used = times_used + 1 WHERE id = v_coupon_id;
    INSERT INTO public.coupon_redemptions (coupon_id, customer_id, order_id) VALUES (v_coupon_id, v_user, v_order.id);
  END IF;

  RETURN QUERY SELECT v_order.id, v_order.order_number, v_order.total;
END; $$;
REVOKE ALL ON FUNCTION public.place_order(jsonb, jsonb, text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, jsonb, text, text, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- cancel_order: a customer may cancel until the order is packed.  Stock and
-- coupon are released by the status trigger above.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_order(p_order_number text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.orders%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to cancel an order'; END IF;
  SELECT * INTO o FROM public.orders
   WHERE order_number = p_order_number AND customer_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF o.status NOT IN ('placed', 'confirmed') THEN
    RAISE EXCEPTION 'This order can no longer be cancelled — it is already %', o.status;
  END IF;
  UPDATE public.orders SET status = 'cancelled' WHERE id = o.id;
END; $$;
REVOKE ALL ON FUNCTION public.cancel_order(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_order(text) TO authenticated;
