-- Fix capacity/SKU-mismatched copy and deduplicate copy-pasted blurbs shared
-- across multiple distinct products. In every case the underlying
-- capacity_or_size column was already correct; only the prose description
-- (and in the shared-description cases, overclaiming one variant's size for
-- all of them) was wrong.

-- 1. Yera Venus Serving Bowl: shared by B12SB (350ml) and B35SB (975ml).
--    Description was copy-pasted from the 975ml variant onto the whole
--    product, named the wrong SKU (B35SB), and used an AI cliche.
UPDATE products SET
  description = 'The Yera Venus Serving Bowl is a glass serving bowl available in 350 ml and 975 ml sizes, suited to salads, sides, or table serving depending on the size chosen.',
  description_highlights = '["Available in 350 ml and 975 ml sizes", "Clear glass construction for easy visibility of contents", "Suited to salads, sides, or serving at the table", "Part of the Yera Venus bowl range"]'::jsonb
WHERE id = '12837808-a298-4692-ba58-92ebae4b2205';

-- 2. Yera Aahar Jar: one shared description hardcoded "1220ml" (the JR-1
--    variant) across all 7 size variants (140 ml-5650 ml).
UPDATE products SET
  description = 'The Yera Aahar Jar is a round, BPA-free glass storage jar with an airtight plastic lid, made for pickles, chutneys, spices, and other kitchen staples. It is sold across several sizes from 140 ml up to 5650 ml in the JR range, so capacity varies by the specific jar selected.',
  description_highlights = '["BPA-free glass jar body", "Airtight plastic lid for freshness", "Suited to pickles, chutneys, spices, and dry goods", "Available across multiple sizes in the JR range (140 ml-5650 ml)"]'::jsonb
WHERE id = '488deef6-5604-40b4-88c5-5230b2e53ba1';

-- 3. Yera Aahar Square Jar: same issue, hardcoded "1010ml" (JS-2) across all
--    6 size variants (650 ml-3280 ml).
UPDATE products SET
  description = 'The Yera Aahar Square Jar is a square-sided, BPA-free glass storage jar with an airtight lid, designed for pantry staples such as spices, grains, and preserves. It is available across several sizes from 650 ml to 3280 ml in the JS range.',
  description_highlights = '["BPA-free glass with a square, shelf-efficient profile", "Airtight lid to keep contents fresh", "Suited to spices, grains, and preserves", "Available across multiple sizes in the JS range (650 ml-3280 ml)"]'::jsonb
WHERE id = '72874551-1b19-4234-ad2b-c3a9a08579e4';

-- 4. Yera Deluxe Aahar Jar JR-120: description said "120ml" (reading the
--    variant code JR120 as a volume) when the jar is actually 3.36 L (3360 ml).
UPDATE products SET
  description = 'The Yera Deluxe Aahar Jar JR120 is a 3.36 L (3360 ml) glass storage jar with an airtight lid, sized for bulk pantry storage rather than small spice quantities.',
  description_highlights = '["3.36 L (3360 ml) capacity", "BPA-free glass with an airtight lid", "Suited to bulk storage such as rice, flour, or pulses", "Part of the Yera Deluxe Aahar Jar range"]'::jsonb
WHERE id = 'd5ae1f5e-c697-4902-bb48-1244208fadc5';

-- 5. Yera Stylo Mug: shared description named only "BM350" / "350ml" even
--    though the product also covers the 355 ml (BM355) variant.
UPDATE products SET
  description = 'The Yera Stylo Mug is a sleek drinkware mug sold in 350 ml and 355 ml sizes, suited to beer, iced beverages, or coffee. It combines a streamlined profile with a sturdy build for everyday use or entertaining.',
  description_highlights = '["Available in 350 ml and 355 ml capacities", "Suited to beer, iced drinks, or coffee", "Sturdy, streamlined mug design", "Part of the Yera Stylo drinkware range"]'::jsonb
WHERE id = '62b8fc97-2507-46c3-bd0a-a062ba24c1b1';

