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
  rating: number;
  rating_count: number;
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

export type ShopFilters = {
  brands?: string[];
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  minDiscount?: number;
  q?: string;
  sort?: string;
  page?: number;
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
      query = query.order("rating", { ascending: false });
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
  let query = supabase.from("catalog_variants").select(SELECT).eq("is_active", true).gt("stock_qty", 0);
  if (kind === "deals") query = query.order("discount_pct", { ascending: false });
  else if (kind === "bestsellers") query = query.order("rating_count", { ascending: false });
  else query = query.order("created_at", { ascending: false });
  const { data, error } = await query.limit(limit);
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
