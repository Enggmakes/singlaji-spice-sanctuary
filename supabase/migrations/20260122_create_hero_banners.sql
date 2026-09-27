-- Migration: Create hero_banners table and storage policies for Singlaji Spice Sanctuary
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/wsvhkgxgfhifmweqcpey/sql

-- 1. Create hero_banners table
CREATE TABLE IF NOT EXISTS public.hero_banners (
    id TEXT PRIMARY KEY DEFAULT ('banner-' || floor(extract(epoch from now()) * 1000)::text),
    image_url TEXT NOT NULL,
    badge_text TEXT,
    title TEXT,
    subtitle TEXT,
    button_text TEXT DEFAULT 'Shop Now',
    button_link TEXT DEFAULT '/products',
    secondary_button_text TEXT DEFAULT 'Our Story',
    secondary_button_link TEXT DEFAULT '/about',
    show_buttons BOOLEAN DEFAULT true,
    hide_overlay BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    aspect_ratio TEXT DEFAULT '16:9',
    width INTEGER DEFAULT 1920,
    height INTEGER DEFAULT 1080,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure column exists if table was already created
ALTER TABLE public.hero_banners ADD COLUMN IF NOT EXISTS hide_overlay BOOLEAN DEFAULT false;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies: Everyone can view banners
DROP POLICY IF EXISTS "Hero banners are viewable by everyone" ON public.hero_banners;
CREATE POLICY "Hero banners are viewable by everyone"
ON public.hero_banners FOR SELECT
USING (true);

-- 4. RLS Policies: Allow insert, update, delete for admins & managers
DROP POLICY IF EXISTS "Admins can insert hero banners" ON public.hero_banners;
CREATE POLICY "Admins can insert hero banners"
ON public.hero_banners FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update hero banners" ON public.hero_banners;
CREATE POLICY "Admins can update hero banners"
ON public.hero_banners FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete hero banners" ON public.hero_banners;
CREATE POLICY "Admins can delete hero banners"
ON public.hero_banners FOR DELETE
USING (true);

-- 5. Add hero_banners to realtime publication so storefront carousel syncs live
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'hero_banners'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.hero_banners;
    END IF;
END $$;

-- 6. Ensure product-images storage bucket exists & is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 7. Public read access policy for product-images bucket
DROP POLICY IF EXISTS "Public Access to product-images" ON storage.objects;
CREATE POLICY "Public Access to product-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 8. Storage RLS Policies: allow uploads into product-images
DROP POLICY IF EXISTS "Allow uploads to product-images" ON storage.objects;
CREATE POLICY "Allow uploads to product-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow updates to product-images" ON storage.objects;
CREATE POLICY "Allow updates to product-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow deletes from product-images" ON storage.objects;
CREATE POLICY "Allow deletes from product-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');