-- 6. Yera Lumino Bowl B6FL: description was copy-pasted from an unrelated
--    "Cafetina Mini Tea Party Set" listing.
UPDATE products SET
  description = 'The Yera Lumino Bowl is a 170 ml glass bowl sized for small servings or mixing. Its compact size suits side dishes, dips, or prepping small ingredient quantities.',
  description_highlights = '["170 ml capacity", "Clear glass construction", "Suited to small servings, dips, or mixing", "Part of the Yera Lumino bowl range"]'::jsonb
WHERE id = '90c72897-9ddb-4c06-b104-27c99073b0c9';

-- 7. Pigeon Chopping Board (Basic): description was copy-pasted from a
--    knife-and-shears set listing.
UPDATE products SET
  description = 'The Pigeon Chopping Board (Basic) is an entry-level cutting board for everyday slicing, chopping, and food prep, alongside the Small, Medium, and Large boards in Pigeon''s chopping board range.',
  description_highlights = '["Entry-level board for everyday cutting and chopping", "Compact, easy to store and clean", "Part of Pigeon''s chopping board range"]'::jsonb
WHERE id = '77bdd314-95c3-4bd6-b36c-5132cd1cc2bb';

-- 8. Pigeon Rigel Plus LED: description was a generic "emergency
--    lights/lanterns" blurb instead of describing this specific desk-light
--    + torch, which its own specifications already detail.
UPDATE products SET
  description = 'The Pigeon Rigel Plus LED is a rechargeable 2-in-1 desk light and torch built around a 3W high-power LED and a 4V 2Ah sealed lead-acid battery, running up to 3.5 hours on strong light or 14 hours on weak light per charge.',
  description_highlights = '["2-in-1 desk light and torch", "3W high-power LED light source", "4V 2Ah sealed lead-acid rechargeable battery, Micro USB charging", "Up to 3.5 hrs on strong light or 14 hrs on weak light per charge", "Charges fully in about 4 hours"]'::jsonb
WHERE id = '85f46141-407e-4cff-a69d-b2e5a56657bc';

-- 9. Yera Polo Bowl: description described it as a "3-piece combo set" when
--    the 435/990/1580 ml sizes are sold individually; the actual 3-bowl combo
--    is a separate listing (B16FL+B35FL+B55FL).
UPDATE products SET
  description = 'The Yera Polo Bowl is a glass mixing and serving bowl with a matching lid, sold individually in 435 ml, 990 ml, and 1580 ml sizes (a separate nested 3-bowl combo set is also available). Stackable and freezer-to-fridge friendly, it suits meal prep and leftover storage.',
  description_highlights = '["Available individually in 435 ml, 990 ml, and 1580 ml sizes", "Comes with a matching lid", "Clear glass body for visibility of contents", "Stackable for fridge or pantry storage"]'::jsonb
WHERE id = 'd9f08ac4-5043-4416-943d-96057b45c179';

-- 10. Yera Zaika Jar: shared description hardcoded "860ml" (JR750) across
--     all 3 size variants (300/565/860 ml).
UPDATE products SET
  description = 'The Yera Zaika Jar is a round, BPA-free glass storage jar with an airtight lid, sold in 300 ml, 565 ml, and 860 ml sizes for spices, baking ingredients, or preserved foods.',
  description_highlights = '["Available in 300 ml, 565 ml, and 860 ml sizes", "BPA-free glass with an airtight lid", "Suited to spices, baking ingredients, or preserves"]'::jsonb
WHERE id = '5af7c18b-b377-4ff8-8dc6-31136aa269cc';

-- 11-17. Pigeon Storm Fry Pan sizes: all 7 shared one of two identical
--        blurbs verbatim, regardless of size or induction-base variant.
UPDATE products SET
  description = 'The Pigeon Storm Fry Pan 175 is a 175 mm non-stick aluminium fry pan, sized for single servings or small quantities such as an omelette or a few pieces of toast.',
  description_highlights = '["175 mm diameter - suited to single servings", "3-layer non-stick coating for low-oil cooking", "Cool-touch bakelite handle", "Gas compatible"]'::jsonb
WHERE id = 'e8270873-56d4-46c2-96ad-b1647b66686a';

UPDATE products SET
  description = 'The Pigeon Storm Fry Pan 200 is a 200 mm non-stick aluminium fry pan for everyday frying and sauteing in small households.',
  description_highlights = '["200 mm diameter", "3-layer non-stick coating for low-oil cooking", "Cool-touch bakelite handle", "Gas compatible"]'::jsonb
