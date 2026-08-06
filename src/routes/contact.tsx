import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/layout/StaticPage";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Swati Enterprises — Delhi store & support" },
      {
        name: "description",
        content:
          "Call, email or visit Swati Enterprises in Chandni Chowk, Delhi for orders, bulk enquiries and warranty support.",
      },
      { property: "og:title", content: "Contact Swati Enterprises" },
      { property: "og:description", content: "Store address, phone, email and business hours." },
    ],
  }),
  component: () => (
    <StaticPage
      title="Contact us"
      intro="We answer calls and emails Monday to Saturday, 10:00 AM to 8:00 PM."
    >
      <section>
        <h2>Store</h2>
        <p>
          Swati Enterprises
          <br />
          Chandni Chowk, Delhi 110006
        </p>
      </section>
      <section>
        <h2>Phone &amp; email</h2>
        <p>
          <a className="text-gold underline" href="tel:+911145678900">
            +91 11 4567 8900
          </a>
          <br />
          <a className="text-gold underline" href="mailto:care@swatienterprises.in">
            care@swatienterprises.in
          </a>
        </p>
      </section>
      <section>
        <h2>Bulk &amp; corporate gifting</h2>
        <p>
          For institutional orders, corporate gifting or GST invoicing, email us with your
          requirement and delivery pincode. We respond with a quotation within one working day.
        </p>
      </section>
      <section>
        <h2>Order support</h2>
        <p>
          Have your order number ready (it starts with SE). For warranty claims, keep the invoice
          and the product batch label handy.
        </p>
      </section>
    </StaticPage>
  ),
});
