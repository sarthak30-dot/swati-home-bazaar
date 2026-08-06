import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/layout/StaticPage";

export const Route = createFileRoute("/returns-policy")({
  head: () => ({
    meta: [
      { title: "Returns & refunds — Swati Enterprises" },
      {
        name: "description",
        content:
          "7-day replacement, warranty claims and refund timelines for Pigeon, Dubblin and Yera products bought from Swati Enterprises.",
      },
      { property: "og:title", content: "Returns & refunds — Swati Enterprises" },
      { property: "og:description", content: "Replacement window, warranty and refund timelines." },
    ],
  }),
  component: () => (
    <StaticPage title="Returns &amp; refunds" intro="What you can return, and how long it takes.">
      <section>
        <h2>7-day replacement</h2>
        <p>
          Report damaged, defective or incorrect items within 7 days of delivery. Products must be
          unused, with original packaging, tags and accessories.
        </p>
      </section>
      <section>
        <h2>Not eligible</h2>
        <ul>
          <li>Products damaged through misuse, overheating or dropping.</li>
          <li>Items returned without original packaging or with missing parts.</li>
          <li>Clearance items marked non-returnable on the product page.</li>
        </ul>
      </section>
      <section>
        <h2>Warranty claims</h2>
        <p>
          Manufacturer warranty is serviced by the brand&apos;s authorised centres. We help you
          register the claim and share the nearest service point for Pigeon, Dubblin or Yera.
        </p>
      </section>
      <section>
        <h2>Refunds</h2>
        <ul>
          <li>Cash on delivery orders are refunded by bank transfer within 5 to 7 working days.</li>
          <li>Prepaid orders are refunded to the original payment method within 5 working days.</li>
          <li>Delivery charges are refunded only when the return is due to our error.</li>
        </ul>
      </section>
    </StaticPage>
  ),
});
