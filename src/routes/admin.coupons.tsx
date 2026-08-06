import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { rupees, formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/coupons")({
  component: AdminCoupons,
});

const schema = z.object({
  code: z.string().trim().min(3).max(24).regex(/^[A-Z0-9]+$/, "Use A-Z and 0-9 only"),
  type: z.enum(["percent", "flat"]),
  value: z.number().positive("Value must be greater than zero"),
  min_order_value: z.number().min(0),
});

function AdminCoupons() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ code: "", type: "percent", value: "", min_order_value: "0" });

  const { data } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      min_order_value: Number(form.min_order_value),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the coupon details");
      return;
    }
    const { error } = await supabase.from("coupons").insert(parsed.data);
    if (error) toast.error("Could not create the coupon");
    else {
      toast.success("Coupon created");
      setForm({ code: "", type: "percent", value: "", min_order_value: "0" });
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    }
  };

  const toggle = async (id: string, is_active: boolean) => {
    const { error } = await supabase.from("coupons").update({ is_active }).eq("id", id);
    if (error) toast.error("Could not update the coupon");
    else queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="grid gap-3 rounded-2xl border border-border p-5 sm:grid-cols-5 sm:items-end">
        <div className="sm:col-span-1">
          <label className="text-sm font-medium" htmlFor="code">
            Code
          </label>
          <input
            id="code"
            value={form.code}
            maxLength={24}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm uppercase"
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="type">
            Type
          </label>
          <select
            id="type"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
          >
            <option value="percent">Percent off</option>
            <option value="flat">Flat amount</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="value">
            Value
          </label>
          <input
            id="value"
            value={form.value}
            inputMode="decimal"
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="min_order_value">
            Min order
          </label>
          <input
            id="min_order_value"
            value={form.min_order_value}
            inputMode="decimal"
            onChange={(e) => setForm((f) => ({ ...f, min_order_value: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
          />
        </div>
        <button type="submit" className="rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-white">
          Create coupon
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">Code</th>
              <th className="p-3">Discount</th>
              <th className="p-3">Min order</th>
              <th className="p-3">Used</th>
              <th className="p-3">Valid to</th>
              <th className="p-3">Active</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3 font-semibold">{c.code}</td>
                <td className="p-3">
                  {c.type === "percent" ? `${Number(c.value)}%` : rupees(c.value)}
                </td>
                <td className="p-3">{rupees(c.min_order_value)}</td>
                <td className="p-3">
                  {c.times_used}
                  {c.usage_limit ? ` / ${c.usage_limit}` : ""}
                </td>
                <td className="p-3">{c.valid_to ? formatDate(c.valid_to) : "No expiry"}</td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => toggle(c.id, !c.is_active)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      c.is_active ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.is_active ? "Active" : "Paused"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
