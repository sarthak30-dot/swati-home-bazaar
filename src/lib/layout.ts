/**
 * The product grid, shared by every page that lists products (shop, brand,
 * department, wishlist) so the density stays identical across the store.
 *
 * Tuned for the Myntra/Meesho density the brief asks for: tight gutters and as
 * many columns as the container can carry without the card dropping below
 * roughly 180px, which is where the price line and the "+N sizes" chip start
 * to crowd.
 *
 * Inside the shop's 1280px container, 240px of filter sidebar and a 24px
 * column gap leave ~984px, so five columns give ~187px per card.
 */
export const PRODUCT_GRID =
  "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5";

/**
 * As above, for pages with no sidebar (brand, department, wishlist): the full
 * container width fits one more column before hitting the same floor.
 */
export const PRODUCT_GRID_WIDE =
  "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";
