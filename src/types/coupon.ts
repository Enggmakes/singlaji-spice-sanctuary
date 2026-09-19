export type DiscountType = 'percentage' | 'flat';

export interface Coupon {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_value?: number;
  max_discount?: number;
  is_active: boolean;
  created_at?: string;
  description?: string;
}
