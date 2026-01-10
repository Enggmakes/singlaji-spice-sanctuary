import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, Shield, Award, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/product/ProductCard';
import { useFeaturedProducts, useCategories } from '@/hooks/useProducts';
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

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Premium Indian Spices"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-transparent" />
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <span className="inline-block px-4 py-1.5 bg-accent/90 text-accent-foreground text-sm font-medium rounded-full mb-6">
              Premium Indian Spices
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-primary-foreground leading-tight mb-6">
              Authentic Flavors,{' '}
              <span className="text-accent">Straight from India</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 leading-relaxed">
              Experience the rich heritage of Indian cuisine with Singlaji's 
              handpicked, stone-ground masalas. Pure tradition, exceptional taste.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild variant="hero" size="xl">
                <Link to="/products">
                  Shop Now <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground">
                <Link to="/about">Our Story</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

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
        <section className="py-16 md:py-24 bg-gradient-warm">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                Browse by Category
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mt-2">
                Explore Our Spices
              </h2>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Link
                    to={`/products?category=${category.slug}`}
                    className="block group"
                  >
                    <div className="bg-card rounded-xl p-6 text-center shadow-soft hover:shadow-card transition-all duration-300 group-hover:-translate-y-1">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-2xl font-serif font-bold text-primary">
                          {category.name.charAt(0)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Brand Story */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
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
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
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
              <div className="absolute -bottom-6 -left-6 bg-card rounded-xl p-6 shadow-card">
                <div className="text-4xl font-serif font-bold text-primary">25+</div>
                <div className="text-sm text-muted-foreground">Years of Trust</div>
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
