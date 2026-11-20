-- Suppress catalogue scans that have supplier pricing printed inside them.
--
-- The Yera and Pigeon images under public/images/products/ are crops of
-- wholesale catalogue pages. Most carry header text: bulk and carton
-- quantities, trade prices, and often a NEIGHBOURING product's code and
-- price. Several contradicted the retail price on the same card -- the
-- TC-435 listing showed "Stylo Tumbler TC-340 ... 6 pcs Pack ... Rs. 390.00",
-- and JM10A showed "PRODUCT: Bistro, CODE: BM360, M.R.P.: Rs. 710.00".
--
-- All 40 remaining local scans were read with tesseract; 26 contained
-- pricing. Those are cleared here so the card falls back to its coloured
-- tile, which is better than a photo quoting a price that is not ours.
--
-- Reversible: the files are still in the repo and the path is
-- '/images/products/yera/<sku_id>.jpg'. Re-run the OCR step after adding new
-- photography.
UPDATE public.product_variants
SET image_url = NULL
WHERE sku_id IN ('JR-2','JR-3','JR-5','JS-2','JS-3','JS-4','JS-8','TC-215','TC-435',
                 'TP08-P0','TS07-P0','TS08-P0','TS010-P0','TS011-P0','TS012-P0',
                 'TS-145','TS-175','TS-265','TS-290','TS-340','T9AHB','CT6','CT9',
                 'CS6MO-Plain','BC08-M11','BP08-M25')
  AND image_url LIKE '/images/products/%';
