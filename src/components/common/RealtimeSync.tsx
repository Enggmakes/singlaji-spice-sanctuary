import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * RealtimeSync sets up global Supabase WebSockets for the entire app.
 * It listens to PostgreSQL database changes & instant broadcast events for:
 * - products (prices, weights, stock, active status)
 * - categories
 * - coupons
 * When an admin updates anything, all open customer tabs/devices update live in real time.
 */
export default function RealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // 1. Supabase PostgreSQL Database changes
    const dbChannel = supabase
      .channel('store_global_db_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('[Realtime DB] Product changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['product'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => {
          console.log('[Realtime DB] Category changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['categories'] });
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'coupons' },
        (payload) => {
          console.log('[Realtime DB] Coupon changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['coupons'] });
        }
      )
      .subscribe();

    // 2. High-speed WebSocket Broadcast for sub-50ms instant updates
    const broadcastChannel = supabase
      .channel('store_fast_broadcast')
      .on('broadcast', { event: 'product_changed' }, () => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['product'] });
      })
      .on('broadcast', { event: 'category_changed' }, () => {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      })
      .on('broadcast', { event: 'coupon_changed' }, () => {
        queryClient.invalidateQueries({ queryKey: ['coupons'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dbChannel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [queryClient]);

  return null;
}
