-- Migration: Add multi-image support to products table
-- Run this in Supabase Dashboard SQL Editor to enable multiple gallery images per product

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Initialize images array with existing image_url for all products
UPDATE public.products
SET images = ARRAY[image_url]
WHERE (images IS NULL OR images = '{}') AND image_url IS NOT NULL;
