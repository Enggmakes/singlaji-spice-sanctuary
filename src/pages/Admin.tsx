import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Ticket,
  Percent,
  Check,
  Ban,
  Smartphone,
  Monitor,
  Truck,
  Package,
  Search,
  Phone,
  ExternalLink,
  MapPin,
  MessageCircle,
  RefreshCw,
  Clock,
  ShieldAlert,
  Eye,
  X,
  Copy,
  Pencil,
  Upload,
  Sparkles,
  Calculator,
  Printer,
  Send,
  Sliders,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Coupon } from '@/types/coupon';
import { HeroBanner } from '@/types/banner';
import {
  fetchCoupons,
  createCoupon,
  toggleCouponActive,
  deleteCoupon,
} from '@/lib/couponService';
import {
  fetchHeroBanners,
  createHeroBanner,
  updateHeroBanner,
  deleteHeroBanner,
  toggleHeroBannerActive,
  reorderHeroBanners,
  validate16by9Ratio,
} from '@/lib/bannerService';
import { compressImage } from '@/lib/imageCompressor';
import {
  parseWeightVariants,
  serializeWeightVariants,
  COMMON_WEIGHT_PRESETS,
  COMMON_RATE_ANCHORS,
  generateVariantsFromRate,
  calculateVariantPrice,
  parseGrams,
  sortVariantsByWeight,
  WeightVariant,
} from '@/lib/weightVariants';
import { toast } from 'sonner';
import BannerLinkSelector from '@/components/admin/BannerLinkSelector';
import { getCategoryVectorIcon } from '@/components/icons/SpiceCategoryIcons';

interface Category {
  id: string;
  name: string;
  slug?: string;
}

