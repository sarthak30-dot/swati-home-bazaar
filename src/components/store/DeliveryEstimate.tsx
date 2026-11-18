import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { DELIVERY_DAYS } from "@/lib/site";
import {
  checkServiceability,
  fetchServiceablePins,
  loadSavedPin,
  savePin,
  SERVICEABLE_PINS,
  type Serviceability,
} from "@/lib/serviceability";

/** Add `days` business days (Mon–Sat; Sunday is skipped) to `from`. */
function addDeliveryDays(from: Date, days: number): Date {
  const d = new Date(from);
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) left--;
  }
  return d;
}

const fmt = (d: Date) =>
  d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

/**
 * "Deliver to PIN — arrives by …" strip for the product page.
 *
 * Delivery date is the single most useful fact on an Indian product page, and
 * serviceability is central to this business model, so it lives next to the
 * buy button rather than in a header popover.
 */
export function DeliveryEstimate({ className }: { className?: string }) {
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<Serviceability | null>(null);

  const { data: livePins = SERVICEABLE_PINS } = useQuery({
    queryKey: ["serviceable-pins"],
    queryFn: fetchServiceablePins,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    const saved = loadSavedPin();
    if (saved) {
      setPin(saved);
      setResult(checkServiceability(saved, livePins));
    }
  }, [livePins]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const outcome = checkServiceability(pin, livePins);
    setResult(outcome);
    if (outcome.status !== "invalid") savePin(outcome.pin);
  };

  const now = new Date();

  return (
    <div className={cn("rounded-2xl border border-border p-4", className)}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Truck className="h-4 w-4 text-gold" />
        Delivery
      </div>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <MapPin className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            placeholder="Enter delivery PIN code"
            aria-label="Delivery PIN code"
            className="w-full rounded-xl border border-border bg-muted/60 py-2 pl-8 pr-3 text-sm outline-none focus:border-gold"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-xl border border-gold px-4 py-2 text-sm font-semibold text-gold hover:bg-gold-tint"
        >
          Check
        </button>
      </form>

      <div aria-live="polite" className="mt-2 text-sm">
        {!result && (
          <p className="text-xs text-muted-foreground">
            Enter your PIN code to see delivery availability and date.
          </p>
        )}
        {result?.status === "serviceable" && (
          <p className="text-success">
            <b>
              Delivery by {fmt(addDeliveryDays(now, DELIVERY_DAYS.min))} –{" "}
              {fmt(addDeliveryDays(now, DELIVERY_DAYS.max))}
            </b>
            <span className="block text-xs text-muted-foreground">
              Retail delivery available at {result.pin}. Free above Rs. 999.
            </span>
          </p>
        )}
        {result?.status === "bulk-only" && (
          <p className="text-foreground">
            <span className="text-xs">{result.message}</span>{" "}
            <Link to="/bulk-orders" className="text-xs font-semibold text-gold hover:underline">
              Send a bulk enquiry &rarr;
            </Link>
          </p>
        )}
        {result?.status === "invalid" && (
          <p className="text-xs text-destructive">{result.message}</p>
        )}
      </div>
    </div>
  );
}
