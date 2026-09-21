import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '@/types';
import { Coupon } from '@/types/coupon';
import { fetchCoupons, calculateCouponDiscount } from '@/lib/couponService';

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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('singlaji-cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    const saved = localStorage.getItem('singlaji-applied-coupon');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('singlaji-cart', JSON.stringify(items));
  }, [items]);

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
    setItems([]);
    setAppliedCoupon(null);
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
      setAppliedCoupon(found);
      return {
        success: true,
        message: 'Free Shipping coupon applied successfully!',
      };
    }

    const validation = calculateCouponDiscount(found, subtotal);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    setAppliedCoupon(found);
    return {
      success: true,
      message: `Coupon '${found.code}' applied! You saved ₹${validation.discount}`,
    };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
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
