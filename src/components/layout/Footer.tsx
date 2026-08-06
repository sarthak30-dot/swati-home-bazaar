import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-muted/50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold font-display text-sm font-bold text-white">
              SE
            </span>
            <span className="font-display text-sm font-bold">Swati Enterprises</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Authorised retailer of Pigeon, Dubblin and Yera Glassware. Serving Delhi homes and
            kitchens since 2005.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Shop</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/shop" className="hover:text-gold">
                All products
              </Link>
            </li>
            <li>
              <Link to="/brand/$slug" params={{ slug: "pigeon" }} className="hover:text-gold">
                Pigeon
              </Link>
            </li>
            <li>
              <Link to="/brand/$slug" params={{ slug: "dubblin" }} className="hover:text-gold">
                Dubblin
              </Link>
            </li>
            <li>
              <Link to="/brand/$slug" params={{ slug: "yera" }} className="hover:text-gold">
                Yera Glassware
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Help</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/contact" className="hover:text-gold">
                Contact us
              </Link>
            </li>
            <li>
              <Link to="/shipping-policy" className="hover:text-gold">
                Shipping policy
              </Link>
            </li>
            <li>
              <Link to="/returns-policy" className="hover:text-gold">
                Returns &amp; refunds
              </Link>
            </li>
            <li>
              <Link to="/privacy-policy" className="hover:text-gold">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-gold">
                Terms of service
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Visit us</h3>
          <address className="mt-3 space-y-1 text-sm not-italic text-muted-foreground">
            <p>Swati Enterprises</p>
            <p>Chandni Chowk, Delhi 110006</p>
            <p>
              <a href="tel:+911145678900" className="hover:text-gold">
                +91 11 4567 8900
              </a>
            </p>
            <p>
              <a href="mailto:care@swatienterprises.in" className="hover:text-gold">
                care@swatienterprises.in
              </a>
            </p>
            <p className="pt-2 text-xs">Mon&ndash;Sat, 10:00 AM &ndash; 8:00 PM</p>
          </address>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Swati Enterprises. All rights reserved.
      </div>
    </footer>
  );
}
