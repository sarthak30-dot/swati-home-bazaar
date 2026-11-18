import { RefreshCw, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shown when a data query fails.
 *
 * Without this a failing backend is indistinguishable from a slow one: the
 * page sits on skeletons forever. Always give the shopper a visible message
 * and a retry.
 */
export function QueryError({
  onRetry,
  retrying,
  title = "We couldn't load this right now",
  message = "The shop is having trouble reaching its catalogue. Please check your connection and try again.",
  className,
}: {
  onRetry?: () => void;
  retrying?: boolean;
  title?: string;
  message?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-gold-tint text-gold">
        <WifiOff className="h-5 w-5" />
      </span>
      <p className="mt-4 font-display text-lg font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          <RefreshCw className={cn("h-4 w-4", retrying && "animate-spin")} />
          {retrying ? "Retrying..." : "Try again"}
        </button>
      )}
    </div>
  );
}
