import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { Product } from '@/types';
import { useState } from 'react';

import { parseWeightVariants, formatVariantPriceDisplay } from '@/lib/weightVariants';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  const variants = parseWeightVariants(product.weight, product.price);
  const hasMultipleVariants = variants.length > 1;
  const priceDisplay = formatVariantPriceDisplay(variants, product.price);

  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultVariant = variants[0];
    addItem(product, quantity, defaultVariant?.weight, defaultVariant?.price);
    setQuantity(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link
        to={`/product/${product.slug}`}
        className="group block bg-card rounded-xl overflow-hidden shadow-soft hover:shadow-card transition-all duration-300"
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-secondary/30 flex items-center justify-center p-3">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-contain drop-shadow-sm transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-4xl font-serif">{product.name.charAt(0)}</span>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.is_featured && (
              <span className="px-2 py-1 text-xs font-medium bg-accent text-accent-foreground rounded">
                Featured
              </span>
            )}
            {discount > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded">
                {discount}% OFF
              </span>
            )}
          </div>

          {/* Stock Badge */}
          {product.stock <= 5 && product.stock > 0 && (
            <span className="absolute top-3 right-3 px-2 py-1 text-xs font-medium bg-destructive/90 text-destructive-foreground rounded">
              Only {product.stock} left
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category */}
          {product.category && (
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              {product.category.name}
            </span>
          )}
          
          {/* Name */}
          <h3 className="font-serif text-lg font-semibold mt-1 text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>
          
          {/* Weight / Pack Sizes */}
          {hasMultipleVariants ? (
            <div className="flex flex-wrap items-center gap-1 mt-1.5">
              {variants.map((v) => (
                <span
                  key={v.weight}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border/40"
                >
                  {v.weight}
                </span>
              ))}
            </div>
          ) : variants[0]?.weight ? (
            <p className="text-sm text-muted-foreground mt-1">{variants[0].weight}</p>
          ) : product.weight ? (
            <p className="text-sm text-muted-foreground mt-1">{product.weight}</p>
          ) : null}

          {/* Price */}
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-xl font-semibold text-primary">
              {priceDisplay.formatted}
            </span>
            {product.compare_at_price && (
              <span className="text-sm text-muted-foreground line-through">
                ₹{product.compare_at_price.toFixed(0)}
              </span>
            )}
          </div>

          {/* Add to Cart */}
          <div className="flex items-center gap-2 mt-4" onClick={(e) => e.preventDefault()}>
            <div className="flex items-center border border-border rounded-lg">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setQuantity(Math.max(1, quantity - 1));
                }}
                className="p-2 hover:bg-muted transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="px-3 text-sm font-medium min-w-[2rem] text-center">{quantity}</span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setQuantity(quantity + 1);
                }}
                className="p-2 hover:bg-muted transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <Button
              onClick={handleAddToCart}
              size="sm"
              className="flex-1"
              disabled={product.stock === 0}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              {product.stock === 0 ? 'Out of Stock' : 'Add'}
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
