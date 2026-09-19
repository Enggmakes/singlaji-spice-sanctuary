import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-secondary border-t border-border">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-block mb-4">
              <span className="text-2xl font-serif font-bold text-primary">Singlaji</span>
              <span className="text-sm text-muted-foreground ml-2">Masala Store</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Bringing authentic Indian spices to your kitchen since generations. 
              Pure, fresh, and full of flavor.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/products?category=garam-masala" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  Garam Masala
                </Link>
              </li>
              <li>
                <Link to="/products?category=blends" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  Special Blends
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/orders" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground text-sm">
                  Shipping & Returns
                </span>
              </li>
              <li>
                <span className="text-muted-foreground text-sm">
                  Privacy Policy
                </span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Singlaji Store, Nai Abadi St no. 17-18 Near uttam vihar colony Gate no. 2 Abohar</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <a href="tel:+918872572784" className="hover:text-primary transition-colors">
                  +91 8872572784
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <a href="mailto:singlaji2026@gmail.com" className="hover:text-primary transition-colors">
                  singlaji2026@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 Singlaji Masala Store. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Cash on Delivery Available</span>
            <span className="hidden md:inline">•</span>
            <span>Pan India Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
