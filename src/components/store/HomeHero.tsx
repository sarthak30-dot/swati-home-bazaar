import { Link } from "@tanstack/react-router";

/** Words cycled through by the headline rotator. Keep to three: the CSS
 *  keyframe divides one 9s cycle into three equal 3s slots. */
const ROTATING = ["every kitchen.", "every festival.", "every order."];

/** Public bucket holding the photography sourced from the brands' own sites. */
const SOURCED =
  "https://nvrkfhjsnepwqgjhjekt.supabase.co/storage/v1/object/public/product-images/brand-sourced";

/**
 * Collage of product photography, curated by hand.
 *
 * It used to be five Dubblin tiles, because Dubblin was once the only brand
 * with images above 800px. That is no longer true: 233 SKUs now carry
 * photography taken from the brands' own sites, Yera's at 3000px. Five tiles
 * of one brand also misrepresented the shop — Pigeon is 565 of 920 SKUs, and
 * the headline names three brands while the picture showed one, with
 * "Dubblin" printed across every bottle.
 *
 * So the set is balanced two Yera / two Pigeon / one Dubblin. Yera's are warm
 * lifestyle shots that carry the mood; Pigeon's are styled cutouts on white,
 * which sit happily on the cream tile. Dubblin has no sourced photography yet
 * — its site cannot be enumerated — so it keeps a catalogue page and the crop
 * that hides the wholesale header.
 *
 * To refresh: pick from `product_variants` where `image_source_url` is not
 * null, favouring images that are square and at least 1000px.
 */
type Tile = {
  src: string;
  alt: string;
  /** Grid placement; empty means a single cell. */
  cls?: string;
  tilt: string;
  delay: string;
  dur: string;
  /** Catalogue page: zoom past the wholesale header at the top of the scan. */
  crop?: boolean;
  /** Hidden on the narrowest screens to keep the hero inside one phone screen. */
  smallScreen?: boolean;
};

const TILES: Tile[] = [
  {
    src: `${SOURCED}/KR-0800.jpg`,
    alt: "Yera glass storage jar of lentils on a kitchen counter",
    cls: "col-span-2 row-span-2",
    tilt: "-2deg",
    delay: "0s",
    dur: "7s",
    smallScreen: true,
  },
  {
    src: `${SOURCED}/19004521.webp`,
    alt: "Pigeon digital air fryer with a basket of chips",
    tilt: "3deg",
    delay: "0.9s",
    dur: "8.5s",
    smallScreen: true,
  },
  {
    src: `${SOURCED}/B12SB.jpg`,
    alt: "Yera glass serving bowl filled with nuts",
    tilt: "-4deg",
    delay: "1.8s",
    dur: "6.5s",
    smallScreen: true,
  },
  {
    src: "/images/products/dubblin/dolphin.jpg",
    alt: "Dubblin insulated steel bottles",
    tilt: "4deg",
    delay: "0.4s",
    dur: "9s",
    crop: true,
  },
  {
    src: `${SOURCED}/19003863.webp`,
    alt: "Pigeon sandwich toaster",
    tilt: "-3deg",
    delay: "1.3s",
    dur: "7.5s",
  },
  // Sixth tile fills the last cell: with five, the 3x3 grid left its
  // bottom-right corner empty and the collage never resolved to a rectangle.
  {
    src: `${SOURCED}/KSM-235.jpg`,
    alt: "Yera wood-lidded glass storage jars of almonds and sweets",
    tilt: "2deg",
    delay: "2.2s",
    dur: "8s",
  },
];

/**
 * The collage's own image paths, so the data-driven sections below it
 * (BrandSpotlight, New arrivals) can skip re-showing one of these same
 * photos — the hero already claimed them.
 */
export const HERO_IMAGE_PATHS: string[] = TILES.map((t) => t.src);