interface Product {
  id: string;
  name: string;
  slug?: string;
  price: number;
  stock: number;
  image_url: string | null;
  category_id?: string;
  description?: string;
  weight?: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface AdminOrder {
  id: string;
  created_at: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  payment_method: string;
  subtotal: number;
  shipping: number;
  total: number;
  notes?: string;
  courier_name?: string;
  tracking_number?: string;
  tracking_url?: string;
  order_items: OrderItem[];
}

const COMMON_COURIERS = [
  'Delhivery',
  'Blue Dart',
  'DTDC',
  'India Post (Speed Post)',
  'Shadowfax',
  'Ekart Logistics',
  'Xpressbees',
  'Local Delivery (Abohar)',
  'Other',
];

const TRACKING_STEPS = [
  { key: 'confirmed', title: 'Order Confirmed', description: 'Order verified for delivery' },
  { key: 'packed', title: 'Packed & Quality Sealed', description: 'Fresh spices sealed at Abohar facility' },
  { key: 'shipped', title: 'Dispatched / In Transit', description: 'Handed over to courier partner' },
  { key: 'out_for_delivery', title: 'Out for Delivery', description: 'Courier agent is on the way' },
  { key: 'delivered', title: 'Delivered', description: 'Package safely delivered to customer' },
];

const getStepIndex = (status: string) => {
  const s = (status || '').toLowerCase().trim();
  if (s === 'pending' || s === 'confirmed') return 0;
  if (s === 'processing' || s === 'packed') return 1;
  if (s === 'shipped' || s === 'dispatched' || s === 'in_transit') return 2;
  if (s === 'out_for_delivery' || s === 'out for delivery') return 3;
  if (s === 'delivered' || s === 'completed') return 4;
  return 0;
};

interface WeightVariantsEditorProps {
  price: string;
  onPriceChange: (price: string) => void;
  variants: WeightVariant[];
  onVariantsChange: (variants: WeightVariant[]) => void;
}

function WeightVariantsEditor({
  price,
  onPriceChange,
  variants,
  onVariantsChange,
}: WeightVariantsEditorProps) {
  const [rateWeight, setRateWeight] = useState<string>('250gm');
  const [isCustomWeight, setIsCustomWeight] = useState<boolean>(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(() => {
    if (variants && variants.length > 0) {
      return variants.map((v) => v.weight);
    }
    return ['100gm', '250gm', '500gm', '1kg'];
  });

  // Sync selectedSizes whenever a new product with variants is loaded
  useEffect(() => {
    if (variants && variants.length > 0) {
      setSelectedSizes(variants.map((v) => v.weight));
    }
  }, [variants.length]);

  // Recalculates variants based on current price, anchor weight, and target sizes
  const recalculateAndApply = (
    currentPriceStr: string,
    currentAnchor: string,
    targetSizes: string[]
  ) => {
    const priceNum = parseFloat(currentPriceStr);
    if (!priceNum || priceNum <= 0 || targetSizes.length === 0) {
      return;
    }
    const calculated = generateVariantsFromRate(priceNum, currentAnchor, targetSizes);
    onVariantsChange(calculated);
  };

  const handlePriceChange = (val: string) => {
    onPriceChange(val);
    if (selectedSizes.length > 0 && parseFloat(val) > 0) {
      recalculateAndApply(val, rateWeight, selectedSizes);
    }
  };

  const handleRateWeightChange = (newAnchor: string) => {
    setRateWeight(newAnchor);
    if (selectedSizes.length > 0 && parseFloat(price) > 0) {
      recalculateAndApply(price, newAnchor, selectedSizes);
    }
  };

  const toggleSizeSelection = (size: string) => {
    let nextSizes: string[];
    if (selectedSizes.includes(size)) {
      if (selectedSizes.length === 1) {
        toast.info('At least one pack size is required. Or click "Single Pack Only".');
        return;
      }
      nextSizes = selectedSizes.filter((s) => s !== size);
    } else {
      nextSizes = [...selectedSizes, size];
    }
    setSelectedSizes(nextSizes);
    if (parseFloat(price) > 0) {
      recalculateAndApply(price, rateWeight, nextSizes);
    }
  };

  const handleSelectStandard = () => {
    const std = ['100gm', '250gm', '500gm', '1kg'];
    setSelectedSizes(std);
    if (parseFloat(price) > 0) {
      recalculateAndApply(price, rateWeight, std);
    }
  };

  const handleSelectAll = () => {
    const all = COMMON_WEIGHT_PRESETS;
    setSelectedSizes(all);
    if (parseFloat(price) > 0) {
      recalculateAndApply(price, rateWeight, all);
    }
  };

  const handleClearVariants = () => {
    setSelectedSizes([]);
    onVariantsChange([]);
  };

  const handleUpdateVariant = (index: number, field: 'weight' | 'price', val: any) => {
    const next = [...variants];
    if (field === 'weight') {
      const weightStr = String(val);
      next[index] = { ...next[index], weight: weightStr };
      // Real-time calculation: dynamically calculate price as admin types e.g. "600gm", "1.5kg"
      const grams = parseGrams(weightStr);
      const baseP = parseFloat(price);
      if (grams > 0 && baseP > 0) {
        const autoPrice = calculateVariantPrice(baseP, rateWeight, weightStr);
        next[index].price = autoPrice;
      }
    } else {
      next[index] = { ...next[index], [field]: val };
    }
    onVariantsChange(next);
  };

  const handleBlurWeight = () => {
    // When admin finishes typing, automatically sort variants ascending by weight (e.g. 500gm < 600gm < 1kg)
    if (variants.length > 1) {
      const sorted = sortVariantsByWeight(variants);
      onVariantsChange(sorted);
    }
  };

  const handleRemoveVariant = (index: number) => {
    const removed = variants[index];
    const next = variants.filter((_, i) => i !== index);
    onVariantsChange(next);
    if (removed && removed.weight) {
      setSelectedSizes((prev) =>
        prev.filter((s) => s.trim().toLowerCase() !== removed.weight.trim().toLowerCase())
      );
    }
  };

  const handleAddCustomSize = () => {
    const defaultP = parseFloat(price) || 100;
    const next = [...variants, { weight: '', price: defaultP }];
    onVariantsChange(next);
  };

  const rateGrams = parseGrams(rateWeight);
  const numPrice = parseFloat(price);
  const perGramPrice =
    rateGrams > 0 && numPrice > 0 ? (numPrice / rateGrams).toFixed(2) : null;

  return (
    <div className="space-y-4 p-4 rounded-xl bg-muted/20 border border-border/80">
      {/* Smart Rate Engine Header */}
      <div className="p-4 rounded-xl bg-background border border-primary/20 shadow-soft space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Pricing & Pack Size Auto-Calculator
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Enter your rate (e.g. ₹199 per 250gm) — all other sizes calculate automatically in real time!
              </p>
            </div>
          </div>
          {perGramPrice && (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              ≈ ₹{perGramPrice} / gm
            </span>
          )}
        </div>

        {/* Rate Setting Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <Label className="text-xs font-semibold block mb-1">
              Rate Price (₹) *
            </Label>
            <Input
              type="number"
              min="1"
              step="1"
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="e.g. 199"
              className="h-9 text-xs font-bold text-primary"
              required
            />
          </div>

          <div>
            <Label className="text-xs font-semibold block mb-1">
              For Quantity / Weight *
            </Label>
            {!isCustomWeight ? (
              <div className="flex items-center gap-1.5">
                <select
                  value={rateWeight}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomWeight(true);
                    } else {
                      handleRateWeightChange(e.target.value);
                    }
                  }}
                  className="w-full h-9 border rounded-md px-2.5 bg-background text-xs border-input font-medium"
                >
                  {COMMON_RATE_ANCHORS.map((anchor) => (
                    <option key={anchor} value={anchor}>
                      {anchor}
                    </option>
                  ))}
                  <option value="custom">Custom Weight...</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Input
                  value={rateWeight}
                  onChange={(e) => handleRateWeightChange(e.target.value)}
                  placeholder="e.g. 75gm, 250gm"
                  className="h-9 text-xs flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsCustomWeight(false);
                    handleRateWeightChange('250gm');
                  }}
                  className="text-[11px] h-9 px-2"
                >
                  Preset
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Pack Size Toggles */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground">
              Offered Pack Sizes:
            </span>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={handleSelectStandard}
                className="text-primary hover:underline font-medium"
              >
                Standard (100g-1kg)
              </button>
              <span className="text-muted-foreground">•</span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-primary hover:underline font-medium"
              >
                All Sizes
              </button>
              <span className="text-muted-foreground">•</span>
              <button
                type="button"
                onClick={handleClearVariants}
                className="text-muted-foreground hover:text-destructive hover:underline font-medium"
              >
                Single Pack Only
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {COMMON_WEIGHT_PRESETS.map((preset) => {
              const isSelected = selectedSizes.includes(preset);
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => toggleSizeSelection(preset)}
                  className={`text-xs px-3 py-1 rounded-lg border font-medium transition-all flex items-center gap-1 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-muted/40 text-muted-foreground hover:text-foreground border-border'
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                  {preset}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Calculated Variants Table */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground">
            {variants.length > 0
              ? `Auto-Calculated Pack Sizes (${variants.length})`
              : 'Single Pack Spice (No extra sizes)'}
          </Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAddCustomSize}
            className="text-xs h-7 gap-1"
          >
            <Plus className="h-3 w-3" /> Add Custom Size
          </Button>
        </div>

        {variants.length > 0 ? (
          <div className="space-y-2 pt-1 border-t border-border/50">
            {variants.map((v, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border"
              >
                <div className="flex-1">
                  <Label className="text-[10px] text-muted-foreground block mb-0.5">
                    Pack Size / Weight
                  </Label>
                  <Input
                    value={v.weight}
                    onChange={(e) => handleUpdateVariant(idx, 'weight', e.target.value)}
                    onBlur={handleBlurWeight}
                    placeholder="e.g. 250gm, 600gm, 1kg"
                    className="h-8 text-xs font-medium"
                  />
                </div>
                <div className="w-28">
                  <Label className="text-[10px] text-muted-foreground block mb-0.5">
                    Price (₹)
                  </Label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={v.price}
                    onChange={(e) =>
                      handleUpdateVariant(idx, 'price', parseFloat(e.target.value) || 0)
                    }
                    placeholder="₹"
                    className="h-8 text-xs font-semibold text-primary"
                  />
                </div>
                <div className="pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveVariant(idx);
                    }}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Remove pack size"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium space-y-0.5">
              <p>
                ✓ Catalog starting price: <strong>From ₹{Math.min(...variants.map((v) => v.price || 0))}</strong>
              </p>
              <p className="text-[10px] text-muted-foreground">
                Prices update in real time when you change Rate Price or Pack Sizes. You can also manually adjust any price above.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-lg bg-muted/30 border border-dashed border-border text-center text-xs text-muted-foreground">
            Selling as a single pack at ₹{price || 0}. Select pack sizes above to offer multiple weights.
          </div>
        )}
      </div>
    </div>
  );
}

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories' | 'coupons' | 'banners'>('orders');

  // Categories & Products state
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [addingProduct, setAddingProduct] = useState(false);
  const [addingCoupon, setAddingCoupon] = useState(false);
  const [addingBanner, setAddingBanner] = useState(false);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Hero Banner Form State (Standard 2.4:1 / 21:9 Ratio Required)
  const [bannerForm, setBannerForm] = useState<{
    title: string;
    subtitle: string;
    badge_text: string;
    button_text: string;
    button_link: string;
    secondary_button_text: string;
    secondary_button_link: string;
    show_buttons: boolean;
    hide_overlay: boolean;
    sort_order: number;
    is_active: boolean;
  }>({
    title: '',
    subtitle: '',
    badge_text: '',
    button_text: 'Shop Now',
    button_link: '/products',
    secondary_button_text: 'Our Story',
    secondary_button_link: '/about',
    show_buttons: true,
    hide_overlay: false,
    sort_order: 1,
    is_active: true,
  });

  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(null);
  const [bannerMobileImageFile, setBannerMobileImageFile] = useState<File | null>(null);
  const [bannerMobileImagePreview, setBannerMobileImagePreview] = useState<string | null>(null);
  const [bannerValidationState, setBannerValidationState] = useState<{
    isValid: boolean;
    width?: number;
    height?: number;
    ratio?: number;
    error?: string;
  }>({ isValid: false });

  // Orders state
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [trackingInputs, setTrackingInputs] = useState<
    Record<string, { courier: string; awb: string }>
  >({});
  const [previewOrder, setPreviewOrder] = useState<AdminOrder | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const [productForm, setProductForm] = useState<{
    name: string;
    price: string;
    stock: string;
    category_id: string;
    description: string;
    image: File | null;
    variants: WeightVariant[];
  }>({
    name: '',
    price: '',
    stock: '',
    category_id: '',
    description: '',
    image: null,
    variants: [],
  });

  // Product Editing State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState<{
    name: string;
    price: string;
    stock: string;
    category_id: string;
    description: string;
    imageFile: File | null;
    currentImageUrl: string | null;
    previewUrl: string | null;
    variants: WeightVariant[];
  }>({
    name: '',
    price: '',
    stock: '',
    category_id: '',
    description: '',
    imageFile: null,
    currentImageUrl: null,
    previewUrl: null,
    variants: [],
  });

  // Banner Editing State
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [savingBannerEdit, setSavingBannerEdit] = useState(false);
  const [editBannerForm, setEditBannerForm] = useState<{
    id: string;
    title: string;
    subtitle: string;
    badge_text: string;
    button_text: string;
    button_link: string;
    secondary_button_text: string;
    secondary_button_link: string;
    show_buttons: boolean;
    hide_overlay: boolean;
    sort_order: number;
    is_active: boolean;
    current_image_url: string;
    new_image_file: File | null;
    new_image_preview: string | null;
    current_mobile_image_url?: string;
    new_mobile_image_file: File | null;
    new_mobile_image_preview: string | null;
    remove_mobile_image: boolean;
  }>({
    id: '',
    title: '',
    subtitle: '',
    badge_text: '',
    button_text: 'Shop Now',
    button_link: '/products',
    secondary_button_text: 'Our Story',
    secondary_button_link: '/about',
    show_buttons: true,
    hide_overlay: false,
    sort_order: 1,
    is_active: true,
    current_image_url: '',
    new_image_file: null,
    new_image_preview: null,
    current_mobile_image_url: '',
    new_mobile_image_file: null,
    new_mobile_image_preview: null,
    remove_mobile_image: false,
  });

  // Lock body scroll and guarantee full screen coverage when modal popup is open
  useEffect(() => {
    if (editingProduct || previewOrder || editingBanner) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [editingProduct, previewOrder, editingBanner]);

  const [couponForm, setCouponForm] = useState<{
    code: string;
    discount_type: 'percentage' | 'flat';
    discount_value: string;
    min_order_value: string;
    max_discount: string;
    description: string;
  }>({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_value: '',
    max_discount: '',
    description: '',
  });

  // Guard: Only allow admin users
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login?redirect=/admin');
      } else if (!isAdmin) {
        toast.error('Access denied. Admin privileges required.');
        navigate('/');
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  // Fallback safety: If auth check takes more than 1.2s and no user is found, redirect to login
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!user) {
        navigate('/login?redirect=/admin');
      }
    }, 1200);
    return () => clearTimeout(fallbackTimer);
  }, [user, navigate]);

  useEffect(() => {
    if (!isAdmin) return;

    fetchCategories();
    fetchProducts();
    loadCoupons();
    loadBanners();
    fetchOrders();

    // SUPABASE REALTIME SUBSCRIPTION FOR LIVE ORDERS, PRODUCTS & CATEGORIES
    const channel = supabase
      .channel('admin_dashboard_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          fetchOrdersSilent();
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as any;
            const shortId = (newOrder?.id || '').slice(0, 8).toUpperCase();
            toast.success(`New Order Received! #${shortId}`, {
              description: `${newOrder?.customer_name || 'Customer'} placed an order for ₹${newOrder?.total || 0}`,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchProducts();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          fetchCategories();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hero_banners' },
        () => {
          loadBanners();
        }
      )
      .on('broadcast', { event: 'product_changed' }, () => {
        fetchProducts();
      })
      .on('broadcast', { event: 'category_changed' }, () => {
        fetchCategories();
      })
      .on('broadcast', { event: 'hero_banners_changed' }, () => {
        loadBanners();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  // Instant broadcast helper to notify all customer browsers and devices immediately
  const broadcastStoreUpdate = (
    event: 'product_changed' | 'category_changed' | 'coupon_changed' | 'hero_banners_changed'
  ) => {
    try {
      const ch = supabase.channel('store_fast_broadcast');
      ch.send({
        type: 'broadcast',
        event,
        payload: { timestamp: Date.now() },
      });
    } catch (err) {
      console.warn('Store update broadcast error:', err);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    // Safety fallback: Never keep admin loader stuck for more than 2s
    const safetyTimer = setTimeout(() => {
      setLoadingOrders(false);
    }, 2000);

    try {
      await fetchOrdersSilent();
    } finally {
      clearTimeout(safetyTimer);
      setLoadingOrders(false);
    }
  };

  const fetchOrdersSilent = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          order_items (*)
        `
        )
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(data as unknown as AdminOrder[]);

        // Prepopulate tracking inputs
        const initialTracking: Record<string, { courier: string; awb: string }> = {};
        data.forEach((o: any) => {
          let c = o.courier_name || '';
          let a = o.tracking_number || '';
          if (!c || !a) {
            const match = (o.notes || '').match(
              /\[Courier:\s*([^|\]]+)\s*\|\s*Track:\s*([^\]]+)\]/i
            );
            if (match) {
              c = c || match[1].trim();
              a = a || match[2].trim();
            }
          }
          initialTracking[o.id] = { courier: c, awb: a };
        });
        setTrackingInputs((prev) => ({ ...initialTracking, ...prev }));

        // Also sync previewOrder if currently open
        setPreviewOrder((current) => {
          if (!current) return null;
          const updated = data.find((item: any) => item.id === current.id);
          return updated ? (updated as unknown as AdminOrder) : current;
        });
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    }
  };

  const loadCoupons = async () => {
    const list = await fetchCoupons();
    setCoupons(list);
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      if (data) setCategories(data);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, price, stock, image_url, category_id, description, weight')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setProducts(data);
    } catch (err: any) {
      console.error('Error fetching products:', err);
    }
  };

  // Order Handlers
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      toast.success(`Order status changed to "${newStatus.replace(/_/g, ' ')}"`);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err: any) {
      console.error('Error updating order status:', err);
      toast.error('Failed to update status');
    }
  };

  const handleSaveTracking = async (orderId: string) => {
    const tracking = trackingInputs[orderId] || { courier: '', awb: '' };
    try {
      // 1. Try updating columns
      const { error } = await supabase
        .from('orders')
        .update({
          courier_name: tracking.courier.trim() || null,
          tracking_number: tracking.awb.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) {
        // Fallback: Store tracking in notes if columns not migrated yet
        const target = orders.find((o) => o.id === orderId);
        const cleanNotes = (target?.notes || '')
          .replace(/\[Courier:[^\]]+\]/g, '')
          .trim();
        const trackingNote = `[Courier: ${tracking.courier.trim()} | Track: ${tracking.awb.trim()}]`;
        const updatedNotes = cleanNotes
          ? `${cleanNotes} ${trackingNote}`
          : trackingNote;

        await supabase
          .from('orders')
          .update({
            notes: updatedNotes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
      }

      toast.success('Tracking details saved successfully');
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                courier_name: tracking.courier.trim(),
                tracking_number: tracking.awb.trim(),
              }
            : o
        )
      );
    } catch (err: any) {
      console.error('Error saving tracking:', err);
      toast.error('Failed to save tracking details');
    }
  };

  // Category Handlers
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const slug =
        newCategoryName.trim().toLowerCase().replace(/\s+/g, '-') +
        '-' +
        Date.now();

      const { error } = await supabase.from('categories').insert({
        name: newCategoryName.trim(),
        slug,
      });

      if (error) throw error;

      toast.success('Category added');
      setNewCategoryName('');
      fetchCategories();
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      broadcastStoreUpdate('category_changed');
    } catch (err: any) {
      console.error('Error adding category:', err);
      toast.error(err.message || 'Failed to add category');
    }
  };

  // Product Handlers
  // Helper to delete old product images from Supabase storage
  const deleteOldProductImage = async (url: string | null) => {
    if (!url || url.startsWith('data:')) return;
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
        await supabase.storage.from(bucketName).remove([path]);
        console.log(`Purged old product image from storage (${bucketName}):`, path);
      }
    } catch (e) {
      console.warn('Storage delete warning:', e);
    }
  };

  // Helper to compress and upload product images directly to 'product-images' bucket
  // with fallback to optimized direct data URL if Supabase storage RLS blocks upload
  const uploadImageFile = async (rawFile: File): Promise<string> => {
    // 1. High-quality client-side compression (down to ~100KB - 200KB)
    const comp = await compressImage(rawFile);
    const fileToUpload = comp.file;

    // 2. Generate clean, unique filename
    const cleanBase = (rawFile.name || 'product')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const ext = fileToUpload.name?.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${cleanBase}.${ext}`;

    // 3. Attempt standard upload to 'product-images' bucket without upsert (avoids RLS update block)
    try {
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, fileToUpload);

      if (!uploadError) {
        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        if (data?.publicUrl) {
          return data.publicUrl;
        }
      } else {
        console.warn('Supabase storage upload error:', uploadError.message);
      }
    } catch (err) {
      console.warn('Storage exception:', err);
    }

    // 4. Reliable Fallback: If storage bucket RLS blocks the upload, save the optimized image data directly
    if (comp.dataUrl && comp.dataUrl.length > 50) {
      console.log('Saved image using optimized direct data (bypassed storage RLS)');
      return comp.dataUrl;
    }

    throw new Error('Failed to process and save product image');
  };

  // Product Handlers
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.category_id) {
      toast.error('Please fill in required fields');
      return;
    }

    setAddingProduct(true);
    try {
      let image_url = null;

      if (productForm.image) {
        image_url = await uploadImageFile(productForm.image);
      }

      const slug =
        productForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') +
        '-' +
        Date.now();

      const validVariants = (productForm.variants || []).filter((v) => v.weight && v.weight.trim() && v.price > 0);
      const weightData = serializeWeightVariants(validVariants);
      const finalPrice = validVariants.length > 0
        ? Math.min(...validVariants.map((v) => v.price))
        : parseFloat(productForm.price) || 0;

      const { error } = await supabase.from('products').insert({
        name: productForm.name.trim(),
        slug,
        price: finalPrice,
        stock: parseInt(productForm.stock) || 0,
        category_id: productForm.category_id,
        description: productForm.description.trim() || null,
        image_url,
        weight: weightData || null,
      });

      if (error) throw error;

      toast.success('Product added successfully');
      setProductForm({
        name: '',
        price: '',
        stock: '',
        category_id: '',
        description: '',
        image: null,
        variants: [],
      });
      fetchProducts();
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      broadcastStoreUpdate('product_changed');
    } catch (err: any) {
      console.error('Failed to add product:', err);
      toast.error(err.message || 'Failed to add product');
    } finally {
      setAddingProduct(false);
    }
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    const parsedVariants = parseWeightVariants(prod.weight, prod.price);
    
    // Initial rate price: if 250gm variant exists, use it, else base price
    let initialPrice = prod.price.toString();
    if (parsedVariants.length > 0) {
      const v250 = parsedVariants.find((v) => v.weight.toLowerCase() === '250gm');
      if (v250) {
        initialPrice = v250.price.toString();
      } else {
        initialPrice = parsedVariants[0].price.toString();
      }
    }

    setEditForm({
      name: prod.name,
      price: initialPrice,
      stock: (prod.stock ?? 0).toString(),
      category_id: prod.category_id || '',
      description: prod.description || '',
      imageFile: null,
      currentImageUrl: prod.image_url,
      previewUrl: null,
      variants: parsedVariants,
    });
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const preview = URL.createObjectURL(file);
      setEditForm((prev) => ({
        ...prev,
        imageFile: file,
        previewUrl: preview,
      }));
    }
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editForm.name.trim() || !editForm.price) {
      toast.error('Product name and price are required');
      return;
    }

    setSavingEdit(true);
    try {
      let finalImageUrl = editForm.currentImageUrl;

      // 1. If a new image was chosen, upload to product-images and delete old image
      if (editForm.imageFile) {
        finalImageUrl = await uploadImageFile(editForm.imageFile);

        // Delete previous image file from database storage if different
        if (editingProduct.image_url && editingProduct.image_url !== finalImageUrl) {
          await deleteOldProductImage(editingProduct.image_url);
        }
      }

      const validVariants = (editForm.variants || []).filter((v) => v.weight && v.weight.trim() && v.price > 0);
      const weightData = serializeWeightVariants(validVariants);
      const finalPrice = validVariants.length > 0
        ? Math.min(...validVariants.map((v) => v.price))
        : parseFloat(editForm.price) || 0;

      // 2. Update product in database
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: editForm.name.trim(),
          price: finalPrice,
          stock: parseInt(editForm.stock) || 0,
          category_id: editForm.category_id || null,
          description: editForm.description.trim() || null,
          image_url: finalImageUrl,
          weight: weightData || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingProduct.id);

      if (updateError) throw updateError;

      toast.success(`Spice "${editForm.name}" updated successfully!`);
      setEditingProduct(null);
      fetchProducts();
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      broadcastStoreUpdate('product_changed');
    } catch (err: any) {
      console.error('Failed to update product:', err);
      toast.error(err.message || 'Failed to update product');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteProduct = async (id: string, imageUrl?: string | null) => {
    if (!confirm('Are you sure you want to delete this spice product?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;

      // Delete image file from storage
      if (imageUrl) {
        await deleteOldProductImage(imageUrl);
      }

      toast.success('Product deleted');
      fetchProducts();
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      broadcastStoreUpdate('product_changed');
    } catch (err: any) {
      console.error('Error deleting product:', err);
      toast.error(err.message || 'Failed to delete product');
    }
  };

  // Coupon Handlers
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    if (!couponForm.discount_value || Number(couponForm.discount_value) <= 0) {
      toast.error('Please enter a valid discount value');
      return;
    }

    setAddingCoupon(true);
    try {
      await createCoupon({
        code: couponForm.code.trim().toUpperCase(),
        discount_type: couponForm.discount_type,
        discount_value: Number(couponForm.discount_value),
        min_order_value: Number(couponForm.min_order_value) || 0,
        max_discount: couponForm.max_discount
          ? Number(couponForm.max_discount)
          : undefined,
        description:
          couponForm.description.trim() ||
          (couponForm.discount_type === 'percentage'
            ? `${couponForm.discount_value}% OFF`
            : `Flat ₹${couponForm.discount_value} OFF`),
        is_active: true,
      });

      toast.success(`Coupon '${couponForm.code.toUpperCase()}' created!`);
      setCouponForm({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        min_order_value: '',
        max_discount: '',
        description: '',
      });
      await loadCoupons();
    } catch (err: any) {
      console.error('Failed to create coupon:', err);
      toast.error(err.message || 'Failed to create coupon');
    } finally {
      setAddingCoupon(false);
    }
  };

  const handleToggleCoupon = async (id: string, currentStatus: boolean) => {
    try {
      await toggleCouponActive(id, !currentStatus);
      toast.success(`Coupon status updated`);
      await loadCoupons();
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      broadcastStoreUpdate('coupon_changed');
    } catch (err) {
      toast.error('Failed to update coupon status');
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon '${code}'?`)) return;
    try {
      await deleteCoupon(id);
      toast.success(`Coupon '${code}' deleted`);
      await loadCoupons();
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      broadcastStoreUpdate('coupon_changed');
    } catch (err) {
      toast.error('Failed to delete coupon');
    }
  };

  // =========================================================================
  // HERO BANNERS MANAGEMENT HANDLERS (STANDARD 2.4:1 / 21:9 RATIO)
  // =========================================================================
  const loadBanners = async () => {
    setLoadingBanners(true);
    try {
      const data = await fetchHeroBanners(false);
      setBanners(data);
    } catch (err) {
      console.error('Failed to load hero banners:', err);
    } finally {
      setLoadingBanners(false);
    }
  };

  const handleBannerImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Standard 2.4:1 / 21:9 ratio validation
    const result = await validate16by9Ratio(file);

    if (!result.isValid) {
      // Clear file input immediately
      e.target.value = '';
      setBannerImageFile(null);
      setBannerImagePreview(null);
      setBannerValidationState({
        isValid: false,
        width: result.width,
        height: result.height,
        ratio: result.ratio,
        error: result.error,
      });

      toast.error('Image Rejected: Standard 2.4:1 / 21:9 Ratio Required!', {
        description:
          result.error ||
          'Only 2.4:1 or 21:9 aspect ratio images are allowed (Recommended: 1920×800, 1440×600, or 1200×500).',
        duration: 7000,
      });
      return;
    }

    // Success: Verified 2.4:1 (21:9) ratio
    setBannerValidationState({
      isValid: true,
      width: result.width,
      height: result.height,
      ratio: result.ratio,
    });
    setBannerImageFile(file);
    setBannerImagePreview(URL.createObjectURL(file));

    toast.success('2.4:1 (21:9) Aspect Ratio Verified!', {
      description: `Widescreen Resolution: ${result.width} × ${result.height} (${(result.ratio).toFixed(2)}:1)`,
    });
  };

  const handleBannerMobileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPEG, PNG, WebP)');
      return;
    }

    setBannerMobileImageFile(file);
    setBannerMobileImagePreview(URL.createObjectURL(file));
    toast.success('Smartphone / Mobile Banner Selected!', {
      description: 'Optimized for mobile screens without side-cropping.',
    });
  };

  const handleRemoveBannerMobileImage = () => {
    setBannerMobileImageFile(null);
    setBannerMobileImagePreview(null);
    const input = document.getElementById('hero-banner-mobile-image-input') as HTMLInputElement;
    if (input) input.value = '';
    toast.info('Mobile banner removed. Storefront will use desktop banner.');
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bannerImageFile) {
      toast.error('Please upload a 2.4:1 (1920×800) banner image');
      return;
    }

    if (!bannerValidationState.isValid) {
      toast.error('Cannot save: Standard 2.4:1 / 21:9 aspect ratio is mandatory!');
      return;
    }

    setAddingBanner(true);
    try {
      // 1. High-quality client-side compression (1920x800 web resolution)
      const comp = await compressImage(bannerImageFile, { maxWidth: 1920, maxHeight: 800, quality: 0.85 });
      const fileToUpload = comp.file;
      const cleanFileName = `banner-${Date.now()}-${fileToUpload.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
      let finalImageUrl = '';

      // 2. Upload image to Supabase storage 'product-images' inside 'banners/' folder
      try {
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(`banners/${cleanFileName}`, fileToUpload, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(`banners/${cleanFileName}`);
          finalImageUrl = publicUrl;
        } else {
          console.warn('Storage upload error, using local fallback:', uploadError);
        }
      } catch (uploadErr) {
        console.warn('Storage upload exception, using local fallback:', uploadErr);
      }

      // 3. Fallback to optimized direct data URL if storage upload was blocked
      if (!finalImageUrl) {
        finalImageUrl = comp.dataUrl || await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(fileToUpload);
        });
      }

      // 4. Upload optional Mobile Smartphone Banner if provided
      let finalMobileImageUrl: string | undefined = undefined;
      if (bannerMobileImageFile) {
        try {
          const compMobile = await compressImage(bannerMobileImageFile, { maxWidth: 1080, maxHeight: 1440, quality: 0.85 });
          const mobileFileToUpload = compMobile.file;
          const cleanMobileFileName = `banner-mobile-${Date.now()}-${mobileFileToUpload.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(`banners/${cleanMobileFileName}`, mobileFileToUpload, { upsert: true });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('product-images')
              .getPublicUrl(`banners/${cleanMobileFileName}`);
            finalMobileImageUrl = publicUrl;
          }
          if (!finalMobileImageUrl) {
            finalMobileImageUrl = compMobile.dataUrl;
          }
        } catch (mobileErr) {
          console.warn('Mobile banner upload fallback:', mobileErr);
        }
      }

      const isNone = bannerForm.button_link === 'none';
      await createHeroBanner({
        image_url: finalImageUrl,
        mobile_image_url: finalMobileImageUrl || null,
        title: bannerForm.hide_overlay || isNone ? null : (bannerForm.title.trim() || null),
        subtitle: bannerForm.hide_overlay || isNone ? null : (bannerForm.subtitle.trim() || null),
        badge_text: bannerForm.hide_overlay || isNone ? null : (bannerForm.badge_text.trim() || null),
        button_text: isNone || !bannerForm.show_buttons ? '' : (bannerForm.button_text.trim() || 'Shop Now'),
        button_link: isNone ? 'none' : (bannerForm.button_link?.trim() || '/products'),
        secondary_button_text: isNone || !bannerForm.show_buttons ? '' : (bannerForm.secondary_button_text.trim() || 'Our Story'),
        secondary_button_link: isNone || !bannerForm.show_buttons ? '' : (bannerForm.secondary_button_link.trim() || ''),
        show_buttons: isNone ? false : (bannerForm.show_buttons !== false),
        hide_overlay: isNone ? true : Boolean(bannerForm.hide_overlay),
        sort_order: Number(bannerForm.sort_order) || (banners.length + 1),
        is_active: bannerForm.is_active,
        aspect_ratio: '2.4:1',
        width: bannerValidationState.width,
        height: bannerValidationState.height,
      });

      toast.success('Hero Banner Added Successfully!');

      // Reset form with default buttons
      setBannerForm({
        title: '',
        subtitle: '',
        badge_text: '',
        button_text: 'Shop Now',
        button_link: '/products',
        secondary_button_text: 'Our Story',
        secondary_button_link: '/about',
        show_buttons: true,
        hide_overlay: false,
        sort_order: banners.length + 2,
        is_active: true,
      });
      setBannerImageFile(null);
      setBannerImagePreview(null);
      setBannerMobileImageFile(null);
      setBannerMobileImagePreview(null);
      setBannerValidationState({ isValid: false });

      // Reset file input elements
      const fileInput = document.getElementById('hero-banner-image-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      const mobileFileInput = document.getElementById('hero-banner-mobile-image-input') as HTMLInputElement;
      if (mobileFileInput) mobileFileInput.value = '';

      await loadBanners();
      broadcastStoreUpdate('hero_banners_changed');
    } catch (err: any) {
      console.error('Failed to create hero banner:', err);
      toast.error(err.message || 'Failed to create hero banner');
    } finally {
      setAddingBanner(false);
    }
  };

  const handleToggleBanner = async (id: string, currentStatus: boolean) => {
    try {
      await toggleHeroBannerActive(id, currentStatus);
      toast.success(`Banner ${!currentStatus ? 'activated' : 'deactivated'}`);
      await loadBanners();
      broadcastStoreUpdate('hero_banners_changed');
    } catch (err) {
      toast.error('Failed to toggle banner status');
    }
  };

  const handleDeleteBanner = async (id: string, title?: string) => {
    if (!confirm(`Are you sure you want to delete this banner${title ? ` "${title}"` : ''}?`)) return;
    try {
      await deleteHeroBanner(id);
      toast.success('Hero banner deleted successfully');
      await loadBanners();
      broadcastStoreUpdate('hero_banners_changed');
    } catch (err) {
      toast.error('Failed to delete banner');
    }
  };

  const handleMoveBanner = async (id: string, direction: 'up' | 'down') => {
    const idx = banners.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= banners.length) return;

    // Swap items in array
    const newBanners = [...banners];
    const temp = newBanners[idx];
    newBanners[idx] = newBanners[targetIdx];
    newBanners[targetIdx] = temp;

    // Immediately update state so UI changes with 0 delay
    setBanners(newBanners);

    try {
      const updated = await reorderHeroBanners(newBanners);
      setBanners(updated);
      toast.success('Banner order updated!');
      broadcastStoreUpdate('hero_banners_changed');
    } catch (err) {
      console.error('Failed to reorder banners:', err);
      toast.error('Failed to reorder banners');
      await loadBanners();
    }
  };

  const handleStartEditBanner = (banner: HeroBanner) => {
    setEditingBanner(banner);
    const isNoLink = banner.button_link === 'none' || (!banner.button_link && banner.show_buttons === false);
    setEditBannerForm({
      id: banner.id,
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      badge_text: banner.badge_text || '',
      button_text: banner.button_text ?? '',
      button_link: isNoLink ? 'none' : (banner.button_link || '/products'),
      secondary_button_text: banner.secondary_button_text ?? '',
      secondary_button_link: banner.secondary_button_link ?? '',
      show_buttons: isNoLink ? false : (banner.show_buttons !== false),
      hide_overlay: banner.hide_overlay ?? isNoLink,
      sort_order: banner.sort_order || 1,
      is_active: banner.is_active,
      current_image_url: banner.image_url,
      new_image_file: null,
      new_image_preview: null,
      current_mobile_image_url: banner.mobile_image_url || '',
      new_mobile_image_file: null,
      new_mobile_image_preview: null,
      remove_mobile_image: false,
    });
  };

  const handleEditBannerImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await validate16by9Ratio(file);
    if (!result.isValid) {
      e.target.value = '';
      toast.error('Image Rejected: Standard 2.4:1 / 21:9 Ratio Required!', {
        description: result.error,
        duration: 6000,
      });
      return;
    }

    setEditBannerForm((prev) => ({
      ...prev,
      new_image_file: file,
      new_image_preview: URL.createObjectURL(file),
    }));
    toast.success('2.4:1 (21:9) Aspect Ratio Verified!');
  };

  const handleEditBannerMobileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPEG, PNG, WebP)');
      return;
    }

    setEditBannerForm((prev) => ({
      ...prev,
      new_mobile_image_file: file,
      new_mobile_image_preview: URL.createObjectURL(file),
      remove_mobile_image: false,
    }));
    toast.success('New Mobile Banner Selected!');
  };

  const handleSaveBannerEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;

    setSavingBannerEdit(true);
    try {
      let finalImageUrl = editBannerForm.current_image_url;

      if (editBannerForm.new_image_file) {
        const comp = await compressImage(editBannerForm.new_image_file, { maxWidth: 1920, maxHeight: 800, quality: 0.85 });
        const fileToUpload = comp.file;
        const cleanFileName = `banner-${Date.now()}-${fileToUpload.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
        try {
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(`banners/${cleanFileName}`, fileToUpload, { upsert: true });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('product-images')
              .getPublicUrl(`banners/${cleanFileName}`);
            finalImageUrl = publicUrl;
          }
        } catch (uploadErr) {
          console.warn('Storage upload fallback:', uploadErr);
        }

        if (finalImageUrl === editBannerForm.current_image_url) {
          finalImageUrl = comp.dataUrl || await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(fileToUpload);
          });
        }
      }

      // Handle mobile image updates
      let finalMobileImageUrl: string | undefined = editBannerForm.remove_mobile_image
        ? undefined
        : (editBannerForm.current_mobile_image_url || undefined);

      if (editBannerForm.new_mobile_image_file) {
        try {
          const compMobile = await compressImage(editBannerForm.new_mobile_image_file, { maxWidth: 1080, maxHeight: 1440, quality: 0.85 });
          const mobileFileToUpload = compMobile.file;
          const cleanMobileFileName = `banner-mobile-${Date.now()}-${mobileFileToUpload.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(`banners/${cleanMobileFileName}`, mobileFileToUpload, { upsert: true });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('product-images')
              .getPublicUrl(`banners/${cleanMobileFileName}`);
            finalMobileImageUrl = publicUrl;
          }
          if (!finalMobileImageUrl) {
            finalMobileImageUrl = compMobile.dataUrl;
          }
        } catch (mobileErr) {
          console.warn('Mobile banner edit upload fallback:', mobileErr);
        }
      }

      const isNone = editBannerForm.button_link === 'none';
      await updateHeroBanner(editingBanner.id, {
        image_url: finalImageUrl,
        mobile_image_url: editBannerForm.remove_mobile_image ? null : (finalMobileImageUrl || null),
        title: editBannerForm.hide_overlay || isNone ? null : (editBannerForm.title?.trim() || null),
        subtitle: editBannerForm.hide_overlay || isNone ? null : (editBannerForm.subtitle?.trim() || null),
        badge_text: editBannerForm.hide_overlay || isNone ? null : (editBannerForm.badge_text?.trim() || null),
        button_text: isNone || !editBannerForm.show_buttons ? '' : (editBannerForm.button_text?.trim() || 'Shop Now'),
        button_link: isNone ? 'none' : (editBannerForm.button_link?.trim() || '/products'),
        secondary_button_text: isNone || !editBannerForm.show_buttons ? '' : (editBannerForm.secondary_button_text?.trim() || 'Our Story'),
        secondary_button_link: isNone || !editBannerForm.show_buttons ? '' : (editBannerForm.secondary_button_link?.trim() || ''),
        show_buttons: isNone ? false : (editBannerForm.show_buttons !== false),
        hide_overlay: isNone ? true : Boolean(editBannerForm.hide_overlay),
        sort_order: Number(editBannerForm.sort_order) || 1,
        is_active: editBannerForm.is_active,
      });

      toast.success('Hero banner updated successfully!');
      setEditingBanner(null);
      await loadBanners();
      broadcastStoreUpdate('hero_banners_changed');
    } catch (err: any) {
      console.error('Failed to update banner:', err);
      toast.error(err.message || 'Failed to update banner');
    } finally {
      setSavingBannerEdit(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center text-muted-foreground animate-pulse">
          Checking admin authorization…
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (orderFilter !== 'all' && order.status.toLowerCase() !== orderFilter) {
      return false;
    }
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      const matchId = order.id.toLowerCase().includes(q);
      const matchName = order.customer_name.toLowerCase().includes(q);
      const matchPhone = order.customer_phone.includes(q);
      const matchCity = (order.city || '').toLowerCase().includes(q);
      return matchId || matchName || matchPhone || matchCity;
    }
    return true;
  });

  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled'
  ).length;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl space-y-8">
        {/* Admin Header with Navigation Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                Store Admin
              </span>
              <span className="text-xs text-muted-foreground">{user?.email}</span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-foreground mt-1">
              Singlaji Operations Center
            </h1>
          </div>

          {/* Tab Selector */}
          <div className="flex flex-wrap bg-muted/60 p-1.5 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'orders'
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Truck className="h-4 w-4" />
              Orders & Tracking
              {activeOrdersCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {activeOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'products'
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Package className="h-4 w-4" />
              Products ({products.length})
            </button>

            <button
              onClick={() => setActiveTab('coupons')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'coupons'
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Ticket className="h-4 w-4" />
              Coupons ({coupons.length})
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'categories'
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Categories ({categories.length})
            </button>

            <button
              onClick={() => setActiveTab('banners')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'banners'
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sliders className="h-4 w-4" />
              Hero Banners ({banners.length})
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: ORDERS & TRACKING CONTROL */}
        {/* ============================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card rounded-xl p-4 shadow-card border border-border">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Order ID, Customer, Phone, or City..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { key: 'all', label: 'All Orders' },
                  { key: 'pending', label: 'Pending' },
                  { key: 'confirmed', label: 'Confirmed' },
                  { key: 'packed', label: 'Packed' },
                  { key: 'shipped', label: 'Shipped' },
                  { key: 'delivered', label: 'Delivered' },
                  { key: 'cancelled', label: 'Cancelled' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setOrderFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      orderFilter === f.key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchOrders}
                  disabled={loadingOrders}
                  className="text-xs shrink-0"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 mr-1 ${loadingOrders ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Orders List */}
            {loadingOrders ? (
              <div className="py-16 text-center text-muted-foreground animate-pulse">
                Loading orders and tracking records…
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-16 text-center bg-card rounded-xl border border-border p-8">
                <Truck className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-base font-semibold">No orders found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {orderSearch || orderFilter !== 'all'
                    ? 'Try clearing the search or status filter'
                    : 'Customer orders will appear here automatically when placed.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredOrders.map((order) => {
                  const shortId = order.id.slice(0, 8).toUpperCase();
                  const tracking = trackingInputs[order.id] || {
                    courier: order.courier_name || '',
                    awb: order.tracking_number || '',
                  };

                  return (
                    <div
                      key={order.id}
                      className="bg-card rounded-xl shadow-card border border-border overflow-hidden"
                    >
                      {/* Order Card Header */}
                      <div className="p-5 bg-muted/20 border-b border-border flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="font-mono font-bold text-sm text-foreground">
                              #{shortId}
                            </span>
                            <span className="text-xs text-muted-foreground ml-3">
                              {new Date(order.created_at).toLocaleDateString(
                                'en-IN',
                                {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Customer Direct WhatsApp Contact */}
                        <div className="flex items-center gap-2">
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="text-xs text-emerald-600 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          >
                            <a
                              href={`https://wa.me/91${order.customer_phone.replace(
                                /\D/g,
                                ''
                              )}?text=${encodeURIComponent(
                                `Hi ${order.customer_name}, regarding your Singlaji Spices Order #${shortId} (Status: ${order.status.replace(
                                  /_/g,
                                  ' '
                                )}${
                                  tracking.courier && tracking.awb
                                    ? `, Shipped via ${tracking.courier} AWB: ${tracking.awb}`
                                    : ''
                                }): https://singlaji.in/orders/${order.id}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MessageCircle className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                              WhatsApp Customer
                            </a>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs font-semibold bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                            onClick={() => setPreviewOrder(order)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Preview Tracker
                          </Button>
                        </div>
                      </div>

                      {/* Order Body */}
                      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Column 1: Customer & Address */}
                        <div className="space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Customer Details
                          </p>
                          <div className="text-xs space-y-1">
                            <p className="font-bold text-sm text-foreground">
                              {order.customer_name}
                            </p>
                            <p className="text-muted-foreground flex items-center gap-1.5 pt-0.5">
                              <Phone className="h-3 w-3" />
                              <span className="font-mono">{order.customer_phone}</span>
                            </p>
                            <p className="text-muted-foreground flex items-start gap-1.5 pt-1">
                              <MapPin className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                              <span>
                                {order.address}, {order.city}, {order.state} -{' '}
                                {order.pincode}
                              </span>
                            </p>
                          </div>

                          <div className="pt-2 text-xs">
                            <span className="text-muted-foreground">Payment: </span>
                            <span className="font-semibold text-foreground">
                              Cash on Delivery (₹{order.total?.toFixed(0)})
                            </span>
                          </div>
                        </div>

                        {/* Column 2: Order Items */}
                        <div className="space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Ordered Spices ({order.order_items?.length || 0})
                          </p>
                          <div className="space-y-2 text-xs divide-y divide-border/50">
                            {order.order_items?.map((item) => (
                              <div
                                key={item.id}
                                className="pt-1.5 first:pt-0 flex justify-between items-center"
                              >
                                <span>
                                  {item.product_name}{' '}
                                  <span className="text-muted-foreground">
                                    × {item.quantity}
                                  </span>
                                </span>
                                <span className="font-medium text-foreground">
                                  ₹{(item.price * item.quantity).toFixed(0)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {order.notes && (
                            <p className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded">
                              {order.notes}
                            </p>
                          )}
                        </div>

                        {/* Column 3: Live Tracking Controller */}
                        <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border">
                          <div>
                            <Label className="text-xs font-bold uppercase tracking-wider block mb-1.5">
                              Order Delivery Status
                            </Label>
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(order.id, e.target.value)
                              }
                              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:ring-2 focus:ring-primary"
                            >
                              <option value="pending">Pending Verification</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="packed">Packed & Sealed</option>
                              <option value="shipped">Dispatched / Shipped</option>
                              <option value="out_for_delivery">
                                Out for Delivery
                              </option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>

                          {/* Courier Partner & AWB Number */}
                          <div className="space-y-2 pt-2 border-t border-border">
                            <Label className="text-xs font-bold uppercase tracking-wider block">
                              Courier Partner & AWB Tracking
                            </Label>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <select
                                  value={
                                    COMMON_COURIERS.includes(tracking.courier)
                                      ? tracking.courier
                                      : 'Other'
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setTrackingInputs((prev) => ({
                                      ...prev,
                                      [order.id]: {
                                        ...tracking,
                                        courier: val === 'Other' ? '' : val,
                                      },
                                    }));
                                  }}
                                  className="w-full h-8 rounded border border-input bg-background px-2 text-[11px] text-foreground"
                                >
                                  <option value="">Select Courier</option>
                                  {COMMON_COURIERS.map((c) => (
                                    <option key={c} value={c}>
                                      {c}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <Input
                                  placeholder="Or type courier"
                                  value={tracking.courier}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setTrackingInputs((prev) => ({
                                      ...prev,
                                      [order.id]: { ...tracking, courier: val },
                                    }));
                                  }}
                                  className="h-8 text-[11px]"
                                />
                              </div>
                            </div>

                            <Input
                              placeholder="Tracking / AWB Number (e.g. 123456789)"
                              value={tracking.awb}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTrackingInputs((prev) => ({
                                  ...prev,
                                  [order.id]: { ...tracking, awb: val },
                                }));
                              }}
                              className="h-8 text-[11px] font-mono"
                            />

                            <Button
                              size="sm"
                              onClick={() => handleSaveTracking(order.id)}
                              className="w-full h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 mt-1"
                            >
                              Update Tracking Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: PRODUCTS & INVENTORY */}
        {/* ============================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-8">
            {/* Add Product Form */}
            <section className="bg-card rounded-xl p-6 shadow-card border border-border">
              <h2 className="text-xl font-semibold mb-6 font-serif">Add New Spice</h2>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Product Name *</Label>
                    <Input
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({ ...productForm, name: e.target.value })
                      }
                      placeholder="e.g. Royal Garam Masala"
                      required
                    />
                  </div>
                  <div>
                    <Label>Category *</Label>
                    <select
                      className="w-full h-10 border rounded-md px-3 bg-background text-sm border-input"
                      value={productForm.category_id}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          category_id: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Stock Quantity</Label>
                    <Input
                      type="number"
                      value={productForm.stock}
                      onChange={(e) =>
                        setProductForm({ ...productForm, stock: e.target.value })
                      }
                      placeholder="50"
                    />
                  </div>
                </div>

                {/* Pricing & Weight Pack Sizes */}
                <WeightVariantsEditor
                  price={productForm.price}
                  onPriceChange={(price) => setProductForm((prev) => ({ ...prev, price }))}
                  variants={productForm.variants}
                  onVariantsChange={(variants) => setProductForm((prev) => ({ ...prev, variants }))}
                />

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe aroma, purity, and specialty..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Product Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        image: e.target.files ? e.target.files[0] : null,
                      })
                    }
                  />
                </div>

                <Button
                  type="submit"
                  disabled={addingProduct}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {addingProduct ? 'Adding...' : 'Add Spice Product'}
                </Button>
              </form>
            </section>

            {/* Existing Products List */}
            <section className="bg-card rounded-xl p-6 shadow-card border border-border">
              <h2 className="text-xl font-semibold mb-6 font-serif">
                Manage Existing Spices ({products.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handleOpenEditProduct(prod);
                    }}
                    className="p-4 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-4 hover:border-primary/50 transition-all cursor-pointer group select-none"
                    title="Right-click or click pencil to edit spice details"
                  >
                    <div
                      className="flex items-center gap-3 overflow-hidden flex-1"
                      onClick={() => handleOpenEditProduct(prod)}
                    >
                      {prod.image_url ? (
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="h-12 w-12 rounded-lg object-cover shrink-0 border border-border"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted border border-border flex items-center justify-center font-bold text-muted-foreground shrink-0">
                          {prod.name.charAt(0)}
                        </div>
                      )}
                      <div className="truncate">
                        <p className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors">
                          {prod.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(() => {
                            const v = parseWeightVariants(prod.weight, prod.price);
                            if (v.length > 1) {
                              const minP = Math.min(...v.map((x) => x.price));
                              const maxP = Math.max(...v.map((x) => x.price));
                              return `From ₹${minP} to ₹${maxP} (${v.length} pack sizes)`;
                            }
                            return `₹${prod.price}${prod.weight ? ` (${prod.weight})` : ''}`;
                          })()}{' '}
                          | Stock: {prod.stock}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditProduct(prod);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Edit Spice Details (Right-Click also supported)"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProduct(prod.id, prod.image_url);
                        }}
                        className="h-8 w-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete Spice Product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: COUPONS & OFFERS */}
        {/* ============================================================== */}
        {activeTab === 'coupons' && (
          <div className="space-y-8">
            <section className="bg-card rounded-xl p-6 shadow-card border border-border">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Ticket className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold font-serif">
                    Discount Coupons & Promo Codes
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Create promo codes for your online store (applied in Cart & Checkout)
                  </p>
                </div>
              </div>

              {/* Coupon Form */}
              <form
                onSubmit={handleCreateCoupon}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-lg bg-muted/20 border border-border mb-6"
              >
                <div>
                  <Label className="text-xs font-semibold mb-1 block">
                    Coupon Code *
                  </Label>
                  <Input
                    placeholder="e.g. DIWALI20"
                    value={couponForm.code}
                    onChange={(e) =>
                      setCouponForm((prev) => ({
                        ...prev,
                        code: e.target.value.toUpperCase().replace(/\s+/g, ''),
                      }))
                    }
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold mb-1 block">
                    Discount Type *
                  </Label>
                  <select
                    className="w-full h-10 border rounded-lg px-3 py-2 bg-background text-sm text-foreground border-input focus:ring-2 focus:ring-primary"
                    value={couponForm.discount_type}
                    onChange={(e) =>
                      setCouponForm((prev) => ({
                        ...prev,
                        discount_type: e.target.value as 'percentage' | 'flat',
                      }))
                    }
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="flat">Flat Amount Discount (₹)</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-semibold mb-1 block">
                    Discount Value *
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder={
                      couponForm.discount_type === 'percentage'
                        ? 'e.g. 15 for 15%'
                        : 'e.g. 50 for ₹50'
                    }
                    value={couponForm.discount_value}
                    onChange={(e) =>
                      setCouponForm((prev) => ({
                        ...prev,
                        discount_value: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold mb-1 block">
                    Min. Order Value (₹)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 499 (0 for no min)"
                    value={couponForm.min_order_value}
                    onChange={(e) =>
                      setCouponForm((prev) => ({
                        ...prev,
                        min_order_value: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold mb-1 block">
                    Max Discount Cap (₹)
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Optional max cap for %"
                    value={couponForm.max_discount}
                    onChange={(e) =>
                      setCouponForm((prev) => ({
                        ...prev,
                        max_discount: e.target.value,
                      }))
                    }
                    disabled={couponForm.discount_type === 'flat'}
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold mb-1 block">
                    Description / Display Label
                  </Label>
                  <Input
                    placeholder="e.g. 10% OFF on all spices"
                    value={couponForm.description}
                    onChange={(e) =>
                      setCouponForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-3 flex justify-end">
                  <Button
                    type="submit"
                    disabled={addingCoupon}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {addingCoupon ? 'Creating...' : 'Create Coupon Code'}
                  </Button>
                </div>
              </form>

              {/* Coupons List */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Active & Configured Coupons</h3>
                {coupons.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No custom coupons found. Starter codes WELCOME10, SINGLA50, and
                    FREESHIP are active by default.
                  </p>
                ) : (
                  <div className="divide-y divide-border border rounded-lg overflow-hidden">
                    {coupons.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 flex flex-wrap items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2.5 py-1 rounded font-mono font-bold text-sm tracking-wider ${
                              c.is_active
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'bg-muted text-muted-foreground line-through'
                            }`}
                          >
                            {c.code}
                          </span>
                          <div>
                            <p className="text-xs font-medium text-foreground">
                              {c.discount_type === 'percentage'
                                ? `${c.discount_value}% OFF`
                                : `Flat ₹${c.discount_value} OFF`}
                              {c.max_discount &&
                                ` (Max ₹${c.max_discount})`}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {c.min_order_value
                                ? `Min Order ₹${c.min_order_value}`
                                : 'No minimum order'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleCoupon(c.id, c.is_active)}
                            className="text-xs h-8"
                          >
                            {c.is_active ? (
                              <>
                                <Ban className="h-3.5 w-3.5 mr-1 text-destructive" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                                Activate
                              </>
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteCoupon(c.id, c.code)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: CATEGORIES */}
        {/* ============================================================== */}
        {activeTab === 'categories' && (
          <section className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-6">
            <div>
              <h2 className="text-xl font-semibold font-serif">Manage Spice Categories</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Categories automatically search and pair with matching Flaticon flat-vector icons for the storefront carousel and navigation.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 max-w-lg">
                <div className="relative flex-1">
                  <Input
                    placeholder="New category name (e.g. Cinnamon, Black Pepper, Coriander...)"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                    className="pr-12 text-sm h-11 rounded-xl"
                  />
                  {newCategoryName.trim() && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center p-1 pointer-events-none">
                      {getCategoryVectorIcon(newCategoryName, 'w-full h-full')}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleAddCategory}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 h-11 px-5 rounded-xl font-medium"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>

              {newCategoryName.trim() && (
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground pl-1">
                  <span>Auto-matched vector icon:</span>
                  <span className="font-semibold text-foreground flex items-center gap-1.5 bg-muted/60 px-2 py-0.5 rounded-md">
                    <span className="w-4 h-4 shrink-0 inline-block">{getCategoryVectorIcon(newCategoryName, 'w-full h-full')}</span>
                    {newCategoryName}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-border/70">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active Categories ({categories.length})
              </div>
              <div className="flex flex-wrap gap-2.5">
                {categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-muted/40 border border-border/70 text-foreground flex items-center gap-2.5 shadow-2xs hover:border-primary/40 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-lg bg-background border border-border/50 flex items-center justify-center shrink-0 p-1">
                      {getCategoryVectorIcon(cat.name, 'w-full h-full')}
                    </span>
                    <span className="capitalize font-medium">{cat.name}</span>
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB 5: HERO BANNERS (STANDARD 2.4:1 / 21:9 RATIO) */}
        {/* ============================================================== */}
        {activeTab === 'banners' && (
          <div className="space-y-8">
            {/* Header / Intro Card */}
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-foreground">
                    Storefront Hero Banners
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage multi-banner auto-changing carousel displayed at the top of your homepage.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {banners.filter((b) => b.is_active).length} Active Banners
                  </span>
                </div>
              </div>
            </div>

            {/* Add New Banner Form Card */}
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-6">
              <div className="border-b border-border pb-4">
                <h3 className="text-lg font-bold font-serif text-foreground flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Upload New 2.4:1 Hero Banner
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select an image with standard 2.4:1 or 21:9 dimensions (Recommended: 1920 × 800 px) and configure optional text overlays or click redirects.
                </p>
              </div>

              <form onSubmit={handleCreateBanner} className="space-y-6">
                {/* Image Upload Area & Live Preview aligned side by side on one line */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  {/* Left Column: Drop / Select Area */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between min-h-[22px]">
                      <Label htmlFor="hero-banner-image-input" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-primary" />
                        <span>Banner Graphic File <span className="text-destructive font-bold">* (2.4:1 / 21:9 - 1920×800)</span></span>
                      </Label>
                    </div>

                    <div className="w-full aspect-[2.4/1] border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors bg-muted/20 relative flex flex-col items-center justify-center text-center p-3">
                      <input
                        id="hero-banner-image-input"
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleBannerImageSelect}
                        className="hidden"
                      />
                      <label
                        htmlFor="hero-banner-image-input"
                        className="cursor-pointer inline-flex flex-col items-center justify-center gap-1.5"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-semibold text-primary hover:underline">
                            {bannerImageFile ? 'Click to change 2.4:1 image' : 'Click to select 2.4:1 / 21:9 image'}
                          </span>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            JPEG, PNG, or WebP • Recommended: 1920 × 800 (or 21:9)
                          </p>
                        </div>
                      </label>

                      {/* Status Overlay inside dropzone at the bottom so height never shifts */}
                      {bannerValidationState.isValid && bannerValidationState.width && (
                        <div className="absolute bottom-2 inset-x-2 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium flex items-center justify-between backdrop-blur-sm">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>2.4:1 Verified</span>
                          </span>
                          <span className="font-mono text-[10px] opacity-90">
                            {bannerValidationState.width} × {bannerValidationState.height} ({(bannerValidationState.ratio || 0).toFixed(2)}:1)
                          </span>
                        </div>
                      )}

                      {bannerValidationState.error && (
                        <div className="absolute bottom-2 inset-x-2 px-2.5 py-1 rounded-md bg-destructive/15 border border-destructive/30 text-destructive text-[11px] font-medium flex items-center gap-1.5 backdrop-blur-sm">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{bannerValidationState.error}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Live 2.4:1 Preview Box */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between min-h-[22px]">
                      <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-primary" />
                        <span>Live 2.4:1 Storefront Preview</span>
                      </Label>
                    </div>

                    <div className="w-full aspect-[2.4/1] rounded-xl border border-border bg-stone-900 relative overflow-hidden flex items-center justify-center shadow-inner group">
                      {bannerImagePreview ? (
                        <>
                          <img
                            src={bannerImagePreview}
                            alt="2.4:1 Banner Preview"
                            className="w-full h-full object-cover"
                          />
                          {/* Overlay simulator with buttons (Hidden if Clean Festival / Ad Poster mode is selected) */}
                          {!bannerForm.hide_overlay && (bannerForm.title || bannerForm.subtitle || bannerForm.badge_text || bannerForm.show_buttons) && (
                            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent flex items-center p-4 sm:p-6 text-left pointer-events-none">
                              <div className="max-w-xs space-y-1.5">
                                {bannerForm.badge_text && (
                                  <span className="inline-block px-2 py-0.5 bg-accent/90 text-accent-foreground text-[9px] font-semibold rounded-full">
                                    {bannerForm.badge_text}
                                  </span>
                                )}
                                {bannerForm.title && (
                                  <h4 className="text-sm sm:text-base font-serif font-bold text-white leading-tight whitespace-pre-line">
                                    {bannerForm.title}
                                  </h4>
                                )}
                                {bannerForm.subtitle && (
                                  <p className="text-[10px] text-white/80 line-clamp-3 leading-relaxed whitespace-pre-line">
                                    {bannerForm.subtitle}
                                  </p>
                                )}
                                {bannerForm.show_buttons && (
                                  <div className="flex items-center gap-1.5 pt-1">
                                    <span className="inline-block px-2.5 py-1 bg-primary text-primary-foreground text-[10px] font-medium rounded-md shadow-sm">
                                      {bannerForm.button_text || 'Shop Now'} →
                                    </span>
                                    <span className="inline-block px-2 py-1 bg-white/15 border border-white/30 text-white text-[10px] font-medium rounded-md shadow-sm">
                                      {bannerForm.secondary_button_text || 'Our Story'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-white font-mono backdrop-blur-sm border border-white/20">
                            2.4:1 • {bannerValidationState.width}×{bannerValidationState.height}
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-6 text-muted-foreground space-y-2">
                          <ImageIcon className="w-8 h-8 mx-auto opacity-40" />
                          <p className="text-xs">No image selected</p>
                          <p className="text-[10px] opacity-70">
                            2.4:1 preview will appear here once a valid 2.4:1 / 21:9 file is selected
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Smartphone / Mobile Banner Graphic (Optional) */}
                <div className="pt-4 border-t border-border space-y-2">
                  <div className="flex items-center justify-between min-h-[22px]">
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-primary" />
                      <span>Smartphone / Mobile Banner Graphic</span>
                      <span className="text-[10px] font-normal text-muted-foreground ml-1">
                        (Optional • Recommended for Phones to prevent side-cutting)
                      </span>
                    </Label>
                    {bannerMobileImagePreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveBannerMobileImage}
                        className="h-6 text-[11px] text-destructive hover:bg-destructive/10 px-2"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Remove Mobile Image
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                    {/* Left: Mobile Dropzone */}
                    <div className="w-full aspect-[2.4/1] border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors bg-muted/20 relative flex flex-col items-center justify-center text-center p-3">
                      <input
                        id="hero-banner-mobile-image-input"
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleBannerMobileImageSelect}
                        className="hidden"
                      />
                      <label
                        htmlFor="hero-banner-mobile-image-input"
                        className="cursor-pointer inline-flex flex-col items-center justify-center gap-1.5"
                      >
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-semibold text-primary hover:underline">
                            {bannerMobileImageFile ? 'Click to change mobile image' : 'Select Mobile Banner (4:3, 1:1, or Portrait)'}
                          </span>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Recommended: 1080×1080, 1080×1350, or 800×600 • Zero side-cropping on phones!
                          </p>
                        </div>
                      </label>

                      {bannerMobileImageFile && (
                        <div className="absolute bottom-2 inset-x-2 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium flex items-center justify-between backdrop-blur-sm">
                          <span className="flex items-center gap-1 truncate">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="truncate">{bannerMobileImageFile.name}</span>
                          </span>
                          <span className="text-[10px] opacity-80 shrink-0 font-mono">Mobile Ready</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Mobile Live Preview */}
                    <div className="w-full aspect-[2.4/1] rounded-xl border border-border bg-stone-900 relative overflow-hidden flex items-center justify-center shadow-inner group">
                      {bannerMobileImagePreview ? (
                        <>
                          <img
                            src={bannerMobileImagePreview}
                            alt="Mobile Banner Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-white font-mono backdrop-blur-sm border border-white/20 flex items-center gap-1">
                            <Smartphone className="w-3 h-3 text-white" />
                            <span>Smartphone Preview</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4 text-muted-foreground space-y-1">
                          <Smartphone className="w-5 h-5 mx-auto opacity-40" />
                          <p className="text-xs">No mobile-specific graphic selected</p>
                          <p className="text-[10px] opacity-70">
                            If skipped, smartphones will display the desktop 2.4:1 banner.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Optional Content Overlays & Click URL Configuration */}
                <div className="pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="banner-badge" className="text-xs">
                      Badge / Tag (Optional)
                    </Label>
                    <Input
                      id="banner-badge"
                      placeholder="e.g. Premium Indian Spices"
                      value={bannerForm.badge_text}
                      onChange={(e) => setBannerForm({ ...bannerForm, badge_text: e.target.value })}
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="banner-title" className="text-xs">
                      Banner Heading / Title (Optional)
                    </Label>
                    <Textarea
                      id="banner-title"
                      rows={2}
                      placeholder="e.g. Authentic Flavors, Straight from India"
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                      className="text-xs mt-1 resize-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="banner-subtitle" className="text-xs">
                      Subtitle / Caption (Optional)
                    </Label>
                    <Textarea
                      id="banner-subtitle"
                      rows={2}
                      placeholder="e.g. Experience the rich heritage of Indian cuisine"
                      value={bannerForm.subtitle}
                      onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                      className="text-xs mt-1 resize-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="banner-btn-text" className="text-xs font-semibold text-primary">
                      Primary Button Text
                    </Label>
                    <Input
                      id="banner-btn-text"
                      placeholder="Shop Now"
                      value={bannerForm.button_text}
                      onChange={(e) => setBannerForm({ ...bannerForm, button_text: e.target.value })}
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <BannerLinkSelector
                      id="banner-btn-link"
                      label="Primary Button Destination"
                      value={bannerForm.button_link}
                      onChange={(url, suggestedText) => {
                        if (url === 'none') {
                          setBannerForm((prev) => ({
                            ...prev,
                            button_link: 'none',
                            button_text: '',
                            secondary_button_text: '',
                            secondary_button_link: 'none',
                            show_buttons: false,
                            hide_overlay: true,
                          }));
                        } else {
                          setBannerForm((prev) => ({
                            ...prev,
                            button_link: url,
                            hide_overlay: false,
                            show_buttons: true,
                            button_text:
                              suggestedText &&
                              (!prev.button_text ||
                                prev.button_text === 'Shop Now' ||
                                prev.button_text.startsWith('Shop') ||
                                prev.button_text.startsWith('Buy'))
                                ? suggestedText
                                : prev.button_text || 'Shop Now',
                          }));
                        }
                      }}
                      categories={categories}
                      products={products}
                      defaultSuggestedText="Shop Now"
                    />
                  </div>

                  <div>
                    <Label htmlFor="banner-sec-btn-text" className="text-xs">
                      Secondary Button Text
                    </Label>
                    <Input
                      id="banner-sec-btn-text"
                      placeholder="Our Story"
                      value={bannerForm.secondary_button_text}
                      onChange={(e) => setBannerForm({ ...bannerForm, secondary_button_text: e.target.value })}
                      className="text-xs mt-1"
                    />
                  </div>

                  <div>
                    <BannerLinkSelector
                      id="banner-sec-btn-link"
                      label="Secondary Button Destination"
                      value={bannerForm.secondary_button_link}
                      onChange={(url, suggestedText) => {
                        if (url === 'none') {
                          setBannerForm((prev) => ({
                            ...prev,
                            secondary_button_link: 'none',
                            secondary_button_text: '',
                          }));
                        } else {
                          setBannerForm((prev) => ({
                            ...prev,
                            secondary_button_link: url,
                            secondary_button_text:
                              suggestedText &&
                              (!prev.secondary_button_text || prev.secondary_button_text === 'Our Story')
                                ? suggestedText
                                : prev.secondary_button_text || 'Our Story',
                          }));
                        }
                      }}
                      categories={categories}
                      products={products}
                      defaultSuggestedText="Our Story"
                    />
                  </div>

                  <div>
                    <Label htmlFor="banner-order" className="text-xs">
                      Display Sequence Number
                    </Label>
                    <Input
                      id="banner-order"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={bannerForm.sort_order}
                      onChange={(e) => setBannerForm({ ...bannerForm, sort_order: parseInt(e.target.value) || 1 })}
                      className="text-xs mt-1"
                    />
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border">
                  <div className="flex flex-wrap items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={bannerForm.show_buttons}
                        onChange={(e) => setBannerForm({ ...bannerForm, show_buttons: e.target.checked })}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="text-xs font-semibold text-foreground">
                        Show "Shop Now" & "Our Story" Buttons on Slide
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={bannerForm.is_active}
                        onChange={(e) => setBannerForm({ ...bannerForm, is_active: e.target.checked })}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="text-xs font-medium text-foreground">
                        Active Immediately
                      </span>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    disabled={addingBanner || !bannerImageFile || !bannerValidationState.isValid}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-6 py-2 h-9"
                  >
                    {addingBanner ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Saving 2.4:1 Banner...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add 2.4:1 Banner
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Existing Banners Management List */}
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="text-lg font-bold font-serif text-foreground">
                    Current Homepage Banners ({banners.length})
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Order of auto-rotation in storefront slider. You can reorder, toggle visibility, or delete anytime.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadBanners}
                  disabled={loadingBanners}
                  className="text-xs h-8 gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingBanners ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {banners.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-xs space-y-2">
                  <ImageIcon className="w-8 h-8 mx-auto opacity-30" />
                  <p className="font-semibold">No custom banners added yet</p>
                  <p className="text-[11px] opacity-75">
                    Storefront is currently using the default Singlaji hero banner. Add your first 2.4:1 banner above!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border space-y-4 pt-2">
                  {banners.map((b, idx) => (
                    <div
                      key={b.id}
                      className="pt-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Left: 2.4:1 Thumbnail & Info */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 min-w-0">
                        {/* 2.4:1 Thumbnail Container */}
                        <div className="relative aspect-[2.4/1] w-full sm:w-56 rounded-xl overflow-hidden border border-border bg-stone-900 shrink-0 shadow-sm">
                          <img
                            src={b.image_url}
                            alt={b.title || 'Hero Banner'}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-white font-semibold backdrop-blur-sm">
                            #{idx + 1}
                          </div>
                          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-emerald-500/80 text-[9px] text-white font-mono font-medium backdrop-blur-sm">
                            2.4:1
                          </div>
                        </div>

                        {/* Banner Details */}
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-serif font-bold text-sm text-foreground truncate">
                              {b.title || <span className="text-muted-foreground italic">Graphic Banner (No Text Overlay)</span>}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                b.is_active
                                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {b.is_active ? 'Active' : 'Inactive'}
                            </span>

                            {b.mobile_image_url ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 flex items-center gap-1">
                                <Smartphone className="w-3 h-3" />
                                <span>Mobile Banner Set</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] text-muted-foreground bg-muted flex items-center gap-1">
                                <Monitor className="w-3 h-3" />
                                <span>Desktop Auto-fit</span>
                              </span>
                            )}
                          </div>

                          {b.subtitle && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {b.subtitle}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                            {b.button_link && b.button_link !== 'none' ? (
                              <span className="flex items-center gap-1 font-mono text-primary truncate max-w-xs">
                                <ExternalLink className="h-3 w-3 shrink-0" />
                                {b.button_link}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium italic">
                                <Ban className="w-3 h-3" /> No Link (Display Only)
                              </span>
                            )}
                            {b.badge_text && (
                              <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-medium">
                                Tag: {b.badge_text}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {/* Reorder Arrows */}
                        <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background">
                          <button
                            type="button"
                            onClick={() => handleMoveBanner(b.id, 'up')}
                            disabled={idx === 0}
                            title="Move Up"
                            className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <div className="w-[1px] h-4 bg-border" />
                          <button
                            type="button"
                            onClick={() => handleMoveBanner(b.id, 'down')}
                            disabled={idx === banners.length - 1}
                            title="Move Down"
                            className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Edit Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartEditBanner(b)}
                          className="text-xs h-8 gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                          title="Edit Banner Content & Image"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>

                        {/* Active Toggle Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleBanner(b.id, b.is_active)}
                          className="text-xs h-8"
                        >
                          {b.is_active ? (
                            <>
                              <Ban className="h-3.5 w-3.5 mr-1 text-destructive" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                              Show
                            </>
                          )}
                        </Button>

                        {/* Delete Button */}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteBanner(b.id, b.title)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          title="Delete Banner"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {/* ============================================================== */}
        {/* IN-PAGE LIVE TRACKER PREVIEW MODAL */}
        {/* ============================================================== */}
        {previewOrder &&
          createPortal(
            <div
              className="fixed inset-0 z-[9999] w-screen h-screen min-h-[100dvh] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget) setPreviewOrder(null);
              }}
            >
              <div
                className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto relative z-10"
                onClick={(e) => e.stopPropagation()}
              >
              {/* Modal Header */}
              <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-bold text-lg text-foreground">
                        Order #{previewOrder.id.slice(0, 8).toUpperCase()}
                      </h3>
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                          previewOrder.status === 'cancelled'
                            ? 'bg-destructive/15 text-destructive'
                            : previewOrder.status === 'delivered'
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                            : 'bg-primary/15 text-primary'
                        }`}
                      >
                        {previewOrder.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Live Customer Delivery Tracker Preview
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setPreviewOrder(null)}
                    className="h-8 w-8 rounded-full hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* 5-Step Progress Timeline */}
                <div className="bg-muted/20 p-5 rounded-xl border border-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                    5-Stage Customer Tracking Timeline
                  </h4>
                  <div className="space-y-4">
                    {TRACKING_STEPS.map((step, idx) => {
                      const curStep = getStepIndex(previewOrder.status);
                      const isCompleted = idx <= curStep && previewOrder.status !== 'cancelled';
                      const isCurrent = idx === curStep && previewOrder.status !== 'cancelled';

                      return (
                        <div key={step.key} className="flex items-start gap-3 relative">
                          {/* Timeline connector line */}
                          {idx < TRACKING_STEPS.length - 1 && (
                            <div
                              className={`absolute left-3.5 top-7 bottom-0 w-0.5 -mb-4 ${
                                idx < curStep ? 'bg-primary' : 'bg-border'
                              }`}
                            />
                          )}

                          <div
                            className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors z-10 ${
                              isCurrent
                                ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                                : isCompleted
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground border border-border'
                            }`}
                          >
                            {isCompleted ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-semibold ${
                                isCurrent
                                  ? 'text-primary'
                                  : isCompleted
                                  ? 'text-foreground'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {step.title}
                            </p>
                            <p className="text-xs text-muted-foreground">{step.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Courier & Dispatch Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-border bg-background">
                    <p className="text-xs text-muted-foreground font-semibold uppercase">
                      Courier Partner
                    </p>
                    <p className="text-sm font-bold text-foreground mt-1">
                      {previewOrder.courier_name || 'Singlaji Express / Standard Dispatch'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-background">
                    <p className="text-xs text-muted-foreground font-semibold uppercase">
                      AWB / Tracking ID
                    </p>
                    <p className="font-mono text-sm font-bold text-foreground mt-1">
                      {previewOrder.tracking_number || 'Will be updated upon pickup'}
                    </p>
                  </div>
                </div>

                {/* Customer & Address Details */}
                <div className="p-4 rounded-xl border border-border bg-background space-y-2 text-xs">
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Recipient Name:</span>
                    <span className="font-bold text-foreground">{previewOrder.customer_name}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Contact Phone:</span>
                    <span className="font-mono font-medium text-foreground">
                      {previewOrder.customer_phone}
                    </span>
                  </div>
                  <div className="flex justify-between items-start border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Delivery Address:</span>
                    <span className="font-medium text-right text-foreground max-w-[280px]">
                      {previewOrder.address}, {previewOrder.city}, {previewOrder.state} -{' '}
                      {previewOrder.pincode}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-muted-foreground">Payment (Cash on Delivery):</span>
                    <span className="font-bold text-primary text-sm">
                      ₹{previewOrder.total?.toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Ordered Items */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Items in this package ({previewOrder.order_items?.length || 0})
                  </p>
                  <div className="divide-y divide-border border border-border rounded-xl p-3 bg-muted/10 text-xs">
                    {previewOrder.order_items?.map((item) => (
                      <div key={item.id} className="py-1.5 first:pt-0 flex justify-between">
                        <span>
                          {item.product_name} ×{' '}
                          <span className="font-semibold">{item.quantity}</span>
                        </span>
                        <span className="font-mono font-medium">
                          ₹{(item.price * item.quantity).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer / Actions */}
              <div className="p-4 border-t border-border bg-muted/20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      const url = `https://singlaji.in/orders/${previewOrder.id}`;
                      navigator.clipboard.writeText(url);
                      setCopiedLink(true);
                      toast.success('Customer Tracking Link copied to clipboard!');
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                  >
                    {copiedLink ? (
                      <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 mr-1" />
                    )}
                    {copiedLink ? 'Copied!' : 'Copy Customer Link'}
                  </Button>

                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
                  >
                    <a
                      href={`https://wa.me/91${previewOrder.customer_phone.replace(
                        /\D/g,
                        ''
                      )}?text=${encodeURIComponent(
                        `Hi ${previewOrder.customer_name}, here is your live tracking link for Singlaji Spices Order #${previewOrder.id.slice(
                          0,
                          8
                        ).toUpperCase()}: https://singlaji.in/orders/${previewOrder.id}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                      WhatsApp Link
                    </a>
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => {
                      handleOpenLabelModal(previewOrder);
                    }}
                  >
                    <Printer className="h-3.5 w-3.5" /> Print Label
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    asChild
                  >
                    <Link to={`/orders/${previewOrder.id}`} target="_blank">
                      Open in New Tab <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>

                  <Button
                    size="sm"
                    className="text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => setPreviewOrder(null)}
                  >
                    Close Preview
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* ============================================================== */}
        {/* EDIT SPICE PRODUCT MODAL */}
        {/* ============================================================== */}
        {editingProduct &&
          createPortal(
            <div
              className="fixed inset-0 z-[9999] w-screen h-screen min-h-[100dvh] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget) setEditingProduct(null);
              }}
            >
              <div
                className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto relative z-10"
                onClick={(e) => e.stopPropagation()}
              >
              {/* Modal Header */}
              <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Pencil className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-foreground">
                      Edit Spice Product
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Update details, pricing, stock, and spice image
                    </p>
                  </div>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditingProduct(null)}
                  className="h-8 w-8 rounded-full hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleSaveEditProduct} className="p-6 overflow-y-auto space-y-4">
                <div>
                  <Label className="text-xs font-semibold">Spice Name *</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="e.g. Royal Garam Masala"
                    required
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold">Category *</Label>
                    <select
                      className="w-full h-10 border rounded-md px-3 bg-background text-sm border-input mt-1"
                      value={editForm.category_id}
                      onChange={(e) =>
                        setEditForm({ ...editForm, category_id: e.target.value })
                      }
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Stock Quantity</Label>
                    <Input
                      type="number"
                      value={editForm.stock}
                      onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                      placeholder="50"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Pricing & Weight Pack Sizes */}
                <WeightVariantsEditor
                  price={editForm.price}
                  onPriceChange={(price) => setEditForm((prev) => ({ ...prev, price }))}
                  variants={editForm.variants}
                  onVariantsChange={(variants) => setEditForm((prev) => ({ ...prev, variants }))}
                />

                <div>
                  <Label className="text-xs font-semibold">Description</Label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    placeholder="Describe aroma, purity, recipe usage, and specialty..."
                    rows={3}
                    className="mt-1"
                  />
                </div>

                {/* Image Upload & Replacement */}
                <div className="space-y-2 border-t border-border pt-4">
                  <Label className="text-xs font-semibold block">Spice Product Image</Label>

                  <div className="flex items-center gap-4">
                    {editForm.previewUrl || editForm.currentImageUrl ? (
                      <div className="relative group shrink-0">
                        <img
                          src={editForm.previewUrl || editForm.currentImageUrl || ''}
                          alt="Product preview"
                          className="h-20 w-20 rounded-xl object-contain bg-neutral-50 dark:bg-neutral-900 border border-border shadow-sm p-1"
                        />
                        {editForm.previewUrl && (
                          <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow">
                            New
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground text-xs font-medium shrink-0">
                        No image
                      </div>
                    )}

                    <div className="flex-1 space-y-1.5">
                      <Input
                        id="edit-product-image-file"
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageChange}
                        className="text-xs"
                      />
                      {editForm.previewUrl ? (
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="text-primary font-medium truncate max-w-[220px]">
                            {editForm.imageFile?.name} (
                            {Math.round((editForm.imageFile?.size || 0) / 1024)} KB)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditForm((prev) => ({
                                ...prev,
                                imageFile: null,
                                previewUrl: null,
                              }));
                              const fileInput = document.getElementById(
                                'edit-product-image-file'
                              ) as HTMLInputElement;
                              if (fileInput) fileInput.value = '';
                            }}
                            className="text-destructive hover:underline font-medium shrink-0"
                          >
                            Revert
                          </button>
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">
                          Select a new photo to replace current image.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer / Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingProduct(null)}
                    disabled={savingEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingEdit}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {savingEdit ? 'Saving Changes...' : 'Save Product Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* ============================================================== */}
        {/* EDIT HERO BANNER MODAL (STANDARD 2.4:1 / 21:9 VALIDATION) */}
        {/* ============================================================== */}
        {editingBanner &&
          createPortal(
            <div
              className="fixed inset-0 z-[9999] w-screen h-screen min-h-[100dvh] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget && !savingBannerEdit) setEditingBanner(null);
              }}
            >
              <div
                className="bg-card w-full max-w-xl rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col my-auto relative z-10"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <Sliders className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-lg text-foreground">
                        Edit Hero Banner
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Modify banner content, CTA buttons, sequence, or replace 2.4:1 image
                      </p>
                    </div>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditingBanner(null)}
                    disabled={savingBannerEdit}
                    className="h-8 w-8 rounded-full hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSaveBannerEdit} className="p-6 overflow-y-auto space-y-5">
                  {/* 2.4:1 Image Preview & Replacement */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>2.4:1 Banner Image</span>
                      <span className="text-[10px] text-primary font-mono">Standard 2.4:1 / 21:9 Required</span>
                    </Label>
                    <div className="relative aspect-[2.4/1] w-full rounded-xl overflow-hidden border border-border bg-stone-900 shadow-inner group">
                      <img
                        src={editBannerForm.new_image_preview || editBannerForm.current_image_url}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-3.5">
                        <label
                          htmlFor="edit-hero-banner-image"
                          className="cursor-pointer px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white text-xs font-medium backdrop-blur-md border border-white/20 flex items-center gap-1.5 transition-all shadow-md"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {editBannerForm.new_image_file ? 'Change Selected Image' : 'Replace Image (2.4:1 / 21:9)'}
                        </label>
                        <input
                          id="edit-hero-banner-image"
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          onChange={handleEditBannerImageSelect}
                          className="hidden"
                        />
                      </div>
                    </div>
                    {editBannerForm.new_image_file && (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        New 2.4:1 Image selected: {editBannerForm.new_image_file.name}
                      </div>
                    )}
                  </div>

                  {/* Smartphone / Mobile Banner Graphic in Edit Modal */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-primary" />
                        <span>Smartphone / Mobile Banner Graphic</span>
                        <span className="text-[10px] font-normal text-muted-foreground ml-1">(Optional)</span>
                      </Label>
                      {(editBannerForm.new_mobile_image_preview || (editBannerForm.current_mobile_image_url && !editBannerForm.remove_mobile_image)) && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditBannerForm((prev) => ({
                              ...prev,
                              new_mobile_image_file: null,
                              new_mobile_image_preview: null,
                              remove_mobile_image: true,
                            }));
                          }}
                          className="text-[11px] text-destructive hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Remove Mobile Image
                        </button>
                      )}
                    </div>

                    <div className="relative aspect-[2.4/1] w-full rounded-xl overflow-hidden border border-border bg-stone-900 shadow-inner group flex items-center justify-center">
                      {(editBannerForm.new_mobile_image_preview || (editBannerForm.current_mobile_image_url && !editBannerForm.remove_mobile_image)) ? (
                        <>
                          <img
                            src={editBannerForm.new_mobile_image_preview || editBannerForm.current_mobile_image_url}
                            alt="Mobile Banner Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-white font-mono backdrop-blur-sm border border-white/20 flex items-center gap-1">
                            <Smartphone className="w-3 h-3 text-white" />
                            <span>Smartphone Banner</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4 text-muted-foreground space-y-1">
                          <Smartphone className="w-5 h-5 mx-auto opacity-40" />
                          <p className="text-xs">No mobile-specific graphic</p>
                          <p className="text-[10px] opacity-70">
                            Smartphones will automatically display the desktop banner.
                          </p>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-3.5">
                        <label
                          htmlFor="edit-hero-banner-mobile-image"
                          className="cursor-pointer px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white text-xs font-medium backdrop-blur-md border border-white/20 flex items-center gap-1.5 transition-all shadow-md"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {editBannerForm.new_mobile_image_file
                            ? 'Change Selected Mobile Image'
                            : (editBannerForm.current_mobile_image_url && !editBannerForm.remove_mobile_image)
                            ? 'Replace Mobile Image'
                            : 'Upload Mobile Image (4:3 / 1:1)'}
                        </label>
                        <input
                          id="edit-hero-banner-mobile-image"
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          onChange={handleEditBannerMobileImageSelect}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {editBannerForm.new_mobile_image_file && (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        New Mobile Image selected: {editBannerForm.new_mobile_image_file.name}
                      </div>
                    )}
                    {editBannerForm.remove_mobile_image && (
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                        Mobile graphic will be removed on save (desktop banner will be used on phones).
                      </div>
                    )}
                  </div>

                  {/* Text Overlays */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-banner-badge" className="text-xs">
                        Badge / Tag (Optional)
                      </Label>
                      <Input
                        id="edit-banner-badge"
                        placeholder="e.g. Premium Indian Spices"
                        value={editBannerForm.badge_text}
                        onChange={(e) =>
                          setEditBannerForm({ ...editBannerForm, badge_text: e.target.value })
                        }
                        className="text-xs mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-banner-order" className="text-xs">
                        Display Order Number
                      </Label>
                      <Input
                        id="edit-banner-order"
                        type="number"
                        min="1"
                        value={editBannerForm.sort_order}
                        onChange={(e) =>
                          setEditBannerForm({
                            ...editBannerForm,
                            sort_order: parseInt(e.target.value) || 1,
                          })
                        }
                        className="text-xs mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-banner-title" className="text-xs">
                      Banner Heading / Title (Optional)
                    </Label>
                    <Textarea
                      id="edit-banner-title"
                      rows={2}
                      placeholder="e.g. Authentic Flavors, Straight from India"
                      value={editBannerForm.title}
                      onChange={(e) =>
                        setEditBannerForm({ ...editBannerForm, title: e.target.value })
                      }
                      className="text-xs mt-1 resize-none font-sans"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-banner-subtitle" className="text-xs">
                      Subtitle / Caption (Optional)
                    </Label>
                    <Textarea
                      id="edit-banner-subtitle"
                      rows={2}
                      placeholder="e.g. Experience the rich heritage of Indian cuisine"
                      value={editBannerForm.subtitle}
                      onChange={(e) =>
                        setEditBannerForm({ ...editBannerForm, subtitle: e.target.value })
                      }
                      className="text-xs mt-1 resize-none font-sans"
                    />
                  </div>

                  {/* Button Controls */}
                  <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Primary Button Text</Label>
                        <Input
                          value={editBannerForm.button_text}
                          onChange={(e) =>
                            setEditBannerForm({ ...editBannerForm, button_text: e.target.value })
                          }
                          className="text-xs mt-0.5"
                        />
                      </div>
                      <div>
                        <BannerLinkSelector
                          id="edit-banner-primary-link"
                          label="Primary Button Destination"
                          value={editBannerForm.button_link}
                          onChange={(url, suggestedText) => {
                            if (url === 'none') {
                              setEditBannerForm((prev) => ({
                                ...prev,
                                button_link: 'none',
                                button_text: '',
                                secondary_button_text: '',
                                secondary_button_link: 'none',
                                show_buttons: false,
                                hide_overlay: true,
                              }));
                            } else {
                              setEditBannerForm((prev) => ({
                                ...prev,
                                button_link: url,
                                hide_overlay: false,
                                show_buttons: true,
                                button_text:
                                  suggestedText &&
                                  (!prev.button_text ||
                                    prev.button_text === 'Shop Now' ||
                                    prev.button_text.startsWith('Shop') ||
                                    prev.button_text.startsWith('Buy'))
                                    ? suggestedText
                                    : prev.button_text || 'Shop Now',
                              }));
                            }
                          }}
                          categories={categories}
                          products={products}
                          defaultSuggestedText="Shop Now"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Secondary Button Text</Label>
                        <Input
                          value={editBannerForm.secondary_button_text}
                          onChange={(e) =>
                            setEditBannerForm({
                              ...editBannerForm,
                              secondary_button_text: e.target.value,
                            })
                          }
                          className="text-xs mt-0.5"
                        />
                      </div>
                      <div>
                        <BannerLinkSelector
                          id="edit-banner-secondary-link"
                          label="Secondary Button Destination"
                          value={editBannerForm.secondary_button_link}
                          onChange={(url, suggestedText) => {
                            if (url === 'none') {
                              setEditBannerForm((prev) => ({
                                ...prev,
                                secondary_button_link: 'none',
                                secondary_button_text: '',
                              }));
                            } else {
                              setEditBannerForm((prev) => ({
                                ...prev,
                                secondary_button_link: url,
                                secondary_button_text:
                                  suggestedText &&
                                  (!prev.secondary_button_text || prev.secondary_button_text === 'Our Story')
                                    ? suggestedText
                                    : prev.secondary_button_text || 'Our Story',
                              }));
                            }
                          }}
                          categories={categories}
                          products={products}
                          defaultSuggestedText="Our Story"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/50">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editBannerForm.show_buttons}
                          onChange={(e) =>
                            setEditBannerForm({ ...editBannerForm, show_buttons: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-xs font-semibold text-foreground">
                          Show "Shop Now" & "Our Story" Buttons on Slide
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editBannerForm.is_active}
                        onChange={(e) =>
                          setEditBannerForm({ ...editBannerForm, is_active: e.target.checked })
                        }
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="text-xs font-medium text-foreground">
                        Active on Storefront Homepage
                      </span>
                    </label>
                  </div>

                  {/* Modal Footer / Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingBanner(null)}
                      disabled={savingBannerEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={savingBannerEdit}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {savingBannerEdit ? 'Saving Changes...' : 'Save Banner Changes'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )}
      </div>
    </Layout>
  );
}
