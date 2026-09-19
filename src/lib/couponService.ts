import { Coupon } from '@/types/coupon';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'singlaji_coupons';

// Default starter coupons
export const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'default-welcome10',
    code: 'WELCOME10',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_value: 0,
    max_discount: 150,
    is_active: true,
    description: '10% OFF on your order (up to ₹150)',
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-singla50',
    code: 'SINGLA50',
    discount_type: 'flat',
    discount_value: 50,
    min_order_value: 499,
    is_active: true,
    description: 'Flat ₹50 OFF on orders above ₹499',
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-freeship',
    code: 'FREESHIP',
    discount_type: 'flat',
    discount_value: 50,
    min_order_value: 299,
    is_active: true,
    description: 'Free Shipping on orders above ₹299',
    created_at: new Date().toISOString(),
  },
];

// Get locally stored coupons
function getLocalCoupons(): Coupon[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_COUPONS));
      return DEFAULT_COUPONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_COUPONS;
  } catch {
    return DEFAULT_COUPONS;
  }
}

// Save locally stored coupons
function setLocalCoupons(coupons: Coupon[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
  } catch (err) {
    console.error('Failed to save coupons to local storage:', err);
  }
}

// Fetch all coupons (tries Supabase first, falls back to local storage)
export async function fetchCoupons(): Promise<Coupon[]> {
  try {
    const { data, error } = await supabase
      .from('coupons' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const merged = data as unknown as Coupon[];
      setLocalCoupons(merged);
      return merged;
    }
  } catch (e) {
    // Supabase table does not exist or network issue; use local storage
  }

  return getLocalCoupons();
}

// Create a new coupon
export async function createCoupon(
  coupon: Omit<Coupon, 'id' | 'created_at'>
): Promise<Coupon> {
  const newCoupon: Coupon = {
    ...coupon,
    id: `coupon-${Date.now()}`,
    code: coupon.code.trim().toUpperCase(),
    created_at: new Date().toISOString(),
  };

  // Try saving to Supabase
  try {
    const { data, error } = await supabase
      .from('coupons' as any)
      .insert({
        code: newCoupon.code,
        discount_type: newCoupon.discount_type,
        discount_value: newCoupon.discount_value,
        min_order_value: newCoupon.min_order_value || 0,
        max_discount: newCoupon.max_discount || null,
        is_active: newCoupon.is_active ?? true,
        description: newCoupon.description || null,
      })
      .select()
      .single();

    if (!error && data) {
      newCoupon.id = (data as any).id;
    }
  } catch {
    // Ignore database write error if table doesn't exist yet
  }

  // Update local storage
  const current = getLocalCoupons();
  const updated = [newCoupon, ...current.filter((c) => c.code !== newCoupon.code)];
  setLocalCoupons(updated);

  return newCoupon;
}

// Toggle coupon status
export async function toggleCouponActive(
  id: string,
  isActive: boolean
): Promise<void> {
  try {
    await supabase
      .from('coupons' as any)
      .update({ is_active: isActive })
      .eq('id', id);
  } catch {}

  const current = getLocalCoupons();
  const updated = current.map((c) =>
    c.id === id ? { ...c, is_active: isActive } : c
  );
  setLocalCoupons(updated);
}

// Delete coupon
export async function deleteCoupon(id: string): Promise<void> {
  try {
    await supabase.from('coupons' as any).delete().eq('id', id);
  } catch {}

  const current = getLocalCoupons();
  const updated = current.filter((c) => c.id !== id);
  setLocalCoupons(updated);
}

// Validate and calculate discount for a coupon code
export function calculateCouponDiscount(
  coupon: Coupon,
  subtotal: number
): { valid: boolean; message: string; discount: number } {
  if (!coupon.is_active) {
    return { valid: false, message: 'This coupon is no longer active', discount: 0 };
  }

  if (coupon.min_order_value && subtotal < coupon.min_order_value) {
    return {
      valid: false,
      message: `Minimum order value of ₹${coupon.min_order_value} required for this coupon`,
      discount: 0,
    };
  }

  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = (subtotal * coupon.discount_value) / 100;
    if (coupon.max_discount && discount > coupon.max_discount) {
      discount = coupon.max_discount;
    }
  } else {
    // Flat discount
    discount = Math.min(coupon.discount_value, subtotal);
  }

  return {
    valid: true,
    message: `Coupon '${coupon.code}' applied successfully!`,
    discount: Math.round(discount),
  };
}
