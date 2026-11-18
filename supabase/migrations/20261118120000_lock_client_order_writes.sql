-- APPLY ONLY AFTER the storefront that calls place_order()/validate_coupon()
-- is deployed (see 20261118110000_server_side_orders.sql).  Applying this
-- earlier breaks checkout for the currently-deployed site.
--
-- 1. The browser can no longer write orders or order lines at all — prices,
--    discounts and stock are decided inside place_order().
-- 2. Coupon codes are no longer publicly readable; customers validate through
--    validate_coupon(), admins read/write through the existing admin policy.

DROP POLICY IF EXISTS "own orders insert" ON public.orders;
DROP POLICY IF EXISTS "own order items insert" ON public.order_items;
REVOKE INSERT ON public.orders FROM authenticated;
REVOKE INSERT ON public.order_items FROM authenticated;

DROP POLICY IF EXISTS "active coupons read" ON public.coupons;
REVOKE SELECT ON public.coupons FROM anon;
-- `authenticated` keeps the grant so admins can list coupons; the remaining
-- "coupons admin write" (FOR ALL) policy only matches admins, so customers
-- now see zero rows.
