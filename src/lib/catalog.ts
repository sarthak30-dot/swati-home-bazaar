import { supabase } from "@/integrations/supabase/client";

export type CatalogVariant = {
  id: string;
  sku_id: string;
  variant_code: string | null;
  capacity_or_size: string | null;
  color: string | null;
  mrp: number;
  selling_price: number;
  stock_qty: number;
  pack_or_carton_qty: number | null;
  image_url: string | null;
  created_at: string;
  discount_pct: number;
  product_id: string;
  product_name: string;
  product_slug: string;
  description: string | null;
  specifications: Record<string, string> | null;
  is_active: boolean;
  brand_id: string;
  brand_name: string;
  brand_slug: string;
  color_hex: string;
  light_color_hex: string;
  category_id: string | null;
  category_name: string | null;
  category_slug: string | null;
  /** Real average from `reviews`, rounded to 1 decimal. `null` when the product has no reviews yet. */
  rating: number | null;
  rating_count: number;
};

export type Review = {
  id: string;
  customer_id: string;
  product_id: string;
  order_item_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  updated_at: string;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  color_hex: string;
  light_color_hex: string;
  tagline: string | null;
  description: string | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  brand_id: string | null;
};

// Each property admits `undefined` explicitly: callers build this object with
// ternaries that yield `undefined`, which `exactOptionalPropertyTypes: true`
// rejects against a bare `?:`.
export type ShopFilters = {
  brands?: string[] | undefined;
  categories?: string[] | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  minRating?: number | undefined;
  minDiscount?: number | undefined;
  q?: string | undefined;
  sort?: string | undefined;
  page?: number | undefined;
};

export const PAGE_SIZE = 24;

export async function fetchBrands(): Promise<Brand[]> {
  const { data, error } = await supabase
    .from("brands")
    .select("id,name,slug,color_hex,light_color_hex,tagline,description")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as Brand[];
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,brand_id")
    .order("name");
  if (error) throw error;
  return (data ?? []) as Category[];
}

const SELECT = "*";

/**
 * Variant count per category slug, for the department landing pages.
 *
 * Supabase's REST API has no GROUP BY, and an RPC for this would be a schema
 * change. Selecting a single column across the whole catalogue is ~920 short
 * strings, so counting client-side is cheaper than it looks — and React Query
 * caches the result for the session.
 */
export async function fetchCategoryCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("catalog_variants")
    .select("category_slug")
    .eq("is_active", true);
  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const slug = (row as { category_slug: string | null }).category_slug;
    if (slug) counts[slug] = (counts[slug] ?? 0) + 1;
  }
  return counts;
}

