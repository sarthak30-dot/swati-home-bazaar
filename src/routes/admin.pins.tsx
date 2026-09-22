import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isWellFormedPin } from "@/lib/serviceability";

export const Route = createFileRoute("/admin/pins")({
  component: AdminPins,
});

type ServiceablePin = { pin: string; area_name: string | null; created_at: string };

async function fetchPins(): Promise<ServiceablePin[]> {
  const { data, error } = await supabase
    .from("serviceable_pins")
    .select("pin, area_name, created_at")
    .order("pin");
  if (error) throw error;
  return (data ?? []) as ServiceablePin[];
}

function AdminPins() {
  const queryClient = useQueryClient();
  const [pin, setPin] = useState("");
  const [areaName, setAreaName] = useState("");

  const { data: pins, isLoading } = useQuery({
    queryKey: ["admin-pins"],
    queryFn: fetchPins,
  });

  const addPin = useMutation({
    mutationFn: async () => {
      const trimmed = pin.trim();
      if (!isWellFormedPin(trimmed)) throw new Error("Enter a valid 6-digit PIN code");
      const { error } = await supabase
        .from("serviceable_pins")
        .insert({ pin: trimmed, area_name: areaName.trim() || null });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("PIN added");
      setPin("");
      setAreaName("");
      queryClient.invalidateQueries({ queryKey: ["admin-pins"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to add PIN"),
  });

  const removePin = useMutation({
    mutationFn: async (p: string) => {
      const { error } = await supabase.from("serviceable_pins").delete().eq("pin", p);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("PIN removed");
      queryClient.invalidateQueries({ queryKey: ["admin-pins"] });
    },
    onError: () => toast.error("Failed to remove PIN — admin access required"),
  });

  return (
    <div className="max-w-xl space-y-6">
      <p className="text-sm text-muted-foreground">
        Only PINs in this list receive retail delivery. Every other PIN is directed to
        the bulk enquiry flow.
      </p>

      <div className="rounded-2xl border border-border p-4 space-y-3">
        <h2 className="text-sm font-semibold">Add serviceable PIN</h2>
        <div className="grid gap-2 sm:grid-cols-[7rem_1fr_auto]">
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            placeholder="110001"
            inputMode="numeric"
            className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-gold"
          />
          <input
            value={areaName}
            onChange={(e) => setAreaName(e.target.value)}
            placeholder="Area name (optional)"
            className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-gold"
          />
          <button
            type="button"
            disabled={addPin.isPending}
            onClick={() => addPin.mutate()}
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        {isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading…</p>
        ) : !pins?.length ? (
          <p className="p-4 text-sm text-muted-foreground">No PINs configured yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">PIN</th>
                <th className="p-3">Area</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {pins.map((p) => (
                <tr key={p.pin} className="border-t border-border">
                  <td className="p-3 font-mono font-semibold">{p.pin}</td>
                  <td className="p-3 text-muted-foreground">{p.area_name ?? "—"}</td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => removePin.mutate(p.pin)}
                      disabled={removePin.isPending}
                      className="text-xs text-destructive hover:underline disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
