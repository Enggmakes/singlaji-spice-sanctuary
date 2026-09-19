import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Ticket, Percent, Check, Ban } from 'lucide-react';
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
}

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const [addingProduct, setAddingProduct] = useState(false);
  const [addingCoupon, setAddingCoupon] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

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
        navigate('/login');
      } else if (!isAdmin) {
        toast.error('Access denied. Admin privileges required.');
        navigate('/');
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchCategories();
      fetchProducts();
      loadCoupons();
    }
  }, [isAdmin]);

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
        .select('id, name, price, stock, image_url')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setProducts(data);
    } catch (err: any) {
      console.error('Error fetching products:', err);
    }
  };

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
      console.error('ADD CATEGORY ERROR:', err);
      toast.error(err.message || 'Failed to add category');
    }
  };

  const uploadProductImage = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleAddProduct = async () => {
    if (!productForm.name.trim() || !productForm.price) {
      toast.error('Name & price required');
      return;
    }

    setAddingProduct(true);
    try {
      let imageUrl: string | null = null;
      if (productForm.image) {
        try {
          imageUrl = await uploadProductImage(productForm.image);
        } catch (imgErr: any) {
          console.warn('Image upload error:', imgErr);
          toast.error('Image upload failed, continuing with product creation');
        }
      }

      const slug =
        productForm.name.trim().toLowerCase().replace(/\s+/g, '-') +
        '-' +
        Date.now();

      const { error } = await supabase.from('products').insert({
        name: productForm.name.trim(),
        slug,
        price: Number(productForm.price),
        stock: Number(productForm.stock) || 0,
        category_id: productForm.category_id || null,
        description: productForm.description.trim() || null,
        image_url: imageUrl,
        is_active: true,
      });

      if (error) throw error;

      toast.success('Product added');
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

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;

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
      toast.success(
        !currentStatus ? 'Coupon activated' : 'Coupon deactivated'
      );
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
        <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">
          Checking admin authorization…
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 space-y-12 max-w-5xl">
        {/* Manage Categories */}
        <section className="bg-card rounded-xl p-6 shadow-card border border-border">
          <h2 className="text-xl font-semibold mb-4 font-serif">
            Manage Categories
          </h2>
          <div className="flex gap-3 max-w-md">
            <Input
              placeholder="New category"
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
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span
                key={cat.id}
                className="px-3 py-1 text-sm rounded-full bg-muted border border-border/50 text-foreground"
              >
                {cat.name}
              </span>
            ))}
          </div>
        </section>

        {/* Manage Discount Coupons (NEW) */}
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
                Create promotional discount codes for your customers (Cart & Checkout)
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
                className="w-full h-10 border rounded-lg px-3 py-2 bg-background text-sm text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring"
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
                placeholder={
                  couponForm.discount_type === 'percentage' ? 'e.g. 15 (for 15%)' : 'e.g. 50 (for ₹50)'
                }
                value={couponForm.discount_value}
                onChange={(e) =>
                  setCouponForm((prev) => ({
                    ...prev,
                    discount_value: e.target.value,
                  }))
                }
                required
                min="1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold mb-1 block">
                Min. Order Value (₹)
              </Label>
              <Input
                type="number"
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
                placeholder="Optional (e.g. 150)"
                value={couponForm.max_discount}
                disabled={couponForm.discount_type === 'flat'}
                onChange={(e) =>
                  setCouponForm((prev) => ({
                    ...prev,
                    max_discount: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label className="text-xs font-semibold mb-1 block">
                Offer Description
              </Label>
              <Input
                placeholder="e.g. 20% OFF on all spices"
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
                {addingCoupon ? 'Creating…' : 'Create Coupon'}
              </Button>
            </div>
          </form>

          {/* Existing Coupons List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Active Coupons ({coupons.length})
            </h3>
            {coupons.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No coupons created yet. Use the form above to add your first promo code.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {coupons.map((c) => (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      c.is_active
                        ? 'bg-card border-border shadow-sm'
                        : 'bg-muted/40 border-dashed border-muted text-muted-foreground opacity-60'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm tracking-wider px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          {c.code}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                          {c.discount_type === 'percentage'
                            ? `${c.discount_value}% OFF`
                            : `₹${c.discount_value} OFF`}
                        </span>
                        {!c.is_active && (
                          <span className="text-[10px] uppercase font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {c.description || `${c.discount_value} discount`}
                        {c.min_order_value ? ` • Min order: ₹${c.min_order_value}` : ''}
                        {c.max_discount ? ` • Up to ₹${c.max_discount}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title={c.is_active ? 'Deactivate' : 'Activate'}
                        onClick={() => handleToggleCoupon(c.id, c.is_active)}
                      >
                        {c.is_active ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Ban className="h-4 w-4 text-amber-600" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Delete Coupon"
                        onClick={() => handleDeleteCoupon(c.id, c.code)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Add Product */}
        <section className="bg-card rounded-xl p-6 shadow-card border border-border">
          <h2 className="text-xl font-semibold mb-6 font-serif">Add Product</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Input
                placeholder="Product name"
                value={productForm.name}
                onChange={(e) =>
                  setProductForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Input
                placeholder="Price"
                type="number"
                value={productForm.price}
                onChange={(e) =>
                  setProductForm((prev) => ({ ...prev, price: e.target.value }))
                }
              />
            </div>
            <div>
              <Input
                placeholder="Stock"
                type="number"
                value={productForm.stock}
                onChange={(e) =>
                  setProductForm((prev) => ({ ...prev, stock: e.target.value }))
                }
              />
            </div>
            <div>
              <select
                className="w-full h-10 border rounded-lg px-3 py-2 bg-background text-sm text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring"
                value={productForm.category_id}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    category_id: e.target.value,
                  }))
                }
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Textarea
                placeholder="Description"
                className="w-full"
                rows={4}
                value={productForm.description}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setProductForm((prev) => ({ ...prev, image: file }));
                }}
              />
            </div>
          </div>
          <Button
            className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleAddProduct}
            disabled={addingProduct}
          >
            {addingProduct ? 'Adding…' : 'Add Product'}
          </Button>
        </section>

        {/* All Products */}
        <section className="bg-card rounded-xl p-6 shadow-card border border-border">
          <h2 className="text-xl font-semibold mb-6 font-serif">All Products</h2>
          {products.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No products found in the database.
            </p>
          ) : (
            <div className="space-y-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border border-border rounded-lg p-4 bg-background/50"
                >
                  <div className="flex items-center gap-4">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-16 h-16 object-cover rounded-lg border border-border"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{p.price} • Stock: {p.stock}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteProduct(p.id)}
                    title="Delete product"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
