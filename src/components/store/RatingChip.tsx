import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingChip({
  rating,
  count,
  className,
}: {
  rating: number;
  count?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-success px-1.5 py-0.5 text-[11px] font-semibold text-success-foreground",
        className,
      )}
    >
      {Number(rating).toFixed(1)}
      <Star className="h-3 w-3 fill-current" />
      {count != null && <span className="font-medium opacity-90">| {count}</span>}
    </span>
  );
}
