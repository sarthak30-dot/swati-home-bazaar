import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, ENQUIRY_STATUS_LABELS } from "@/lib/format";

export const Route = createFileRoute("/admin/enquiries")({
  component: AdminEnquiries,
});

const STATUSES = Object.keys(ENQUIRY_STATUS_LABELS);

function AdminEnquiries() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-enquiries", filter],
    queryFn: async () => {
      let query = supabase
        .from("bulk_enquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("status", filter as never);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const update = async (id: string, status: string) => {
    const { error } = await supabase
      .from("bulk_enquiries")
      .update({ status } as never)
      .eq("id", id);
    if (error) toast.error("Could not update the enquiry");
    else {
      toast.success("Enquiry updated");
      queryClient.invalidateQueries({ queryKey: ["admin-enquiries"] });
    }
  };

  return (
    <div className="space-y-4">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {["all", ...STATUSES].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm ${
              filter === s ? "border-gold bg-gold-tint font-semibold text-gold" : "border-border"
            }`}
          >
            {s === "all" ? "All" : ENQUIRY_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading enquiries...</p>}
      {!isLoading && !data?.length && (
        <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No enquiries in this view.
        </p>
      )}

      <div className="space-y-4">
        {(data ?? []).map((enquiry) => (
          <div key={enquiry.id} className="rounded-2xl border border-border p-5">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
              <div className="min-w-0">
                <p className="truncate font-display text-base font-bold">
                  {enquiry.name}
                  {enquiry.company && (
                    <span className="font-normal text-muted-foreground"> · {enquiry.company}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(enquiry.created_at)}
                  {enquiry.department && ` · ${enquiry.department}`}
                  {enquiry.quantity && ` · Qty ${enquiry.quantity}`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <a className="font-semibold text-gold" href={`tel:${enquiry.phone}`}>
                    {enquiry.phone}
                  </a>
                  {enquiry.email && (
                    <>
                      {" · "}
                      <a className="font-semibold text-gold" href={`mailto:${enquiry.email}`}>
                        {enquiry.email}
                      </a>
                    </>
                  )}
                  {(enquiry.city || enquiry.pin) &&
                    ` · ${[enquiry.city, enquiry.pin].filter(Boolean).join(" ")}`}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <select
                  value={enquiry.status}
                  onChange={(e) => update(enquiry.id, e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {ENQUIRY_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {enquiry.message && (
              <p className="mt-3 whitespace-pre-wrap border-t border-border pt-3 text-sm">
                {enquiry.message}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
