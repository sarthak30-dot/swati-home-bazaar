import { cn } from "@/lib/utils";

const BRAND_CLASS: Record<string, string> = {
  pigeon: "brand-pigeon",
  dubblin: "brand-dubblin",
  yera: "brand-yera",
};

export function brandClass(slug?: string | null) {
  return (slug && BRAND_CLASS[slug]) || "";
}

/** Brand-tinted product tile used until real product photography is uploaded. */
export function ProductImage({
  name,
  capacity,
  brandSlug,
  imageUrl,
  className,
}: {
  name: string;
  capacity?: string | null;
  brandSlug: string;
  imageUrl?: string | null;
  className?: string;
}) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        loading="lazy"
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        brandClass(brandSlug),
        "flex h-full w-full flex-col items-center justify-center gap-1 bg-brand-tint px-3 text-center",
        className,
      )}
    >
      <span className="line-clamp-3 font-display text-[13px] font-semibold leading-tight text-brand sm:text-sm">
        {name}
      </span>
      {capacity && <span className="text-[11px] font-medium text-brand/70">{capacity}</span>}
    </div>
  );
}
