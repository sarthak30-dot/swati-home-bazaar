// Photos that must NOT be shown as product images on the storefront.
//
// These files are raw crops of printed supplier catalogues: they carry spec
// text and trade prices ("M.R.P.: Rs. 325.00 / Carton - 24"), coloured side
// bars, decorative page fragments, neighbouring products or a cut-off product.
// A retail shopper must never see trade pricing next to the shop's own price,
// and a broken scan is worse than an honest "photo coming soon" tile.
//
// Maintained by hand after running scripts/clean-catalogue-crops.py: files the
// cleaner extracted cleanly were rewritten in place and are NOT listed here;
// files it could not extract are listed. Replace a file with a real photograph
// (same name, or upload through the admin panel) and delete its line.
export const UNUSABLE_IMAGES: ReadonlySet<string> = new Set([
  "/images/products/yera/B11RIB.jpg",
  "/images/products/yera/B16FL.jpg",
  "/images/products/yera/B27FA(1N)+B7FA(6N).jpg",
  "/images/products/yera/B30DF(1N)+B6DF(6N).jpg",
  "/images/products/yera/B35FL.jpg",
  "/images/products/yera/B5AC.jpg",
  "/images/products/yera/B7FH.jpg",
  "/images/products/yera/B9ML.jpg",
  "/images/products/yera/BP35M25(1N)+BP8M25(6N).jpg",
  "/images/products/yera/BS350.jpg",
  "/images/products/yera/BS375+WB500.jpg",
  "/images/products/yera/BS625.jpg",
  "/images/products/yera/CT8B.jpg",
  "/images/products/yera/G330.jpg",
  "/images/products/yera/GS1700(1N)+TB10(6N).jpg",
  "/images/products/yera/IC4IF.jpg",
  "/images/products/yera/IC5FD.jpg",
  "/images/products/yera/ICV7-M23.jpg",
  "/images/products/yera/ISR-530-335.jpg",
  "/images/products/yera/ISS-0495-0380.jpg",
  "/images/products/yera/JC-250.jpg",
  "/images/products/yera/JM300.jpg",
  "/images/products/yera/JR-120.jpg",
  "/images/products/yera/JR-1ST.jpg",
  "/images/products/yera/JR-4.jpg",
  "/images/products/yera/JR-5.jpg",
  "/images/products/yera/JR-5ST.jpg",
  "/images/products/yera/JR1000STK.jpg",
  "/images/products/yera/JR1500STK.jpg",
  "/images/products/yera/JR1KGM22.jpg",
  "/images/products/yera/JR200.jpg",
  "/images/products/yera/JR500ST.jpg",
  "/images/products/yera/JR750ST.jpg",
  "/images/products/yera/JS-2.jpg",
  "/images/products/yera/JS-3.jpg",
  "/images/products/yera/KSM-235.jpg",
  "/images/products/yera/KSM-300.jpg",
  "/images/products/yera/KSM-3000.jpg",
  "/images/products/yera/KSM-4000.jpg",
  "/images/products/yera/KSM-600.jpg",
  "/images/products/yera/KSM-800.jpg",
  "/images/products/yera/NPR-0202.jpg",
  "/images/products/yera/PJS1000.jpg",
  "/images/products/yera/PJS2000.jpg",
  "/images/products/yera/PJS300.jpg",
  "/images/products/yera/PJS550.jpg",
  "/images/products/yera/PSR-0810-0640.jpg",
  "/images/products/yera/PSR-550-425(2)+TS10HB(3).jpg",
  "/images/products/yera/PSR550-425.jpg",
  "/images/products/yera/RP300.jpg",
  "/images/products/yera/T-205TH.jpg",
  "/images/products/yera/T-260TH.jpg",
  "/images/products/yera/T-270TH.jpg",
  "/images/products/yera/T10BD.jpg",
  "/images/products/yera/T10FB.jpg",
  "/images/products/yera/T10SQ.jpg",
  "/images/products/yera/T11FC.jpg",
  "/images/products/yera/T12M19.jpg",
  "/images/products/yera/T12M21.jpg",
  "/images/products/yera/T12M23.jpg",
  "/images/products/yera/T12M34.jpg",
  "/images/products/yera/T9AHB.jpg",
  "/images/products/yera/TC-340.jpg",
  "/images/products/yera/TP9-P0_T8G.jpg",
  "/images/products/yera/TS-175.jpg",
  "/images/products/yera/TS-340.jpg",
  "/images/products/yera/TS10HB.jpg",
  "/images/products/yera/TS12-P0.jpg",
  "/images/products/yera/TS7-P0.jpg",
  "/images/products/yera/TS8-P0.jpg",
  "/images/products/yera/WB1.5S.jpg",
  "/images/products/yera/WRJ875(1N)+T6RIB(2N).jpg",
  "/images/products/yera/WT350.jpg",
  "/images/products/pigeon/pop-up-toaster-white.jpg", // Pigeon logo, not a product shot
]);

export function isUsableImage(src: string | null | undefined): src is string {
  return Boolean(src) && !UNUSABLE_IMAGES.has(src as string);
}
