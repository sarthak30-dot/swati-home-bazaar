import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  checkServiceability,
  fetchServiceablePins,
  loadSavedPin,
  savePin,
  SERVICEABLE_PINS,
  type Serviceability,
} from "@/lib/serviceability";

/**
 * Delivery PIN control.
 *
 * Retail delivery is Delhi-only today, so a shopper needs to find that out on
 * arrival rather than at checkout. When a PIN falls outside the retail zone the
 * panel routes them to the pan-India bulk enquiry instead of dead-ending.
 */
export function PinCheck({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [result, setResult] = useState<Serviceability | null>(null);
  const [livePins, setLivePins] = useState<string[]>(SERVICEABLE_PINS);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchServiceablePins().then(setLivePins);
  }, []);

  useEffect(() => {
    const existing = loadSavedPin();
    if (existing) {
      setSaved(existing);
      setPin(existing);
      setResult(checkServiceability(existing, livePins));
    }
  // Re-check when live pins load so saved result reflects current DB state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livePins]);

  // Close on outside click — the panel overlays page content while open.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const outcome = checkServiceability(pin, livePins);
    setResult(outcome);
    if (outcome.status !== "invalid") {
      savePin(outcome.pin);
      setSaved(outcome.pin);
    }
  };

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[11rem] items-center gap-1.5 rounded-lg px-2 py-1.5 text-left hover:bg-muted"
      >
        <MapPin className="h-4 w-4 shrink-0 text-gold" />
        <span className="min-w-0 leading-tight">
          <span className="block text-[10px] text-muted-foreground">Deliver to</span>
          <span className="block truncate text-xs font-semibold">{saved ?? "Select PIN code"}</span>
        </span>
        <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-border bg-background p-3 shadow-lg">
          <p className="text-xs font-semibold">Check delivery availability</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Retail delivery is currently available in Delhi.
          </p>

          <form onSubmit={submit} className="mt-2 flex gap-2">
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="6-digit PIN"
              aria-label="PIN code"
              className="min-w-0 flex-1 rounded-lg border border-border bg-muted/60 px-2.5 py-1.5 text-sm outline-none focus:border-gold"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              Check
            </button>
          </form>

          {result && (
            <div
              className={cn(
                "mt-2 rounded-lg px-2.5 py-2 text-[11px] leading-relaxed",
                result.status === "serviceable" && "bg-success/10 text-success",
                result.status === "bulk-only" && "bg-gold/10 text-foreground",
                result.status === "invalid" && "bg-destructive/10 text-destructive",
              )}
            >
              <p>{result.message}</p>
              {result.status === "bulk-only" && (
                <Link
                  to="/bulk-orders"
                  onClick={() => setOpen(false)}
                  className="mt-1 inline-block font-semibold text-gold hover:underline"
                >
                  Send a bulk enquiry &rarr;
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