WHERE id = '5ebcb67f-54a4-4277-b9f8-7f88ce68cff5';

UPDATE products SET
  description = 'The Pigeon Storm Fry Pan 220 is a 220 mm non-stick aluminium fry pan, a mid-size option for frying, sauteing, or shallow pan-frying.',
  description_highlights = '["220 mm diameter", "3-layer non-stick coating for low-oil cooking", "Extra-thick base to resist warping", "Gas compatible"]'::jsonb
WHERE id = '37ccc94e-4f81-4239-bea9-112b816ed1f2';

UPDATE products SET
  description = 'The Pigeon Storm Fry Pan 240 is a 240 mm non-stick aluminium fry pan sized for family-portion frying and sauteing.',
  description_highlights = '["240 mm diameter", "3-layer non-stick coating for low-oil cooking", "Extra-thick base to resist warping", "Gas compatible"]'::jsonb
WHERE id = 'c8d95707-da33-4baa-b191-97a77b16d48e';

UPDATE products SET
  description = 'The Pigeon Storm Fry Pan 240 IB is the induction-base version of the 240 mm Storm Fry Pan, usable on induction as well as gas.',
  description_highlights = '["240 mm diameter", "Induction-compatible base", "3-layer non-stick coating for low-oil cooking", "Cool-touch bakelite handle"]'::jsonb
WHERE id = 'dbd2ef1d-5989-48c4-8aa3-28969b04e1aa';

UPDATE products SET
  description = 'The Pigeon Storm Fry Pan 260 is a 260 mm non-stick aluminium fry pan, the largest size in the Storm Fry Pan line for bigger batches.',
  description_highlights = '["260 mm diameter", "3-layer non-stick coating for low-oil cooking", "Extra-thick base to resist warping", "Gas compatible"]'::jsonb
WHERE id = 'efe25d01-a986-4dc7-acf4-40e94d5049f4';

UPDATE products SET
  description = 'The Pigeon Storm Fry Pan 260 IB is the induction-base version of the 260 mm Storm Fry Pan, usable on induction as well as gas.',
  description_highlights = '["260 mm diameter", "Induction-compatible base", "3-layer non-stick coating for low-oil cooking", "Cool-touch bakelite handle"]'::jsonb
WHERE id = 'b7c7ff51-2395-4f7c-ace9-2a73b7da33b6';

-- 18. Pigeon Tadka Pan: shared the Storm Fry Pan blurb verbatim, despite
--     being a small tempering pan rather than a general fry pan.
UPDATE products SET
  description = 'The Pigeon Tadka Pan is a small non-stick aluminium pan built for tempering spices in hot oil before adding them to a dish, rather than for general frying.',
  description_highlights = '["Sized for tempering (tadka), not general frying", "3-layer non-stick coating for low-oil cooking", "Cool-touch bakelite handle", "Gas compatible"]'::jsonb
WHERE id = '4214624d-b1b7-456e-bb2d-bfd64daa8883';

-- 19-20. Pigeon Appachetty SP / with Lid: shared the Storm Fry Pan blurb
--        verbatim, despite being a different pan shape with a lid option.
UPDATE products SET
  description = 'The Pigeon Appachetty SP (without Lid) is a small, deep non-stick aluminium pan used for tempering and small-batch frying, sold without a lid.',
  description_highlights = '["Deep, small-batch pan for tempering and frying", "Sold without a lid", "3-layer non-stick coating for low-oil cooking", "Cool-touch bakelite handle"]'::jsonb
WHERE id = '68bb887f-c46e-4f44-9865-c5b689407dfb';

UPDATE products SET
  description = 'The Pigeon Appachetty with Lid is a small, deep non-stick aluminium pan used for tempering and small-batch frying, sold with a matching lid.',
  description_highlights = '["Deep, small-batch pan for tempering and frying", "Includes a matching lid", "3-layer non-stick coating for low-oil cooking", "Cool-touch bakelite handle"]'::jsonb
WHERE id = '0dd07b70-4835-409b-b453-cec587e7f749';
