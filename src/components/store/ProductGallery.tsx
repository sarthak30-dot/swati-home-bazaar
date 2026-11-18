import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/store/ProductImage";

export type GalleryImage = { src: string; alt: string };

/**
 * Product gallery: a main image with thumbnails and a click-to-zoom lightbox.
 *
 * When a product has only one photo (or none) the thumbnails are omitted and
 * the "photo coming soon" tile is shown instead of a broken gallery.
 */
export function ProductGallery({
  images,
  fallback,
}: {
  images: GalleryImage[];
  fallback: React.ComponentProps<typeof ProductImage>;
}) {
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  // Switching variant can change the image list; keep the index in range.
  useEffect(() => setIndex(0), [images[0]?.src]);

  useEffect(() => {
    if (!zoomOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomOpen(false);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [zoomOpen, images.length]);

  if (!images.length) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="aspect-square">
          <ProductImage {...fallback} priority zoom={false} />
        </div>
      </div>
    );
  }

  const current = images[Math.min(index, images.length - 1)]!;
  const isCatalogueSheet = current.src.includes("/dubblin/");

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-white">
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          aria-label="Zoom product image"
          className="group block aspect-square w-full cursor-zoom-in"
        >
          <ProductImage {...fallback} imageUrl={current.src} priority zoom={false} />
          <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground shadow transition-transform group-hover:scale-110">
            <ZoomIn className="h-4 w-4" />
          </span>
        </button>
      </div>

      {images.length > 1 && (
        <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <li key={img.src} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === index}
                className={cn(
                  "block h-16 w-16 overflow-hidden rounded-xl border bg-white sm:h-20 sm:w-20",
                  i === index ? "border-brand ring-2 ring-brand/30" : "border-border",
                )}
              >
                <img
                  src={img.src}
                  alt=""
                  width={80}
                  height={80}
                  loading="lazy"
                  className={cn(
                    "h-full w-full",
                    img.src.includes("/dubblin/")
                      ? "origin-bottom scale-[1.4] object-cover object-bottom"
                      : "object-contain",
                  )}
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {zoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Product image"
          className="fixed inset-0 z-[70] grid place-items-center bg-foreground/80 p-4"
          onClick={() => setZoomOpen(false)}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setZoomOpen(false)}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-background text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex((i) => (i - 1 + images.length) % images.length);
                }}
                className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex((i) => (i + 1) % images.length);
                }}
                className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <div
            className="max-h-[88vh] max-w-[min(92vw,900px)] overflow-hidden rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={current.src}
              alt={current.alt}
              className={cn(
                "max-h-[88vh] w-full object-contain",
                isCatalogueSheet && "origin-bottom scale-[1.4] object-cover object-bottom",
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}
