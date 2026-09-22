/**
 * Customer-facing department taxonomy.
 *
 * The 51 rows in `categories` come straight from the Pigeon / Yera / Dubblin
 * supplier catalogues, so they are brand-scoped and use trade jargon: a shopper
 * looking for a water bottle would otherwise have to visit eight different
 * categories across three brands. This module groups those 51 into six
 * departments that match shopping intent, and demotes brand + material to
 * filters.
 *
 * Nothing here touches the database. `categories` remains the source of truth
 * and keeps working as a sub-category/series facet inside each department.
 */

export type DepartmentSlug =
  | "cookware"
  | "drinkware-bottles"
  | "kitchen-appliances"
  | "storage-serveware"
  | "lunch-boxes"
  | "home-personal-care";

export type Department = {
  slug: DepartmentSlug;
  name: string;
  blurb: string;
  /** Category slugs (from `categories.slug`) that roll up into this department. */
  categorySlugs: string[];
};

export const DEPARTMENTS: Department[] = [
  {
    slug: "cookware",
    name: "Cookware",
    blurb: "Pressure cookers, kadhais, tawas and pans",
    categorySlugs: [
      "pigeon-pressure-cookers",
      "pigeon-non-stick-cookware",
      "pigeon-stainless-steel-cookware",
      "pigeon-tri-ply-cookware",
      "pigeon-cast-iron-cookware-imperi",
      "pigeon-non-stick-cookware-storm",
      "pigeon-non-stick-gift-sets",
      "pigeon-hard-anodised-cookware",
      "pigeon-cast-iron-cookware-imperi-luxe",
      "pigeon-die-cast-cookware",
    ],
  },
  {
    slug: "drinkware-bottles",
    name: "Drinkware & Bottles",
    blurb: "Vacuum flasks, tumblers, mugs and glasses",
    categorySlugs: [
      "yera-tumblers",
      "pigeon-water-bottles-vacuum-ss",
      "dubblin-ss-vacuum-bottles",
      "yera-beer-juice-mugs",
      "dubblin-ss-vacuum-mugs",
      "pigeon-water-bottles-pu-insulated",
      "yera-cups-mugs",
      "dubblin-ss-double-wall-mugs",
      "dubblin-ss-single-wall-bottles",
      "pigeon-water-bottles-single-wall",
      "pigeon-water-bottles-clear-glass",
      "pigeon-water-bottles-thermo-cup",
      "yera-tumblers-coated",
      "yera-wine-glasses",
      "yera-sipper-bottles",
    ],
  },
  {
    slug: "kitchen-appliances",
    name: "Kitchen Appliances",
    blurb: "Cooktops, mixers, chimneys and ovens",
    categorySlugs: [
      "pigeon-gas-cooktops",
      "pigeon-mixer-grinders-juicers",
      "pigeon-rice-cookers",
      "pigeon-kettles-kessels",
      "pigeon-gas-cooktops-ss",
      "pigeon-chimneys",
      "pigeon-small-appliances",
      "pigeon-hobs",
      "pigeon-electric-ovens-otgs",
      "pigeon-induction-cooktops",
      "pigeon-air-fryers",
      "pigeon-infrared-cooktops",
    ],
  },
  {
    slug: "storage-serveware",
    name: "Storage & Serveware",
    blurb: "Glass jars, bowls, containers and gift sets",
    categorySlugs: [
      "yera-jars",
      "dubblin-ss-containers",
      "yera-int-l-series",
      "yera-bowls",
      "yera-combo-packs",
      "yera-ice-cream-bowls",
      "yera-lemon-set-jug",
    ],
  },
  {
    slug: "lunch-boxes",
    name: "Lunch Boxes",
    blurb: "Insulated tiffins for office and school",
    categorySlugs: ["dubblin-ss-pu-insulated-lunch-boxes", "pigeon-lunch-boxes"],
  },
  {
    slug: "home-personal-care",
    name: "Home & Personal Care",
    blurb: "Kitchen tools, lighting, grooming and garment care",
    categorySlugs: [
      "pigeon-kitchen-utilities",
      "pigeon-personal-care",
      "pigeon-led-lights-emergency-lamps",
      "pigeon-garment-care",
      "pigeon-home-solutions",
    ],
  },
];

/**
 * Cookware material, recovered as a filter.
 *
 * Merging ten supplier categories into one Cookware department would otherwise
 * throw away the non-stick / cast-iron distinction, which is the first thing a
 * cookware buyer narrows on.
 */
export const MATERIALS: { label: string; categorySlugs: string[] }[] = [
  {
    label: "Non-stick",
    categorySlugs: [
      "pigeon-non-stick-cookware",
      "pigeon-non-stick-cookware-storm",
      "pigeon-non-stick-gift-sets",
    ],
  },
  {
    label: "Stainless steel",
    categorySlugs: ["pigeon-stainless-steel-cookware", "pigeon-tri-ply-cookware"],
  },
  {
    label: "Cast iron",
    categorySlugs: ["pigeon-cast-iron-cookware-imperi", "pigeon-cast-iron-cookware-imperi-luxe"],
  },
  { label: "Hard anodised", categorySlugs: ["pigeon-hard-anodised-cookware"] },
  { label: "Die-cast", categorySlugs: ["pigeon-die-cast-cookware"] },
];

const CATEGORY_TO_DEPARTMENT = new Map<string, Department>(
  DEPARTMENTS.flatMap((d) => d.categorySlugs.map((slug) => [slug, d] as const)),
);

export function departmentForCategory(categorySlug: string | null): Department | undefined {
  return categorySlug ? CATEGORY_TO_DEPARTMENT.get(categorySlug) : undefined;
}

export function departmentBySlug(slug: string): Department | undefined {
  return DEPARTMENTS.find((d) => d.slug === slug);
}

/**
 * Warn when the map and the database have drifted apart.
 *
 * The seed pipeline upserts categories, so a new supplier range adds rows here
 * without touching this file. An unmapped category belongs to no department and
 * is unreachable from the main navigation, which is easy to miss in review.
 */
export function assertCategoriesMapped(dbCategorySlugs: string[]): void {
  if (!import.meta.env.DEV) return;

  const mapped = new Set(CATEGORY_TO_DEPARTMENT.keys());
  const unmapped = dbCategorySlugs.filter((s) => !mapped.has(s));
  const stale = [...mapped].filter((s) => !dbCategorySlugs.includes(s));

  if (unmapped.length) {
    console.error(
      `[departments] ${unmapped.length} category slug(s) are not in any department and will be ` +
        `invisible in the department navigation:\n  ${unmapped.join("\n  ")}`,
    );
  }
  if (stale.length) {
    console.warn(
      `[departments] mapped slug(s) no longer in the database:\n  ${stale.join("\n  ")}`,
    );
  }
}
