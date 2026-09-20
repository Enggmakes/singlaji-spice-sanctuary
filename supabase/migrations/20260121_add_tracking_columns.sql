-- Add courier and tracking columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS courier_name TEXT,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS tracking_url TEXT;

-- Comment for documentation
COMMENT ON COLUMN public.orders.courier_name IS 'Name of courier partner, e.g. Delhivery, Blue Dart, DTDC, India Post';
COMMENT ON COLUMN public.orders.tracking_number IS 'AWB or tracking number provided by the courier';
COMMENT ON COLUMN public.orders.tracking_url IS 'Optional direct link to courier tracking page';
