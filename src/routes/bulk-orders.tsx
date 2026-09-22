import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Gift, Store, Truck } from "lucide-react";
import { toast } from "sonner";
import { DEPARTMENTS } from "@/lib/departments";
import { supabase } from "@/integrations/supabase/client";

/** Ops contact points. Update both if the store number or inbox changes. */
const BULK_EMAIL = "care@swatienterprises.in";
const BULK_WHATSAPP = "911145678900";

export const Route = createFileRoute("/bulk-orders")({
  head: () => ({
    meta: [
      { title: "Bulk & wholesale orders, shipped pan-India — Swati Enterprises" },
      {
        name: "description",
        content:
          "Bulk and corporate orders for Pigeon, Dubblin and Yera shipped across India. Send your requirement and receive a quotation from Swati Enterprises, Delhi.",
      },
      { property: "og:title", content: "Bulk orders shipped pan-India — Swati Enterprises" },
      {
        property: "og:description",
        content: "Wholesale, corporate gifting and institutional supply across India.",
      },
    ],
  }),
  component: BulkOrders,
});

const AUDIENCES = [
  {
    icon: Store,
    title: "Retailers & distributors",
    text: "Carton-quantity supply across our three brands",
  },
  { icon: Gift, title: "Corporate gifting", text: "Diwali, onboarding and milestone gift sets" },
  {
    icon: Building2,
    title: "Institutions & HoReCa",
    text: "Hotels, canteens, hostels and offices",
  },
  {
    icon: Truck,
    title: "Delivered pan-India",
    text: "Freight arranged to any serviceable pincode",
  },
];

