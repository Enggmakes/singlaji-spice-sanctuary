import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, ShieldCheck, Truck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-secondary border-t border-border">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Main Footer Grid: 2 columns on mobile, 4 columns on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Brand - full width on mobile, 1 col on desktop */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 mb-2">
              <span className="text-xl sm:text-2xl font-serif font-bold text-primary">Singlaji</span>
              <span className="text-[11px] font-semibold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Masala Store
              </span>
            </Link>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-sm">
              Bringing authentic Indian spices to your kitchen since generations. Pure, fresh, and full of flavor.
            </p>
          </div>

          {/* Quick Links - 1 col on mobile (left half), 1 col on desktop */}
          <div className="col-span-1">
            <h4 className="font-serif text-sm sm:text-base font-bold text-foreground uppercase tracking-wider mb-3">
              Quick Links
            </h4>
            <ul className="space-y-1.5 text-xs sm:text-sm">
              <li>
                <Link to="/products" className="text-muted-foreground hover:text-primary py-0.5 block transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary py-0.5 block transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/products?category=garam-masala" className="text-muted-foreground hover:text-primary py-0.5 block transition-colors">
                  Garam Masala
                </Link>
              </li>
              <li>
                <Link to="/products?category=blends" className="text-muted-foreground hover:text-primary py-0.5 block transition-colors">
                  Special Blends
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service - 1 col on mobile (right half), 1 col on desktop */}
          <div className="col-span-1">
            <h4 className="font-serif text-sm sm:text-base font-bold text-foreground uppercase tracking-wider mb-3">
              Customer Care
            </h4>
            <ul className="space-y-1.5 text-xs sm:text-sm">
              <li>
                <Link to="/orders" className="text-muted-foreground hover:text-primary py-0.5 block transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-muted-foreground hover:text-primary py-0.5 block transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground py-0.5 block">
                  Shipping & Returns
                </span>
              </li>
              <li>
                <span className="text-muted-foreground py-0.5 block">
                  Privacy Policy
                </span>
              </li>
            </ul>
          </div>

          {/* Contact - full width on mobile, 1 col on desktop */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-serif text-sm sm:text-base font-bold text-foreground uppercase tracking-wider mb-3">
              Contact Us
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li className="flex items-start gap-2.5 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span className="leading-snug">
                  Singlaji Store, Nai Abadi St no. 17-18 Near uttam vihar colony Gate no. 2 Abohar
                </span>
              </li>
              <li>
                <a
                  href="tel:+918872572784"
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors py-0.5"
                >
                  <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="font-medium">+91 8872572784</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:singlaji2026@gmail.com"
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors py-0.5"
                >
                  <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>singlaji2026@gmail.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p className="order-2 sm:order-1 text-center sm:text-left">
            © 2025 Singlaji Masala Store. All rights reserved.
          </p>
          <div className="order-1 sm:order-2 flex items-center gap-3 flex-wrap justify-center">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border/60 text-[11px] font-medium text-foreground">
              <ShieldCheck className="h-3 w-3 text-primary" /> Cash on Delivery
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border/60 text-[11px] font-medium text-foreground">
              <Truck className="h-3 w-3 text-primary" /> Pan India Delivery
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

