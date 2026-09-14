import { useState, useEffect } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt: string;
  fallbackLabel?: string;
  fallbackSublabel?: string;
  /** Extra classes applied to the fallback container (same dimensions as the img). */
  fallbackClassName?: string;
  /** When true the component fills its positioned parent (equivalent to Next.js fill). */
  fill?: boolean;
  /** Mirrors Next.js priority — sets loading="eager" and fetchPriority="high". */
  priority?: boolean;
}

/**
 * Drop-in <img> replacement with branded error fallback.
 * Works with Vite/TanStack (no next/image dependency).
 *
 * Usage:
 *   <SafeImage src={url} alt="..." className="object-cover" />
 *   <SafeImage src={url} alt="..." fill priority />
 */
export function SafeImage({
  src,
  alt,
  fallbackLabel,
  fallbackSublabel,
  fallbackClassName,
  fill = false,
  priority = false,
  loading,
  className,
  style,
  ...rest
}: SafeImageProps) {
  const [errored, setErrored] = useState(false);

  // Reset error state if src changes so a corrected URL re-attempts.
  useEffect(() => {
    setErrored(false);
  }, [src]);

  const isEmpty = !src || src.trim() === "";
  const showFallback = isEmpty || errored;

  const resolvedLoading: React.ImgHTMLAttributes<HTMLImageElement>["loading"] =
    priority ? "eager" : (loading ?? "lazy");

  const sharedStyle: React.CSSProperties = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style }
    : style ?? {};

  if (showFallback) {
    return (
      <div
        aria-label={alt}
        role="img"
        className={cn(
          "flex flex-col items-center justify-center gap-2",
          "bg-brand-tint text-brand/40",
          fill && "absolute inset-0",
          fallbackClassName,
          className,
        )}
        style={sharedStyle}
      >
        <ImageOff className="h-8 w-8 shrink-0 opacity-50" strokeWidth={1.5} />
        {fallbackLabel && (
          <span className="max-w-[80%] text-center text-[11px] font-semibold leading-snug text-brand/60">
            {fallbackLabel}
          </span>
        )}
        {fallbackSublabel && (
          <span className="text-[10px] text-brand/40">{fallbackSublabel}</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={resolvedLoading}
      fetchPriority={priority ? "high" : undefined}
      onError={() => setErrored(true)}
      className={className}
      style={sharedStyle}
      {...rest}
    />
  );
}
