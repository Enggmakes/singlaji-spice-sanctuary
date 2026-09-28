import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useProducts';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getCategoryVectorIcon,
  NavShopBagIcon,
  NavCategoriesIcon,
  NavOurStoryIcon,
  NavTrackOrderIcon,
} from '@/components/icons/SpiceCategoryIcons';

const fallbackCategories = [
  { name: 'Garam Masala', slug: 'garam-masala' },
  { name: 'Red Chilli', slug: 'red-chilli' },
  { name: 'Turmeric', slug: 'turmeric' },
  { name: 'Coriander', slug: 'coriander' },
  { name: 'Cumin', slug: 'cumin' },
  { name: 'Blends', slug: 'blends' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const { totalItems } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const { data: remoteCategories } = useCategories();
  const navigate = useNavigate();
  const location = useLocation();

  const categories =
    remoteCategories && remoteCategories.length > 0
      ? remoteCategories
      : fallbackCategories;

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      toast.success('Signed out successfully');
      await signOut();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      window.location.replace('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-xs">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl md:text-3xl font-serif font-bold text-primary tracking-tight group-hover:opacity-90 transition-opacity">
              Singlaji
            </span>
            <span className="text-xs md:text-sm text-muted-foreground font-light hidden sm:inline-block border-l border-border pl-2 py-0.5">
              Masala Store
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            <Link
              to="/products"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                location.pathname === '/products' && !location.search
                  ? 'text-primary bg-primary/10 font-semibold shadow-xs'
                  : 'text-foreground/80 hover:text-primary hover:bg-muted/60'
              }`}
            >
              All Spices
            </Link>

            {/* Categories Dropdown (Scroll-contained, Flaticon vector icons inside dropdown) */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 outline-none cursor-pointer ${
                  location.search.includes('category=')
                    ? 'text-primary bg-primary/10 font-semibold shadow-xs'
                    : 'text-foreground/80 hover:text-primary hover:bg-muted/60'
                }`}
              >
                <span>Categories</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform duration-200" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-64 p-2 shadow-xl border-border rounded-xl">
                <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>Spice Categories</span>
                  <span className="text-[10px] font-normal text-muted-foreground">({categories.length})</span>
                </div>
                <div className="grid grid-cols-1 gap-0.5 pt-1 max-h-72 overflow-y-auto">
                  {categories.map((cat) => (
                    <DropdownMenuItem key={cat.slug} asChild className="cursor-pointer rounded-lg">
                      <Link
                        to={`/products?category=${cat.slug}`}
                        className="flex items-center justify-between w-full px-2.5 py-2 text-sm font-medium capitalize hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-md bg-muted/70 flex items-center justify-center shrink-0 p-0.5">
                            {getCategoryVectorIcon(cat.name, 'w-full h-full')}
                          </span>
                          <span className="truncate">{cat.name}</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-30" />
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator className="my-1.5" />
                <DropdownMenuItem asChild className="rounded-lg">
                  <Link
                    to="/products"
                    className="flex items-center justify-center text-xs font-semibold text-primary py-2 hover:bg-primary/10 transition-colors w-full text-center"
                  >
                    Explore Full Catalog →
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              to="/about"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                location.pathname === '/about'
                  ? 'text-primary bg-primary/10 font-semibold shadow-xs'
                  : 'text-foreground/80 hover:text-primary hover:bg-muted/60'
              }`}
            >
              Our Story
            </Link>

            {/* Admin Panel Tab - ONLY visible to admin */}
            {isAdmin && (
              <Link
                to="/admin"
                className="text-primary font-semibold flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-full hover:bg-primary/20 transition-all shadow-xs text-xs ml-2"
              >
                <Settings className="h-3.5 w-3.5" />
                Admin Panel
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Cart */}
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-muted">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold shadow-xs"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 p-1.5 shadow-xl rounded-xl">
                  <div className="px-2.5 py-1.5 border-b border-border/60 mb-1">
                    <p className="text-xs font-semibold text-foreground truncate">{user.email}</p>
                    <p className="text-[10px] text-muted-foreground">Singlaji Customer</p>
                  </div>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to="/account">My Account</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to="/orders">My Orders & Tracking</Link>
                  </DropdownMenuItem>

                  {/* Admin link - ONLY visible to admin */}
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link
                          to="/admin"
                          className="flex items-center gap-2 text-primary font-semibold"
                        >
                          <Settings className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      handleSignOut();
                    }}
                    className="text-destructive cursor-pointer rounded-lg focus:text-destructive focus:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button variant="outline-primary" size="sm" className="hidden sm:flex rounded-xl font-medium">
                  Login
                </Button>
                <Button variant="ghost" size="icon" className="sm:hidden rounded-xl hover:bg-muted">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center border border-border/80 bg-background hover:bg-muted active:scale-95 text-foreground transition-all shadow-xs"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-primary" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="lg:hidden overflow-hidden border-t border-border bg-card/98 backdrop-blur-xl"
            >
              <div className="py-4 space-y-3 max-h-[82vh] overflow-y-auto px-1">
                {/* 1. All Products Main Card */}
                <Link
                  to="/products"
                  className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 hover:bg-primary/10 border border-border/60 text-foreground transition-all group"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform p-1.5">
                      <NavShopBagIcon className="w-full h-full" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                        All Spices & Masalas
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Explore our handcrafted, 100% pure catalog
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>

                {/* 2. Nested Expandable Categories Accordion */}
                <div className="rounded-2xl border border-border/70 overflow-hidden bg-muted/20">
                  <button
                    type="button"
                    onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 p-1.5">
                        <NavCategoriesIcon className="w-full h-full" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                          <span>Shop by Category</span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {categories.length}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {mobileCategoriesOpen ? 'Tap to collapse categories' : 'Tap to browse spices by category'}
                        </div>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-background border border-border/60 flex items-center justify-center text-muted-foreground">
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          mobileCategoriesOpen ? 'rotate-180 text-primary' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Collapsible Nested Category List */}
                  <AnimatePresence>
                    {mobileCategoriesOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-border/50 bg-background/70"
                      >
                        <div className="p-2 max-h-56 overflow-y-auto space-y-1">
                          {categories.map((cat) => (
                            <Link
                              key={cat.slug}
                              to={`/products?category=${cat.slug}`}
                              className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-primary/10 text-foreground transition-colors group"
                              onClick={() => {
                                setMobileCategoriesOpen(false);
                                setMobileMenuOpen(false);
                              }}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-7 h-7 rounded-lg bg-muted/80 flex items-center justify-center shrink-0 p-1 group-hover:scale-105 transition-transform">
                                  {getCategoryVectorIcon(cat.name, 'w-full h-full')}
                                </span>
                                <span className="text-xs font-medium capitalize truncate group-hover:text-primary transition-colors">
                                  {cat.name}
                                </span>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                            </Link>
                          ))}
                          <Link
                            to="/products"
                            className="block text-center text-xs font-semibold text-primary py-2.5 border-t border-border/40 mt-1 hover:underline"
                            onClick={() => {
                              setMobileCategoriesOpen(false);
                              setMobileMenuOpen(false);
                            }}
                          >
                            View All ({categories.length}) Categories →
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 3. Secondary Nav Links (Our Story & Track Order) */}
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/about"
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-muted/30 hover:bg-primary/10 border border-border/50 text-foreground transition-all group"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 p-1.5">
                      <NavOurStoryIcon className="w-full h-full" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-foreground group-hover:text-primary truncate">
                        Our Story
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        Heritage & Purity
                      </div>
                    </div>
                  </Link>

                  <Link
                    to="/orders"
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-muted/30 hover:bg-primary/10 border border-border/50 text-foreground transition-all group"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 p-1.5">
                      <NavTrackOrderIcon className="w-full h-full" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-foreground group-hover:text-primary truncate">
                        Track Order
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        Live shipment
                      </div>
                    </div>
                  </Link>
                </div>

                {/* 4. Account / User Action */}
                <div className="pt-2 border-t border-border/60">
                  {user ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-foreground truncate">
                            {user.email || 'My Account'}
                          </div>
                          <Link
                            to="/account"
                            className="text-[10px] text-primary hover:underline block"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Manage Account →
                          </Link>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive hover:bg-destructive/10 h-7 px-2"
                        onClick={handleSignOut}
                      >
                        <LogOut className="w-3.5 h-3.5 mr-1" /> Logout
                      </Button>
                    </div>
                  ) : (
                    <Link
                      to="/login"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:bg-primary/90 transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="w-3.5 h-3.5" />
                      Login or Register Account
                    </Link>
                  )}
                </div>

                {/* 5. Mobile Admin Link - ONLY visible to admin */}
                {isAdmin && (
                  <div className="pt-1">
                    <Link
                      to="/admin"
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-primary/10 border border-primary/25 text-primary font-semibold text-xs hover:bg-primary/20 transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <span>Singlaji Admin Dashboard</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
