import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Clock,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface OrderDetailData {
  id: string;
  user_id?: string;
  created_at: string;
  status: string;
  subtotal: number;
  shipping: number;
  total: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  payment_method: string;
  notes?: string;
  courier_name?: string;
  tracking_number?: string;
  tracking_url?: string;
  order_items: OrderItem[];
}

const TRACKING_STEPS = [
  {
    key: 'confirmed',
    title: 'Order Confirmed',
    description: 'Order placed & verified for Cash on Delivery',
  },
  {
    key: 'packed',
    title: 'Packed & Quality Sealed',
    description: 'Fresh spices sealed at Abohar facility',
  },
  {
    key: 'shipped',
    title: 'Dispatched / In Transit',
    description: 'Handed over to courier partner',
  },
  {
    key: 'out_for_delivery',
    title: 'Out for Delivery',
    description: 'Courier agent is on the way to your doorstep',
  },
  {
    key: 'delivered',
    title: 'Delivered',
    description: 'Package safely delivered to you',
  },
];

const getStepIndex = (status: string) => {
  const s = (status || '').toLowerCase().trim();
  if (s === 'pending' || s === 'confirmed') return 0;
  if (s === 'processing' || s === 'packed') return 1;
  if (s === 'shipped' || s === 'dispatched' || s === 'in_transit') return 2;
  if (s === 'out_for_delivery' || s === 'out for delivery') return 3;
  if (s === 'delivered' || s === 'completed') return 4;
  return 0;
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety timer: Never freeze on loading screen
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    if (id) {
      fetchOrderDetail(id);

      // Realtime subscription for live status changes on this order
      const channel = supabase
        .channel(`order_live_${id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${id}`,
          },
          () => {
            fetchOrderDetailSilent(id);
          }
        )
        .subscribe();

      return () => {
        clearTimeout(safetyTimer);
        supabase.removeChannel(channel);
      };
    }

    return () => clearTimeout(safetyTimer);
  }, [id]);

  const fetchOrderDetail = async (orderId: string) => {
    setLoading(true);
    await fetchOrderDetailSilent(orderId);
    setLoading(false);
  };

  const fetchOrderDetailSilent = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          user_id,
          created_at,
          status,
          subtotal,
          shipping,
          total,
          customer_name,
          customer_phone,
          customer_email,
          address,
          city,
          state,
          pincode,
          payment_method,
          notes,
          courier_name,
          tracking_number,
          tracking_url,
          order_items (
            id,
            product_name,
            quantity,
            price
          )
        `
        )
        .eq('id', orderId)
        .maybeSingle();

      if (!error && data) {
        setOrder(data as unknown as OrderDetailData);
      }
    } catch (err) {
      console.error('Error loading order detail:', err);
    }
  };

  if (loading || authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
          <p className="text-sm font-medium">Loading live order tracking…</p>
        </div>
      </Layout>
    );
  }

  // PRIVACY RESTRICTION CHECK:
  // Customers may only view their own orders. Admins can view any order.
  const isAuthorized =
    isAdmin ||
    (user &&
      order &&
      (order.user_id === user.id ||
        (order.customer_email &&
          user.email &&
          order.customer_email.toLowerCase().trim() ===
            user.email.toLowerCase().trim())));

  if (order && !isAuthorized) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center max-w-md">
          <div className="h-14 w-14 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-4">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-serif font-bold mb-2 text-foreground">
            Access Restricted
          </h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            For privacy and security, you can only view orders placed from your own
            Singlaji account. Sensitive customer information is protected.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link to="/orders">View My Orders</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Back to Store</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center max-w-md">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-40" />
          <h1 className="text-2xl font-serif font-bold mb-2">Order Not Found</h1>
          <p className="text-sm text-muted-foreground mb-6">
            We couldn't find an order with ID #{id?.slice(0, 8).toUpperCase()}.
            Please check the link or contact our support team.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link to="/">Back to Home</Link>
            </Button>
            {user && (
              <Button variant="outline" asChild>
                <Link to="/orders">My Orders</Link>
              </Button>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  const currentStep = getStepIndex(order.status);
  const isCancelled = order.status.toLowerCase() === 'cancelled';

  // Parse courier details from columns or notes fallback
  let courier = order.courier_name || '';
  let awb = order.tracking_number || '';
  if (!courier || !awb) {
    const match = (order.notes || '').match(/\[Courier:\s*([^|\]]+)\s*\|\s*Track:\s*([^\]]+)\]/i);
    if (match) {
      courier = courier || match[1].trim();
      awb = awb || match[2].trim();
    }
  }

  // Generate courier tracking URL
  let courierTrackUrl = order.tracking_url || '';
  if (!courierTrackUrl && awb) {
    const cLower = courier.toLowerCase();
    if (cLower.includes('delhivery')) {
      courierTrackUrl = `https://www.delhivery.com/track/package/${awb}`;
    } else if (cLower.includes('blue dart')) {
      courierTrackUrl = `https://www.bluedart.com/tracking`;
    } else if (cLower.includes('dtdc')) {
      courierTrackUrl = `https://www.dtdc.in/tracking.asp`;
    } else if (cLower.includes('india post') || cLower.includes('speed post')) {
      courierTrackUrl = `https://www.indiapost.gov.in/_layouts/15/dpt.cept.tracking/trackconsignment.aspx`;
    }
  }

  const shortOrderId = order.id.slice(0, 8).toUpperCase();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            to="/orders"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Orders
          </Link>
        </div>

        {/* Status Card Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-card border border-border p-6 md:p-8 mb-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                  Order #{shortOrderId}
                </h1>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                    isCancelled
                      ? 'bg-destructive/15 text-destructive'
                      : order.status === 'delivered' || order.status === 'completed'
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                      : order.status === 'shipped' || order.status === 'out_for_delivery'
                      ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300'
                      : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" /> Placed on{' '}
                {new Date(order.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Total Amount</span>
              <span className="text-2xl font-bold text-primary">
                ₹{order.total?.toFixed(0) || 0}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-medium">
                Cash on Delivery (COD)
              </span>
            </div>
          </div>

          {/* Cancellation Notice if Cancelled */}
          {isCancelled ? (
            <div className="mt-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold text-sm">This order was cancelled.</p>
                <p className="text-xs opacity-90">
                  If this was a mistake or you have queries, please contact our support team.
                </p>
              </div>
            </div>
          ) : (
            /* Live Step Tracker (Amazon / Flipkart style) */
            <div className="mt-8">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                Live Delivery Tracker
              </h2>

              <div className="relative">
                {/* Horizontal progress bar for md+ screens */}
                <div className="hidden md:block absolute top-5 left-8 right-8 h-1 bg-muted -z-0">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{
                      width: `${(currentStep / (TRACKING_STEPS.length - 1)) * 100}%`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-2 relative z-10">
                  {TRACKING_STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStep;
                    const isCurrent = idx === currentStep;

                    return (
                      <div
                        key={step.key}
                        className="flex md:flex-col items-start md:items-center text-left md:text-center gap-4 md:gap-3"
                      >
                        {/* Step Circle Icon */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                            isCompleted
                              ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                              : 'bg-muted text-muted-foreground border-2 border-border'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <span className="text-xs font-bold">{idx + 1}</span>
                          )}
                        </div>

                        {/* Step Text */}
                        <div>
                          <p
                            className={`text-sm font-semibold ${
                              isCurrent
                                ? 'text-primary'
                                : isCompleted
                                ? 'text-foreground'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {step.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[150px]">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Courier Tracking Details Card (if shipped) */}
              {courier && (
                <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/20 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                        Courier Partner
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {courier}{' '}
                        {awb && (
                          <span className="font-mono font-normal text-muted-foreground ml-2">
                            (AWB: {awb})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {courierTrackUrl && (
                    <Button asChild size="sm" variant="outline" className="text-xs shrink-0">
                      <a href={courierTrackUrl} target="_blank" rel="noopener noreferrer">
                        Track with Courier <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* 2-Column Details: Shipping Address & Order Items */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Shipping Address & Customer Details */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-card rounded-xl p-6 shadow-card border border-border">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Delivery Address</h3>
              </div>

              <div className="text-sm space-y-1 text-foreground">
                <p className="font-semibold">{order.customer_name}</p>
                <p className="text-muted-foreground">{order.address}</p>
                <p className="text-muted-foreground">
                  {order.city}, {order.state} - {order.pincode}
                </p>
                <p className="text-muted-foreground pt-2 text-xs">
                  Phone: <span className="font-mono text-foreground">{order.customer_phone}</span>
                </p>
                {order.customer_email && (
                  <p className="text-muted-foreground text-xs">
                    Email: <span className="text-foreground">{order.customer_email}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Payment & Assurance */}
            <div className="bg-card rounded-xl p-6 shadow-card border border-border">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Payment Method</h3>
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">Cash on Delivery (COD)</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please keep exact cash ready: <strong>₹{order.total?.toFixed(0)}</strong>
                </p>
              </div>
            </div>

            {/* Quick WhatsApp Support */}
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 text-center">
              <MessageCircle className="h-6 w-6 mx-auto text-emerald-600 mb-2" />
              <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
                Need Help with this Order?
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 mb-3">
                Chat directly with our Singlaji support team on WhatsApp.
              </p>
              <Button
                asChild
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                <a
                  href={`https://wa.me/918872572784?text=${encodeURIComponent(
                    `Hi Singlaji, I need help with my Order #${shortOrderId}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                  Chat on WhatsApp
                </a>
              </Button>
            </div>
          </div>

          {/* Ordered Items & Summary */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Items in this Order ({order.order_items?.length || 0})
                </h3>
              </div>

              {/* Items List */}
              <div className="divide-y divide-border">
                {order.order_items?.map((item) => (
                  <div
                    key={item.id}
                    className="p-6 flex items-center justify-between gap-4 text-sm"
                  >
                    <div>
                      <p className="font-medium text-foreground">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Quantity: <span className="font-semibold text-foreground">{item.quantity}</span> × ₹{item.price.toFixed(0)}
                      </p>
                    </div>
                    <span className="font-bold text-base text-foreground">
                      ₹{(item.price * item.quantity).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="p-6 bg-muted/20 border-t border-border space-y-2.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-foreground">₹{order.subtotal?.toFixed(0) || 0}</span>
                </div>

                {order.notes && order.notes.includes('[Coupon:') && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                    <span>Discount Applied</span>
                    <span>{order.notes.match(/\[Coupon:[^\]]+\]/)?.[0]}</span>
                  </div>
                )}

                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping Fee</span>
                  <span className="text-foreground">
                    {order.shipping === 0 ? (
                      <span className="text-emerald-600 font-semibold">FREE</span>
                    ) : (
                      `₹${order.shipping?.toFixed(0)}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between font-bold text-lg pt-3 border-t border-border text-foreground">
                  <span>Total (Pay on Delivery)</span>
                  <span className="text-primary">₹{order.total?.toFixed(0) || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
