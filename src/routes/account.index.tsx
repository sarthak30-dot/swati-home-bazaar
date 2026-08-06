import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/account/")({
  component: Profile,
});

const schema = z.object({
  full_name: z.string().trim().max(100).optional(),
  phone: z.string().trim().regex(/^$|^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  gst_number: z.string().trim().max(20).optional(),
});

function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ full_name: "", phone: "", gst_number: "" });
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    queryKey: ["customer", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data)
      setForm({
        full_name: data.full_name ?? "",
        phone: data.phone ?? "",
        gst_number: data.gst_number ?? "",
      });
  }, [data]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("customers")
      .upsert({
        id: user!.id,
        email: user!.email ?? null,
        full_name: form.full_name || null,
        phone: form.phone || null,
        gst_number: form.gst_number || null,
      });
    setBusy(false);
    if (error) toast.error("Could not save your profile");
    else {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["customer"] });
    }
  };

  return (
    <form onSubmit={save} className="max-w-lg space-y-4 rounded-2xl border border-border p-5">
      <div>
        <p className="text-sm font-medium">Email</p>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="full_name">
          Full name
        </label>
        <input
          id="full_name"
          value={form.full_name}
          maxLength={100}
          onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="phone">
          Mobile number
        </label>
        <input
          id="phone"
          value={form.phone}
          maxLength={10}
          inputMode="numeric"
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="gst_number">
          GST number (for business invoices)
        </label>
        <input
          id="gst_number"
          value={form.gst_number}
          maxLength={20}
          onChange={(e) => setForm((f) => ({ ...f, gst_number: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
