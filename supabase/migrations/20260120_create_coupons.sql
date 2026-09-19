-- Create coupons table for Singlaji Store
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
    discount_value NUMERIC NOT NULL,
    min_order_value NUMERIC DEFAULT 0,
    max_discount NUMERIC DEFAULT NULL,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Everyone can view active coupons
CREATE POLICY "Coupons are viewable by everyone"
ON public.coupons FOR SELECT
USING (true);

-- Admins can insert coupons
CREATE POLICY "Admins can insert coupons"
ON public.coupons FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR true);

-- Admins can update coupons
CREATE POLICY "Admins can update coupons"
ON public.coupons FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR true);

-- Admins can delete coupons
CREATE POLICY "Admins can delete coupons"
ON public.coupons FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR true);

-- Insert starter default coupons
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_value, max_discount, description)
VALUES 
('WELCOME10', 'percentage', 10, 0, 150, '10% OFF on your order (up to ₹150)'),
('SINGLA50', 'flat', 50, 499, NULL, 'Flat ₹50 OFF on orders above ₹499'),
('FREESHIP', 'flat', 50, 299, NULL, 'Free shipping discount on orders above ₹299')
ON CONFLICT (code) DO NOTHING;
