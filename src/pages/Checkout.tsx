import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  CreditCard,
  Tag,
  Check,
  X,
  LogIn,
  Truck,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Layout from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh',
];

export default function Checkout() {
  const navigate = useNavigate();
  const {
    items,
    subtotal,
    clearCart,
    appliedCoupon,
    discountAmount,
    finalTotal,
    shipping,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: 'Punjab',
    pincode: '',
    paymentMethod: 'cod',
    notes: '',
  });

  // Prepopulate customer details from profile if user is logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        email: prev.email || user.email || '',
      }));

      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setFormData((prev) => ({
              ...prev,
              name: prev.name || data.full_name || '',
              phone: prev.phone || data.phone || '',
              address: prev.address || data.address || '',
              city: prev.city || data.city || '',
              state: prev.state || data.state || 'Punjab',
              pincode: prev.pincode || data.pincode || '',
            }));
          }
        });
    }
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleApplyCheckoutCoupon = async () => {
    if (!couponInput.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    setApplyingCoupon(true);
    const result = await applyCoupon(couponInput);
    setApplyingCoupon(false);

    if (result.success) {
      toast.success(result.message);
      setCouponInput('');
    } else {
      toast.error(result.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in to place your order');
      navigate('/login?redirect=/checkout');
      return;
    }

    if (
      !formData.name ||
      !formData.phone ||
      !formData.address ||
      !formData.city ||
      !formData.pincode
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    if (!/^[0-9]{6}$/.test(formData.pincode)) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    setLoading(true);

    try {
      // Build order notes with coupon information if applied
      let orderNotes = formData.notes.trim();
      if (appliedCoupon && discountAmount > 0) {
        const couponNote = `[Coupon: ${appliedCoupon.code} (-₹${discountAmount.toFixed(0)})]`;
        orderNotes = orderNotes ? `${orderNotes} ${couponNote}` : couponNote;
      }

      // Pre-generate order UUID so we don't rely on RETURNING * which can fail under RLS select policies
      const newOrderId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
              const r = (Math.random() * 16) | 0;
              const v = c === 'x' ? r : (r & 0x3) | 0x8;
              return v.toString(16);
            });

      // Create order tied permanently to user.id
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          id: newOrderId,
          user_id: user.id,
          customer_name: formData.name,
          customer_phone: formData.phone,
          customer_email: formData.email || user.email || null,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          payment_method: formData.paymentMethod,
          status: 'pending',
          subtotal,
          shipping,
          total: finalTotal,
          notes: orderNotes || null,
        });

      if (orderError) throw orderError;

      // Create order items with explicit weight variant name and custom price
      const orderItems = items.map((item) => ({
        order_id: newOrderId,
        product_id: item.product?.id || null,
        product_name: item.selectedWeight
          ? `${item.product.name} (${item.selectedWeight})`
          : item.product.name,
        quantity: item.quantity,
        price: item.price ?? item.product.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update customer profile with delivery details for 1-click future checkout (non-blocking)
      try {
        await supabase.from('profiles').upsert(
          {
            user_id: user.id,
            full_name: formData.name,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
          },
          { onConflict: 'user_id' }
        );
      } catch (profErr) {
        console.warn('Profile update warning:', profErr);
      }

      // Success!
      setOrderId(newOrderId);
      setOrderPlaced(true);
      clearCart();
      toast.success('Order placed successfully!');
    } catch (error: any) {
      console.error('Error placing order:', error);
      const errorMsg = error?.message || 'Failed to place order. Please try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppOrder = () => {
    const orderText = items
      .map(
        (item) =>
          `${item.quantity}x ${item.product.name}${item.selectedWeight ? ` (${item.selectedWeight})` : ''} - ₹${(((item.price ?? item.product.price)) * item.quantity).toFixed(0)}`
      )
      .join('\n');

    const couponLine =
      appliedCoupon && discountAmount > 0
        ? `\nCoupon Applied: ${appliedCoupon.code} (-₹${discountAmount.toFixed(0)})`
        : '';

    const message = encodeURIComponent(
      `Hi Singlaji Store! I'd like to place an order:\n\n${orderText}\n\nSubtotal: ₹${subtotal.toFixed(0)}${couponLine}\nShipping: ${shipping === 0 ? 'FREE' : '₹' + shipping}\nTotal: ₹${finalTotal.toFixed(0)}\nPayment: Cash on Delivery\n\nName: ${formData.name}\nPhone: ${formData.phone}\nAddress: ${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`
    );

    window.open(`https://wa.me/918872572784?text=${message}`, '_blank');
  };

  if (items.length === 0 && !orderPlaced) {
    navigate('/cart');
    return null;
  }

  // Mandatory Sign In Gate (Amazon / Flipkart / Rezoni style)
  if (!authLoading && !user && !orderPlaced) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 md:py-20 max-w-2xl">
          <Link
            to="/cart"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-8 md:p-10 shadow-card border border-border text-center"
          >
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <LogIn className="h-8 w-8" />
            </div>

            <h1 className="text-2xl md:text-3xl font-serif font-bold mb-3">
              Sign In to Place Your Order
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto mb-8">
              To track your spices delivery live, view receipts, and manage your orders, please sign in or create an account.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Link to="/login?redirect=/checkout">
                  <LogIn className="h-4 w-4 mr-2" /> Sign In to Proceed
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/register?redirect=/checkout">
                  Create New Account
                </Link>
              </Button>
            </div>

            {/* Benefits Banner */}
            <div className="pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Live Tracking</p>
                  <p className="text-[11px] text-muted-foreground">
                    Track live from Abohar facility to doorstep
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Cash on Delivery</p>
                  <p className="text-[11px] text-muted-foreground">
                    Pay safely with cash when package arrives
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Saved Address</p>
                  <p className="text-[11px] text-muted-foreground">
                    1-Click checkout for future orders
                  </p>
                </div>
              </div>
            </div>

            {/* Cart Preview summary */}
            <div className="mt-6 p-4 rounded-xl bg-muted/40 text-left text-xs space-y-1">
              <div className="flex justify-between font-medium">
                <span>Items waiting in your cart ({items.length})</span>
                <span className="font-bold text-primary">₹{finalTotal.toFixed(0)}</span>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Your cart items and applied discounts remain saved when you return.
              </p>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  if (orderPlaced) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold mb-4">
              Order Placed Successfully!
            </h1>
            <p className="text-muted-foreground mb-4">
              Thank you for shopping with Singlaji Masala Store. We have received
              your Cash on Delivery order and are preparing your fresh spices.
            </p>
            {orderId && (
              <p className="text-sm font-mono text-muted-foreground mb-6">
                Order ID: #{orderId.slice(0, 8).toUpperCase()}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {orderId && (
                <Button
                  asChild
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                >
                  <Link to={`/orders/${orderId}`}>
                    Track Order Live <Truck className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button variant="outline" asChild size="lg">
                <Link to="/products">Continue Shopping</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <Link
          to="/cart"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Link>

        <h1 className="text-3xl md:text-4xl font-serif font-bold mb-8">
          Checkout
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Delivery Details */}
              <div className="bg-card rounded-xl p-6 shadow-card border border-border space-y-4">
                <h2 className="font-serif font-semibold text-lg border-b border-border pb-3">
                  Delivery Details
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium mb-1.5 block">
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium mb-1.5 block">
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="email" className="text-sm font-medium mb-1.5 block">
                      Email Address (Optional)
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="For order tracking updates"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="address" className="text-sm font-medium mb-1.5 block">
                      Delivery Address *
                    </Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="House/Flat No., Street, Area, Landmark"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="city" className="text-sm font-medium mb-1.5 block">
                      City *
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="City"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="state" className="text-sm font-medium mb-1.5 block">
                      State *
                    </Label>
                    <select
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full h-10 border rounded-lg px-3 py-2 bg-background text-sm text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="pincode" className="text-sm font-medium mb-1.5 block">
                      PIN Code *
                    </Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="6-digit PIN code"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-card rounded-xl p-6 shadow-card border border-border space-y-4">
                <h2 className="font-serif font-semibold text-lg border-b border-border pb-3">
                  Payment Option
                </h2>

                <RadioGroup
                  value={formData.paymentMethod}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, paymentMethod: val }))
                  }
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Cash on Delivery (COD)</p>
                          <p className="text-xs text-muted-foreground">
                            Pay in cash or UPI to the delivery person
                          </p>
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                    <RadioGroupItem value="whatsapp" id="whatsapp" />
                    <Label htmlFor="whatsapp" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <MessageCircle className="h-5 w-5 text-emerald-600" />
                        <div>
                          <p className="font-medium">Order via WhatsApp</p>
                          <p className="text-xs text-muted-foreground">
                            Confirm order directly with Singlaji Store via WhatsApp
                          </p>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Order Notes */}
              <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                <h2 className="font-serif font-semibold text-lg mb-3">
                  Order Notes (Optional)
                </h2>
                <Textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any special instructions for packaging or delivery..."
                  rows={2}
                />
              </div>

              {/* Place Order Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                {formData.paymentMethod === 'whatsapp' ? (
                  <Button
                    type="button"
                    size="lg"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleWhatsAppOrder}
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Send Order on WhatsApp (₹{finalTotal.toFixed(0)})
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="lg"
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading
                      ? 'Placing Order...'
                      : `Place Order (COD) • ₹${finalTotal.toFixed(0)}`}
                  </Button>
                )}
              </div>
            </form>
          </motion.div>

          {/* Order Summary & Coupon Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:sticky lg:top-28 h-fit space-y-4"
          >
            {/* Quick Coupon in Checkout */}
            <div className="bg-card rounded-xl p-4 shadow-card border border-border">
              <div className="flex items-center gap-2 mb-2.5">
                <Tag className="h-4 w-4 text-primary" />
                <span className="font-semibold text-xs">Coupon Code</span>
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="font-mono font-bold tracking-wider">
                      {appliedCoupon.code}
                    </span>
                    <span>(-₹{discountAmount} saved)</span>
                  </div>
                  <button
                    onClick={() => {
                      removeCoupon();
                      toast.info('Coupon removed');
                    }}
                    className="text-muted-foreground hover:text-destructive font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <Input
                    placeholder="Enter code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyCheckoutCoupon();
                      }
                    }}
                    className="font-mono uppercase text-xs h-9"
                  />
                  <Button
                    size="sm"
                    onClick={handleApplyCheckoutCoupon}
                    disabled={applyingCoupon || !couponInput.trim()}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 h-9"
                  >
                    {applyingCoupon ? '…' : 'Apply'}
                  </Button>
                </div>
              )}
            </div>

            {/* Order Items Breakdown */}
            <div className="bg-card rounded-xl p-6 shadow-card border border-border">
              <h2 className="text-xl font-serif font-semibold mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={`${item.product.id}_${item.selectedWeight || 'default'}`}
                    className="flex gap-3"
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary border border-border shrink-0">
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-serif text-muted-foreground/30">
                            {item.product.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.selectedWeight && (
                          <span className="font-semibold text-primary">
                            {item.selectedWeight} •{' '}
                          </span>
                        )}
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium text-sm">
                      ₹{(((item.price ?? item.product.price)) * item.quantity).toFixed(0)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5 pt-4 border-t border-border text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toFixed(0)}</span>
                </div>

                {appliedCoupon && discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" /> Coupon ({appliedCoupon.code})
                    </span>
                    <span>-₹{discountAmount.toFixed(0)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        FREE
                      </span>
                    ) : (
                      `₹${shipping}`
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center py-4 mt-4 border-t border-border">
                <div>
                  <span className="text-lg font-semibold block">Total</span>
                  {discountAmount > 0 && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Saved ₹{discountAmount.toFixed(0)} with discount
                    </span>
                  )}
                </div>
                <span className="text-2xl font-bold text-primary">
                  ₹{finalTotal.toFixed(0)}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
