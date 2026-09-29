import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, ShoppingCart, Truck, Shield, Package, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
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
  const firstSetRef = React.useRef<HTMLDivElement>(null);
  const scrollPosRef = React.useRef<number>(0);
  const isDraggingRef = React.useRef(false);
  const isTouchingRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const startScrollLeftRef = React.useRef(0);
  const hasDraggedRef = React.useRef(false);
  const touchCooldownTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // If variants > 1, enable seamless infinite loop
  const shouldLoop = variants.length > 1;
  // Duplicate variants enough times so it easily spans wider than any viewport
  const repeatCount = Math.max(3, Math.ceil(12 / (variants.length || 1)));
  const loopList: WeightVariant[] = [];
  for (let i = 0; i < repeatCount; i++) {
    loopList.push(...variants);
  }

  // Smooth continuous auto-scroll requestAnimationFrame with floating point accumulator
  React.useEffect(() => {
    if (!shouldLoop) return;

    let animId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const el = containerRef.current;
      const set1 = firstSetRef.current;

      // Runs continuously; only pauses while user is actively touching or dragging
      if (el && set1 && !isDraggingRef.current && !isTouchingRef.current) {
        const halfWidth = set1.offsetWidth;
        if (halfWidth > 0) {
          scrollPosRef.current += 30 * delta;
          if (scrollPosRef.current >= halfWidth) {
            scrollPosRef.current -= halfWidth;
          }
          el.scrollLeft = scrollPosRef.current;
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [shouldLoop, variants]);

  // Touch scroll on mobile: pause while touching & cool down after release
  const handleTouchStart = () => {
    isTouchingRef.current = true;
    hasDraggedRef.current = false;
    if (touchCooldownTimerRef.current) {
      clearTimeout(touchCooldownTimerRef.current);
      touchCooldownTimerRef.current = null;
    }
    if (containerRef.current) {
      scrollPosRef.current = containerRef.current.scrollLeft;
    }
  };

  const handleTouchMove = () => {
    hasDraggedRef.current = true;
  };

  const handleTouchEnd = () => {
    if (touchCooldownTimerRef.current) {
      clearTimeout(touchCooldownTimerRef.current);
    }
    // Cooldown allows momentum scroll to settle before auto-gliding resumes
    touchCooldownTimerRef.current = setTimeout(() => {
      if (containerRef.current) {
        scrollPosRef.current = containerRef.current.scrollLeft;
      }
      isTouchingRef.current = false;
    }, 1200);
  };

  // Mouse drag handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.clientX;
    startScrollLeftRef.current = el.scrollLeft;
    scrollPosRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const el = containerRef.current;
    const set1 = firstSetRef.current;
    if (!el) return;

    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 3) {
      hasDraggedRef.current = true;
    }

    let next = startScrollLeftRef.current - dx;
    if (set1 && shouldLoop) {
      const halfWidth = set1.offsetWidth;
      if (halfWidth > 0) {
        while (next < 0) next += halfWidth;
        while (next >= halfWidth * 2) next -= halfWidth;
      }
    }
    el.scrollLeft = next;
    scrollPosRef.current = next;
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (containerRef.current) {
      scrollPosRef.current = containerRef.current.scrollLeft;
    }
  };

  const handleNativeScroll = () => {
    const el = containerRef.current;
    const set1 = firstSetRef.current;
    if (!el || !set1 || !shouldLoop) return;
    const halfWidth = set1.offsetWidth;
    if (halfWidth <= 0) return;

    if (isTouchingRef.current || isDraggingRef.current) {
      if (el.scrollLeft >= halfWidth * 1.5) {
        el.scrollLeft -= halfWidth;
      } else if (el.scrollLeft <= 0) {
        el.scrollLeft += halfWidth;
      }
      scrollPosRef.current = el.scrollLeft;
    }
  };

  const renderPills = (list: WeightVariant[], keyPrefix: string, isFirstCopy = false) => (
    <div
      ref={isFirstCopy ? firstSetRef : undefined}
      className="flex items-center gap-2.5 shrink-0"
    >
      {list.map((v, idx) => {
        const isSelected = selectedVariant?.weight === v.weight;
        return (
          <button
            key={`${keyPrefix}-${v.weight}-${idx}`}
            type="button"
            onClick={(e) => {
              if (hasDraggedRef.current) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              onSelect(v);
            }}
            className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm transition-all border cursor-pointer select-none ${
              isSelected
                ? 'bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20 font-semibold scale-[1.02]'
                : 'bg-card/90 backdrop-blur-sm text-foreground border-border hover:border-primary/50 hover:bg-card font-medium'
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
  );

  return (
    <div className="relative -mx-4 sm:mx-0 py-1 overflow-hidden">
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onScroll={handleNativeScroll}
        className="flex items-center gap-2.5 overflow-x-auto no-scrollbar select-none cursor-grab active:cursor-grabbing px-4 sm:px-0 py-0.5"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x',
          overscrollBehaviorX: 'contain',
        }}
      >
        {renderPills(loopList, 'set-1', true)}
        {shouldLoop && renderPills(loopList, 'set-2')}
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

  // Multi-image gallery list & selection hooks (always called unconditionally at top level)
  const allImages = React.useMemo(() => {
    if (!product) return [];
    if (product.images) {
      if (Array.isArray(product.images) && product.images.length > 0) {
        return product.images.filter((img): img is string => typeof img === 'string' && img.trim().length > 0);
      }
      if (typeof product.images === 'string') {
        try {
          const parsed = JSON.parse(product.images);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.filter((img): img is string => typeof img === 'string' && img.trim().length > 0);
          }
        } catch {
          if (product.images.trim()) return [product.images.trim()];
        }
      }
    }
    return product.image_url ? [product.image_url] : [];
  }, [product?.images, product?.image_url]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reset active image index when product changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [product?.id]);

  // Preload all gallery images immediately so image switching is 100% instantaneous
  useEffect(() => {
    if (allImages.length > 0) {
      allImages.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    }
  }, [allImages]);

  const currentImageUrl = allImages[activeImageIndex] || product?.image_url;

  // Touch swipe support for mobile
  const touchStartXRef = React.useRef<number | null>(null);
  const handleTouchStartImg = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchEndImg = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diffX = touchStartXRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diffX) > 40 && allImages.length > 1) {
      if (diffX > 0) {
        // Swipe left -> Next image
        setActiveImageIndex((prev) => (prev + 1) % allImages.length);
      } else {
        // Swipe right -> Prev image
        setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
      }
    }
    touchStartXRef.current = null;
  };

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
        {/* Ambient Mobile Background Image with Soft Seamless Fade to White */}
        <div
          className="block sm:hidden absolute inset-x-0 top-0 h-[720px] max-h-[85vh] pointer-events-none bg-no-repeat bg-top z-0"
          style={{
            backgroundImage: `url('/product_page_mobile.png')`,
            backgroundSize: '100% auto',
            opacity: 0.14,
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 25%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0) 88%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 25%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0) 88%)',
          }}
        />
        {/* Soft White Melt Gradient Layer */}
        <div
          className="block sm:hidden absolute inset-x-0 top-0 h-[720px] max-h-[85vh] pointer-events-none z-0 bg-gradient-to-b from-transparent via-background/40 to-background"
        />
        {/* Ambient Laptop / Desktop Horizontal Background Image */}
        <div
          className="hidden sm:block absolute inset-0 left-1/2 -translate-x-1/2 w-full max-w-[1672px] pointer-events-none bg-no-repeat bg-top z-0"
          style={{
            backgroundImage: `url('/product_page_back.png')`,
            backgroundSize: '100% auto',
            opacity: 0.12,
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 95%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 95%)',
          }}
        />
        <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8 relative z-10 w-full max-w-full">
          {/* Breadcrumb */}
          <nav className="mb-4 sm:mb-6">
            <Link
              to="/products"
              className="inline-flex items-center text-xs sm:text-sm font-semibold text-stone-700 hover:text-stone-950 dark:text-stone-300 dark:hover:text-white transition-colors group"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5 transition-transform group-hover:-translate-x-1" />
              <span>Back to Spices & Masalas</span>
            </Link>
          </nav>

          {/* Product Details */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 xl:gap-16 items-start w-full min-w-0">
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center w-full min-w-0"
            >
              <div className="flex justify-center mx-auto w-full">
                {allImages.length > 0 ? (
                  <div
                    className="relative w-full max-w-[285px] sm:max-w-[350px] lg:max-w-[420px] aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl isolate group select-none bg-stone-100 dark:bg-stone-900 mx-auto"
                    onTouchStart={handleTouchStartImg}
                    onTouchEnd={handleTouchEndImg}
                  >
                    {allImages.map((imgSrc, idx) => (
                      <img
                        key={imgSrc + idx}
                        src={imgSrc}
                        alt={`${product.name} view ${idx + 1}`}
                        loading="eager"
                        decoding="async"
                        className={`absolute inset-0 w-full h-full object-cover rounded-2xl sm:rounded-3xl transition-all duration-300 ease-in-out hover:scale-[1.03] ${
                          idx === activeImageIndex
                            ? 'opacity-100 z-10 pointer-events-auto'
                            : 'opacity-0 z-0 pointer-events-none'
                        }`}
                        style={{ borderRadius: '1.25rem' }}
                      />
                    ))}

                    {/* Previous / Next Arrow Controls */}
                    {allImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
                          }}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white/90 hover:text-white flex items-center justify-center backdrop-blur-md border border-white/20 opacity-85 sm:opacity-0 sm:group-hover:opacity-100 transition-all z-20 shadow-sm active:scale-95"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="h-4 w-4 drop-shadow-sm" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIndex((prev) => (prev + 1) % allImages.length);
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white/90 hover:text-white flex items-center justify-center backdrop-blur-md border border-white/20 opacity-85 sm:opacity-0 sm:group-hover:opacity-100 transition-all z-20 shadow-sm active:scale-95"
                          aria-label="Next image"
                        >
                          <ChevronRight className="h-4 w-4 drop-shadow-sm" />
                        </button>

                        {/* Image Counter Badge */}
                        <div className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/25 backdrop-blur-md border border-white/15 text-[10px] sm:text-[11px] font-medium text-white/90 tracking-wider z-20 shadow-sm">
                          {activeImageIndex + 1} / {allImages.length}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[4/5] w-full max-w-[285px] sm:max-w-[350px] lg:max-w-[420px] flex items-center justify-center bg-secondary/30 rounded-2xl mx-auto">
                    <span className="text-8xl font-serif text-muted-foreground/30">
                      {product.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Multi-Image Thumbnail Strip (Below Main Image) */}
              {allImages.length > 1 && (
                <div className="flex items-center justify-center gap-2.5 sm:gap-3 mt-4 sm:mt-5 overflow-x-auto no-scrollbar py-1 px-2 max-w-full">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-secondary/20 shadow-sm cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-primary ring-2 ring-primary/30 scale-105 shadow-md'
                          : 'border-border/80 hover:border-primary/50 opacity-70 hover:opacity-100'
                      }`}
                      title={`View photo ${idx + 1}`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
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
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-stone-950 dark:text-white mb-4 leading-tight font-sans">
                {product.name}
              </h1>

              {/* Weight / Pack Size Variants (Marquee with instant pause on hitbox) */}
              {variants.length > 0 ? (
                <div className="mb-5 space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-stone-900 dark:text-stone-100">
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
                <p className="text-stone-900 dark:text-stone-100 mb-4 font-semibold">{product.weight}</p>
              ) : null}

              {/* Price */}
              <div className="mb-6 flex flex-col gap-1">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-extrabold text-stone-950 dark:text-white tracking-tight">
                    ₹{activePrice.toFixed(0)}
                  </span>
                  {selectedWeightLabel && (
                    <span className="text-sm font-bold text-stone-800 dark:text-stone-200">
                      / {selectedWeightLabel}
                    </span>
                  )}
                  {product.compare_at_price && product.compare_at_price > activePrice && (
                    <>
                      <span className="text-base sm:text-lg text-stone-500 line-through font-medium">
                        ₹{product.compare_at_price.toFixed(0)}
                      </span>
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
                        {discount}% OFF
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-stone-800 dark:text-stone-200 font-medium mt-0.5">
                  Inclusive of all taxes • Freshly ground & sealed
                </p>
              </div>

              {/* Quantity & Add to Cart (Desktop only: hidden on mobile where Blinkit sticky bottom bar handles it) */}
              <div className="hidden md:flex items-center gap-4 mb-6">
                {cartQuantity > 0 ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-primary text-primary-foreground rounded-xl shadow-sm border border-primary/20 overflow-hidden font-bold">
                      <button
                        type="button"
                        onClick={handleDecrease}
                        className="p-3 px-4 hover:bg-black/10 active:scale-95 transition-all flex items-center justify-center text-primary-foreground"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 text-base min-w-[3rem] text-center font-bold text-primary-foreground">
                        {cartQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={handleIncrease}
                        disabled={cartQuantity >= product.stock}
                        className="p-3 px-4 hover:bg-black/10 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center text-primary-foreground"
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
                  <Button
                    onClick={handleQuickAdd}
                    size="lg"
                    className="min-w-[200px] h-12 text-base rounded-xl font-bold shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
                    disabled={product.stock === 0}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </Button>
                )}
              </div>

              {/* Description & Ingredients */}
              <div className="space-y-5 mb-6">
                {product.description && (
                  <div>
                    <h3 className="text-base font-bold text-stone-950 dark:text-white mb-2">
                      About this product
                    </h3>
                    <p className="text-sm sm:text-base text-stone-950 dark:text-stone-100 font-medium leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}

                {product.ingredients && (
                  <div className="pt-4 border-t border-border/40">
                    <h3 className="text-base font-bold text-stone-950 dark:text-white mb-2">
                      Key Ingredients
                    </h3>
                    <p className="text-sm sm:text-base text-stone-950 dark:text-stone-100 font-medium leading-relaxed">
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
                    <p className="text-xs font-bold text-stone-950 dark:text-white">Free Delivery</p>
                    <p className="text-[11px] text-stone-700 dark:text-stone-300 font-semibold">Orders ₹500+</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-950 dark:text-white">Fresh Packed</p>
                    <p className="text-[11px] text-stone-700 dark:text-stone-300 font-semibold">Quality sealed</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-950 dark:text-white">100% Pure</p>
                    <p className="text-[11px] text-stone-700 dark:text-stone-300 font-semibold">Authentic taste</p>
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

    {/* Apple UIGlassEffect Liquid Glass Bottom Action Bar (Mobile only) */}
    {product && (
      <div
        className="fixed bottom-0 left-0 right-0 z-40 pt-2.5 pb-[max(1rem,env(safe-area-inset-bottom,1rem))] px-4 sm:px-6 md:hidden rounded-t-2xl rounded-b-none transition-all after:absolute after:top-full after:left-0 after:right-0 after:h-24 after:bg-white/20 dark:after:bg-black/30 after:backdrop-blur-3xl after:pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.14) 100%)',
          backdropFilter: 'blur(30px) saturate(210%)',
          WebkitBackdropFilter: 'blur(30px) saturate(210%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.55)',
          boxShadow: 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.75), 0 -10px 35px rgba(0, 0, 0, 0.08)',
        }}
      >
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
              <span className="text-xs font-semibold text-muted-foreground truncate leading-tight">
                {selectedWeightLabel}
              </span>
            )}
            <div className="flex items-baseline gap-1.5 my-0.5">
              <span className="text-xl font-extrabold text-foreground tracking-tight">
                ₹{activePrice.toFixed(0)}
              </span>
              {product.compare_at_price && product.compare_at_price > activePrice && (
                <span className="text-xs text-muted-foreground line-through font-medium">
                  ₹{product.compare_at_price.toFixed(0)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground tracking-tight leading-tight">
              Inclusive of all taxes
            </span>
          </div>

          {/* Right: Standard Clean Add to Cart / Stepper */}
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
