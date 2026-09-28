import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, Shield, Award, Leaf, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/product/ProductCard';
import { useFeaturedProducts, useCategories } from '@/hooks/useProducts';
import HeroBannerSlider from '@/components/home/HeroBannerSlider';
import { getCategoryVectorIcon } from '@/components/icons/SpiceCategoryIcons';
import heroImage from '@/assets/hero-spices.jpg';

const trustBadges = [
  { icon: Leaf, title: '100% Pure', description: 'No additives or preservatives' },
  { icon: Award, title: 'Premium Quality', description: 'Handpicked finest spices' },
  { icon: Truck, title: 'Pan India Delivery', description: 'Free shipping over ₹500' },
  { icon: Shield, title: 'Secure Payment', description: 'COD & online options' },
];

export default function Index() {
  const { data: featuredProducts, isLoading: productsLoading } = useFeaturedProducts();
  const { data: categories } = useCategories();

  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkCategoryScroll = () => {
    if (!categoryScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkCategoryScroll();
    window.addEventListener('resize', checkCategoryScroll);
    return () => window.removeEventListener('resize', checkCategoryScroll);
  }, [categories]);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (!categoryScrollRef.current) return;
    const scrollAmount = 300;
    categoryScrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
    setTimeout(checkCategoryScroll, 350);
  };

  return (
    <Layout>
      {/* Dynamic 2.4:1 Multi-Banner Auto-Changing Hero Carousel */}
      <HeroBannerSlider />

      {/* Trust Badges */}
      <section className="py-12 md:py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {trustBadges.map((badge, index) => (
              <motion.div
                key={badge.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <badge.icon className="h-6 w-6 md:h-7 md:w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{badge.title}</h3>
                <p className="text-sm text-muted-foreground">{badge.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-sm font-medium text-primary uppercase tracking-wider">
              Handpicked Selection
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mt-2 mb-4">
              Featured Masalas
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our most loved spices, chosen for their exceptional quality and flavor. 
              Each blend crafted with care for authentic Indian taste.
            </p>
          </motion.div>

          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl overflow-hidden animate-pulse">
                  <div className="aspect-square bg-muted" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-5 bg-muted rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts && featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No featured products yet. Check back soon!</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Button asChild variant="outline-primary" size="lg">
              <Link to="/products">
                View All Products <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="py-16 md:py-24 bg-gradient-warm relative overflow-hidden">
          <div className="container mx-auto px-4 max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10 md:mb-12"
            >
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                Browse by Category
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mt-2">
                Explore Our Spices
              </h2>
            </motion.div>

            {/* Slider Container with Left / Right buttons if scrollable */}
            <div className="relative group/cats">
              {canScrollLeft && (
                <button
                  type="button"
                  onClick={() => scrollCategories('left')}
                  aria-label="Scroll categories left"
                  className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-background/95 hover:bg-background border border-border shadow-lg text-foreground items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-sm"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
              )}

              {canScrollRight && (
                <button
                  type="button"
                  onClick={() => scrollCategories('right')}
                  aria-label="Scroll categories right"
                  className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-background/95 hover:bg-background border border-border shadow-lg text-foreground items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-sm"
                >
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </button>
              )}

              <div
                ref={categoryScrollRef}
                onScroll={checkCategoryScroll}
                className="flex items-stretch gap-4 md:gap-6 overflow-x-auto pb-4 pt-1 px-2 scrollbar-none snap-x snap-mandatory justify-start sm:justify-center"
              >
                {categories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="w-40 sm:w-48 md:w-56 shrink-0 snap-center"
                  >
                    <Link
                      to={`/products?category=${category.slug}`}
                      className="block group h-full"
                    >
                      <div className="bg-card rounded-2xl p-5 md:p-6 text-center border border-border/70 shadow-xs hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1.5 flex flex-col items-center justify-between h-full group-hover:border-primary/40">
                        <div className="w-18 h-18 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-primary/10 to-orange-500/10 border border-primary/15 flex items-center justify-center p-3.5 group-hover:scale-110 group-hover:bg-primary/15 transition-all duration-300 shadow-inner">
                          {getCategoryVectorIcon(category.name, 'w-full h-full object-contain drop-shadow-xs')}
                        </div>
                        <div>
                          <h3 className="font-serif font-bold text-sm sm:text-base text-foreground capitalize group-hover:text-primary transition-colors">
                            {category.name}
                          </h3>
                          <span className="text-[11px] text-muted-foreground mt-1.5 opacity-70 group-hover:opacity-100 group-hover:text-primary transition-all flex items-center justify-center gap-1 font-medium">
                            Explore <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Brand Story */}
      <section className="py-16 md:py-24 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                Our Heritage
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mt-2 mb-6">
                A Legacy of Authentic Flavors
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  For generations, the Singlaji family has been dedicated to bringing 
                  the purest, most flavorful spices to Indian kitchens. Our journey 
                  began in the heart of India's spice regions, where we learned the 
                  art of selecting and blending the finest ingredients.
                </p>
                <p>
                  Today, we continue this tradition with the same passion and 
                  commitment to quality. Every masala we create is a testament to 
                  our heritage — stone-ground using traditional methods, packed 
                  fresh to preserve flavor, and delivered with care to your doorstep.
                </p>
                <p>
                  When you choose Singlaji, you choose authenticity. You choose 
                  purity. You choose the taste of real India.
                </p>
              </div>
              <Button asChild className="mt-8" variant="outline-primary">
                <Link to="/about">Learn More About Us</Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-elevated">
                <img
                  src={heroImage}
                  alt="Traditional Indian Spices"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-spice">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-foreground mb-4">
              Ready to Spice Up Your Kitchen?
            </h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
              Order now and experience the authentic taste of India. 
              Free shipping on orders above ₹500!
            </p>
            <Button asChild variant="gold" size="xl">
              <Link to="/products">
                Start Shopping <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
