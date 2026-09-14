import type { Product } from "@/types/product";

// ── AI image helper ───────────────────────────────────────────────────────────

export function getAiProductImage(prompt: string, seed: number = 42): string {
  const cleanPrompt = encodeURIComponent(
    `commercial studio product photography of ${prompt}, white to soft gray background, 4k, crisp lighting, e-commerce catalog shot, no text, no watermark`,
  );
  return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=600&height=600&seed=${seed}&nologo=true`;
}

// ── Brand CDN helpers (kept for reference; AI images used for all SKUs) ───────

const DUBBLIN_CDN = "https://d2x7cze2eyr23w.cloudfront.net/public/images/";
const YERA_CDN = "https://cdn.shopify.com/s/files/1/0733/7967/6327/files/";
const PIGEON_CDN = "https://www.stovekraft.com/storage/products/cover/";

function dubblin(img: string) {
  return img ? `${DUBBLIN_CDN}${img}` : "";
}
function yera(img: string) {
  return img ? `${YERA_CDN}${img}` : "";
}
function pigeon(img: string) {
  return img ? `${PIGEON_CDN}${img}` : "";
}

function disc(mrp: number, pct: number) {
  return Math.round(mrp * (1 - pct / 100));
}

// ── AI image prompts per SKU ──────────────────────────────────────────────────
// primary seed = product index (stable), hover seed = primary + 100

const AI = {
  // Dubblin
  "db-001": {
    primary: getAiProductImage("Dubblin stainless steel insulated lunch box double wall vacuum silver metallic cylindrical container with lid", 1),
    hover:   getAiProductImage("Dubblin stainless steel insulated lunch box open showing inner compartment", 101),
  },
  "db-002": {
    primary: getAiProductImage("pair of stainless steel travel mugs 360 degree sip lid glossy emerald green set of two", 2),
    hover:   getAiProductImage("stainless steel travel mug top-down view showing 360 degree sip lid emerald green", 102),
  },
  "db-003": {
    primary: getAiProductImage("Dubblin York 540ml stainless steel travel mug ergonomic grip handle push button lid matte finish", 3),
    hover:   getAiProductImage("540ml stainless steel travel mug side angle showing push button and grip ribs", 103),
  },
  "db-004": {
    primary: getAiProductImage("600ml vacuum flask stainless steel wide mouth screw cap cylindrical slim bottle silver", 4),
    hover:   getAiProductImage("600ml stainless steel vacuum flask disassembled showing wide mouth opening and screw cap", 104),
  },
  "db-005": {
    primary: getAiProductImage("550ml slim stainless steel vacuum flask powder coated dark forest green cylindrical sleek", 5),
    hover:   getAiProductImage("550ml slim stainless steel vacuum flask dark green angled view showing bottom and cap", 105),
  },
  "db-006": {
    primary: getAiProductImage("450ml stainless steel travel mug with flip lid one-hand operation matte black car holder", 6),
    hover:   getAiProductImage("450ml stainless steel travel mug flip lid open showing interior matte black", 106),
  },
  "db-007": {
    primary: getAiProductImage("slim insulated stainless steel lunch box two compartments school lunch tiffin silver rectangular", 7),
    hover:   getAiProductImage("insulated lunch box open top view showing two stainless steel inner compartments", 107),
  },
  "db-008": {
    primary: getAiProductImage("750ml borosilicate glass water bottle with mint green silicone sleeve transparent cylindrical", 8),
    hover:   getAiProductImage("borosilicate glass water bottle 750ml without sleeve showing crystal clear glass", 108),
  },

  // YERA Prima
  "yp-001": {
    primary: getAiProductImage("set of 6 premium crystal whiskey glasses 300ml straight edge old fashioned tumbler arranged in triangle", 9),
    hover:   getAiProductImage("single crystal whiskey glass 300ml filled with amber whiskey and ice cubes dramatic lighting", 109),
  },
  "yp-002": {
    primary: getAiProductImage("set of 6 elegant tapered crystal tumbler glasses 320ml arranged in two rows", 10),
    hover:   getAiProductImage("single elegant tapered crystal tumbler glass 320ml filled with clear water and lemon", 110),
  },
  "yp-003": {
    primary: getAiProductImage("set of 6 cobalt blue tinted crystal cocktail glasses 300ml vibrant color arranged in circle", 11),
    hover:   getAiProductImage("single cobalt blue cocktail glass filled with blue cocktail and ice garnished with lime", 111),
  },
  "yp-004": {
    primary: getAiProductImage("set of 6 emerald green tinted crystal cocktail glasses 300ml rich color arranged in pyramid", 12),
    hover:   getAiProductImage("single emerald green cocktail glass filled with mojito mint leaves ice cubes", 112),
  },
  "yp-005": {
    primary: getAiProductImage("set of 6 heavy bottom whiskey glasses octagonal base crystal 285ml arranged in two rows", 13),
    hover:   getAiProductImage("single heavy bottom crystal whiskey glass octagonal European design with whiskey and large ice cube", 113),
  },
  "yp-006": {
    primary: getAiProductImage("set of 6 curved barrel crystal tumbler glasses 300ml water glasses arranged in staggered row", 14),
    hover:   getAiProductImage("single curved barrel crystal tumbler glass filled with orange juice and slice", 114),
  },
  "yp-007": {
    primary: getAiProductImage("crystal glass carafe 1 litre with two matching wine glasses elegant dining gift set", 15),
    hover:   getAiProductImage("crystal glass carafe filled with red wine alongside two matching glasses on dark wood table", 115),
  },

  // Stovekraft Pigeon
  "pg-001": {
    primary: getAiProductImage("Pigeon electric kettle 1.5 litre stainless steel cordless 360 degree swivel base silver", 16),
    hover:   getAiProductImage("electric kettle 1.5L stainless steel lid open showing interior hidden heating element", 116),
  },
  "pg-002": {
    primary: getAiProductImage("Pigeon multi function electric kettle 1.5 litre stainless steel with temperature dial and steamer basket", 17),
    hover:   getAiProductImage("multi cook electric kettle 1.5L with detachable steamer basket shown separately on side", 117),
  },
  "pg-003": {
    primary: getAiProductImage("Pigeon 3 litre ceramic coated aluminium pressure cooker red lid ISI certified induction gas compatible", 18),
    hover:   getAiProductImage("3 litre ceramic pressure cooker open lid top view showing inner ceramic non stick coating", 118),
  },
  "pg-004": {
    primary: getAiProductImage("Pigeon 5 litre ceramic coated aluminium pressure cooker red lid large family size induction", 19),
    hover:   getAiProductImage("5 litre ceramic pressure cooker angled side view showing safety valve and ergonomic handles", 119),
  },
  "pg-005": {
    primary: getAiProductImage("Pigeon Joy electric biryani rice cooker 1.8 litre non stick inner pot with steamer basket digital", 20),
    hover:   getAiProductImage("electric biryani cooker 1.8L open showing non stick inner pot with rice inside steam rising", 120),
  },
  "pg-006": {
    primary: getAiProductImage("Pigeon Joy electric biryani cooker 2.8 litre large capacity non stick keep warm function", 21),
    hover:   getAiProductImage("2.8L electric biryani cooker with lid open and dual layer steamer basket shown", 121),
  },
  "pg-007": {
    primary: getAiProductImage("Pigeon INOX Pro 1 litre electric cooker premium stainless steel inner pot compact size", 22),
    hover:   getAiProductImage("compact 1L electric cooker stainless steel inner pot lifted out showing mirror finish interior", 122),
  },
  "pg-008": {
    primary: getAiProductImage("Pigeon Crispa 4 litre air fryer digital touch screen display with non stick frying basket black", 23),
    hover:   getAiProductImage("air fryer 4L with basket pulled out showing food rack inside crispy fries", 123),
  },
} as const;

export const PRODUCTS: Product[] = [
  // ── DUBBLIN ────────────────────────────────────────────────────────────────

  {
    id: "db-001",
    sku: "DB-DREAM-LB",
    name: "Dream Lunch Box",
    brand: "Dubblin",
    category: "Food Storage & Lunch Gear",
    subcategory: "Insulated Lunchbox",
    mrp: 1549,
    sellingPrice: disc(1549, 15),
    discountPercentage: 15,
    material: "Stainless Steel",
    images: {
      primary: dubblin("main_image-1788413554536-792894829.webp") || AI["db-001"].primary,
      hover:   dubblin("second_main_image-1788413554537-582086474.webp") || AI["db-001"].hover,
    },
    features: [
      "Double-wall vacuum insulation",
      "Leak-proof lid",
      "Keeps food hot/cold for 6 hrs",
    ],
    inStock: true,
    isBestSeller: true,
  },

  {
    id: "db-002",
    sku: "DB-RUGBY-MUG2",
    name: "Rugby 2-Piece Mug Set",
    brand: "Dubblin",
    category: "Hydration & On-The-Go",
    subcategory: "Travel Mug",
    mrp: 839,
    sellingPrice: disc(839, 15),
    discountPercentage: 15,
    packSize: 2,
    material: "Stainless Steel",
    images: {
      primary: dubblin("main_image-1786615583998-129817546.webp") || AI["db-002"].primary,
      hover:   dubblin("second_main_image-1786615584028-627875774.webp") || AI["db-002"].hover,
    },
    features: [
      "360° sip lid",
      "Double-wall insulation",
      "BPA-free inner coating",
    ],
    inStock: true,
    isNewArrival: true,
  },

  {
    id: "db-003",
    sku: "DB-YORK-540",
    name: "York 540ml Travel Mug",
    brand: "Dubblin",
    category: "Hydration & On-The-Go",
    subcategory: "Travel Mug",
    mrp: 659,
    sellingPrice: disc(659, 15),
    discountPercentage: 15,
    capacity: "540ml",
    material: "Stainless Steel",
    images: {
      primary: dubblin("main_image-1787129356948-70224425.webp") || AI["db-003"].primary,
      hover:   dubblin("second_main_image-1787129356949-345659360.webp") || AI["db-003"].hover,
    },
    features: [
      "Ergonomic grip handle",
      "Spill-proof push-button lid",
      "Fits standard car cup holders",
    ],
    inStock: true,
    isBestSeller: true,
  },

  {
    id: "db-004",
    sku: "DB-CREST-600",
    name: "Crest 600ml Vacuum Flask",
    brand: "Dubblin",
    category: "Hydration & On-The-Go",
    subcategory: "Vacuum Flask",
    mrp: 1129,
    sellingPrice: disc(1129, 15),
    discountPercentage: 15,
    capacity: "600ml",
    material: "Stainless Steel",
    images: {
      primary: dubblin("main_image-1772870353545-222062932.webp") || AI["db-004"].primary,
      hover:   dubblin("second_main_image-1772870353545-879569652.webp") || AI["db-004"].hover,
    },
    features: [
      "18/8 food-grade stainless steel interior",
      "Keeps hot 12 hrs / cold 24 hrs",
      "Wide-mouth easy-clean design",
    ],
    inStock: true,
  },

  {
    id: "db-005",
    sku: "DB-ZOOM-550",
    name: "Zoom 550ml Vacuum Flask",
    brand: "Dubblin",
    category: "Hydration & On-The-Go",
    subcategory: "Vacuum Flask",
    mrp: 995,
    sellingPrice: disc(995, 15),
    discountPercentage: 15,
    capacity: "550ml",
    material: "Stainless Steel",
    images: {
      primary: AI["db-005"].primary,
      hover:   AI["db-005"].hover,
    },
    features: [
      "Slim cylindrical silhouette",
      "Powder-coated exterior",
      "Leak-proof screw cap",
    ],
    inStock: true,
  },

  {
    id: "db-006",
    sku: "DB-CRAZE-450",
    name: "Craze 450ml Travel Mug",
    brand: "Dubblin",
    category: "Hydration & On-The-Go",
    subcategory: "Travel Mug",
    mrp: 749,
    sellingPrice: disc(749, 15),
    discountPercentage: 15,
    capacity: "450ml",
    material: "Stainless Steel",
    images: {
      primary: AI["db-006"].primary,
      hover:   AI["db-006"].hover,
    },
    features: [
      "Push-button flip lid",
      "One-hand operation",
      "Car-cup-holder compatible",
    ],
    inStock: true,
  },

  {
    id: "db-007",
    sku: "DB-SLIM-LB",
    name: "Slim Insulated Lunchbox",
    brand: "Dubblin",
    category: "Food Storage & Lunch Gear",
    subcategory: "Insulated Lunchbox",
    mrp: 1349,
    sellingPrice: disc(1349, 15),
    discountPercentage: 15,
    material: "Stainless Steel",
    images: {
      primary: AI["db-007"].primary,
      hover:   AI["db-007"].hover,
    },
    features: [
      "Slim profile fits in school bags",
      "2-compartment stainless inner",
      "Keeps food warm 4-5 hrs",
    ],
    inStock: true,
  },

  {
    id: "db-008",
    sku: "DB-STREAM-750",
    name: "Stream 750ml Borosilicate Bottle",
    brand: "Dubblin",
    category: "Hydration & On-The-Go",
    subcategory: "Glass Water Bottle",
    mrp: 849,
    sellingPrice: disc(849, 15),
    discountPercentage: 15,
    capacity: "750ml",
    material: "Borosilicate Glass",
    images: {
      primary: AI["db-008"].primary,
      hover:   AI["db-008"].hover,
    },
    features: [
      "Heat-resistant borosilicate glass",
      "Silicone sleeve for grip",
      "BPA-free, dishwasher safe",
    ],
    inStock: true,
    isNewArrival: true,
  },

  // ── YERA PRIMA ─────────────────────────────────────────────────────────────

  {
    id: "yp-001",
    sku: "YP-PRIMA-OAK-300",
    name: "Prima Oak Whiskey Glasses — Set of 6",
    brand: "YERA Prima",
    category: "Luxury Glassware & Bar",
    subcategory: "Whiskey Glasses",
    mrp: 360,
    sellingPrice: 360,
    discountPercentage: 0,
    capacity: "300ml",
    packSize: 6,
    material: "Crystal-clear glass",
    images: {
      primary: yera("TH10ALG_2.jpg") || AI["yp-001"].primary,
      hover:   yera("TH10ALG_1_f1b4f8b6-c062-4ded-ac1b-4a99b397c90a.jpg") || AI["yp-001"].hover,
    },
    features: [
      "Premium crystal-clarity glass",
      "Classic straight-edge tumbler profile",
      "Dishwasher safe",
      "Gift-box ready",
    ],
    inStock: true,
    isBestSeller: true,
  },

  {
    id: "yp-002",
    sku: "YP-PRIMA-ORIANA-320",
    name: "Prima Oriana Tumblers — Set of 6",
    brand: "YERA Prima",
    category: "Luxury Glassware & Bar",
    subcategory: "Tumblers",
    mrp: 455,
    sellingPrice: 455,
    discountPercentage: 0,
    capacity: "320ml",
    packSize: 6,
    material: "Crystal-clear glass",
    images: {
      primary: yera("Prima_-_TB320_main_1.jpg") || AI["yp-002"].primary,
      hover:   yera("Prima-TB320_3.jpg") || AI["yp-002"].hover,
    },
    features: [
      "Elegant tapered silhouette",
      "Lead-free crystal glass",
      "Stackable design",
    ],
    inStock: true,
    isBestSeller: true,
  },

  {
    id: "yp-003",
    sku: "YP-PRIMA-MRC-BLUE",
    name: "Prima Morocco Blue Color Glasses — Set of 6",
    brand: "YERA Prima",
    category: "Luxury Glassware & Bar",
    subcategory: "Color Glasses",
    mrp: 460,
    sellingPrice: 460,
    discountPercentage: 0,
    capacity: "300ml",
    packSize: 6,
    material: "Colored crystal glass",
    images: {
      primary: yera("TH10ALG-Blue_extra1_57359b48-082b-438b-8f6e-b23ee606a86f.jpg") || AI["yp-003"].primary,
      hover:   yera("TH10ALG-Blue_main1.jpg") || AI["yp-003"].hover,
    },
    features: [
      "Vibrant cobalt-blue tint",
      "Colour-safe food-grade glass",
      "Ideal for cocktails & mocktails",
    ],
    inStock: true,
    isNewArrival: true,
  },

  {
    id: "yp-004",
    sku: "YP-PRIMA-MRC-GREEN",
    name: "Prima Morocco Green Color Glasses — Set of 6",
    brand: "YERA Prima",
    category: "Luxury Glassware & Bar",
    subcategory: "Color Glasses",
    mrp: 460,
    sellingPrice: 460,
    discountPercentage: 0,
    capacity: "300ml",
    packSize: 6,
    material: "Colored crystal glass",
    images: {
      primary: yera("TH10ALG-Green_extra1.jpg") || AI["yp-004"].primary,
      hover:   yera("TH10ALG-Green_main1.jpg") || AI["yp-004"].hover,
    },
    features: [
      "Emerald-green tint",
      "Colour-safe food-grade glass",
      "Ideal for cocktails & mocktails",
    ],
    inStock: true,
    isNewArrival: true,
  },

  {
    id: "yp-005",
    sku: "YP-PRIMA-GENEVA-285",
    name: "Prima Geneva Glasses — Set of 6",
    brand: "YERA Prima",
    category: "Luxury Glassware & Bar",
    subcategory: "Whiskey Glasses",
    mrp: 525,
    sellingPrice: 525,
    discountPercentage: 0,
    capacity: "285ml",
    packSize: 6,
    material: "Crystal-clear glass",
    images: {
      primary: yera("TH10OD_2.jpg") || AI["yp-005"].primary,
      hover:   yera("TH10OD_extra1.jpg") || AI["yp-005"].hover,
    },
    features: [
      "European-inspired octagonal base",
      "Heavy-bottomed anti-tip design",
      "Elegant for whiskey & spirits",
    ],
    inStock: true,
    isBestSeller: true,
  },

  {
    id: "yp-006",
    sku: "YP-PRIMA-VENICE-300",
    name: "Prima Venice Glasses — Set of 6",
    brand: "YERA Prima",
    category: "Luxury Glassware & Bar",
    subcategory: "Tumblers",
    mrp: 485,
    sellingPrice: 485,
    discountPercentage: 0,
    capacity: "300ml",
    packSize: 6,
    material: "Crystal-clear glass",
    images: {
      primary: yera("TH10CB_2_878ae08e-529e-43bd-907a-209dce41de6b.jpg") || AI["yp-006"].primary,
      hover:   yera("TH10CB_1.jpg") || AI["yp-006"].hover,
    },
    features: [
      "Curved barrel silhouette",
      "Crystal clarity with fine rim",
      "Perfect for water, juice & cocktails",
    ],
    inStock: true,
  },

  {
    id: "yp-007",
    sku: "YP-PRIMA-SANTORINI",
    name: "Prima Santorini Carafe Set",
    brand: "YERA Prima",
    category: "Luxury Glassware & Bar",
    subcategory: "Carafe & Decanter",
    mrp: 725,
    sellingPrice: 725,
    discountPercentage: 0,
    packSize: 3,
    material: "Crystal-clear glass",
    images: {
      primary: yera("main_1.jpg") || AI["yp-007"].primary,
      hover:   yera("Carafe_Set_Package_2.png") || AI["yp-007"].hover,
    },
    features: [
      "1 carafe + 2 matching glasses",
      "Handcrafted crystal glass",
      "Ideal gifting set",
      "Elegant for dining table",
    ],
    inStock: true,
    isBestSeller: true,
  },

  // ── STOVEKRAFT PIGEON ───────────────────────────────────────────────────────

  {
    id: "pg-001",
    sku: "PG-KETTLE-HOT-1.5",
    name: "Hot Electric Kettle 1.5L",
    brand: "Stovekraft Pigeon",
    category: "Kitchen Appliances",
    subcategory: "Electric Kettle",
    mrp: 1095,
    sellingPrice: disc(1095, 15),
    discountPercentage: 15,
    capacity: "1.5L",
    material: "Stainless Steel",
    images: {
      primary: pigeon("stkIPT1lI1FA9rfM1tR3CfghYb0z5JMCDzZj6NRq.webp") || AI["pg-001"].primary,
      hover:   AI["pg-001"].hover,
    },
    features: [
      "1500W rapid boil",
      "Auto shut-off & boil-dry protection",
      "360° cordless swivel base",
      "Hidden SS heating element",
    ],
    inStock: true,
    isBestSeller: true,
  },

  {
    id: "pg-002",
    sku: "PG-SWIFT-KETTLE-1.5",
    name: "Swift Multi-Cook Kettle 1.5L",
    brand: "Stovekraft Pigeon",
    category: "Kitchen Appliances",
    subcategory: "Multi-Cook Kettle",
    mrp: 2145,
    sellingPrice: disc(2145, 15),
    discountPercentage: 15,
    capacity: "1.5L",
    material: "Stainless Steel",
    images: {
      primary: pigeon("NvgJCVbz1xDg6bEpKHFAkViRoAb63K24Nab0cdea.webp") || AI["pg-002"].primary,
      hover:   AI["pg-002"].hover,
    },
    features: [
      "Multi-cook — boil, steam & poach",
      "Temperature control dial",
      "Detachable steaming basket",
      "Keep-warm function",
    ],
    inStock: true,
    isNewArrival: true,
  },

  {
    id: "pg-003",
    sku: "PG-MABEL-CER-3L",
    name: "Mabel Ceramic Pressure Cooker 3L",
    brand: "Stovekraft Pigeon",
    category: "Cookware & Pressure Cookers",
    subcategory: "Ceramic Pressure Cooker",
    mrp: 2795,
    sellingPrice: disc(2795, 15),
    discountPercentage: 15,
    capacity: "3L",
    material: "Ceramic-coated Aluminium",
    images: {
      primary: pigeon("USMfPT4rkRzGMfTkmn3gGH4LYNI4OkirmtV7v4y2.webp") || AI["pg-003"].primary,
      hover:   AI["pg-003"].hover,
    },
    features: [
      "5-layer ceramic non-stick coating",
      "ISI-certified safety valve",
      "Compatible with gas & induction",
      "Inner-lid design for easy cleaning",
    ],
    inStock: true,
    isBestSeller: true,
  },

  {
    id: "pg-004",
    sku: "PG-MABEL-CER-5L",
    name: "Mabel Ceramic Pressure Cooker 5L",
    brand: "Stovekraft Pigeon",
    category: "Cookware & Pressure Cookers",
    subcategory: "Ceramic Pressure Cooker",
    mrp: 3445,
    sellingPrice: disc(3445, 15),
    discountPercentage: 15,
    capacity: "5L",
    material: "Ceramic-coated Aluminium",
    images: {
      primary: pigeon("QEPka3lnhym4t0UWanye9BDULkAAcrQqfCq3wucM.webp") || AI["pg-004"].primary,
      hover:   AI["pg-004"].hover,
    },
    features: [
      "5-layer ceramic non-stick coating",
      "ISI-certified safety valve",
      "Compatible with gas & induction",
      "Inner-lid design for easy cleaning",
    ],
    inStock: true,
  },

  {
    id: "pg-005",
    sku: "PG-JOY-ERC-1.8",
    name: "Joy Unlimited Electric Biryani Cooker 1.8L",
    brand: "Stovekraft Pigeon",
    category: "Kitchen Appliances",
    subcategory: "Electric Rice & Biryani Cooker",
    mrp: 3695,
    sellingPrice: disc(3695, 15),
    discountPercentage: 15,
    capacity: "1.8L",
    material: "Aluminium inner pot",
    images: {
      primary: pigeon("W6fnc3QNrj9hiOB6JCOtnVjIqfvyXGv6VhK7wLFX.webp") || AI["pg-005"].primary,
      hover:   AI["pg-005"].hover,
    },
    features: [
      "Auto cook-to-keep-warm switch",
      "Non-stick inner pot",
      "Dual-layer steamer basket",
      "Preset biryani/rice/steam modes",
    ],
    inStock: true,
    isBestSeller: true,
  },

  {
    id: "pg-006",
    sku: "PG-JOY-ERC-2.8",
    name: "Joy Unlimited Electric Biryani Cooker 2.8L",
    brand: "Stovekraft Pigeon",
    category: "Kitchen Appliances",
    subcategory: "Electric Rice & Biryani Cooker",
    mrp: 5795,
    sellingPrice: disc(5795, 15),
    discountPercentage: 15,
    capacity: "2.8L",
    material: "Aluminium inner pot",
    images: {
      primary: pigeon("vxvsXJZY6HDqdsj91EJfbbo1xhVAbjJc0ZFa7M1B.webp") || AI["pg-006"].primary,
      hover:   AI["pg-006"].hover,
    },
    features: [
      "Auto cook-to-keep-warm switch",
      "Non-stick inner pot",
      "Dual-layer steamer basket",
      "Serves 6-8 people",
    ],
    inStock: true,
  },

  {
    id: "pg-007",
    sku: "PG-INOX-PRO-STMR-1",
    name: "INOX Pro with Steamer Electric Cooker 1L",
    brand: "Stovekraft Pigeon",
    category: "Kitchen Appliances",
    subcategory: "Electric Rice & Biryani Cooker",
    mrp: 4049,
    sellingPrice: disc(4049, 15),
    discountPercentage: 15,
    capacity: "1L",
    material: "Stainless Steel inner pot",
    images: {
      primary: pigeon("jRKCOegOyKkCbN91N0aWDnHWVQp3wBQgpv9Ouoa7.webp") || AI["pg-007"].primary,
      hover:   AI["pg-007"].hover,
    },
    features: [
      "Premium SS inner pot — rust-free",
      "Integrated steamer basket",
      "Automatic keep-warm",
      "Compact — ideal for 1-2 people",
    ],
    inStock: true,
    isNewArrival: true,
  },

  {
    id: "pg-008",
    sku: "PG-AIRFRY-CRISPA",
    name: "Air Fryer Crispa 4L",
    brand: "Stovekraft Pigeon",
    category: "Kitchen Appliances",
    subcategory: "Air Fryer",
    mrp: 5495,
    sellingPrice: disc(5495, 15),
    discountPercentage: 15,
    capacity: "4L",
    material: "ABS + food-grade non-stick basket",
    images: {
      primary: pigeon("QHYcyDjphdGEMXiA4DWeWmFWJEfZUyo4WouUDQpA.webp") || AI["pg-008"].primary,
      hover:   AI["pg-008"].hover,
    },
    features: [
      "1400W rapid-air technology",
      "8 preset cooking functions",
      "Digital touch display",
      "Dishwasher-safe removable basket",
      "Up to 85% less oil than deep-frying",
    ],
    inStock: true,
    isBestSeller: true,
  },
];

/**
 * Returns the best available image URL for a product.
 * Use this everywhere instead of reading `product.images.primary` directly.
 *
 * Priority: realAsset (local /public file) → primary (AI or CDN URL)
 */
export function resolveProductImage(product: Product): string {
  return product.images.realAsset ?? product.images.primary;
}

export function getProductsByBrand(brand: Product["brand"]) {
  return PRODUCTS.filter((p) => p.brand === brand);
}

export function getProductsByCategory(category: Product["category"]) {
  return PRODUCTS.filter((p) => p.category === category);
}

export function getProductById(id: string) {
  return PRODUCTS.find((p) => p.id === id) ?? null;
}

export function getBestSellers() {
  return PRODUCTS.filter((p) => p.isBestSeller);
}

export function getNewArrivals() {
  return PRODUCTS.filter((p) => p.isNewArrival);
}
