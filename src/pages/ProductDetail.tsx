import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, ShoppingCart, Truck, Shield, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/product/ProductCard';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { useSEO } from '@/hooks/useSEO';
import { parseWeightVariants, WeightVariant } from '@/lib/weightVariants';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, error } = useProduct(slug!);
  const { data: relatedProducts } = useProducts(product?.category?.slug);
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  const variants = product ? parseWeightVariants(product.weight, product.price) : [];
  const [selectedVariant, setSelectedVariant] = useState<WeightVariant | null>(null);

  useEffect(() => {
    if (variants.length > 0) {
      // Re-sync current selected weight with new updated price from database
      setSelectedVariant((prev) => {
        if (prev) {
          const match = variants.find((v) => v.weight.toLowerCase() === prev.weight.toLowerCase());
          if (match) return match;
        }
        return variants[0];
      });
    } else {
      setSelectedVariant(null);
    }
  }, [product?.id, product?.weight, product?.price]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [slug]);

  const activePrice = selectedVariant ? selectedVariant.price : product?.price || 0;
  const selectedWeightLabel = selectedVariant ? selectedVariant.weight : product?.weight;

  useSEO({
    title: product ? `${product.name} (₹${Math.round(activePrice)})` : undefined,
    description: product?.description
      ? product.description.slice(0, 160)
      : product?.name
      ? `Order pure ${product.name} from Singlaji Spices Abohar. 100% authentic, rich aroma, and Cash on Delivery across India.`
      : undefined,
    image: product?.image_url,
    type: 'product',
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-32 mb-8" />
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="aspect-square bg-muted rounded-2xl" />
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-10 bg-muted rounded w-3/4" />
                <div className="h-8 bg-muted rounded w-32" />
                <div className="h-24 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-serif font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/products">Browse Products</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const discount =
    product.compare_at_price && product.compare_at_price > activePrice
      ? Math.round(
          ((product.compare_at_price - activePrice) /
            product.compare_at_price) *
            100
        )
      : 0;

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity, selectedWeightLabel || undefined, activePrice);
    toast.success(
      `Added ${quantity} × ${product.name}${
        selectedWeightLabel ? ` (${selectedWeightLabel})` : ''
      } to cart`
    );
  };

  const related = relatedProducts?.filter((p) => p.id !== product.id).slice(0, 4) || [];

  return (
    <Layout>
      <div className="relative min-h-[85vh] overflow-hidden">
        {/* Ambient Mobile Background Image */}
        <div
          className="block sm:hidden absolute inset-0 z-0 pointer-events-none bg-cover bg-top bg-no-repeat opacity-20"
          style={{ backgroundImage: `url('/product_page_mobile.png')` }}
        />
        {/* Ambient Laptop / Desktop Horizontal Background Image */}
        <div
          className="hidden sm:block absolute inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url('/product_page_back.png')` }}
        />
        {/* Soft bottom fade to seamlessly blend into background */}
        <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none bg-gradient-to-t from-background via-background/50 to-transparent z-0" />

        <div className="container mx-auto px-4 py-4 sm:py-8 md:py-12 relative z-10">
          {/* Breadcrumb */}
          <nav className="mb-4 sm:mb-8">
            <Link
              to="/products"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
          </nav>

          {/* Product Details */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-14 xl:gap-16 items-start">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center lg:justify-center"
            >
              <div className="w-full max-w-[250px] sm:max-w-[320px] lg:max-w-[370px] rounded-2xl overflow-hidden shadow-elevated border border-border/40 bg-card">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-auto max-h-[330px] sm:max-h-[420px] lg:max-h-[500px] block object-cover transition-transform duration-500 hover:scale-[1.02]"
                  />
                ) : (
                  <div className="aspect-square w-full flex items-center justify-center bg-secondary">
                    <span className="text-8xl font-serif text-muted-foreground/30">
                      {product.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col"
          >
            {/* Category */}
            {product.category && (
              <Link
                to={`/products?category=${product.category.slug}`}
                className="text-sm text-primary uppercase tracking-wider hover:underline mb-2"
              >
                {product.category.name}
              </Link>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-3">
              {product.name}
            </h1>

            {/* Weight / Pack Size Variants */}
            {variants.length > 0 ? (
              <div className="mb-6 space-y-2.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Select Pack Size / Quantity
                  </label>
                  {selectedVariant && (
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                      Selected: {selectedVariant.weight}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {variants.map((v) => {
                    const isSelected = selectedVariant?.weight === v.weight;
                    return (
                      <button
                        key={v.weight}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all border ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20'
                            : 'bg-card text-foreground border-border hover:border-primary/40 hover:bg-muted/30'
                        }`}
                      >
                        <span>{v.weight}</span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                            isSelected
                              ? 'bg-white/20 text-primary-foreground'
                              : 'bg-muted text-muted-foreground group-hover:text-foreground'
                          }`}
                        >
                          ₹{Math.round(v.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : product.weight ? (
              <p className="text-muted-foreground mb-4 font-medium">{product.weight}</p>
            ) : null}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-primary">
                ₹{activePrice.toFixed(0)}
              </span>
              {selectedWeightLabel && (
                <span className="text-sm font-medium text-muted-foreground">
                  ({selectedWeightLabel})
                </span>
              )}
              {product.compare_at_price && product.compare_at_price > activePrice && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    ₹{product.compare_at_price.toFixed(0)}
                  </span>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-sm font-medium rounded">
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {product.stock === 0 ? (
                <span className="text-destructive font-medium">Out of Stock</span>
              ) : product.stock <= 5 ? (
                <span className="text-accent font-medium">
                  Only {product.stock} left in stock!
                </span>
              ) : (
                <span className="text-cardamom font-medium">In Stock</span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">About this product</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Ingredients */}
            {product.ingredients && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Ingredients</h3>
                <p className="text-muted-foreground">{product.ingredients}</p>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex items-center border border-border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-muted transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-6 text-lg font-medium min-w-[4rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 hover:bg-muted transition-colors"
                  disabled={quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button
                onClick={handleAddToCart}
                size="lg"
                className="flex-1 sm:flex-none sm:min-w-[200px]"
                disabled={product.stock === 0}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Free Delivery</p>
                  <p className="text-xs text-muted-foreground">On orders ₹500+</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Fresh Packed</p>
                  <p className="text-xs text-muted-foreground">Quality sealed</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">COD Available</p>
                  <p className="text-xs text-muted-foreground">Pay on delivery</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-16 md:mt-24">
            <h2 className="text-2xl md:text-3xl font-serif font-bold mb-8">
              You May Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </section>
        )}
        </div>
      </div>
    </Layout>
  );
}
