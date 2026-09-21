import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category } from '@/types';

export function useProducts(categorySlug?: string) {
  return useQuery({
    queryKey: ['products', categorySlug],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .or('is_active.eq.true,is_active.is.null')
        .order('created_at', { ascending: false });

      if (categorySlug) {
        const { data: category } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', categorySlug)
          .single();
        
        if (category) {
          query = query.eq('category_id', category.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      // 1. First attempt to fetch products marked as is_featured
      const { data: featured, error: featError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .or('is_active.eq.true,is_active.is.null')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (!featError && featured && featured.length > 0) {
        return featured as Product[];
      }

      // 2. Smart fallback: if no products are explicitly marked featured, display the top store products
      const { data: fallback, error: fallError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .or('is_active.eq.true,is_active.is.null')
        .order('created_at', { ascending: false })
        .limit(6);

      if (fallError) throw fallError;
      return (fallback || []) as Product[];
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as Product;
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Category[];
    },
  });
}
