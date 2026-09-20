-- 1. Add courier and tracking columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS courier_name TEXT,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS tracking_url TEXT;

-- 2. Allow public read access to orders and order items by Order ID
-- (Enables direct tracking links from WhatsApp/Email without requiring login)
DROP POLICY IF EXISTS "Anyone with order link can view order" ON public.orders;
CREATE POLICY "Anyone with order link can view order"
ON public.orders FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Anyone with order link can view order items" ON public.order_items;
CREATE POLICY "Anyone with order link can view order items"
ON public.order_items FOR SELECT
USING (true);

-- Documentation comments
COMMENT ON COLUMN public.orders.courier_name IS 'Name of courier partner, e.g. Delhivery, Blue Dart, DTDC, India Post';
COMMENT ON COLUMN public.orders.tracking_number IS 'AWB or tracking number provided by the courier';
COMMENT ON COLUMN public.orders.tracking_url IS 'Optional direct link to courier tracking page';
