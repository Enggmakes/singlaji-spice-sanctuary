import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Layout from '@/components/layout/Layout';
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
  created_at: string;
  status: string;
  subtotal: number;
  shipping: number;
  total: number;
  order_items: OrderItem[];
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (id && user) {
      fetchOrderDetail(id);
    }
  }, [id, user, authLoading, navigate]);

  const fetchOrderDetail = async (orderId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          created_at,
          status,
          subtotal,
          shipping,
          total,
          order_items (
            id,
            product_name,
            quantity,
            price
          )
        `
        )
        .eq('id', orderId)
        .single();

      if (!error && data) {
        setOrder(data as unknown as OrderDetailData);
      } else {
        navigate('/orders');
      }
    } catch (err) {
      console.error('Error loading order detail:', err);
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">
          Loading order details…
        </div>
      </Layout>
    );
  }

  if (!order) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <Link
          to="/orders"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl shadow-card border border-border overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-border flex flex-wrap justify-between items-center gap-4 bg-muted/20">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Order ID
              </p>
              <p className="font-mono text-base font-bold text-foreground">
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
                className={`inline-block rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  order.status === 'pending'
                    ? 'bg-amber-100 text-amber-800'
                    : order.status === 'completed' || order.status === 'delivered'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {order.status}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="divide-y divide-border">
            {order.order_items?.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center px-6 py-4 text-sm"
              >
                <span className="text-foreground">
                  {item.product_name}{' '}
                  <span className="text-muted-foreground">× {item.quantity}</span>
                </span>
                <span className="font-medium text-foreground">
                  ₹{(item.price * item.quantity).toFixed(0)}
                </span>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="p-6 border-t border-border space-y-2 text-sm bg-muted/10">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">
                ₹{order.subtotal?.toFixed(0) || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-foreground">
                ₹{order.shipping?.toFixed(0) || 0}
              </span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-3 border-t border-border">
              <span>Total</span>
              <span className="text-primary">
                ₹{order.total?.toFixed(0) || 0}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
