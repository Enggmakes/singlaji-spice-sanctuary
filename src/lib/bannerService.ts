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
    aspect_ratio: '16:9',
    width: 1920,
    height: 1080,
    created_at: new Date().toISOString(),
  },
];

/**
 * Strict 16:9 Aspect Ratio Validator.
 * Returns dimensions, computed ratio, and whether it strictly matches 16:9 (±0.04 tolerance for standard pixel rounding).
 */
export async function validate16by9Ratio(file: File): Promise<{
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
      const targetRatio = 16 / 9; // ~1.77778
      const diff = Math.abs(ratio - targetRatio);

      // Tolerance of 0.04 allows standard resolutions like 1366x768 (1.7786), 1920x1080 (1.7778), 1280x720 (1.7778)
      // while strictly rejecting square (1.0), vertical (0.56), 4:3 (1.33), 3:2 (1.5), 21:9 (2.33), etc.
      if (diff <= 0.04) {
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
        error: `Invalid aspect ratio! Your image is ${width}×${height} (${roundedRatio}:1). A mandatory 16:9 ratio (1.78:1) is required (e.g., 1920×1080, 1600×900, 1280×720).`,
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

/**
 * Get locally cached banners
 */
export function getLocalBanners(): HeroBanner[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BANNERS));
      return DEFAULT_BANNERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return [...parsed].sort((a: HeroBanner, b: HeroBanner) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }
    return DEFAULT_BANNERS;
  } catch {
    return DEFAULT_BANNERS;
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

    const payload = {
      id: b.id,
      image_url: finalImageUrl,
      badge_text: b.badge_text || null,
      title: b.title || null,
      subtitle: b.subtitle || null,
      button_text: b.button_text || 'Shop Now',
      button_link: b.button_link || '/products',
      secondary_button_text: b.secondary_button_text || 'Our Story',
      secondary_button_link: b.secondary_button_link || '/about',
      show_buttons: b.show_buttons !== false,
      sort_order: b.sort_order || 1,
      is_active: b.is_active,
      aspect_ratio: b.aspect_ratio || '16:9',
      width: b.width || 1920,
      height: b.height || 1080,
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
          return activeOnly.length > 0 ? activeOnly : DEFAULT_BANNERS;
        }
        return sorted;
      } else {
        // Supabase table is empty ([]), but we have local banners in browser!
        // Automatically sync local banners to Supabase table right now:
        const migrated = await syncLocalBannersToSupabase();
        if (migrated.length > 0) {
          if (onlyActive) {
            const activeOnly = migrated.filter((b) => b.is_active);
            return activeOnly.length > 0 ? activeOnly : DEFAULT_BANNERS;
          }
          return migrated;
        }
      }
    }
  } catch (err) {
    console.log('Supabase hero_banners query notice:', err);
  }

  // Fallback to local storage
  const local = getLocalBanners();
  if (onlyActive) {
    const activeOnly = local.filter((b) => b.is_active);
    return activeOnly.length > 0 ? activeOnly : DEFAULT_BANNERS;
  }
  return local;
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
    id: `banner-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Try inserting into Supabase
  try {
    let { error } = await supabase.from('hero_banners').insert(newBanner);

    // If Supabase does not have hide_overlay column yet, retry insert without it
    if (error && (error.message?.includes('hide_overlay') || error.code === 'PGRST204')) {
      console.warn('hide_overlay column not found in Supabase schema cache. Retrying insert without it...');
      const { hide_overlay, ...bannerWithoutOverlayCol } = newBanner;
      const res = await supabase.from('hero_banners').insert(bannerWithoutOverlayCol);
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
  try {
    let { error } = await supabase
      .from('hero_banners')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    // If Supabase does not have hide_overlay column yet, retry update without it
    if (error && (error.message?.includes('hide_overlay') || error.code === 'PGRST204')) {
      console.warn('hide_overlay column not found in Supabase schema cache. Retrying update without it...');
      const { hide_overlay, ...updatesWithoutOverlayCol } = updates;
      const res = await supabase
        .from('hero_banners')
        .update({ ...updatesWithoutOverlayCol, updated_at: new Date().toISOString() })
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
  const updated = current.map((b) => (b.id === id ? { ...b, ...updates, updated_at: new Date().toISOString() } : b));
  setLocalBanners(updated);

  broadcastBannerChange();
}

/**
 * Delete a hero banner
 */
export async function deleteHeroBanner(id: string): Promise<void> {
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
 * Toggle active status
 */
export async function toggleHeroBannerActive(id: string, currentStatus: boolean): Promise<void> {
  await updateHeroBanner(id, { is_active: !currentStatus });
}