export async function fetchShop(filters: ShopFilters) {
  let query = supabase
    .from("catalog_variants")
    .select(SELECT, { count: "exact" })
    .eq("is_active", true);

  if (filters.brands?.length) query = query.in("brand_slug", filters.brands);
  if (filters.categories?.length) query = query.in("category_slug", filters.categories);
  if (filters.minPrice != null) query = query.gte("selling_price", filters.minPrice);
  if (filters.maxPrice != null) query = query.lte("selling_price", filters.maxPrice);
  if (filters.minRating != null) query = query.gte("rating", filters.minRating);
  if (filters.minDiscount != null) query = query.gte("discount_pct", filters.minDiscount);
  if (filters.q) query = query.ilike("product_name", `%${filters.q}%`);

  switch (filters.sort) {
    case "price_asc":
      query = query.order("selling_price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("selling_price", { ascending: false });
      break;
    case "discount":
      query = query.order("discount_pct", { ascending: false });
      break;
    case "rating":
      // Products with no reviews yet have rating = NULL — sink them to the
      // bottom rather than letting Postgres's default NULLS FIRST (for DESC)
      // put unrated products ahead of a genuine 5-star item.
      query = query.order("rating", { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }
  query = query.order("sku_id", { ascending: true });

  const page = filters.page ?? 1;
  const from = (page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  return { items: (data ?? []) as CatalogVariant[], total: count ?? 0 };
}

export async function fetchRail(kind: "deals" | "bestsellers" | "new", limit = 12) {
  let query = supabase
    .from("catalog_variants")
    .select(SELECT)
    .eq("is_active", true)
    .gt("stock_qty", 0);
  if (kind === "deals") query = query.order("discount_pct", { ascending: false });
  else if (kind === "bestsellers") query = query.order("rating_count", { ascending: false });
  else query = query.order("created_at", { ascending: false });
  const { data, error } = await query.limit(limit);
  if (error) throw error;
  return (data ?? []) as CatalogVariant[];
}

/**
 * Candidate "hero" variants for one brand, best first.
 *
 * Returns a pool rather than a single row because whether a variant actually
 * renders a photo depends on the generated image manifest, which lives in the
 * UI layer and is invisible to Postgres. The caller picks the first candidate
 * that resolves to an image.
 */
export async function fetchBrandBest(brandSlug: string, limit = 24) {
  const { data, error } = await supabase
    .from("catalog_variants")
    .select(SELECT)
    .eq("is_active", true)
    .eq("brand_slug", brandSlug)
    .gt("stock_qty", 0)
    .order("rating", { ascending: false })
    .order("rating_count", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as CatalogVariant[];
}

export async function fetchProductBySku(sku: string) {
  const { data, error } = await supabase
    .from("catalog_variants")
    .select(SELECT)
    .eq("sku_id", sku)
    .maybeSingle();
  if (error) throw error;
  return data as CatalogVariant | null;
}

export async function fetchSiblings(productId: string) {
  const { data, error } = await supabase
    .from("catalog_variants")
    .select(SELECT)
    .eq("product_id", productId)
    .order("selling_price");
  if (error) throw error;
  return (data ?? []) as CatalogVariant[];
}

export async function fetchRelated(categorySlug: string | null, excludeProductId: string) {
  if (!categorySlug) return [];
  const { data, error } = await supabase
    .from("catalog_variants")
    .select(SELECT)
    .eq("category_slug", categorySlug)
    .neq("product_id", excludeProductId)
    .limit(10);
  if (error) throw error;
  return (data ?? []) as CatalogVariant[];
}

export async function fetchVariantsByIds(ids: string[]) {
  if (!ids.length) return [];
  const { data, error } = await supabase.from("catalog_variants").select(SELECT).in("id", ids);
  if (error) throw error;
  return (data ?? []) as CatalogVariant[];
}

export async function fetchReviews(productId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Review[];
}

export async function fetchMyReview(productId: string, customerId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .eq("customer_id", customerId)
    .maybeSingle();
  if (error) throw error;
  return data as Review | null;
}

/**
 * The order_item that would back a new review for this product by this
 * customer: a delivered order_item for the product, chosen arbitrarily when
 * more than one qualifies. `undefined` when the customer hasn't bought this
 * product or it hasn't been delivered yet — RLS enforces the same rule
 * server-side, this is only for deciding whether to show the review form.
 */
export async function fetchReviewEligibility(
  productId: string,
  customerId: string,
): Promise<string | undefined> {
  const { data, error } = await supabase
    .from("order_items")
    .select("id, orders!inner(status,customer_id), product_variants!inner(product_id)")
    .eq("orders.customer_id", customerId)
    .eq("orders.status", "delivered")
    .eq("product_variants.product_id", productId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id;
}

export async function submitReview(input: {
  productId: string;
  customerId: string;
  orderItemId: string;
  rating: number;
  title: string | null;
  body: string | null;
}) {
  const { error } = await supabase.from("reviews").insert({
    product_id: input.productId,
    customer_id: input.customerId,
    order_item_id: input.orderItemId,
    rating: input.rating,
    title: input.title,
    body: input.body,
  });
  if (error) throw error;
}

export async function updateReview(
  reviewId: string,
  input: { rating: number; title: string | null; body: string | null },
) {
  const { error } = await supabase.from("reviews").update(input).eq("id", reviewId);
  if (error) throw error;
}
