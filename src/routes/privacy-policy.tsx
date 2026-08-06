import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/layout/StaticPage";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy policy — Swati Enterprises" },
      {
        name: "description",
        content:
          "How Swati Enterprises collects, stores and uses your personal information when you shop with us.",
      },
      { property: "og:title", content: "Privacy policy — Swati Enterprises" },
      { property: "og:description", content: "How we handle your personal data." },
    ],
  }),
  component: () => (
    <StaticPage title="Privacy policy" intro="What we collect, why we collect it, and your choices.">
      <section>
        <h2>Information we collect</h2>
        <ul>
          <li>Account details: name, email address and mobile number.</li>
          <li>Delivery addresses and, if provided, your GST number.</li>
          <li>Order history, cart and wishlist contents.</li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <p>
          We use your information to process orders, arrange delivery, provide support, and send
          transactional updates about your purchases. We do not sell your data.
        </p>
      </section>
      <section>
        <h2>Sharing</h2>
        <p>
          We share the minimum necessary details with courier partners for delivery, and with brand
          service centres when you raise a warranty claim.
        </p>
      </section>
      <section>
        <h2>Your rights</h2>
        <p>
          You can update your profile and addresses at any time from your account, or write to
          care@swatienterprises.in to request deletion of your account and associated data.
        </p>
      </section>
    </StaticPage>
  ),
});
