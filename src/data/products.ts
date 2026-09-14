import type { Product } from "@/types/product";

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
      primary: dubblin("main_image-1788413554536-792894829.webp"),
      hover: dubblin("second_main_image-1788413554537-582086474.webp"),
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
      primary: dubblin("main_image-1786615583998-129817546.webp"),
      hover: dubblin("second_main_image-1786615584028-627875774.webp"),
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
      primary: dubblin("main_image-1787129356948-70224425.webp"),
      hover: dubblin("second_main_image-1787129356949-345659360.webp"),
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
      primary: dubblin("main_image-1772870353545-222062932.webp"),
      hover: dubblin("second_main_image-1772870353545-879569652.webp"),
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
      primary: "",
      hover: "",
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
      primary: "",
      hover: "",
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
      primary: "",
      hover: "",
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
      primary: "",
      hover: "",
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
      primary: yera("TH10ALG_2.jpg"),
      hover: yera("TH10ALG_1_f1b4f8b6-c062-4ded-ac1b-4a99b397c90a.jpg"),
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
      primary: yera("Prima_-_TB320_main_1.jpg"),
      hover: yera("Prima-TB320_3.jpg"),
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
      primary: yera("TH10ALG-Blue_extra1_57359b48-082b-438b-8f6e-b23ee606a86f.jpg"),
      hover: yera("TH10ALG-Blue_main1.jpg"),
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
      primary: yera("TH10ALG-Green_extra1.jpg"),
      hover: yera("TH10ALG-Green_main1.jpg"),
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
      primary: yera("TH10OD_2.jpg"),
      hover: yera("TH10OD_extra1.jpg"),
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
      primary: yera("TH10CB_2_878ae08e-529e-43bd-907a-209dce41de6b.jpg"),
      hover: yera("TH10CB_1.jpg"),
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
      primary: "https://cdn.shopify.com/s/files/1/0733/7967/6327/files/main_1.jpg",
      hover: yera("Carafe_Set_Package_2.png"),
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
      primary: pigeon("stkIPT1lI1FA9rfM1tR3CfghYb0z5JMCDzZj6NRq.webp"),
      hover: "",
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
      primary: pigeon("NvgJCVbz1xDg6bEpKHFAkViRoAb63K24Nab0cdea.webp"),
      hover: "",
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
      primary: pigeon("USMfPT4rkRzGMfTkmn3gGH4LYNI4OkirmtV7v4y2.webp"),
      hover: "",
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
      primary: pigeon("QEPka3lnhym4t0UWanye9BDULkAAcrQqfCq3wucM.webp"),
      hover: "",
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
      primary: pigeon("W6fnc3QNrj9hiOB6JCOtnVjIqfvyXGv6VhK7wLFX.webp"),
      hover: "",
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
      primary: pigeon("vxvsXJZY6HDqdsj91EJfbbo1xhVAbjJc0ZFa7M1B.webp"),
      hover: "",
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
      primary: pigeon("jRKCOegOyKkCbN91N0aWDnHWVQp3wBQgpv9Ouoa7.webp"),
      hover: "",
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
      primary: pigeon("QHYcyDjphdGEMXiA4DWeWmFWJEfZUyo4WouUDQpA.webp"),
      hover: "",
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
