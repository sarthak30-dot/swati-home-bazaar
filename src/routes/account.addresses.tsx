import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/account/addresses")({
  component: Addresses,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  line1: z.string().trim().min(5, "Enter your address").max(200),
  line2: z.string().trim().max(200),
  city: z.string().trim().min(2, "Enter your city").max(80),
  state: z.string().trim().min(2, "Enter your state").max(80),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
});

const EMPTY = {
  full_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "Delhi",
  pincode: "",
};

function Addresses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["addresses", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the address");
      return;
    }
    const { error } = await supabase.from("addresses").insert({
      ...parsed.data,
      line2: parsed.data.line2 || null,
      customer_id: user!.id,
      is_default: !data?.length,
    });
    if (error) toast.error("Could not save the address");
    else {
      toast.success("Address saved");
      setForm(EMPTY);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) toast.error("Could not delete the address");
    else {
      toast.success("Address removed");
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    }
  };

  const makeDefault = async (id: string) => {
    await supabase.from("addresses").update({ is_default: false }).eq("customer_id", user!.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["addresses"] });
    toast.success("Default address updated");
  };

  const field = (key: keyof typeof EMPTY, label: string, max: number) => (
    <div>
      <label className="text-sm font-medium" htmlFor={key}>
        {label}
      </label>
      <input
        id={key}
        value={form[key]}
        maxLength={max}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-gold"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {(data ?? []).map((a) => (
          <div key={a.id} className="rounded-2xl border border-border p-4 text-sm">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <p className="truncate font-semibold">{a.full_name}</p>
              <button
                type="button"
                aria-label="Delete address"
                onClick={() => remove(a.id)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <p className="text-muted-foreground">{a.phone}</p>
            <p className="mt-1 text-muted-foreground">
              {a.line1}
              {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}
            </p>
            {a.is_default ? (
              <span className="mt-2 inline-block rounded-full bg-gold-tint px-2 py-0.5 text-xs font-semibold text-gold">
                Default
              </span>
            ) : (
              <button
                type="button"
                onClick={() => makeDefault(a.id)}
                className="mt-2 text-xs font-semibold text-gold hover:underline"
              >
                Make default
              </button>
            )}
          </div>
        ))}
      </div>

      {open ? (
        <form onSubmit={save} className="grid max-w-2xl gap-3 rounded-2xl border border-border p-5 sm:grid-cols-2">
          {field("full_name", "Full name", 100)}
          {field("phone", "Mobile number", 10)}
          <div className="sm:col-span-2">{field("line1", "Address line 1", 200)}</div>
          <div className="sm:col-span-2">{field("line2", "Address line 2 (optional)", 200)}</div>
          {field("city", "City", 80)}
          {field("state", "State", 80)}
          {field("pincode", "Pincode", 6)}
          <div className="flex items-end gap-2">
            <button type="submit" className="rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-white">
              Save address
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl border border-dashed border-border px-5 py-3 text-sm font-semibold"
        >
          + Add a new address
        </button>
      )}
    </div>
  );
}
