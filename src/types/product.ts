/**
 * Domain types for the Swati Enterprises product catalog.
 *
 * Note: `Brand` here is the human-facing display-name union used in UI logic
 * and seed data. The Supabase DB row shape (with id, slug, color_hex …) lives
 * in src/lib/catalog.ts as `Brand` — alias one on import if you need both:
 *   import type { Brand as BrandRow } from "@/lib/catalog";
 */

export type Brand = "Dubblin" | "YERA Prima" | "Stovekraft Pigeon";

export type MainCategory =
  | "Hydration & On-The-Go"
  | "Luxury Glassware & Bar"
  | "Cookware & Pressure Cookers"
  | "Kitchen Appliances"
  | "Food Storage & Lunch Gear";

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: Brand;
  category: MainCategory;
  subcategory?: string;
  mrp: number;
  sellingPrice: number;
  discountPercentage: number;
  capacity?: string;
  packSize?: number;
  material?: string;
  images: {
    primary: string;
    hover?: string;
  };
  features?: string[];
  inStock: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
}

/** Maps the Supabase brand slug → display Brand name. */
export const BRAND_SLUG_TO_NAME: Record<string, Brand> = {
  pigeon: "Stovekraft Pigeon",
  dubblin: "Dubblin",
  yera: "YERA Prima",
} as const;

/** Maps display Brand name → Tailwind brand-context CSS class. */
export const BRAND_CLASS: Record<Brand, string> = {
  "Stovekraft Pigeon": "brand-pigeon",
  Dubblin: "brand-dubblin",
  "YERA Prima": "brand-yera",
} as const;

/** Maps display Brand name → DB slug (reverse of BRAND_SLUG_TO_NAME). */
export const BRAND_NAME_TO_SLUG: Record<Brand, string> = {
  "Stovekraft Pigeon": "pigeon",
  Dubblin: "dubblin",
  "YERA Prima": "yera",
} as const;

export const ALL_BRANDS: Brand[] = [
  "Stovekraft Pigeon",
  "Dubblin",
  "YERA Prima",
];

export const ALL_CATEGORIES: MainCategory[] = [
  "Hydration & On-The-Go",
  "Luxury Glassware & Bar",
  "Cookware & Pressure Cookers",
  "Kitchen Appliances",
  "Food Storage & Lunch Gear",
];
