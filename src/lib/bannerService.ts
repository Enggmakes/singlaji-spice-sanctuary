import { HeroBanner } from '@/types/banner';
import { supabase } from '@/integrations/supabase/client';
import heroImage from '@/assets/hero-spices.jpg';

const STORAGE_KEY = 'singlaji_hero_banners';

/**
 * Default initial banner using the current authentic Singlaji hero artwork
 */
export const DEFAULT_BANNERS: HeroBanner[] = [
  {
    id: 'default-hero-1',
    image_url: heroImage,
    badge_text: 'Premium Indian Spices',
    title: 'Authentic Flavors, Straight from India',
    subtitle:
      "Experience the rich heritage of Indian cuisine with Singlaji's handpicked, stone-ground masalas. Pure tradition, exceptional taste.",
    button_text: 'Shop Now',
    button_link: '/products',
    secondary_button_text: 'Our Story',
    secondary_button_link: '/about',
    sort_order: 1,
    is_active: true,
    aspect_ratio: '2.4:1',
    width: 1920,
    height: 800,
    created_at: new Date().toISOString(),
  },
];

/**
 * Strict 2.4:1 / 21:9 Aspect Ratio Validator (Standard E-Commerce Hero Banner).
 * Accepts 2.4:1 (1920×800) and 21:9 (2560×1080) with a safe tolerance (2.20:1 to 2.55:1).
 */
export async function validateBannerRatio(file: File): Promise<{
  isValid: boolean;
  width: number;
  height: number;
  ratio: number;
  error?: string;
}> {
  return new Promise((resolve) => {
    // Basic file type check
    if (!file.type.startsWith('image/')) {
      return resolve({
        isValid: false,
        width: 0,
        height: 0,
        ratio: 0,
        error: 'Please upload a valid image file (JPEG, PNG, WebP).',
      });
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.naturalWidth;
      const height = img.naturalHeight;

      if (!width || !height) {
        return resolve({
          isValid: false,
          width: 0,
          height: 0,
          ratio: 0,
          error: 'Unable to inspect image dimensions.',
        });
      }

      const ratio = width / height;

      // Accepts standard e-commerce hero banner ratios:
      // 21:9 (~2.33:1) up to 2.4:1 (1920×800) and 2.5:1
      const isValid = ratio >= 2.20 && ratio <= 2.55;

      if (isValid) {
        return resolve({
          isValid: true,
          width,
          height,
          ratio,
        });
      }

      const roundedRatio = ratio.toFixed(2);
      return resolve({
        isValid: false,
        width,
        height,
        ratio,
        error: `Invalid aspect ratio! Your image is ${width}×${height} (${roundedRatio}:1). Standard 2.4:1 (or 21:9) hero banner ratio is required (Recommended: 1920×800, 1440×600, or 1200×500).`,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        isValid: false,
        width: 0,
        height: 0,
        ratio: 0,
        error: 'Failed to read image file. Please try another image.',
      });
    };

    img.src = objectUrl;
  });
}

// Backward-compatible alias for existing imports
export const validate16by9Ratio = validateBannerRatio;

/**
 * Get locally cached banners
 */
