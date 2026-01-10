import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/product/ProductCard';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get('category') || undefined;
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { data: products, isLoading } = useProducts(categorySlug);
  const { data: categories } = useCategories();

  const handleCategoryChange = (slug: string | null) => {
    if (slug) {
      searchParams.set('category', slug);
    } else {
      searchParams.delete('category');
    }
    setSearchParams(searchParams);
    setMobileFiltersOpen(false);
  };

  const currentCategory = categories?.find((c) => c.slug === categorySlug);

  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-warm py-12 md:py-16 border-b border-border">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-4">
              {currentCategory ? currentCategory.name : 'All Products'}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {currentCategory?.description ||
                'Explore our complete collection of premium, authentic Indian masalas and spices.'}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4">
            <Button
              variant="outline"
              onClick={() => setMobileFiltersOpen(true)}
              className="w-full"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {categorySlug && (
                <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                  1
                </span>
              )}
            </Button>
          </div>

          {/* Mobile Filters Drawer */}
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-foreground/50"
                onClick={() => setMobileFiltersOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                className="absolute inset-y-0 left-0 w-72 bg-background p-6 shadow-elevated"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif text-lg font-semibold">Filters</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileFiltersOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => handleCategoryChange(null)}
                    className={cn(
                      'block w-full text-left px-4 py-2.5 rounded-lg transition-colors text-sm',
                      !categorySlug
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    All Products
                  </button>
                  {categories?.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.slug)}
                      className={cn(
                        'block w-full text-left px-4 py-2.5 rounded-lg transition-colors text-sm',
                        categorySlug === category.slug
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      )}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 bg-card rounded-xl p-6 shadow-soft">
              <h3 className="font-serif text-lg font-semibold mb-4">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => handleCategoryChange(null)}
                  className={cn(
                    'block w-full text-left px-4 py-2.5 rounded-lg transition-colors text-sm',
                    !categorySlug
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  All Products
                </button>
                {categories?.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.slug)}
                    className={cn(
                      'block w-full text-left px-4 py-2.5 rounded-lg transition-colors text-sm',
                      categorySlug === category.slug
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-foreground'
                    )}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <main>
            {/* Active Filters */}
            {categorySlug && (
              <div className="mb-6 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Showing:</span>
                <button
                  onClick={() => handleCategoryChange(null)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full hover:bg-primary/20 transition-colors"
                >
                  {currentCategory?.name}
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
            ) : products && products.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-6">
                  {products.length} product{products.length !== 1 ? 's' : ''} found
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">No products found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try selecting a different category
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
}
