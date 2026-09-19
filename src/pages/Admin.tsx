import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
  const [addingProduct, setAddingProduct] = useState(false);
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
    }
  }, [isAdmin]);

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
