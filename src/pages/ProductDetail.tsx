import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, ShoppingCart, Truck, Shield, Package, ChevronRight, Sparkles, Leaf } from 'lucide-react';
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
      {/* 1. Main Product Section with Ambient Background */}
      <section className="relative overflow-hidden pb-8 sm:pb-12">
        {/* Ambient Mobile Background Image (9:16 vertical ratio) */}
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
        {/* Ambient Laptop / Desktop Horizontal Background Image */}
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
          <nav className="mb-4 sm:mb-6">
            <Link
              to="/products"
              className="inline-flex items-center text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5 transition-transform group-hover:-translate-x-1" />
              <span>Back to Spices & Masalas</span>
            </Link>
          </nav>

          {/* Product Details */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 xl:gap-16 items-start">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center"
            >
              <div className="w-full max-w-[280px] sm:max-w-[340px] lg:max-w-[400px] rounded-3xl overflow-hidden shadow-elevated border border-border/60 bg-card p-3">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-auto max-h-[350px] sm:max-h-[420px] lg:max-h-[480px] block object-cover rounded-2xl transition-transform duration-500 hover:scale-[1.02]"
                  />
                ) : (
                  <div className="aspect-square w-full flex items-center justify-center bg-secondary rounded-2xl">
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
              {/* Category & Stock Pill */}
              <div className="flex items-center gap-2.5 flex-wrap mb-2.5">
                {product.category && (
                  <Link
                    to={`/products?category=${product.category.slug}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {product.category.name}
                  </Link>
                )}
                {product.stock === 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                    Out of Stock
                  </span>
                ) : product.stock <= 5 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Only {product.stock} left in stock
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    In Stock
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground mb-4 leading-tight font-sans">
                {product.name}
              </h1>

              {/* Weight / Pack Size Variants */}
              {variants.length > 0 ? (
                <div className="mb-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Select Pack Size
                    </label>
                    {selectedVariant && (
                      <span className="text-xs font-semibold text-primary">
                        Selected: <span className="font-bold">{selectedVariant.weight}</span>
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {variants.map((v) => {
                      const isSelected = selectedVariant?.weight === v.weight;
                      return (
                        <button
                          key={v.weight}
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all border ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20 font-semibold'
                              : 'bg-card text-foreground border-border hover:border-primary/40 hover:bg-muted/30 font-medium'
                          }`}
                        >
                          <span className="tracking-tight">{v.weight}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                              isSelected
                                ? 'bg-white/20 text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
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

              {/* Price Box */}
              <div className="bg-card/70 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-border/70 shadow-sm mb-6 flex flex-col gap-1">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                    ₹{activePrice.toFixed(0)}
                  </span>
                  {selectedWeightLabel && (
                    <span className="text-sm font-semibold text-muted-foreground">
                      / {selectedWeightLabel}
                    </span>
                  )}
                  {product.compare_at_price && product.compare_at_price > activePrice && (
                    <>
                      <span className="text-base sm:text-lg text-muted-foreground line-through font-normal">
                        ₹{product.compare_at_price.toFixed(0)}
                      </span>
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
                        {discount}% OFF
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Inclusive of all taxes • Freshly ground & sealed
                </p>
              </div>

              {/* Quantity & Add to Cart (Desktop only: hidden on mobile where Blinkit sticky bottom bar handles it) */}
              <div className="hidden md:flex flex-col sm:flex-row gap-4 mb-6">
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
                    <div className="flex items-center border border-border rounded-xl bg-card">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-3 hover:bg-muted transition-colors rounded-l-xl"
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-6 text-lg font-medium min-w-[4rem] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-3 hover:bg-muted transition-colors rounded-r-xl"
                        disabled={quantity >= product.stock}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <Button
                      onClick={handleAddToCart}
                      size="lg"
                      className="flex-1 sm:flex-none sm:min-w-[200px] rounded-xl font-bold shadow-md"
                      disabled={product.stock === 0}
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                )}
              </div>

              {/* Description & Ingredients */}
              <div className="space-y-4 mb-6">
                {product.description && (
                  <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-border/60">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-primary" />
                      About This Product
                    </h3>
                    <p className="text-sm sm:text-base text-foreground/85 leading-relaxed font-normal">
                      {product.description}
                    </p>
                  </div>
                )}

                {product.ingredients && (
                  <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-border/60">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                      Key Ingredients
                    </h3>
                    <p className="text-sm text-foreground/85 leading-relaxed">
                      {product.ingredients}
                    </p>
                  </div>
                )}
              </div>

              {/* Features / Highlights */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-border/60">
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 p-2.5 sm:p-3 rounded-xl bg-card/60 border border-border/40">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Truck className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Free Delivery</p>
                    <p className="text-[11px] text-muted-foreground">Orders ₹500+</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 p-2.5 sm:p-3 rounded-xl bg-card/60 border border-border/40">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Fresh Packed</p>
                    <p className="text-[11px] text-muted-foreground">Quality sealed</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 p-2.5 sm:p-3 rounded-xl bg-card/60 border border-border/40">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">100% Pure</p>
                    <p className="text-[11px] text-muted-foreground">Authentic taste</p>
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
