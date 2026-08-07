# Swati Home & Kitchen

I'm building an e-commerce website for Swati Enterprises, a Delhi-based

home & kitchen retailer that sells three brands: Pigeon (cookware, pressure

cookers, small appliances), Dubblin (insulated steel bottles, mugs, lunch

boxes), and Yera Glassware (storage jars, gift-range candle jars, tumblers,

tableware). Build this as a full-stack app using React + Tailwind + shadcn/ui

on the frontend and Supabase (Lovable Cloud) for the database, auth, and

storage.



Before writing any code, show me your build plan (screens, database schema,

and implementation order) so I can review it. Then build Phase 1 in full.



===========================================================

COMPANY CONTEXT

===========================================================

- Name: Swati Enterprises

- Registered address: G-241, Gazipur Village, East Delhi, Delhi 110096,

  NCT of Delhi, India

- Currency: INR throughout, formatted as "Rs. 1,234"

- This is a real multi-brand catalogue (~800 SKUs across the three brands),

  not a demo store — treat pricing, stock, and orders as real business data.



===========================================================

DESIGN SYSTEM — reference Myntra and Meesho's UI patterns

===========================================================

Take direct inspiration from Myntra (clean grid PLPs, left filter sidebar,

sticky header, bold "X% OFF" styling) and Meesho (price-forward cards,

green discount badges, rating chips, mobile-first density). Do not use a

generic SaaS/AI-template look — this should feel like a real Indian

e-commerce storefront.



Design tokens:

- Site-wide neutral/accent: warm gold #B8862F (light tint #FBF3E2)

- Pigeon brand color: #C41230 (light tint #FCE7EA) — used on Pigeon brand

  pages, badges, and Pigeon product accents

- Dubblin brand color: #9C1150 (light tint #FBE6EF)

- Yera brand color: #163A6B (light tint #E8EEF6)

- Background: white / very light warm grey

