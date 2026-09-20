import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, RefreshCw } from 'lucide-react';
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

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  order_items: OrderItem[];
}

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety fallback: Never keep loading spinner stuck for more than 1.5s
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    if (!authLoading && !user) {
      navigate('/login?redirect=/orders');
      return;
    }

    if (user) {
      fetchOrders();

      // Realtime subscription for customer's own orders
      const channel = supabase
        .channel(`customer_orders_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchOrdersSilent();
          }
        )
        .subscribe();

      return () => {
        clearTimeout(safetyTimer);
        supabase.removeChannel(channel);
      };
    }

    return () => clearTimeout(safetyTimer);
  }, [user?.id, authLoading]);

  const fetchOrders = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    await fetchOrdersSilent();
    setLoading(false);
  };

  const fetchOrdersSilent = async () => {
    if (!user) return;
    try {
      // PRIVACY ENFORCEMENT: Strictly fetch ONLY orders belonging to this logged in customer
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          created_at,
          status,
          total,
          order_items (
            id,
            product_name,
            quantity,
            price
          )
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(data as unknown as Order[]);
      }
    } catch (err) {
      console.error('Error fetching customer orders:', err);
    }
  };

  if (authLoading && !user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
          <p className="text-muted-foreground text-sm">Authenticating…</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">My Orders</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Track your spice deliveries and view past purchases
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading && orders.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-primary mb-3"></div>
            <p className="text-sm font-medium">Loading your orders…</p>
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-card rounded-xl border border-border p-8"
          >
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-6 text-lg">
              You haven't placed any orders yet.
            </p>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/products">Start Shopping</Link>
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl shadow-card border border-border overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 p-6 border-b border-border bg-muted/20">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Order ID
                    </p>
                    <p className="font-mono text-sm font-medium text-foreground">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Date
                    </p>
                    <p className="text-sm text-foreground">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Status
                    </p>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize tracking-wide ${
                        order.status === 'cancelled'
                          ? 'bg-destructive/15 text-destructive'
                          : order.status === 'delivered' || order.status === 'completed'
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                          : order.status === 'shipped' || order.status === 'out_for_delivery'
                          ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300'
                          : order.status === 'packed' || order.status === 'processing'
                          ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300'
                          : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Total
                    </p>
                    <p className="font-semibold text-primary text-base">
                      ₹{order.total?.toFixed(0) || 0}
                    </p>
                  </div>

                  <div>
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold"
                      asChild
                    >
                      <Link to={`/orders/${order.id}`}>
                        Track Order →
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="divide-y divide-border">
                  {order.order_items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center px-6 py-4 text-sm"
                    >
                      <span className="text-foreground">
                        {item.product_name}{' '}
                        <span className="text-muted-foreground">
                          × {item.quantity}
                        </span>
                      </span>
                      <span className="font-medium text-foreground">
                        ₹{(item.price * item.quantity).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
