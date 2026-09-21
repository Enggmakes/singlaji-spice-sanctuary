import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  ArrowRight,
  Tag,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Layout from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';
import { fetchCoupons } from '@/lib/couponService';
import { Coupon } from '@/types/coupon';
import { toast } from 'sonner';

export default function Cart() {
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    clearCart,
    appliedCoupon,
    discountAmount,
    finalTotal,
    shipping,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);

  useEffect(() => {
    fetchCoupons().then((list) => {
      setAvailableCoupons(list.filter((c) => c.is_active));
    });
  }, []);

  const handleApplyCoupon = async (codeToApply?: string) => {
    const targetCode = codeToApply || couponCode;
    if (!targetCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setApplying(true);
    const result = await applyCoupon(targetCode);
    setApplying(false);

    if (result.success) {
      toast.success(result.message);
      setCouponCode('');
    } else {
      toast.error(result.message);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    toast.info('Coupon removed');
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/50 mb-6" />
            <h1 className="text-2xl md:text-3xl font-serif font-bold mb-4">
              Your Cart is Empty
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Looks like you haven't added any spices to your cart yet. Explore our
              collection and find your perfect flavors!
            </p>
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/products">
                Start Shopping <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-serif font-bold mb-8"
        >
          Shopping Cart
        </motion.h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={`${item.product.id}_${item.selectedWeight || 'default'}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-4 p-4 bg-card rounded-xl shadow-soft border border-border"
              >
                {/* Image */}
                <Link
                  to={`/product/${item.product.slug}`}
                  className="w-24 h-24 rounded-lg overflow-hidden bg-secondary shrink-0"
                >
                  <div className="w-full h-full">
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-2xl font-serif text-muted-foreground/30">
                          {item.product.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.product.slug}`}
                    className="font-serif text-lg font-semibold hover:text-primary transition-colors line-clamp-1"
                  >
                    {item.product.name}
                  </Link>
                  {item.selectedWeight ? (
                    <span className="inline-block text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full mt-1">
                      Pack: {item.selectedWeight}
                    </span>
                  ) : item.product.weight ? (
                    <p className="text-sm text-muted-foreground">
                      {item.product.weight}
                    </p>
                  ) : null}
                  <p className="text-lg font-semibold text-primary mt-1">
                    ₹{(item.price ?? item.product.price).toFixed(0)}
                  </p>
                </div>

                {/* Quantity & Actions */}
                <div className="flex flex-col items-end justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.product.id, item.selectedWeight)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center border border-border rounded-lg bg-background">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.quantity - 1,
                          item.selectedWeight
                        )
                      }
                      className="p-2 hover:bg-muted transition-colors rounded-l-lg"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-3 text-sm font-medium min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.quantity + 1,
                          item.selectedWeight
                        )
                      }
                      className="p-2 hover:bg-muted transition-colors rounded-r-lg"
                      disabled={item.quantity >= item.product.stock}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={clearCart}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </Button>
          </div>

          {/* Order Summary & Coupon */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:sticky lg:top-28 h-fit space-y-4"
          >
            {/* Coupon Code Card */}
            <div className="bg-card rounded-xl p-5 shadow-card border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Have a Coupon Code?</h3>
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="font-mono font-bold text-sm tracking-wider">
                        {appliedCoupon.code}
                      </span>
                      <span className="text-xs ml-2">
                        (-₹{discountAmount} saved)
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-muted-foreground hover:text-destructive text-xs font-semibold px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. WELCOME10"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      className="font-mono uppercase text-sm"
                    />
                    <Button
                      onClick={() => handleApplyCoupon()}
                      disabled={applying || !couponCode.trim()}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                    >
                      {applying ? 'Applying…' : 'Apply'}
                    </Button>
                  </div>

                  {/* Available Coupons Pills (Like Myntra) */}
                  {availableCoupons.length > 0 && (
                    <div className="pt-2 border-t border-border/60">
                      <p className="text-[11px] text-muted-foreground font-medium mb-2 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        Available Store Offers:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {availableCoupons.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => handleApplyCoupon(c.code)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium border border-primary/30 bg-primary/5 hover:bg-primary/15 text-primary transition-colors cursor-pointer"
                            title={c.description || `${c.discount_value} OFF`}
                          >
                            <span>{c.code}</span>
                            <span className="text-[10px] opacity-75">
                              ({c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`})
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Price Summary Card */}
            <div className="bg-card rounded-xl p-6 shadow-card border border-border">
              <h2 className="text-xl font-serif font-semibold mb-6">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Subtotal ({items.length} items)
                  </span>
                  <span className="font-medium">₹{subtotal.toFixed(0)}</span>
                </div>

                {appliedCoupon && discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" /> Coupon Discount ({appliedCoupon.code})
                    </span>
                    <span>-₹{discountAmount.toFixed(0)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        FREE
                      </span>
                    ) : (
                      `₹${shipping}`
                    )}
                  </span>
                </div>

                {shipping > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Add ₹{(500 - subtotal).toFixed(0)} more for free shipping
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center py-4 border-t border-border mb-6">
                <div>
                  <span className="text-lg font-semibold block">Total</span>
                  {discountAmount > 0 && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      You saved ₹{discountAmount.toFixed(0)}!
                    </span>
                  )}
                </div>
                <span className="text-2xl font-bold text-primary">
                  ₹{finalTotal.toFixed(0)}
                </span>
              </div>

              <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
                <Link to="/checkout">
                  Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-4">
                Cash on Delivery & WhatsApp Orders Available
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
