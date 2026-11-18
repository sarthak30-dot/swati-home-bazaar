import { Link } from "@tanstack/react-router";
import { MessageCircle, ShieldCheck, Truck, RotateCcw, Banknote } from "lucide-react";
import { CONTACT } from "@/lib/site";

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
              <Link to="/account/orders" className="hover:text-gold">
                Track my order
              </Link>
            </li>
            <li>
              <Link to="/bulk-orders" className="hover:text-gold">
                Bulk orders
              </Link>
            </li>
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
              <a href={CONTACT.phoneHref} className="hover:text-gold">
                {CONTACT.phoneDisplay}
              </a>
            </p>
            <p>
              <a href={`mailto:${CONTACT.email}`} className="hover:text-gold">
                {CONTACT.email}
              </a>
            </p>
            <p className="pt-2 text-xs">Mon&ndash;Sat, 10:00 AM &ndash; 8:00 PM</p>
          </address>
          <a
            href={CONTACT.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-success px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" />
            Chat on WhatsApp
          </a>
        </div>
      </div>
      <div className="border-t border-border">
        <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-4 text-xs text-muted-foreground sm:grid-cols-4">
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-gold" /> Authorised retailer
          </li>
          <li className="flex items-center gap-2">
            <Truck className="h-4 w-4 shrink-0 text-gold" /> Free delivery above Rs. 999
          </li>
          <li className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 shrink-0 text-gold" /> 7-day replacement
          </li>
          <li className="flex items-center gap-2">
            <Banknote className="h-4 w-4 shrink-0 text-gold" /> Cash on delivery
          </li>
        </ul>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Swati Enterprises. All rights reserved.
      </div>
    </footer>
  );
}
