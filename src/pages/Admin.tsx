import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Ticket,
  Percent,
  Check,
  Ban,
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
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Coupon } from '@/types/coupon';
import {
  fetchCoupons,
  createCoupon,
  toggleCouponActive,
  deleteCoupon,
} from '@/lib/couponService';
import { compressImage } from '@/lib/imageCompressor';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  category_id?: string;
  description?: string;
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

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories' | 'coupons'>('orders');

  // Categories & Products state
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [addingProduct, setAddingProduct] = useState(false);
  const [addingCoupon, setAddingCoupon] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

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
  }>({
    name: '',
    price: '',
    stock: '',
    category_id: '',
    description: '',
    image: null,
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
  }>({
    name: '',
    price: '',
    stock: '',
    category_id: '',
    description: '',
    imageFile: null,
    currentImageUrl: null,
    previewUrl: null,
  });

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
    fetchOrders();

    // SUPABASE REALTIME SUBSCRIPTION FOR LIVE ORDERS
    const channel = supabase
      .channel('admin_orders_realtime')
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

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
        .select('id, name, price, stock, image_url, category_id, description')
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
    } catch (err: any) {
      console.error('Error adding category:', err);
      toast.error(err.message || 'Failed to add category');
    }
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
        // High-quality automatic image compression (silent background optimization)
        const comp = await compressImage(productForm.image);
        const imageToUpload = comp.file;

        const fileName = `${Date.now()}.webp`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, imageToUpload, {
            contentType: 'image/webp',
            upsert: false,
          });

        if (!uploadError) {
          const { data } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);
          image_url = data.publicUrl;
        }
      }

      const slug =
        productForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') +
        '-' +
        Date.now();

      const { error } = await supabase.from('products').insert({
        name: productForm.name,
        slug,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock) || 0,
        category_id: productForm.category_id,
        description: productForm.description,
        image_url,
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
      });
      fetchProducts();
    } catch (err: any) {
      console.error('Failed to add product:', err);
      toast.error(err.message || 'Failed to add product');
    } finally {
      setAddingProduct(false);
    }
  };

  // Helper to delete old product images from Supabase storage
  const deleteOldProductImage = async (url: string | null) => {
    if (!url) return;
    try {
      let path: string | null = null;
      if (url.includes('/products/')) {
        const parts = url.split('/products/');
        if (parts.length > 1) {
          path = parts[parts.length - 1].split('?')[0];
        }
      }
      if (path) {
        await supabase.storage.from('products').remove([path]);
        console.log('Purged old product image from storage:', path);
      }
    } catch (e) {
      console.warn('Storage delete warning:', e);
    }
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setEditForm({
      name: prod.name,
      price: prod.price.toString(),
      stock: (prod.stock ?? 0).toString(),
      category_id: prod.category_id || '',
      description: prod.description || '',
      imageFile: null,
      currentImageUrl: prod.image_url,
      previewUrl: null,
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

      // 1. If a new image was chosen, compress, upload to storage and delete old file
      if (editForm.imageFile) {
        // High-quality automatic image compression (silent background optimization)
        const comp = await compressImage(editForm.imageFile);
        const imageToUpload = comp.file;

        const fileName = `${Date.now()}_edit.webp`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, imageToUpload, {
            contentType: 'image/webp',
            upsert: false,
          });

        if (uploadError) {
          console.warn('Storage image upload error:', uploadError);
          toast.error('Image upload failed, updating text details');
        } else {
          const { data } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);
          finalImageUrl = data.publicUrl;

          // Delete previous image file from database storage
          if (editingProduct.image_url) {
            await deleteOldProductImage(editingProduct.image_url);
          }
        }
      }

      // 2. Update product in database
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: editForm.name.trim(),
          price: parseFloat(editForm.price),
          stock: parseInt(editForm.stock) || 0,
          category_id: editForm.category_id || null,
          description: editForm.description.trim() || null,
          image_url: finalImageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingProduct.id);

      if (updateError) throw updateError;

      toast.success(`Spice "${editForm.name}" updated successfully!`);
      setEditingProduct(null);
      fetchProducts();
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
    } catch (err) {
      toast.error('Failed to delete coupon');
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
                              Courier Partner & AWB
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
                    <Label>Price (₹) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) =>
                        setProductForm({ ...productForm, price: e.target.value })
                      }
                      placeholder="150"
                      required
                    />
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
                          ₹{prod.price} | Stock: {prod.stock}
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
          <section className="bg-card rounded-xl p-6 shadow-card border border-border space-y-6">
            <h2 className="text-xl font-semibold font-serif">Manage Spice Categories</h2>
            <div className="flex gap-3 max-w-md">
              <Input
                placeholder="New category name (e.g. Whole Spices)"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
              />
              <Button
                onClick={handleAddCategory}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {categories.map((cat) => (
                <span
                  key={cat.id}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-muted border border-border text-foreground"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          </section>
        )}
        {/* ============================================================== */}
        {/* IN-PAGE LIVE TRACKER PREVIEW MODAL */}
        {/* ============================================================== */}
        {previewOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
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
          </div>
        )}

        {/* ============================================================== */}
        {/* EDIT SPICE PRODUCT MODAL */}
        {/* ============================================================== */}
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
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
                    <Label className="text-xs font-semibold">Price (₹) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      placeholder="150"
                      required
                      className="mt-1"
                    />
                  </div>
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
                          className="h-16 w-16 rounded-xl object-cover border border-border shadow-sm"
                        />
                        {editForm.previewUrl && (
                          <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow">
                            New
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground text-xs font-medium shrink-0">
                        No image
                      </div>
                    )}

                    <div className="flex-1 space-y-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageChange}
                        className="text-xs"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Select a new file to replace the current image. The old image will be permanently purged from database storage.
                      </p>
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
          </div>
        )}
      </div>
    </Layout>
  );
}
