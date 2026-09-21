import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CartItem, Product } from '@/types';
import { Coupon } from '@/types/coupon';
import { fetchCoupons, calculateCouponDiscount } from '@/lib/couponService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface CartContextType {
  items: CartItem[];
  addItem: (
    product: Product,
    quantity?: number,
    selectedWeight?: string,
    unitPrice?: number
  ) => void;
  removeItem: (productId: string, selectedWeight?: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    selectedWeight?: string
  ) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  appliedCoupon: Coupon | null;
  discountAmount: number;
  finalTotal: number;
  shipping: number;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Unique device/tab session ID to avoid processing self-broadcasts
function getDeviceId(): string {
  try {
    let id = sessionStorage.getItem('singlaji_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
      sessionStorage.setItem('singlaji_device_id', id);
    }
    return id;
  } catch {
    return 'dev_' + Math.random().toString(36).substring(2, 10);
  }
}

// Helper function to merge cloud cart and local cart items without duplicating
function mergeCartItems(cloudItems: CartItem[], localItems: CartItem[]): CartItem[] {
  const merged: CartItem[] = [...cloudItems];
  for (const local of localItems) {
    const matchIndex = merged.findIndex(
      (item) =>
        item.product.id === local.product.id &&
        (item.selectedWeight || '') === (local.selectedWeight || '')
    );
    if (matchIndex >= 0) {
      merged[matchIndex] = {
        ...merged[matchIndex],
        quantity: Math.max(merged[matchIndex].quantity, local.quantity),
        price: local.price || merged[matchIndex].price,
      };
    } else {
      merged.push(local);
    }
  }
  return merged;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const lastSyncedUserIdRef = useRef<string | null>(null);
  const isSyncingFromCloudRef = useRef<boolean>(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const deviceId = useRef<string>(getDeviceId()).current;
  const couponTimestampRef = useRef<number>(
    (() => {
      const savedTs = localStorage.getItem('singlaji-applied-coupon-timestamp');
      return savedTs ? Number(savedTs) : 0;
    })()
  );

  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('singlaji-cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    const saved = localStorage.getItem('singlaji-applied-coupon');
    return saved ? JSON.parse(saved) : null;
  });

  // Helper to pull fresh cart data from Supabase Auth cloud
  const pullFreshCloudCart = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.auth.getUser();
      const freshCloud = data?.user?.user_metadata?.cart_items;
      const freshCloudCoupon = data?.user?.user_metadata?.cart_coupon;
      const freshCouponTs = Number(data?.user?.user_metadata?.cart_coupon_timestamp) || 0;

      if (Array.isArray(freshCloud)) {
        const localString = localStorage.getItem('singlaji-cart') || '[]';
        if (JSON.stringify(freshCloud) !== localString) {
          isSyncingFromCloudRef.current = true;
          setItems(freshCloud);
          localStorage.setItem('singlaji-cart', JSON.stringify(freshCloud));
        }
      }

      // Conflict-free: Only apply cloud coupon if its timestamp is strictly newer
      if (freshCouponTs > couponTimestampRef.current) {
        couponTimestampRef.current = freshCouponTs;
        setAppliedCoupon(freshCloudCoupon || null);
        if (freshCloudCoupon) {
          localStorage.setItem('singlaji-applied-coupon', JSON.stringify(freshCloudCoupon));
          localStorage.setItem('singlaji-applied-coupon-timestamp', String(freshCouponTs));
        } else {
          localStorage.removeItem('singlaji-applied-coupon');
          localStorage.setItem('singlaji-applied-coupon-timestamp', String(freshCouponTs));
        }
      }
    } catch {
      // Silently ignore network hiccup during active check
    }
  };

  // 1. Setup Supabase Realtime WebSocket Broadcast Channel for Instant Multi-Device Sync
  useEffect(() => {
    if (!user) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    const channelName = `cart_realtime_${user.id}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: {
          self: false,
        },
      },
    });

    channel
      .on('broadcast', { event: 'cart_sync' }, ({ payload }) => {
        if (!payload || payload.senderId === deviceId) return;

        // cart_sync handles cart items only so it never conflicts with applied coupons
        if (Array.isArray(payload.items)) {
          isSyncingFromCloudRef.current = true;
          setItems(payload.items);
          localStorage.setItem('singlaji-cart', JSON.stringify(payload.items));
        }
      })
      .on('broadcast', { event: 'coupon_sync' }, ({ payload }) => {
        if (!payload || payload.senderId === deviceId) return;

        // Dedicated real-time coupon event from the other device with timestamp protection
        const incomingTs = Number(payload.couponTimestamp) || 0;
        if (incomingTs >= couponTimestampRef.current) {
          couponTimestampRef.current = incomingTs;
          setAppliedCoupon(payload.coupon || null);
          if (payload.coupon) {
            localStorage.setItem('singlaji-applied-coupon', JSON.stringify(payload.coupon));
            localStorage.setItem('singlaji-applied-coupon-timestamp', String(incomingTs));
          } else {
            localStorage.removeItem('singlaji-applied-coupon');
            localStorage.setItem('singlaji-applied-coupon-timestamp', String(incomingTs));
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Immediately pull latest upon channel connection
          pullFreshCloudCart();
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]);

  // 2. Initial Cloud Sync when User logs in or account switches
  useEffect(() => {
    if (!user) {
      lastSyncedUserIdRef.current = null;
      return;
    }

    if (lastSyncedUserIdRef.current === user.id) {
      return;
    }
    lastSyncedUserIdRef.current = user.id;

    const syncOnLogin = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const cloudRaw = userData?.user?.user_metadata?.cart_items;
        const cloudCoupon = userData?.user?.user_metadata?.cart_coupon;
        const cloudCouponTs = Number(userData?.user?.user_metadata?.cart_coupon_timestamp) || 0;
        const cloudItems: CartItem[] = Array.isArray(cloudRaw) ? cloudRaw : [];

        if (cloudCouponTs > couponTimestampRef.current) {
          couponTimestampRef.current = cloudCouponTs;
          setAppliedCoupon(cloudCoupon || null);
          if (cloudCoupon) {
            localStorage.setItem('singlaji-applied-coupon', JSON.stringify(cloudCoupon));
            localStorage.setItem('singlaji-applied-coupon-timestamp', String(cloudCouponTs));
          } else {
            localStorage.removeItem('singlaji-applied-coupon');
            localStorage.setItem('singlaji-applied-coupon-timestamp', String(cloudCouponTs));
          }
        } else if (couponTimestampRef.current > cloudCouponTs && appliedCoupon) {
          supabase.auth.updateUser({
            data: {
              cart_coupon: appliedCoupon,
              cart_coupon_timestamp: couponTimestampRef.current,
            },
          }).catch(console.warn);
        }

        setItems((currentLocal) => {
          if (cloudItems.length > 0 && currentLocal.length === 0) {
            isSyncingFromCloudRef.current = true;
            localStorage.setItem('singlaji-cart', JSON.stringify(cloudItems));
            return cloudItems;
          }

          if (currentLocal.length > 0 && cloudItems.length === 0) {
            supabase.auth.updateUser({
              data: { cart_items: currentLocal, cart_updated_at: Date.now() },
            }).catch(console.warn);
            return currentLocal;
          }

          if (cloudItems.length > 0 && currentLocal.length > 0) {
            const merged = mergeCartItems(cloudItems, currentLocal);
            isSyncingFromCloudRef.current = true;
            localStorage.setItem('singlaji-cart', JSON.stringify(merged));
            supabase.auth.updateUser({
              data: { cart_items: merged, cart_updated_at: Date.now() },
            }).catch(console.warn);
            return merged;
          }

          return currentLocal;
        });
      } catch (err) {
        console.warn('Cart sync on login error:', err);
      }
    };

    syncOnLogin();
  }, [user?.id]);

  // 3. Active Background Polling & Window Focus / Visibility Sync
  useEffect(() => {
    if (!user) return;

    const handleActive = () => {
      if (document.visibilityState === 'visible') {
        pullFreshCloudCart();
      }
    };

    window.addEventListener('focus', handleActive);
    document.addEventListener('visibilitychange', handleActive);

    // Fast 3-second heartbeat poll while tab is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        pullFreshCloudCart();
      }
    }, 3000);

    return () => {
      window.removeEventListener('focus', handleActive);
      document.removeEventListener('visibilitychange', handleActive);
      clearInterval(interval);
    };
  }, [user?.id]);

  // 4. Save to localStorage, Broadcast via WebSocket, and Persist to Supabase
  useEffect(() => {
    localStorage.setItem('singlaji-cart', JSON.stringify(items));

    // If change was received from another device, avoid sending echo
    if (isSyncingFromCloudRef.current) {
      isSyncingFromCloudRef.current = false;
      return;
    }

    if (!user) return;

    // A. INSTANT WebSocket broadcast to all other open devices/tabs (0ms lag!)
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'cart_sync',
        payload: {
          items,
          senderId: deviceId,
          timestamp: Date.now(),
        },
      }).catch(console.warn);
    }

    // B. Persist to Supabase Auth cloud (debounced 300ms)
    const timer = setTimeout(() => {
      supabase.auth.updateUser({
        data: {
          cart_items: items,
          cart_updated_at: Date.now(),
        },
      }).catch((err) => {
        console.warn('Failed to upload cart to cloud:', err);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [items, user?.id]);

  // 5. Coupon persistence
  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem(
        'singlaji-applied-coupon',
        JSON.stringify(appliedCoupon)
      );
    } else {
      localStorage.removeItem('singlaji-applied-coupon');
    }
  }, [appliedCoupon]);

  const addItem = (
    product: Product,
    quantity = 1,
    selectedWeight?: string,
    unitPrice?: number
  ) => {
    const effectivePrice = unitPrice !== undefined ? unitPrice : product.price;

    setItems((prev) => {
      const matchIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          (item.selectedWeight || '') === (selectedWeight || '')
      );

      if (matchIndex >= 0) {
        return prev.map((item, idx) =>
          idx === matchIndex
            ? {
                ...item,
                quantity: item.quantity + quantity,
                price: effectivePrice,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          product,
          quantity,
          selectedWeight,
          price: effectivePrice,
        },
      ];
    });
  };

  const removeItem = (productId: string, selectedWeight?: string) => {
    setItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product.id === productId &&
            (selectedWeight === undefined ||
              (item.selectedWeight || '') === selectedWeight)
          )
      )
    );
  };

  const updateQuantity = (
    productId: string,
    quantity: number,
    selectedWeight?: string
  ) => {
    if (quantity <= 0) {
      removeItem(productId, selectedWeight);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        const isMatch =
          item.product.id === productId &&
          (selectedWeight === undefined ||
            (item.selectedWeight || '') === selectedWeight);
        return isMatch ? { ...item, quantity } : item;
      })
    );
  };

  const clearCart = () => {
    const ts = Date.now();
    couponTimestampRef.current = ts;
    setItems([]);
    setAppliedCoupon(null);
    localStorage.removeItem('singlaji-cart');
    localStorage.removeItem('singlaji-applied-coupon');
    localStorage.setItem('singlaji-applied-coupon-timestamp', String(ts));

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'cart_sync',
        payload: {
          items: [],
          senderId: deviceId,
          timestamp: ts,
        },
      }).catch(console.warn);

      channelRef.current.send({
        type: 'broadcast',
        event: 'coupon_sync',
        payload: {
          coupon: null,
          couponTimestamp: ts,
          senderId: deviceId,
        },
      }).catch(console.warn);
    }

    if (user) {
      supabase.auth.updateUser({
        data: {
          cart_items: [],
          cart_coupon: null,
          cart_coupon_timestamp: ts,
          cart_updated_at: ts,
        },
      }).catch(console.warn);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + (item.price ?? item.product.price) * item.quantity,
    0
  );

  // Standard shipping rule: Free if subtotal >= 500, else ₹50
  const standardShipping = subtotal >= 500 || subtotal === 0 ? 0 : 50;

  // Calculate discount
  let discountAmount = 0;
  let shipping = standardShipping;

  if (appliedCoupon) {
    if (appliedCoupon.code === 'FREESHIP') {
      shipping = 0;
      discountAmount = standardShipping;
    } else {
      const result = calculateCouponDiscount(appliedCoupon, subtotal);
      if (result.valid) {
        discountAmount = result.discount;
      }
    }
  }

  const finalTotal = Math.max(0, subtotal - discountAmount + shipping);

  const applyCoupon = async (
    code: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!code || !code.trim()) {
      return { success: false, message: 'Please enter a coupon code' };
    }

    const cleanCode = code.trim().toUpperCase();
    const allCoupons = await fetchCoupons();
    const found = allCoupons.find(
      (c) => c.code.toUpperCase() === cleanCode && c.is_active
    );

    if (!found) {
      return {
        success: false,
        message: `Coupon code '${cleanCode}' is invalid or expired`,
      };
    }

    // Special check for FREESHIP
    if (found.code === 'FREESHIP') {
      if (found.min_order_value && subtotal < found.min_order_value) {
        return {
          success: false,
          message: `Minimum order value of ₹${found.min_order_value} required for this coupon`,
        };
      }
      const ts = Date.now();
      couponTimestampRef.current = ts;
      setAppliedCoupon(found);
      localStorage.setItem('singlaji-applied-coupon', JSON.stringify(found));
      localStorage.setItem('singlaji-applied-coupon-timestamp', String(ts));

      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'coupon_sync',
          payload: {
            coupon: found,
            couponTimestamp: ts,
            senderId: deviceId,
          },
        }).catch(console.warn);
      }

      if (user) {
        supabase.auth.updateUser({
          data: {
            cart_coupon: found,
            cart_coupon_timestamp: ts,
          },
        }).catch(console.warn);
      }

      return {
        success: true,
        message: 'Free Shipping coupon applied successfully!',
      };
    }

    const validation = calculateCouponDiscount(found, subtotal);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    const ts = Date.now();
    couponTimestampRef.current = ts;
    setAppliedCoupon(found);
    localStorage.setItem('singlaji-applied-coupon', JSON.stringify(found));
    localStorage.setItem('singlaji-applied-coupon-timestamp', String(ts));

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'coupon_sync',
        payload: {
          coupon: found,
          couponTimestamp: ts,
          senderId: deviceId,
        },
      }).catch(console.warn);
    }

    if (user) {
      supabase.auth.updateUser({
        data: {
          cart_coupon: found,
          cart_coupon_timestamp: ts,
        },
      }).catch(console.warn);
    }

    return {
      success: true,
      message: `Coupon '${found.code}' applied! You saved ₹${validation.discount}`,
    };
  };

  const removeCoupon = () => {
    const ts = Date.now();
    couponTimestampRef.current = ts;
    setAppliedCoupon(null);
    localStorage.removeItem('singlaji-applied-coupon');
    localStorage.setItem('singlaji-applied-coupon-timestamp', String(ts));

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'coupon_sync',
        payload: {
          coupon: null,
          couponTimestamp: ts,
          senderId: deviceId,
        },
      }).catch(console.warn);
    }

    if (user) {
      supabase.auth.updateUser({
        data: {
          cart_coupon: null,
          cart_coupon_timestamp: ts,
        },
      }).catch(console.warn);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        appliedCoupon,
        discountAmount,
        finalTotal,
        shipping,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
