import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

/** Words cycled through by the headline rotator. Keep to three: the CSS
 *  keyframe divides one 9s cycle into three equal 3s slots. */
const ROTATING = ["every kitchen.", "every festival.", "every order."];

/**
 * Drifting collage of product photography.
 *
 * Sourced from Dubblin deliberately: it is the only brand whose images are
 * above 800px (all 59 of them). Every Pigeon and Yera asset is a sub-800px
 * catalogue crop that turns to mush at hero size.
 *
 * Each Dubblin file is a catalogue page — wholesale header text ("Ctn. 24 Pcs",
 * "MRP Rs. 939/-") sits in the top ~25%, with a styled product shot beneath.
 * `object-bottom` frames the photograph and leaves the header outside the crop,
 * which also keeps trade pricing off a retail storefront.
 */
const TILES = [
  {
    src: "/images/products/dubblin/dolphin.jpg",
    cls: "col-span-2 row-span-2",
    tilt: "-2deg",
    delay: "0s",
    dur: "7s",
  },
  { src: "/images/products/dubblin/crest.jpg", cls: "", tilt: "3deg", delay: "0.9s", dur: "8.5s" },
  { src: "/images/products/dubblin/banjo.jpg", cls: "", tilt: "-4deg", delay: "1.8s", dur: "6.5s" },
  {
    src: "/images/products/dubblin/craze-800.jpg",
    cls: "",
    tilt: "4deg",
    delay: "0.4s",
    dur: "9s",
  },
  { src: "/images/products/dubblin/euro.jpg", cls: "", tilt: "-3deg", delay: "1.3s", dur: "7.5s" },
];

export function HomeHero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="hero-mesh absolute inset-0 -z-10" aria-hidden="true" />

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        {/* ---- copy ---- */}
        <div>
          <span
            className="animate-rise inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold backdrop-blur"
            style={{ animationDelay: "0.05s" }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Chandni Chowk, Delhi
          </span>

          <h1
            className="animate-rise mt-5 font-display text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl"
            style={{ animationDelay: "0.15s" }}
          >
            Built for
            {/* The rotator is inline-grid so all three words occupy one cell;
                the tallest word therefore sets the height and the line below
                never shifts as the words swap. */}
            <span className="word-rotator relative ml-3 inline-grid text-left align-baseline">
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
            Over 900 genuine SKUs from Pigeon, Dubblin and Yera Glassware &mdash; delivered across
            Delhi, and shipped pan-India for bulk orders.
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
            className="animate-rise mt-9 flex flex-wrap gap-x-8 gap-y-3"
            style={{ animationDelay: "0.45s" }}
          >
            {[
              ["900+", "Products"],
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
        {/* Fixed row height keeps the collage from ballooning on narrow screens,
            where it sits under the copy rather than beside it. */}
        <div
          className="animate-rise grid auto-rows-[7rem] grid-cols-3 gap-3 sm:auto-rows-[9rem] sm:gap-4 lg:auto-rows-[10rem]"
          style={{ animationDelay: "0.3s" }}
          aria-hidden="true"
        >
          {TILES.map((t, i) => (
            <div
              key={t.src}
              className={`animate-float overflow-hidden rounded-2xl border border-white/60 bg-white shadow-xl ${t.cls}`}
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
                alt=""
                loading={i === 0 ? "eager" : "lazy"}
                /* origin-bottom anchors the zoom to the foot of the frame, so
                   scaling pushes the catalogue header off the top. object-bottom
                   alone is not enough: a portrait tile shows the source's full
                   height, header included. */
                className="h-full w-full origin-bottom scale-[1.55] object-cover object-bottom"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
