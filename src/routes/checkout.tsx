import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { rupees, shippingFor } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Swati Enterprises" },
      { name: "description", content: "Confirm your delivery address and place your order." },
      { property: "og:title", content: "Checkout — Swati Enterprises" },
      { property: "og:description", content: "Secure checkout with cash on delivery across Delhi NCR." },
    ],
  }),
  component: Checkout,
});

const addressSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  line1: z.string().trim().min(5, "Enter your address").max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2, "Enter your city").max(80),
  state: z.string().trim().min(2, "Enter your state").max(80),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
});

type AddressForm = z.infer<typeof addressSchema>;

const EMPTY: AddressForm = {
  full_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "Delhi",
  pincode: "",
};

function Checkout() {
  const { user, loading: authLoading } = useAuth();
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState<AddressForm>(EMPTY);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [saveAddress, setSaveAddress] = useState(true);
  const [payment, setPayment] = useState<"cod" | "online">("cod");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth", replace: true });
  }, [authLoading, user, navigate]);

  const { data: addresses } = useQuery({
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

  useEffect(() => {
    if (addresses?.length && !selectedAddress) setSelectedAddress(addresses[0]!.id);
  }, [addresses, selectedAddress]);

  const shipping = shippingFor(subtotal);
  const total = Math.max(0, subtotal - discount) + shipping;

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle();
    if (error || !data) {
      toast.error("Coupon not found");
      return;
    }
    if (data.valid_to && new Date(data.valid_to) < new Date()) {
      toast.error("This coupon has expired");
      return;
    }
    if (subtotal < Number(data.min_order_value)) {
      toast.error(`Valid on orders above ${rupees(data.min_order_value)}`);
      return;
    }
    const value =
      data.type === "percent"
        ? Math.round((subtotal * Number(data.value)) / 100)
        : Number(data.value);
    setDiscount(Math.min(value, subtotal));
    setAppliedCoupon(code);
    toast.success(`${code} applied — you saved ${rupees(Math.min(value, subtotal))}`);
  };

  const placeOrder = async () => {
    if (!user || !items.length) return;

    let addressId = selectedAddress;
    let shippingAddress: AddressForm | null = null;

    if (addressId) {
      const found = addresses?.find((a) => a.id === addressId);
      if (found) {
        shippingAddress = {
          full_name: found.full_name,
          phone: found.phone,
          line1: found.line1,
          line2: found.line2 ?? "",
          city: found.city,
          state: found.state,
          pincode: found.pincode,
        };
      }
    } else {
      const parsed = addressSchema.safeParse(form);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Check your address");
        return;
      }
      shippingAddress = parsed.data;
      if (saveAddress) {
        const { data: inserted } = await supabase
          .from("addresses")
          .insert({ ...parsed.data, customer_id: user.id, is_default: !addresses?.length })
          .select("id")
          .maybeSingle();
        addressId = inserted?.id ?? null;
      }
    }

    if (!shippingAddress) {
      toast.error("Add a delivery address to continue");
      return;
    }

    setPlacing(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          subtotal,
          shipping_fee: shipping,
          discount_amount: discount,
          total,
          coupon_code: appliedCoupon,
          payment_method: payment,
          payment_status: "pending",
          status: "placed",
          shipping_address_id: addressId,
          shipping_address: shippingAddress,
        })
        .select("id, order_number")
        .single();
      if (error) throw error;

      const lines = items.map(({ variant, qty }) => ({
        order_id: order.id,
        product_variant_id: variant.id,
        product_name: variant.product_name,
        sku_id: variant.sku_id,
        brand_name: variant.brand_name,
        qty,
        unit_price: variant.selling_price,
        line_total: Number(variant.selling_price) * qty,
      }));
      const { error: itemsError } = await supabase.from("order_items").insert(lines);
      if (itemsError) throw itemsError;

      await clear();
      toast.success("Order placed!");
      navigate({ to: "/order/$orderNumber", params: { orderNumber: order.order_number } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place the order");
    } finally {
      setPlacing(false);
    }
  };

  if (authLoading || !user) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-sm text-muted-foreground">Loading...</div>;
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Nothing to check out</h1>
        <Link to="/shop" className="mt-6 inline-block rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-white">
          Browse products
        </Link>
      </div>
    );
  }

  const field = (
    key: keyof AddressForm,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div>
      <label className="text-sm font-medium" htmlFor={key}>
        {label}
      </label>
      <input
        id={key}
        value={form[key] ?? ""}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-gold"
        {...props}
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold">Checkout</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border p-5">
            <h2 className="font-display text-base font-bold">Delivery address</h2>

            {addresses && addresses.length > 0 && (
              <div className="mt-4 space-y-2">
                {addresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedAddress(a.id)}
                    className={cn(
                      "block w-full rounded-xl border p-3 text-left text-sm",
                      selectedAddress === a.id ? "border-gold bg-gold-tint" : "border-border",
                    )}
                  >
                    <p className="font-semibold">
                      {a.full_name} &middot; {a.phone}
                    </p>
                    <p className="text-muted-foreground">
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}
                    </p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedAddress(null)}
                  className={cn(
                    "w-full rounded-xl border border-dashed p-3 text-sm font-medium",
                    selectedAddress === null ? "border-gold text-gold" : "border-border",
                  )}
                >
                  + Deliver to a new address
                </button>
              </div>
            )}

            {selectedAddress === null && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {field("full_name", "Full name", { maxLength: 100 })}
                {field("phone", "Mobile number", { maxLength: 10, inputMode: "numeric" })}
                <div className="sm:col-span-2">{field("line1", "Address line 1", { maxLength: 200 })}</div>
                <div className="sm:col-span-2">
                  {field("line2", "Address line 2 (optional)", { maxLength: 200 })}
                </div>
                {field("city", "City", { maxLength: 80 })}
                {field("state", "State", { maxLength: 80 })}
                {field("pincode", "Pincode", { maxLength: 6, inputMode: "numeric" })}
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="h-4 w-4 accent-[var(--gold)]"
                  />
                  Save this address for future orders
                </label>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border p-5">
            <h2 className="font-display text-base font-bold">Payment method</h2>
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => setPayment("cod")}
                className={cn(
                  "block w-full rounded-xl border p-3 text-left text-sm",
                  payment === "cod" ? "border-gold bg-gold-tint" : "border-border",
                )}
              >
                <p className="font-semibold">Cash on delivery</p>
                <p className="text-muted-foreground">Pay the courier when your order arrives.</p>
              </button>
              <div className="block w-full cursor-not-allowed rounded-xl border border-border p-3 text-left text-sm opacity-60">
                <p className="font-semibold">Card / UPI / Netbanking</p>
                <p className="text-muted-foreground">
                  Online payments are coming soon — use cash on delivery for now.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border p-5">
            <h2 className="font-display text-base font-bold">Order items ({items.length})</h2>
            <ul className="mt-3 divide-y divide-border text-sm">
              {items.map(({ variant, qty }) => (
                <li key={variant.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="line-clamp-1 font-medium">{variant.product_name}</span>
                    <span className="text-xs text-muted-foreground">Qty {qty}</span>
                  </span>
                  <span className="shrink-0 font-medium">
                    {rupees(Number(variant.selling_price) * qty)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border border-border p-5 lg:sticky lg:top-28">
          <h2 className="font-display text-base font-bold">Summary</h2>

          <div className="flex gap-2">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Coupon code"
              maxLength={24}
              className="min-w-0 flex-1 rounded-xl border border-border px-3 py-2 text-sm uppercase outline-none focus:border-gold"
            />
            <button
              type="button"
              onClick={applyCoupon}
              className="shrink-0 rounded-xl border border-gold px-3 py-2 text-sm font-semibold text-gold"
            >
              Apply
            </button>
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{rupees(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-success">
                <dt>Coupon {appliedCoupon}</dt>
                <dd className="font-medium">-{rupees(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="font-medium">{shipping === 0 ? "Free" : rupees(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
              <dt>Total payable</dt>
              <dd>{rupees(total)}</dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={placeOrder}
            disabled={placing}
            className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {placing ? "Placing order..." : `Place order · ${rupees(total)}`}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            By placing this order you agree to our{" "}
            <Link to="/terms" className="underline">
              terms
            </Link>
            .
          </p>
        </aside>
      </div>
    </div>
  );
}