export function getLocalBanners(): HeroBanner[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Purge stale default banner if custom banners exist
      const customOnly = parsed.filter((b: HeroBanner) => b.id !== 'default-hero-1');
      const list = customOnly.length > 0 ? customOnly : parsed;
      return [...list].sort((a: HeroBanner, b: HeroBanner) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Save banners locally
 */
export function setLocalBanners(banners: HeroBanner[]) {
  try {
    const sorted = [...banners].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  } catch (err) {
    console.warn('Failed to save banners to localStorage:', err);
  }
}

/**
 * Reorder banners by providing the newly ordered array
 */
export async function reorderHeroBanners(orderedBanners: HeroBanner[]): Promise<HeroBanner[]> {
  const withUpdatedOrders = orderedBanners.map((banner, index) => ({
    ...banner,
    sort_order: index + 1,
    updated_at: new Date().toISOString(),
  }));

  setLocalBanners(withUpdatedOrders);

  try {
    for (const b of withUpdatedOrders) {
      await supabase
        .from('hero_banners')
        .update({ sort_order: b.sort_order, updated_at: b.updated_at })
        .eq('id', b.id);
    }
  } catch (err) {
    console.warn('Supabase reorder fallback:', err);
  }

  broadcastBannerChange();
  return withUpdatedOrders;
}

/**
 * Automatically migrate and sync any locally cached banners into Supabase
 */
export async function syncLocalBannersToSupabase(): Promise<HeroBanner[]> {
  const local = getLocalBanners();
  if (!local || local.length === 0) return [];

  const migrated: HeroBanner[] = [];

  for (const b of local) {
    let finalImageUrl = b.image_url;

    // If banner has base64 dataUrl, upload it into Supabase Storage
    if (finalImageUrl && finalImageUrl.startsWith('data:image')) {
      try {
        const res = await fetch(finalImageUrl);
        const blob = await res.blob();
        const ext = blob.type.includes('png') ? 'png' : 'jpg';
        const fileName = `banner-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(`banners/${fileName}`, blob, { contentType: blob.type, upsert: true });

        if (!uploadError) {
          const { data: pubData } = supabase.storage
            .from('product-images')
            .getPublicUrl(`banners/${fileName}`);
          if (pubData?.publicUrl) {
            finalImageUrl = pubData.publicUrl;
          }
        }
      } catch (uploadErr) {
        console.warn('Storage upload error during migration:', uploadErr);
      }
    }

    const isNone = b.button_link === 'none';
    const payload = {
      id: b.id,
      image_url: finalImageUrl,
      mobile_image_url: b.mobile_image_url || null,
      badge_text: b.badge_text || null,
      title: b.title || null,
      subtitle: b.subtitle || null,
      button_text: isNone ? '' : (b.button_text || 'Shop Now'),
      button_link: isNone ? 'none' : (b.button_link || '/products'),
      secondary_button_text: isNone ? '' : (b.secondary_button_text || 'Our Story'),
      secondary_button_link: isNone ? 'none' : (b.secondary_button_link || '/about'),
      show_buttons: isNone ? false : (b.show_buttons !== false),
      hide_overlay: isNone ? true : Boolean(b.hide_overlay),
      sort_order: b.sort_order || 1,
      is_active: b.is_active,
      aspect_ratio: b.aspect_ratio || '2.4:1',
      width: b.width || 1920,
      height: b.height || 800,
    };

    try {
      const { error: insertErr } = await supabase.from('hero_banners').upsert(payload);
      if (!insertErr) {
        migrated.push({ ...b, image_url: finalImageUrl });
      }
    } catch (insertErr) {
      console.warn('Error inserting banner into Supabase:', insertErr);
    }
  }

  if (migrated.length > 0) {
    setLocalBanners(migrated);
    broadcastBannerChange();
  }

  return migrated;
}

/**
 * Fetch all hero banners (active and inactive for admin, or filtered for storefront)
 */
export async function fetchHeroBanners(onlyActive = false): Promise<HeroBanner[]> {
  try {
    const { data, error } = await supabase
      .from('hero_banners')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && Array.isArray(data)) {
      if (data.length > 0) {
        const sorted = [...(data as unknown as HeroBanner[])].sort(
          (a: HeroBanner, b: HeroBanner) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        );
        setLocalBanners(sorted);
        if (onlyActive) {
          const activeOnly = sorted.filter((b: HeroBanner) => b.is_active);
          return activeOnly;
        }
        return sorted;
      }
    }
  } catch (err) {
    console.log('Supabase hero_banners query notice:', err);
  }

  // Fallback to local storage (only real active custom banners)
  const local = getLocalBanners();
  if (local && local.length > 0) {
    if (onlyActive) {
      return local.filter((b) => b.is_active);
    }
    return local;
  }

  return [];
}

/**
 * Broadcast banner changes to all open browser windows
 */
function broadcastBannerChange() {
  try {
    const ch = supabase.channel('store_fast_broadcast');
    ch.send({
      type: 'broadcast',
      event: 'hero_banners_changed',
      payload: { timestamp: Date.now() },
    });
  } catch (err) {
    console.warn('Banner broadcast error:', err);
  }
}

/**
 * Create a new hero banner
 */
export async function createHeroBanner(
  bannerData: Omit<HeroBanner, 'id' | 'created_at' | 'updated_at'>
): Promise<HeroBanner> {
  const newBanner: HeroBanner = {
    ...bannerData,
    title: bannerData.title ? bannerData.title.trim() || null : null,
    subtitle: bannerData.subtitle ? bannerData.subtitle.trim() || null : null,
    badge_text: bannerData.badge_text ? bannerData.badge_text.trim() || null : null,
    mobile_image_url: bannerData.mobile_image_url || null,
    id: `banner-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Try inserting into Supabase
  try {
    let { error } = await supabase.from('hero_banners').insert(newBanner);

    // If Supabase does not have columns like mobile_image_url or hide_overlay yet, retry insert safely
    if (error && (error.message?.includes('mobile_image_url') || error.message?.includes('hide_overlay') || error.code === 'PGRST204')) {
      console.warn('Optional banner columns not yet found in Supabase schema cache. Retrying insert with base fields...');
      const bannerFallback: any = { ...newBanner };
      if (error.message?.includes('mobile_image_url')) delete bannerFallback.mobile_image_url;
      if (error.message?.includes('hide_overlay')) delete bannerFallback.hide_overlay;
      
      const res = await supabase.from('hero_banners').insert(bannerFallback);
      error = res.error;
    }

    if (error) {
      console.error('Supabase hero_banners insert error:', error);
      throw new Error(`Database error: ${error.message}`);
    } else {
      console.log('Hero banner successfully synchronized with Supabase database!');
    }
  } catch (err: any) {
    console.error('Failed to insert banner into Supabase:', err);
    throw err;
  }

  // Update local storage
  const current = getLocalBanners();
  const updated = [...current, newBanner].sort((a, b) => a.sort_order - b.sort_order);
  setLocalBanners(updated);

  broadcastBannerChange();
  return newBanner;
}

/**
 * Update an existing hero banner
 */
export async function updateHeroBanner(
  id: string,
  updates: Partial<HeroBanner>
): Promise<void> {
  // Normalize text fields so empty/deleted values are explicitly sent as null (not undefined)
  // This ensures PostgreSQL executes SET column = NULL rather than ignoring the update
  const sanitizedUpdates: Record<string, any> = { ...updates };
  if ('title' in updates) {
    const val = typeof updates.title === 'string' ? updates.title.trim() : updates.title;
    sanitizedUpdates.title = val ? val : null;
  }
  if ('subtitle' in updates) {
    const val = typeof updates.subtitle === 'string' ? updates.subtitle.trim() : updates.subtitle;
    sanitizedUpdates.subtitle = val ? val : null;
  }
  if ('badge_text' in updates) {
    const val = typeof updates.badge_text === 'string' ? updates.badge_text.trim() : updates.badge_text;
    sanitizedUpdates.badge_text = val ? val : null;
  }
  if ('mobile_image_url' in updates) {
    sanitizedUpdates.mobile_image_url = updates.mobile_image_url || null;
  }
  if ('button_text' in updates) {
    sanitizedUpdates.button_text = updates.button_text || '';
  }
  if ('secondary_button_text' in updates) {
    sanitizedUpdates.secondary_button_text = updates.secondary_button_text || '';
  }

  try {
    let { error } = await supabase
      .from('hero_banners')
      .update({ ...sanitizedUpdates, updated_at: new Date().toISOString() })
      .eq('id', id);

    // If Supabase does not have mobile_image_url or hide_overlay columns yet, retry update safely
    if (error && (error.message?.includes('mobile_image_url') || error.message?.includes('hide_overlay') || error.code === 'PGRST204')) {
      console.warn('Optional banner columns not yet found in Supabase schema cache. Retrying update with base fields...');
      const fallbackUpdates: any = { ...sanitizedUpdates, updated_at: new Date().toISOString() };
      if (error.message?.includes('mobile_image_url')) delete fallbackUpdates.mobile_image_url;
      if (error.message?.includes('hide_overlay')) delete fallbackUpdates.hide_overlay;
      
      const res = await supabase
        .from('hero_banners')
        .update(fallbackUpdates)
        .eq('id', id);
      error = res.error;
    }

    if (error) {
      console.error('Supabase hero_banners update error:', error);
      throw new Error(`Database error: ${error.message}`);
    } else {
      console.log('Hero banner update synchronized with Supabase!');
    }
  } catch (err: any) {
    console.error('Failed to update banner in Supabase:', err);
    throw err;
  }

  const current = getLocalBanners();
  const updated = current.map((b) => (b.id === id ? { ...b, ...sanitizedUpdates, updated_at: new Date().toISOString() } : b));
  setLocalBanners(updated);

  broadcastBannerChange();
}

/**
 * Delete a banner image file from Supabase Storage
 */
export async function deleteStorageBannerImage(url: string | null | undefined): Promise<boolean> {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return false;
  try {
    let path: string | null = null;
    let bucketName = 'product-images';

    if (url.includes('/product-images/')) {
      const parts = url.split('/product-images/');
      if (parts.length > 1) {
        path = decodeURIComponent(parts[parts.length - 1].split('?')[0]);
        bucketName = 'product-images';
      }
    } else if (url.includes('/products/')) {
      const parts = url.split('/products/');
      if (parts.length > 1) {
        path = decodeURIComponent(parts[parts.length - 1].split('?')[0]);
        bucketName = 'products';
      }
    }

    if (path) {
      const { error } = await supabase.storage.from(bucketName).remove([path]);
      if (!error) {
        console.log(`Purged banner image from storage (${bucketName}):`, path);
        return true;
      } else {
        console.warn('Storage delete error:', error.message);
      }
    }
  } catch (e) {
    console.warn('Storage delete exception:', e);
  }
  return false;
}

/**
 * Delete a hero banner and its associated images from Supabase storage
 */
export async function deleteHeroBanner(
  id: string,
  bannerUrls?: { image_url?: string | null; mobile_image_url?: string | null }
): Promise<void> {
  // 1. Resolve image URLs to purge from Supabase storage
  let imgUrl = bannerUrls?.image_url;
  let mobUrl = bannerUrls?.mobile_image_url;

  if (!imgUrl && !mobUrl) {
    const local = getLocalBanners().find((b) => b.id === id);
    if (local) {
      imgUrl = local.image_url;
      mobUrl = local.mobile_image_url;
    } else {
      try {
        const { data } = await supabase
          .from('hero_banners')
          .select('image_url, mobile_image_url')
          .eq('id', id)
          .maybeSingle();
        if (data) {
          imgUrl = data.image_url;
          mobUrl = data.mobile_image_url;
        }
      } catch {
        // ignore
      }
    }
  }

  // 2. Delete storage files
  if (imgUrl) await deleteStorageBannerImage(imgUrl);
  if (mobUrl) await deleteStorageBannerImage(mobUrl);

  // 3. Delete database row
  try {
    const { error } = await supabase.from('hero_banners').delete().eq('id', id);
    if (error) {
      console.warn('Supabase hero_banners delete notice:', error.message);
    } else {
      console.log('Hero banner deletion synchronized with Supabase!');
    }
  } catch (err) {
    console.log('Supabase hero_banners delete fallback to local storage:', err);
  }

  const current = getLocalBanners();
  const updated = current.filter((b) => b.id !== id);
  setLocalBanners(updated);

  broadcastBannerChange();
}

/**
 * Purge all orphaned banner images from Supabase storage that are not used by any active banner
 */
export async function cleanOrphanedBannerStorage(): Promise<{ removedCount: number; errors: number }> {
  try {
    // 1. Fetch all current banner image URLs
    const { data: dbBanners } = await supabase
      .from('hero_banners')
      .select('id, image_url, mobile_image_url');
    
    const localBanners = getLocalBanners();
    const activeFilenames = new Set<string>();

    const checkUrl = (url: string | null | undefined) => {
      if (!url) return;
      if (url.includes('/banners/')) {
        const parts = url.split('/banners/');
        if (parts.length > 1) {
          const filename = decodeURIComponent(parts[1].split('?')[0]);
          activeFilenames.add(filename);
        }
      }
    };

    (dbBanners || []).forEach((b) => {
      checkUrl(b.image_url);
      checkUrl(b.mobile_image_url);
    });

    localBanners.forEach((b) => {
      checkUrl(b.image_url);
      checkUrl(b.mobile_image_url);
    });

    // 2. List all files currently in 'product-images/banners/'
    const { data: files, error: listErr } = await supabase.storage
      .from('product-images')
      .list('banners', { limit: 100 });

    if (listErr || !files) {
      console.warn('Unable to list storage banner files:', listErr);
      return { removedCount: 0, errors: listErr ? 1 : 0 };
    }

    const pathsToDelete = files
      .filter((f) => !activeFilenames.has(f.name))
      .map((f) => `banners/${f.name}`);

    if (pathsToDelete.length === 0) {
      return { removedCount: 0, errors: 0 };
    }

    const { error: removeErr } = await supabase.storage
      .from('product-images')
      .remove(pathsToDelete);

    if (removeErr) {
      console.error('Failed to remove orphaned storage banners:', removeErr);
      return { removedCount: 0, errors: 1 };
    }

    console.log(`Cleaned up ${pathsToDelete.length} orphaned banner images from storage!`);
    return { removedCount: pathsToDelete.length, errors: 0 };
  } catch (err) {
    console.error('cleanOrphanedBannerStorage error:', err);
    return { removedCount: 0, errors: 1 };
  }
}

/**
 * Toggle active status
 */
export async function toggleHeroBannerActive(id: string, currentStatus: boolean): Promise<void> {
  await updateHeroBanner(id, { is_active: !currentStatus });
}

