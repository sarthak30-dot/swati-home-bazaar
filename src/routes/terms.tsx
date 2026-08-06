import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/layout/StaticPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of service — Swati Enterprises" },
      {
        name: "description",
        content:
          "The terms that apply when you browse, order or return products on the Swati Enterprises store.",
      },
      { property: "og:title", content: "Terms of service — Swati Enterprises" },
      { property: "og:description", content: "Terms that apply to orders placed with us." },
    ],
  }),
  component: () => (
    <StaticPage title="Terms of service" intro="Please read these terms before placing an order.">
      <section>
        <h2>Pricing and availability</h2>
        <p>
          Prices are in Indian Rupees and inclusive of applicable taxes. Stock levels change
          frequently; if an item becomes unavailable after you order, we will contact you and refund
          that line in full.
        </p>
      </section>
      <section>
        <h2>Orders</h2>
        <ul>
          <li>An order is confirmed once we mark it Confirmed in your account.</li>
          <li>We may cancel orders with pricing errors or suspected fraud.</li>
          <li>Cash on delivery is available on eligible pincodes across Delhi NCR.</li>
        </ul>
      </section>
      <section>
        <h2>Coupons</h2>
        <p>
          Coupons apply to eligible order values only, cannot be combined, and may be withdrawn at
          any time. One coupon per order.
        </p>
      </section>
      <section>
        <h2>Brand marks</h2>
        <p>
          Pigeon, Dubblin and Yera are trademarks of their respective owners. Swati Enterprises is an
          authorised retailer and not the manufacturer of these products.
        </p>
      </section>
    </StaticPage>
  ),
});
