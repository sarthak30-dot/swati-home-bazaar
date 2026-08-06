import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/layout/StaticPage";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Swati Enterprises — Delhi home & kitchen retailer" },
      {
        name: "description",
        content:
          "Swati Enterprises has supplied Delhi homes with Pigeon, Dubblin and Yera kitchenware since 2005. Learn about our store and service.",
      },
      { property: "og:title", content: "About Swati Enterprises" },
      { property: "og:description", content: "Delhi's trusted Pigeon, Dubblin and Yera retailer since 2005." },
    ],
  }),
  component: () => (
    <StaticPage
      title="About Swati Enterprises"
      intro="A Chandni Chowk kitchenware business serving Delhi households and institutions since 2005."
    >
      <section>
        <h2>Who we are</h2>
        <p>
          Swati Enterprises began as a single counter in Chandni Chowk selling pressure cookers and
          steel tableware. Today we stock over 800 SKUs across three brands and supply homes,
          caterers, gifting agents and institutional buyers across Delhi NCR.
        </p>
      </section>
      <section>
        <h2>The brands we carry</h2>
        <ul>
          <li>
            <strong>Pigeon</strong> — pressure cookers, non-stick cookware, gas stoves and small
            kitchen appliances.
          </li>
          <li>
            <strong>Dubblin</strong> — vacuum-insulated bottles, casseroles, lunch boxes and
            stainless steel serveware.
          </li>
          <li>
            <strong>Yera Glassware</strong> — borosilicate storage, bakeware, tumblers and dinner
            sets.
          </li>
        </ul>
      </section>
      <section>
        <h2>Why buy from us</h2>
        <ul>
          <li>Authorised stock with full manufacturer warranty.</li>
          <li>Delhi NCR dispatch within the same week, free above Rs. 999.</li>
          <li>Cash on delivery and GST invoices for business buyers.</li>
          <li>Walk-in support at our Chandni Chowk counter for replacements.</li>
        </ul>
      </section>
    </StaticPage>
  ),
});
