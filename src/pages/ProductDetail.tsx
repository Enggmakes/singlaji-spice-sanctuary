import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, ShoppingCart, Truck, Shield, Package, ChevronRight } from 'lucide-react';
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
  const { addItem, items, updateQuantity, totalItems, subtotal } = useCart();
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

  const currentCartItem = items.find(
    (item) =>
      item.product.id === product?.id &&
      (item.selectedWeight || '') === (selectedWeightLabel || '')
  );
  const cartQuantity = currentCartItem?.quantity || 0;

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity, selectedWeightLabel || undefined, activePrice);
  };

  const handleQuickAdd = () => {
    if (!product) return;
    addItem(product, 1, selectedWeightLabel || undefined, activePrice);
  };

  const handleIncrease = () => {
    if (!product) return;
    if (cartQuantity >= product.stock) {
      toast.error(`Only ${product.stock} available in stock`);
      return;
    }
    updateQuantity(product.id, cartQuantity + 1, selectedWeightLabel || undefined);
  };

  const handleDecrease = () => {
    if (!product) return;
    updateQuantity(product.id, cartQuantity - 1, selectedWeightLabel || undefined);
  };

  const related = relatedProducts?.filter((p) => p.id !== product.id).slice(0, 4) || [];

  return (
    <Layout whatsappClassName={totalItems > 0 ? "bottom-36 sm:bottom-6" : "bottom-24 sm:bottom-6"}>
      {/* 1. Main Product Section with Proportional Ambient Framing Background */}
      <section className="relative overflow-hidden pb-8 sm:pb-12">
        {/* Ambient Mobile Background Image (9:16 vertical ratio, 12% subtle opacity) */}
        <div
          className="block sm:hidden absolute inset-0 w-full pointer-events-none bg-no-repeat bg-top z-0"
          style={{
            backgroundImage: `url('/product_page_mobile.png')`,
            backgroundSize: '100% auto',
            opacity: 0.12,
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)',
          }}
        />
        {/* Ambient Laptop / Desktop Horizontal Background Image (16:9 ratio, 12% subtle opacity) */}
        <div
          className="hidden sm:block absolute inset-0 left-1/2 -translate-x-1/2 w-full max-w-[1672px] pointer-events-none bg-no-repeat bg-top z-0"
          style={{
            backgroundImage: `url('/product_page_back.png')`,
            backgroundSize: '100% auto',
            opacity: 0.12,
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%)',
          }}
        />

        <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8 relative z-10">
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

            {/* Quantity & Add to Cart (Desktop only: hidden on mobile where Blinkit sticky bottom bar handles it) */}
            <div className="hidden md:flex flex-col sm:flex-row gap-4 mb-8">
              {cartQuantity > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-primary text-primary-foreground rounded-xl shadow-sm border border-primary/20 overflow-hidden font-bold">
                    <button
                      type="button"
                      onClick={handleDecrease}
                      className="p-3 px-4 hover:bg-black/10 active:scale-95 transition-all flex items-center justify-center"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-4 text-base min-w-[3rem] text-center font-bold">
                      {cartQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={handleIncrease}
                      disabled={cartQuantity >= product.stock}
                      className="p-3 px-4 hover:bg-black/10 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    ✓ In your cart
                  </span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
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
              )}
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
      </div>
    </section>

    {/* 2. Related Products / Recommendations Section */}
    {related.length > 0 && (
      <section className="py-8 sm:py-12 pb-36 sm:pb-16 border-t border-border/15">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-serif font-bold mb-8">
            You May Also Like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      </section>
    )}

    {/* Blinkit-Style Sticky Bottom Action Bar (Fixed across mobile viewport) */}
    {product && (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.12)] pt-2 pb-3 px-4 sm:px-6 md:hidden">
        {/* Floating Blinkit 'View Cart' Pill above the bottom bar */}
        {totalItems > 0 && (
          <div className="container mx-auto max-w-lg mb-2">
            <Link
              to="/cart"
              className="w-full flex items-center justify-between bg-primary hover:bg-primary/95 text-primary-foreground px-3.5 py-2.5 rounded-xl shadow-lg active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-black/15 flex items-center justify-center shrink-0">
                  <ShoppingCart className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold leading-tight">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </span>
                  <span className="text-xs font-semibold leading-tight text-primary-foreground/90">
                    ₹{Math.round(subtotal)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-0.5 text-sm font-bold tracking-wide">
                <span>View Cart</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
          </div>
        )}

        <div className="container mx-auto flex items-center justify-between gap-3 max-w-lg">
          {/* Left: Pack Size, Price & Taxes */}
          <div className="flex flex-col min-w-0 pr-2">
            {selectedWeightLabel && (
              <span className="text-xs font-semibold text-muted-foreground truncate">
                {selectedWeightLabel}
              </span>
            )}
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-foreground">
                ₹{activePrice.toFixed(0)}
              </span>
              {product.compare_at_price && product.compare_at_price > activePrice && (
                <span className="text-xs text-muted-foreground line-through">
                  ₹{product.compare_at_price.toFixed(0)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground tracking-tight">
              Inclusive of all taxes
            </span>
          </div>

          {/* Right: Blinkit-style Add to cart / Stepper */}
          <div className="shrink-0">
            {cartQuantity > 0 ? (
              <div className="flex items-center bg-primary text-primary-foreground rounded-xl shadow-md font-bold overflow-hidden">
                <button
                  type="button"
                  onClick={handleDecrease}
                  className="p-2.5 px-3.5 hover:bg-black/10 active:scale-90 transition-all flex items-center justify-center text-primary-foreground"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4 stroke-[2.5]" />
                </button>
                <span className="px-3 text-sm min-w-[2rem] text-center font-bold text-primary-foreground">
                  {cartQuantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrease}
                  disabled={cartQuantity >= product.stock}
                  className="p-2.5 px-3.5 hover:bg-black/10 active:scale-90 transition-all disabled:opacity-50 flex items-center justify-center text-primary-foreground"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={handleQuickAdd}
                disabled={product.stock === 0}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-7 py-2.5 rounded-xl shadow-md text-sm active:scale-95 transition-all flex items-center gap-1.5"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>{product.stock === 0 ? 'Out of Stock' : 'Add to cart'}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    )}
  </Layout>
  );
}
