# Swati Enterprises — Phase 1 Build Plan

Multi-brand home & kitchen store (Pigeon, Dubblin, Yera) with a full storefront, working COD checkout, customer account, and an admin inventory/order panel. INR throughout, formatted `Rs. 1,234`. Mobile-first, Myntra/Meesho-style density — not a generic SaaS look.

## Catalogue data

Your uploaded workbook has an `All_Products` sheet with 824 real SKUs (SKU ID, brand, category, product name, variant code, capacity, MRP, dealer price, pack/carton qty, notes). I'll seed the **full 824-SKU catalogue** from that sheet rather than only the 38 representative rows — the 38 rows are used to sanity-check names/prices. Selling price = MRP minus a varied 10–30% discount (deterministic per SKU so it's stable), except where the sheet already carries a sensible website price. Pigeon keeps its dealer price as `cost_price`; Dubblin/Yera `cost_price` stays null. Stock: seeded from your listed quantities where given, otherwise a realistic per-category default.

No product photography exists yet, so products render with a branded placeholder tile (brand-tinted, product name + capacity) until images are uploaded via the admin panel.

## Design system

- Warm gold `#B8862F` / tint `#FBF3E2` as the neutral shell accent; white / warm-grey backgrounds
- Brand tokens: Pigeon `#C41230`/`#FCE7EA`, Dubblin `#9C1150`/`#FBE6EF`, Yera `#163A6B`/`#E8EEF6`
- Green `#2E8B45` discount text, green rating chip with white star
- Poppins 600–800 headings, Inter body
- `rounded-2xl` cards, hover lift, brand pill chip on every product image
- Brand tinting: entering a brand context (`/brand/pigeon` or brand filter) swaps a CSS variable so hero, chips, buttons and accents take that brand's colour inside the same neutral shell

## Screens

**Storefront**
1. `/` Home — hero, 3 brand cards, category shortcut icons, Trending Deals + Bestsellers rails, trust strip
2. `/shop` — left filter sidebar (brand, category, price, discount, rating) + grid; sort by price/discount/newest; all state in the URL so links are shareable; mobile filters in a bottom sheet
3. `/brand/$slug` — brand-tinted landing that feeds into the same shop grid
4. `/product/$skuId` — gallery area, brand tag, MRP struck through + % off, stock status, qty selector, add to cart / wishlist, related products
5. `/cart` — guest cart in localStorage, merged into the DB cart on login; qty edit, remove, subtotal, free-delivery threshold nudge
6. `/checkout` — address form (save to account), coupon field, payment method (UPI / Card / Netbanking / COD), summary; COD places a real order (`payment_status: pending`), online methods show a clearly labelled **Test mode** confirmation and place the order the same way. No fake gateway charge.
7. `/order/$id` confirmation
8. `/account` — orders + status timeline, addresses, wishlist, profile
9. `/auth` — email/password signup and login
10. Static: About, Contact, Shipping Policy, Cancellation & Refund, Privacy, Terms — real copy written to India's Consumer Protection (E-Commerce) Rules 2020 expectations (seller identity, Gazipur Delhi address, grievance officer contact, return windows, refund timelines)

**Admin** (`/admin`, role-gated)
- Dashboard: revenue, order count, revenue-by-brand for a selectable date range
- Inventory table: all variants with brand/category/MRP/cost/selling/stock/carton qty, sort + filter, inline edit, low-stock highlight under 10 units and a "Low stock" view
- Product & variant create/edit/delete with image upload to storage
- Bulk CSV import matching `brand, category, product_name, variant_code, capacity, mrp, cost_price, selling_price, stock_qty, pack_carton_qty`, with a preview/validation step before commit
- Bulk price update: apply a % change across a brand or category
- Orders: filter by status, view detail, advance status through placed → confirmed → packed → shipped → out_for_delivery → delivered / cancelled / returned
- Coupons: create/edit/deactivate

## Database

Tables exactly as you specified: `brands`, `categories`, `products`, `product_variants`, `customers`, `addresses`, `orders`, `order_items`, `cart_items`, `wishlist_items`, `coupons`, plus:
- `order_status` and `payment_status` enums
- a separate `user_roles` table + `has_role()` security-definer function — admin flags must never live on the customer row (privilege-escalation risk)

RLS on everything: public read on brands/categories/products/variants/active coupons; customers read/write only their own cart, wishlist, addresses, orders, order items; admin-only writes on catalogue, orders (status), and coupons.

## Technical notes

- TanStack Start file routes; catalogue reads go through public server functions with a publishable-key client, customer/admin reads through auth-middleware server functions
- Order placement runs server-side: prices and stock are re-read from the DB, coupon is re-validated, totals recomputed — the client never dictates price
- Stock decrements on order placement
- No Razorpay wiring in Phase 1; the checkout is structured so a gateway step drops in later without reworking order creation

## Build order

1. Schema + RLS + seed (brands, categories, 824 variants)
2. Design tokens, shell (header/nav/footer), home
3. Shop with URL filters, brand pages, product detail
4. Cart, auth, checkout with working COD
5. Account: orders, addresses, wishlist, profile
6. Admin: dashboard, inventory CRUD, CSV import, bulk pricing, orders, coupons
7. Policy pages with real copy
8. Mobile pass and polish

Phase 2 (not now): reviews, Razorpay live, Shiprocket, WhatsApp/SMS notifications, dealer portal.