function BulkOrders() {
  const [form, setForm] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    city: "",
    pin: "",
    department: "",
    quantity: "",
    message: "",
  });

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  // Email and WhatsApp remain available as secondary routes, so the prefilled
  // message is still composed regardless of whether the enquiry was saved.
  const enquiryBody = [
    `Name: ${form.name}`,
    `Company: ${form.company}`,
    `Phone: ${form.phone}`,
    `Email: ${form.email}`,
    `Delivery city / PIN: ${form.city} ${form.pin}`.trim(),
    `Interested in: ${form.department || "Not specified"}`,
    `Approximate quantity: ${form.quantity}`,
    "",
    "Requirement:",
    form.message,
  ].join("\n");

  const mailto = `mailto:${BULK_EMAIL}?subject=${encodeURIComponent(
    `Bulk order enquiry${form.company ? ` — ${form.company}` : ""}`,
  )}&body=${encodeURIComponent(enquiryBody)}`;

  const whatsapp = `https://wa.me/${BULK_WHATSAPP}?text=${encodeURIComponent(
    `Bulk order enquiry\n\n${enquiryBody}`,
  )}`;

  const ready = form.name.trim() !== "" && form.phone.trim() !== "";

  const submit = async () => {
    if (!ready || saving) return;
    setSaving(true);

    // Optional columns are nullable, so blank inputs are stored as NULL rather
    // than "" — otherwise the admin list has to treat both as "not provided".
    const optional = (v: string) => {
      const trimmed = v.trim();
      return trimmed === "" ? null : trimmed;
    };

    // No .select() chain: anon holds INSERT but not SELECT on this table, so
    // asking for the row back would fail the read even though the write landed.
    const { error } = await supabase.from("bulk_enquiries").insert({
      name: form.name.trim(),
      phone: form.phone.trim(),
      company: optional(form.company),
      email: optional(form.email),
      city: optional(form.city),
      pin: optional(form.pin),
      department: optional(form.department),
      quantity: optional(form.quantity),
      message: optional(form.message),
    });

    setSaving(false);

    if (error) {
      toast.error("We could not save your enquiry. Please send it by email or WhatsApp instead.");
      return;
    }

    setSent(true);
    toast.success("Enquiry received. Our team will get back to you with a quotation.");
    setForm({
      name: "",
      company: "",
      phone: "",
      email: "",
      city: "",
      pin: "",
      department: "",
      quantity: "",
      message: "",
    });
  };

  return (
    <div>
      <section className="border-b border-border bg-gold-tint">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <span className="inline-block rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold">
            Available across India
          </span>
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-bold leading-tight sm:text-4xl">
            Bulk and wholesale orders, shipped anywhere in India.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-foreground/80 sm:text-base">
            Retail delivery from our Chandni Chowk store is currently limited to Delhi. Bulk orders
            are not &mdash; tell us what you need and we will send a quotation with freight to your
            pincode.
          </p>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 lg:grid-cols-4">
          {AUDIENCES.map((a) => (
            <div key={a.title} className="flex min-w-0 items-start gap-3">
              <a.icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10">
        <h2 className="font-display text-xl font-bold">Send us your requirement</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill this in and send it across &mdash; we will come back with a quotation. Name and phone
          are required.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field
            label="Your name"
            required
            maxLength={120}
            value={form.name}
            onChange={set("name")}
          />
          <Field
            label="Company / organisation"
            maxLength={150}
            value={form.company}
            onChange={set("company")}
          />
          <Field
            label="Phone"
            required
            type="tel"
            maxLength={20}
            value={form.phone}
            onChange={set("phone")}
          />
          <Field
            label="Email"
            type="email"
            maxLength={150}
            value={form.email}
            onChange={set("email")}
          />
          <Field label="Delivery city" maxLength={80} value={form.city} onChange={set("city")} />
          <Field
            label="Delivery PIN code"
            inputMode="numeric"
            maxLength={10}
            value={form.pin}
            onChange={set("pin")}
          />

          <label className="block">
            <span className="text-xs font-semibold text-foreground">Interested in</span>
            <select
              value={form.department}
              onChange={set("department")}
              className="mt-1 w-full rounded-xl border border-border bg-muted/60 px-3 py-2 text-sm outline-none focus:border-gold"
            >
              <option value="">Select a category</option>
              {DEPARTMENTS.map((d) => (
                <option key={d.slug} value={d.name}>
                  {d.name}
                </option>
              ))}
              <option value="Mixed / multiple categories">Mixed / multiple categories</option>
            </select>
          </label>

          <Field
            label="Approximate quantity"
            placeholder="e.g. 200 pieces, or 10 cartons"
            maxLength={40}
            value={form.quantity}
            onChange={set("quantity")}
          />
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-semibold text-foreground">Requirement details</span>
          <textarea
            value={form.message}
            onChange={set("message")}
            maxLength={2000}
            rows={4}
            placeholder="Product names or codes, sizes, branding needs, timeline, GST requirement."
            className="mt-1 w-full rounded-xl border border-border bg-muted/60 px-3 py-2 text-sm outline-none focus:border-gold"
          />
        </label>

        <div className="mt-6">
          <button
            type="button"
            onClick={submit}
            disabled={!ready || saving}
            className="rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
          >
            {saving ? "Sending..." : "Send enquiry"}
          </button>

          {sent && (
            <p className="mt-3 text-sm font-medium text-gold">
              Thank you — your enquiry is with our team. We usually reply within one working day.
            </p>
          )}
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <p className="text-xs text-muted-foreground">Prefer to send it yourself?</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href={ready ? mailto : undefined}
              aria-disabled={!ready}
              className={`rounded-xl border border-border px-5 py-2.5 text-sm font-semibold ${
                ready ? "hover:bg-muted" : "pointer-events-none opacity-40"
              }`}
            >
              Send by email
            </a>
            <a
              href={ready ? whatsapp : undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!ready}
              className={`rounded-xl border border-border px-5 py-2.5 text-sm font-semibold ${
                ready ? "hover:bg-muted" : "pointer-events-none opacity-40"
              }`}
            >
              Send on WhatsApp
            </a>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Prefer to talk? Call{" "}
          <a className="font-semibold text-gold underline" href={`tel:+${BULK_WHATSAPP}`}>
            +91 11 4567 8900
          </a>
          , Monday to Saturday, 10:00 AM to 8:00 PM.
        </p>
      </section>
    </div>
  );
}

function Field({
  label,
  required,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </span>
      <input
        {...props}
        className="mt-1 w-full rounded-xl border border-border bg-muted/60 px-3 py-2 text-sm outline-none focus:border-gold"
      />
    </label>
  );
}
