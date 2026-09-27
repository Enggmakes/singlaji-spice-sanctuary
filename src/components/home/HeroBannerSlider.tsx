import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroBanner } from '@/types/banner';
import { fetchHeroBanners, DEFAULT_BANNERS } from '@/lib/bannerService';
import { supabase } from '@/integrations/supabase/client';

export default function HeroBannerSlider() {
  const [banners, setBanners] = useState<HeroBanner[]>(DEFAULT_BANNERS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const loadBanners = useCallback(async () => {
    try {
      const activeBanners = await fetchHeroBanners(true);
      if (activeBanners && activeBanners.length > 0) {
        setBanners(activeBanners);
      } else {
        setBanners(DEFAULT_BANNERS);
      }
    } catch {
      setBanners(DEFAULT_BANNERS);
    }
  }, []);

  useEffect(() => {
    loadBanners();

    // Listen for live updates when admin adds or removes banners
    const channel = supabase
      .channel('banner_realtime_sync')
      .on('broadcast', { event: 'hero_banners_changed' }, () => {
        loadBanners();
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hero_banners' },
        () => {
          loadBanners();
        }
      )
      .subscribe();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'singlaji_hero_banners') {
        loadBanners();
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('hero_banners_updated', loadBanners);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('hero_banners_updated', loadBanners);
    };
  }, [loadBanners]);

  // Keep index within bounds if banners list changes
  useEffect(() => {
    if (currentIndex >= banners.length) {
      setCurrentIndex(0);
    }
  }, [banners.length, currentIndex]);

  // Next / Prev slide handlers
  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Auto-slide timer (every 5 seconds when not paused)
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length, isPaused, handleNext]);

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const currentBanner = banners[currentIndex] || banners[0] || DEFAULT_BANNERS[0];
  const isCleanGraphicMode = currentBanner.hide_overlay === true || (!currentBanner.title?.trim() && !currentBanner.subtitle?.trim() && !currentBanner.badge_text?.trim() && currentBanner.show_buttons === false);
  const showButtons = !isCleanGraphicMode && currentBanner.show_buttons !== false;
  const hasText = !isCleanGraphicMode && Boolean(currentBanner.title?.trim() || currentBanner.subtitle?.trim() || currentBanner.badge_text?.trim());
  const hasOverlay = !isCleanGraphicMode && (hasText || showButtons);
  const primaryBtnText = currentBanner.button_text || 'Shop Now';
  const primaryBtnLink = currentBanner.button_link || '/products';
  const secondaryBtnText = currentBanner.secondary_button_text || 'Our Story';
  const secondaryBtnLink = currentBanner.secondary_button_link || '/about';

  // Slide animation variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  return (
    <section
      className="relative w-full aspect-[16/9] max-h-[78vh] min-h-[220px] sm:min-h-[340px] md:min-h-[460px] lg:min-h-[560px] overflow-hidden select-none bg-stone-900 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Promotional Hero Banners"
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentBanner.id || currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 280, damping: 30 },
            opacity: { duration: 0.35 },
          }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Background Image Container strictly in 16:9 */}
          <div className="relative w-full h-full">
            <img
              src={currentBanner.image_url}
              alt={currentBanner.title || 'Singlaji Spices Promotional Banner'}
              className="w-full h-full object-cover object-center"
              loading="eager"
            />

            {/* Gradient Overlay for high-contrast readability (only when text or buttons exist) */}
            {hasOverlay ? (
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 sm:via-black/35 to-transparent pointer-events-none" />
            ) : null}

            {/* Direct banner background link if buttons are disabled (e.g. clean festival/ad poster) */}
            {!showButtons && primaryBtnLink && (
              <Link
                to={primaryBtnLink}
                className="absolute inset-0 z-10 cursor-pointer"
                aria-label={currentBanner.title || 'View Promotion'}
              />
            )}
          </div>

          {/* Interactive Content & Action Buttons Overlay */}
          {hasOverlay && (
            <div className="absolute inset-0 flex items-center z-10 pointer-events-none">
              <div className="container mx-auto px-4 sm:px-6 md:px-12">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="max-w-xl sm:max-w-2xl text-left pointer-events-auto"
                >
                  {/* Badge */}
                  {currentBanner.badge_text && (
                    <span className="inline-block px-2.5 py-0.5 sm:px-4 sm:py-1.5 bg-accent/90 text-accent-foreground text-[10px] sm:text-xs md:text-sm font-semibold rounded-full mb-1.5 sm:mb-3 md:mb-4 shadow-sm backdrop-blur-sm">
                      {currentBanner.badge_text}
                    </span>
                  )}

                  {/* Title */}
                  {currentBanner.title && (
                    <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight mb-1.5 sm:mb-3 md:mb-4 drop-shadow-md whitespace-pre-line">
                      {currentBanner.title}
                    </h1>
                  )}

                  {/* Subtitle */}
                  {currentBanner.subtitle && (
                    <p className="text-xs sm:text-base md:text-lg text-white/90 mb-3 sm:mb-6 leading-relaxed line-clamp-3 sm:line-clamp-4 max-w-lg drop-shadow whitespace-pre-line">
                      {currentBanner.subtitle}
                    </p>
                  )}

                  {/* Call to Action Buttons (Shop Now & Our Story like previous slide) */}
                  {showButtons && (
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-1 sm:pt-2">
                      <Button
                        asChild
                        variant="hero"
                        size="sm"
                        className="sm:h-11 sm:px-6 sm:text-base text-xs h-8 px-3.5 shadow-lg shadow-black/20"
                      >
                        <Link to={primaryBtnLink}>
                          {primaryBtnText}
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Link>
                      </Button>

                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="sm:h-11 sm:px-6 sm:text-base text-xs h-8 px-3.5 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm shadow-sm"
                      >
                        <Link to={secondaryBtnLink}>
                          {secondaryBtnText}
                        </Link>
                      </Button>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows (visible if more than 1 banner) */}
      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Previous Slide"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Next Slide"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-105 active:scale-95"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </>
      )}

      {/* Navigation Dots / Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-black/35 backdrop-blur-md border border-white/10">
          {banners.map((b, idx) => (
            <button
              key={b.id || idx}
              onClick={(e) => {
                e.stopPropagation();
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full ${
                idx === currentIndex
                  ? 'w-5 sm:w-7 h-1.5 sm:h-2 bg-primary shadow-sm'
                  : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}

      {/* 16:9 Indicator watermark badge for admins or quick debug (subtle) */}
      <div className="sr-only">16:9 Aspect Ratio Hero Banner Carousel</div>
    </section>
  );
}