export function HomeHero({ skuCount }: { skuCount?: number | undefined }) {
  const skuLabel = skuCount != null ? skuCount.toLocaleString("en-IN") : null;
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="hero-mesh absolute inset-0 -z-10" aria-hidden="true" />

      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:gap-10 lg:grid-cols-[1.05fr_1fr] lg:py-16">
        {/* ---- copy ---- */}
        <div>
          <span
            className="animate-rise inline-flex items-center rounded-full border border-gold/30 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold backdrop-blur"
            style={{ animationDelay: "0.05s" }}
          >
            Chandni Chowk, Delhi · Est. Wholesale &amp; Retail
          </span>

          <h1
            className="animate-rise mt-5 font-display text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl"
            style={{ animationDelay: "0.15s" }}
          >
            <span className="block">Built for</span>
            {/* Block, not inline: "Built for" and the rotator always sit on
                their own flush-left line each, rather than one depending on
                whether the text happens to wrap at the viewport's width (the
                bug: an inline rotator carried its left margin onto whichever
                line it landed on, so the two lines only aligned by accident).
                The rotator is still a grid so all three words occupy one
                cell; the tallest word sets the height and the line below
                never shifts as the words swap. */}
            <span className="word-rotator relative grid w-fit text-left align-baseline">
              {ROTATING.map((word, i) => (
                <span
                  key={word}
                  /* Only the first word is exposed to assistive tech. All three
                     are in the DOM at once, so without this a screen reader
                     announces the heading as one run-on sentence. */
                  aria-hidden={i > 0}
                  className="animate-word col-start-1 row-start-1 whitespace-nowrap text-gold"
                  style={{ animationDelay: `${i * 3}s` }}
                >
                  {word}
                </span>
              ))}
            </span>
          </h1>

          <p
            className="animate-rise mt-5 max-w-xl text-base text-foreground/75 sm:text-lg"
            style={{ animationDelay: "0.25s" }}
          >
            {skuLabel ?? "Hundreds of"} genuine SKUs from Pigeon, Dubblin and Yera Glassware &mdash;
            delivered across Delhi, and shipped pan-India for bulk orders.
          </p>

          <div
            className="animate-rise mt-7 flex flex-wrap gap-3"
            style={{ animationDelay: "0.35s" }}
          >
            <Link
              to="/shop"
              className="rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gold/25 transition hover:-translate-y-0.5 hover:opacity-90"
            >
              Shop all products
            </Link>
            <Link
              to="/bulk-orders"
              className="rounded-xl border border-gold bg-white/60 px-6 py-3 text-sm font-semibold text-gold backdrop-blur transition hover:-translate-y-0.5 hover:bg-gold/10"
            >
              Enquire about bulk orders
            </Link>
          </div>

          <dl
            className="animate-rise mt-8 flex flex-wrap gap-x-8 gap-y-3"
            style={{ animationDelay: "0.45s" }}
          >
            {[
              [skuLabel ?? "—", "Genuine SKUs"],
              ["3", "Trusted brands"],
              ["Pan-India", "Bulk delivery"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="font-display text-2xl font-bold text-gold">{value}</dt>
                <dd className="text-xs text-muted-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ---- drifting collage ---- */}
        {/* Fixed row heights keep the collage from ballooning on narrow screens,
            where it sits under the copy rather than beside it. The two tiles
            that carry no brand of their own are dropped below sm so the whole
            hero still fits a phone screen. */}
        <div
          className="animate-rise grid auto-rows-[6rem] grid-cols-3 gap-3 sm:auto-rows-[8.5rem] sm:gap-4 lg:auto-rows-[9.5rem]"
          style={{ animationDelay: "0.3s" }}
          aria-hidden="true"
        >
          {TILES.map((t, i) => (
            <div
              key={t.src}
              className={[
                "animate-float overflow-hidden rounded-2xl border border-white/60 bg-card shadow-xl",
                t.cls ?? "",
                t.smallScreen ? "" : "hidden sm:block",
              ].join(" ")}
              style={
                {
                  "--tilt": t.tilt,
                  animationDelay: t.delay,
                  animationDuration: t.dur,
                } as React.CSSProperties
              }
            >
              <img
                src={t.src}
                alt={t.alt}
                loading={i === 0 ? "eager" : "lazy"}
                {...(i === 0 ? { fetchPriority: "high" as const } : {})}
                /* Sourced photography is already framed on the product, so it
                   is shown as-is. A catalogue page is not: origin-bottom
                   anchors the zoom to the foot of the frame so scaling pushes
                   the wholesale header off the top. */
                className={
                  t.crop
                    ? "h-full w-full origin-bottom scale-[1.55] object-cover object-bottom"
                    : "h-full w-full object-cover"
                }
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