- Discount % text: green (#2E8B45); rating chip: green fill, white star + number

- Typography: 'Poppins' (600-800 weight) for headings/display, 'Inter' for

  body and UI text

- Rounded cards (rounded-2xl), soft shadows on hover, brand-colored tag

  chips on product images (e.g. a small "Pigeon" pill on the image)



Signature interaction: selecting a brand (Pigeon/Dubblin/Yera) from the nav

or brand-strip should tint that section's hero/accent to the brand's color

— each brand gets its own visual moment inside a shared shell.



===========================================================

DATABASE SCHEMA (Supabase / Postgres)

===========================================================

Create these tables with Row Level Security enabled (public read on

catalogue tables, admin-only write; customers can only read/write their

own orders, cart, wishlist, addresses):



brands

  id, name, slug, color_hex, light_color_hex, tagline, description



categories

  id, name, slug, brand_id (nullable — some categories span brands)



products

  id, brand_id, category_id, name, description, specifications (jsonb),

  is_active (bool)



product_variants   -- this is the actual sellable SKU

  id, product_id, variant_code (text, e.g. "JR-500" or a HANA code),

  capacity_or_size (text), color (text, nullable), mrp (numeric),

  cost_price (numeric, nullable), selling_price (numeric),

  stock_qty (integer), pack_or_carton_qty (integer, nullable),

  sku_id (text, unique, human-readable e.g. "PGN-00001"),

  image_url (text, nullable)



customers

  id (matches Supabase auth user id), full_name, phone, email, gst_number (nullable)



addresses

  id, customer_id, full_name, phone, line1, city, state, pincode, is_default



orders

  id, customer_id, status (enum: placed, confirmed, packed, shipped,

  out_for_delivery, delivered, cancelled, returned), payment_status,

  payment_method, subtotal, shipping_fee, discount_amount, total,

  shipping_address_id, created_at



order_items

  id, order_id, product_variant_id, qty, unit_price, line_total



cart_items

  id, customer_id, product_variant_id, qty



wishlist_items

  id, customer_id, product_variant_id



coupons

  id, code, type (percent | flat), value, min_order_value, valid_from,

  valid_to, usage_limit, times_used, is_active



Seed the brands table with Pigeon, Dubblin, and Yera using the exact

colors above and these taglines:

- Pigeon: "Crafted for every kitchen masterpiece"

- Dubblin: "Drink the unique way"

- Yera: "Glassware for every occasion"



Seed products + product_variants with this representative data (brand,

category, product name, variant code/capacity, MRP, stock — I've left

cost_price null for Dubblin and Yera because their source catalogues only

publish MRP, not trade price; Pigeon's cost_price should be set to roughly

50% of MRP to reflect its published dealer price):



brand,category,name,variant_code,capacity,mrp,stock_qty

Pigeon,Pressure Cookers,Inox Pressure Cooker 5L Outer Lid (SS),19000338,5L,3245,40

Pigeon,Pressure Cookers,Deluxe Pressure Cooker 3L,19000018,3L,1795,60

Pigeon,Cookware,Ceramic Fry Pan 260mm,19004510,260mm,2175,35

Pigeon,Cookware,Imperi Cast Iron Kadai With Lid 240,19004021,240mm,1749,25

Pigeon,Cooking Appliances,1.8L Evoke Electric Kettle,19004407,1.8L,1445,50

Pigeon,Cooking Appliances,ERC Joy Unlimited 1.8L Rice Cooker DX,19001507,1.8L,3695,20

Pigeon,Induction Cooktops,Stella 1800W Induction Cooktop,19004265,1800W,4095,30

Pigeon,LPG Cooktops,Glasstop 3-Burner Sleek,19001345,3 Burner,9999,15

Pigeon,Chimney & Hob,Pigeon Chimney Atmos 60cm (BLDC),19004826,60cm,24790,8

Pigeon,Fans,Fan-Tastic 35W BLDC Ceiling Fan,19004455,35W,4998,25

Pigeon,Air Fryer,Healthifry+ Digital Air Fryer 5.4L,19004931,5.4L,10999,18

Pigeon,Mixer Grinder,Mixer Grinder Sonik 750W 3 Jar,16002631,750W,5999,22

Pigeon,Water Bottle,Pigeon Aqua Galaxy Vacuum Bottle 1000ml,19004321,1000ml,1225,40

Pigeon,Lunch Box,PG Treat Lunch Box With Bottle 5pc,19003851,5pc,1295,30

Pigeon,Kitchen Utilities,Pigeon Edge Carbon Knife Set 7pc,16002380,7pc,2095,20

Dubblin,SS Vacuum Bottles,Fancy Vacuum Bottle 750ml,DUB-FANCY-750,750ml,1249,45

Dubblin,SS Vacuum Bottles,Ruff & Tuff Vacuum Bottle 1000ml,DUB-RT-1000,1000ml,1399,30

Dubblin,SS Vacuum Bottles,Jumbo Vacuum Bottle 1800ml,DUB-JUMBO-1800,1800ml,1949,15

Dubblin,SS Vacuum Bottles,Tango Vacuum Bottle 1000ml,DUB-TANGO-1000,1000ml,1149,35

Dubblin,SS Vacuum Mugs,Rage Vacuum Mug 800ml,DUB-RAGE-800,800ml,1299,25

Dubblin,SS Vacuum Mugs,Rock Vacuum Mug 1200ml,DUB-ROCK-1200,1200ml,1489,20

Dubblin,SS Double Wall Mugs,Polo Double Wall Mug 270ml,DUB-POLO-270,270ml,379,60

Dubblin,SS Single Wall Bottles,Mountain Single Wall Bottle 1000ml,DUB-MTN-1000,1000ml,489,40

Dubblin,Insulated Lunch Boxes,Buffet Insulated Lunch Box,DUB-BUFFET,Standard,1199,25

Dubblin,SS Containers,Fresher SS Container 1500ml,DUB-FRESH-1500,1500ml,699,50

Yera,Jars,Deluxe Aahaar Jar 3360ml,JR-120,3360ml,295,40

Yera,Jars,Steelex Jar 1220ml,JR-1ST,1220ml,415,30

Yera,Jars,Sweet Pepper Spice Jars 275ml,JR-275,275ml,240,45

Yera,Gift Range,Florence Candle Jar 290ml,TS10HB,290ml,270,35

Yera,Gift Range,Miami Candle Jar 540ml,PSR550-425,540ml,210,30

Yera,Gift Range,Brooklyn Large Gift Bowl 1340ml,BS802,1340ml,385,20

Yera,Drinkware,Stylo Conical Tumbler 435ml,TC-435,435ml,490,25

Yera,Drinkware,Noble Whisky Tumbler 380ml,T12M21,380ml,675,20

Yera,Drinkware,Goblet Wine Glass 330ml,G330,330ml,225,40

Yera,Tea & Coffee,Cosmos Tea Cup 250ml,CT9,250ml,385,30

Yera,Tableware,Evelyn Pudding Set 7pc,B27FA-B7FA,7pc,500,15

Yera,Water Bottle,Aqua Bliss Water Bottle 750ml,WB750,750ml,250,50



Compute selling_price for each variant as MRP minus a discount between

10-30% (vary it across products for a realistic mixed-discount storefront).



===========================================================

PAGES & CORE STOREFRONT FEATURES (Phase 1 — build this first)

===========================================================

1. Home — hero banner, brand strip (3 brand cards linking to filtered

   shop views), category shortcut icons, "Trending deals" and "Bestsellers"

   product rails, trust strip (free delivery, COD, 7-day returns, genuine

   products)

2. Shop / listing page — left filter sidebar (brand, category, price range,

   rating) + product grid, sort dropdown (price, rating, discount,

   newest), works from a URL so filters are shareable/bookmarkable

3. Product detail page — image area, brand tag, price with MRP struck

   through + % off, stock status, quantity selector, add to cart, add to

   wishlist, related products from the same category

4. Cart — persists per logged-in customer (or local storage for guests),

   quantity edit, remove, subtotal, free-delivery threshold messaging

5. Checkout — address form (with save-to-account), payment method

   selection UI (UPI / Card / Netbanking / Cash on Delivery — see payments

   note below), order summary, order confirmation screen

6. Customer account — order history with status, saved addresses,

   wishlist, profile

7. Auth — email/password signup+login via Supabase Auth (magic link or

   OTP is a nice-to-have if straightforward)

8. Static pages — About Us, Contact Us, Shipping Policy, Cancellation &

   Refund Policy, Privacy Policy, Terms & Conditions (draft real, specific

   copy aligned with India's Consumer Protection (E-Commerce) Rules 2020 —

   not lorem ipsum)



===========================================================

ADMIN / INVENTORY MANAGEMENT PANEL (Phase 1 — required, not optional)

===========================================================

This is a core requirement, not an afterthought. Build a role-gated

/admin section (admin role stored on the customer/user record via Supabase,

only accessible to accounts flagged as admin):



- Product & inventory management:

  - Table view of all product_variants with brand, category, MRP, cost

    price, selling price, stock_qty, pack/carton qty — sortable/filterable

  - Create/edit/delete product and variant records, including image upload

    to Supabase Storage

  - Bulk CSV import that matches this column structure so I can upload

    my existing inventory spreadsheet directly:

    brand, category, product_name, variant_code, capacity, mrp,

    cost_price, selling_price, stock_qty, pack_carton_qty

  - Low-stock indicator (e.g. highlight rows under 10 units) and a

    dedicated "Low stock" filtered view

  - Bulk price update tool (e.g. apply a % discount across a brand or

    category at once)

- Order management:

  - List all orders with status, customer, total, date — filterable by

    status

  - Update order status through the pipeline (placed → confirmed →

    packed → shipped → out for delivery → delivered / cancelled / returned)

  - View full order detail (items, address, payment status)

- Coupon management: create/edit/deactivate coupons (code, % or flat

  discount, min order value, validity dates, usage limit)

- Basic dashboard/reporting: total revenue, order count, and a simple

  revenue-by-brand breakdown for a selectable date range



===========================================================

INDIA-SPECIFIC / PAYMENTS NOTE

===========================================================

This is an India-only store. For Phase 1, build the full checkout UI and

order-placement flow (including a "Cash on Delivery" option that actually

works end-to-end — creates a real order with payment_status "pending"),

but for online payment methods (UPI/Card/Netbanking), stub the payment

step with a clearly-labeled "test mode" confirmation rather than wiring a

live gateway — Razorpay is the right gateway for this business (not

Stripe, which is Lovable's default) and needs a custom Supabase Edge

Function integration I'll set up separately once I have Razorpay API keys.

Don't block the rest of checkout on this.



===========================================================

BUILD ORDER

===========================================================

1. Database schema + seed data

2. Storefront: home, shop/listing with filters, product detail

3. Cart + auth + checkout UI (COD working end-to-end, online payment stubbed)

4. Customer account (orders, addresses, wishlist)

5. Admin panel: product/inventory CRUD + bulk CSV import, order

   management, coupons, dashboard

6. Static/policy pages

7. Mobile responsiveness pass and polish



Phase 2 (after I review Phase 1, don't build yet): product reviews &

ratings, Razorpay live integration, Shiprocket shipping/tracking

integration, WhatsApp/SMS order notifications, a dealer/wholesale portal

with tiered pricing.



===========================================================

CONSTRAINTS

===========================================================

- Mobile-first responsive at every breakpoint — most traffic will be mobile

- Don't fabricate a working payment gateway charge — see payments note

- Keep the three brand colors visually distinct but the overall shell

  (header, footer, checkout, admin) neutral so it reads as one coherent

  store, not three unrelated sites

- Real, specific copy everywhere (product descriptions, policy pages,

  empty states) — no lorem ipsum or placeholder "Lorem" text

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3c092641-198c-40df-955c-04284012e32f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
