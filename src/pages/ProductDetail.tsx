import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, ShoppingCart, Truck, Shield, Package, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/product/ProductCard';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { useSEO } from '@/hooks/useSEO';
import { parseWeightVariants, WeightVariant } from '@/lib/weightVariants';
import { toast } from 'sonner';

function PackSizeMarquee({
  variants,
  selectedVariant,
  onSelect,
}: {
  variants: WeightVariant[];
  selectedVariant: WeightVariant | null;
  onSelect: (variant: WeightVariant) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isPausedRef = React.useRef(false);
  const resumeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // If variants > 3, duplicate list for seamless infinite loop
  const shouldLoop = variants.length > 3;
  const items = shouldLoop ? [...variants, ...variants] : variants;

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || !shouldLoop) return;

    let animId: number;
    let scrollPos = el.scrollLeft;
    const speed = 0.35; // gentle, steady glide

    const step = () => {
      if (!isPausedRef.current && el) {
        scrollPos += speed;
        // Seamless infinite loop: when reaching half, rewind by half
        if (scrollPos >= el.scrollWidth / 2) {
          scrollPos -= el.scrollWidth / 2;
        }
        el.scrollLeft = scrollPos;
      } else if (el) {
        // Keep internal float in sync with manual user touch scrolling!
        scrollPos = el.scrollLeft;
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animId);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, [shouldLoop, variants.length]);

  const handlePause = () => {
    isPausedRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  };

  const handleResume = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      isPausedRef.current = false;
    }, 2000); // 2s pause before resuming
  };

  return (
    <div
      className="relative -mx-4 sm:mx-0 overflow-hidden py-1"
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      onTouchStart={handlePause}
      onTouchEnd={handleResume}
    >
      <div
        ref={containerRef}
        className="flex items-center gap-2.5 overflow-x-auto select-none cursor-grab active:cursor-grabbing [touch-action:pan-x] [overscroll-behavior-x:contain] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4 sm:px-0 py-0.5"
      >
        {items.map((v, idx) => {
          const isSelected = selectedVariant?.weight === v.weight;
          return (
            <button
              key={`${v.weight}-${idx}`}
              type="button"
              onClick={() => {
                onSelect(v);
                handlePause();
                handleResume();
              }}
              className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm transition-all border ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20 font-semibold'
                  : 'bg-card/70 backdrop-blur-sm text-foreground border-border hover:border-primary/40 hover:bg-card font-medium'
              }`}
            >
              <span className="whitespace-nowrap tracking-tight font-semibold">{v.weight}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-md font-bold whitespace-nowrap ${
                  isSelected
                    ? 'bg-white/20 text-primary-foreground'
                    : 'bg-muted/80 text-muted-foreground'
                }`}
              >
                ₹{Math.round(v.price)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
    <Layout>
      {/* 1. Main Product Section with Ambient Background */}
      <section className="relative overflow-hidden w-full max-w-full pb-8 sm:pb-12">
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
        <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8 relative z-10 w-full max-w-full overflow-hidden">
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
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 xl:gap-16 items-start w-full min-w-0">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center w-full min-w-0"
            >
              <div className="w-full max-w-[260px] sm:max-w-[320px] lg:max-w-[380px] flex items-center justify-center mx-auto">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-auto max-h-[340px] sm:max-h-[420px] lg:max-h-[480px] block object-contain drop-shadow-xl transition-transform duration-500 hover:scale-[1.02] mx-auto"
                  />
                ) : (
                  <div className="aspect-square w-full max-w-[260px] flex items-center justify-center bg-secondary/30 rounded-2xl mx-auto">
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
              className="flex flex-col w-full min-w-0"
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

              {/* Weight / Pack Size Variants (Marquee with instant pause on hitbox) */}
              {variants.length > 0 ? (
                <div className="mb-5 space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Select Pack Size
                    </label>
                    {selectedVariant && (
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                        Selected: {selectedVariant.weight}
                      </span>
                    )}
                  </div>

                  <PackSizeMarquee
                    variants={variants}
                    selectedVariant={selectedVariant}
                    onSelect={setSelectedVariant}
                  />
                </div>
              ) : product.weight ? (
                <p className="text-muted-foreground mb-4 font-medium">{product.weight}</p>
              ) : null}

              {/* Price */}
              <div className="mb-6 flex flex-col gap-1">
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
                    <div className="flex items-center border border-border/80 rounded-xl bg-background/50 backdrop-blur-sm">
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
              <div className="space-y-5 mb-6">
                {product.description && (
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-2">
                      About this product
                    </h3>
                    <p className="text-sm sm:text-base text-foreground/80 leading-relaxed font-normal">
                      {product.description}
                    </p>
                  </div>
                )}

                {product.ingredients && (
                  <div className="pt-4 border-t border-border/40">
                    <h3 className="text-base font-bold text-foreground mb-2">
                      Key Ingredients
                    </h3>
                    <p className="text-sm sm:text-base text-foreground/80 leading-relaxed font-normal">
                      {product.ingredients}
                    </p>
                  </div>
                )}
              </div>

              {/* Features / Highlights */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-border/60">
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Truck className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Free Delivery</p>
                    <p className="text-[11px] text-muted-foreground">Orders ₹500+</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Fresh Packed</p>
                    <p className="text-[11px] text-muted-foreground">Quality sealed</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-2.5">
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
