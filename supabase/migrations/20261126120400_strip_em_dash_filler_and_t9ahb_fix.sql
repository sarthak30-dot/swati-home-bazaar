-- Em-dash filler: ~70 products across Pigeon and Yera used the template
-- "<thing> for <use>—<adjective>, <adjective>, and <adjective> for <use>.",
-- all sharing one em dash splitting a sentence from a trailing adjective
-- list. Splitting on the dash and starting a new sentence with "It's "
-- keeps the same factual content without the dash.
UPDATE products
SET description = replace(description, '—', '. It''s ')
WHERE description LIKE '%—%'
  AND id <> 'ab538b3f-ad5d-4c78-94e3-7915b71a4936';

-- One product used an em dash as a legitimate parenthetical aside rather
-- than filler; rewritten with parentheses instead of removed outright.
UPDATE products
SET description = 'This mixer grinder features three jars (a 1.5-litre big jar, a 1.0-litre medium jar, and a 0.4-litre chutney jar) powered by a 750W motor for efficient performance.'
WHERE id = 'ab538b3f-ad5d-4c78-94e3-7915b71a4936';

-- Yera Classic Tumbler T9AHB: title/capacity_or_size both say 250ml; the
-- description claimed 280ml and carried leftover AI-cliche phrasing.
UPDATE products SET
  description = 'The Yera Classic Tumbler T9AHB is a 250 ml glass tumbler with classic proportions, suited to everyday beverages.',
  description_highlights = '["250 ml capacity", "Classic tumbler proportions", "Glass construction", "Suited to everyday beverages"]'::jsonb
WHERE id = 'e8afef2b-f350-4300-8c53-33499abb4e0f';
