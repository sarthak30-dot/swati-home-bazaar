import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/layout/StaticPage";

export const Route = createFileRoute("/shipping-policy")({
  head: () => ({
    meta: [
      { title: "Shipping policy — Swati Enterprises" },
      {
        name: "description",
        content:
          "Delivery timelines, shipping charges and coverage areas for Swati Enterprises orders across Delhi NCR and India.",
      },
      { property: "og:title", content: "Shipping policy — Swati Enterprises" },
      { property: "og:description", content: "Delivery timelines, charges and coverage." },
    ],
  }),
  component: () => (
    <StaticPage title="Shipping policy" intro="How and when your order reaches you.">
      <section>
        <h2>Charges</h2>
        <ul>
          <li>Free delivery on orders of Rs. 999 and above.</li>
          <li>Flat Rs. 79 delivery charge on orders below Rs. 999.</li>
        </ul>
      </section>
      <section>
        <h2>Timelines</h2>
        <ul>
          <li>Delhi NCR: 2 to 4 working days.</li>
          <li>Rest of India: 4 to 8 working days.</li>
          <li>Orders placed on Sundays and public holidays are processed the next working day.</li>
        </ul>
      </section>
      <section>
        <h2>Tracking</h2>
        <p>
          Every order moves through Placed, Confirmed, Packed, Shipped, Out for delivery and
          Delivered. You can follow the current stage from your account orders page.
        </p>
      </section>
      <section>
        <h2>Glassware handling</h2>
        <p>
          Yera glassware is double-boxed with corrugated inserts. If a parcel arrives visibly
          damaged, refuse delivery or record an unboxing video and contact us within 48 hours.
        </p>
      </section>
    </StaticPage>
  ),
});
