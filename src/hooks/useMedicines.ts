/**
 * useMedicines Hook
 * Optimized hook for fetching medicines with caching, pagination, and Error boundary
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../config/supabase';

interface UseMedicinesResult {
  medicines: any[];
  total: number;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    pages: number;
    hasMore: boolean;
  };
  fetchMedicines: (
    page: number,
    search?: string,
    category?: string,
    sortBy?: string,
    priceMin?: number,
    priceMax?: number
  ) => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  reset: () => void;
}

// LRU Cache for medicines queries
class MedicinesCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private maxSize = 50;
  private ttl = 5 * 60 * 1000; // 5 minutes

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key: string, data: any) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear() {
    this.cache.clear();
  }

  getCacheKey(page: number, search: string, category: string, sortBy: string, priceMin: number, priceMax: number) {
    return `med:${page}:${search}:${category}:${sortBy}:${priceMin}:${priceMax}`;
  }
}

const medicinesCache = new MedicinesCache();

export const useMedicines = (initialLimit = 50): UseMedicinesResult => {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: initialLimit,
    pages: 0,
    hasMore: false
  });

  const currentQueryRef = useRef({
    page: 1,
    search: '',
    category: '',
    sortBy: 'recent',
    priceMin: 0,
    priceMax: 10000
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Fetch medicines with pagination and filters
   */
  const fetchMedicines = useCallback(
    async (
      page: number,
      search: string = '',
      category: string = '',
      sortBy: string = 'recent',
      priceMin: number = 0,
      priceMax: number = 10000
    ) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const cacheKey = medicinesCache.getCacheKey(page, search, category, sortBy, priceMin, priceMax);
      const cached = medicinesCache.get(cacheKey);

      if (cached) {
        console.log('✨ Using cached medicines data');
        setMedicines(cached.medicines);
        setTotal(cached.total);
        setPagination(cached.pagination);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const offset = (page - 1) * initialLimit;

        // Build query
        let query = supabase.from('medicines').select('*', { count: 'exact' });

        // Apply filters
        if (search.trim()) {
          const searchTerm = search.trim().toLowerCase();
          query = query.or(
            `brand_name.ilike.%${searchTerm}%,generic_name.ilike.%${searchTerm}%`
          );
        }

        if (category.trim()) {
          query = query.eq('therapeutic_class', category);
        }

        query = query.gte('price', priceMin).lte('price', priceMax);

        // Apply sorting
        switch (sortBy) {
          case 'price':
            query = query.order('price', { ascending: true });
            break;
          case 'name':
            query = query.order('brand_name', { ascending: true });
            break;
          case 'recent':
          default:
            query = query.order('created_at', { ascending: false });
        }

        // Paginate
        query = query.range(offset, offset + initialLimit - 1);

        const { data, error: queryError, count } = await query;

        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        if (queryError) {
          setError(`Failed to fetch medicines: ${queryError.message}`);
          console.error('❌ Database error:', queryError);
          return;
        }

        const pages = Math.ceil((count || 0) / initialLimit);
        const newPagination = {
          page,
          limit: initialLimit,
          pages,
          hasMore: page < pages
        };

        setMedicines(data || []);
        setTotal(count || 0);
        setPagination(newPagination);

        // Cache the result
        medicinesCache.set(cacheKey, {
          medicines: data || [],
          total: count || 0,
          pagination: newPagination
        });

        currentQueryRef.current = { page, search, category, sortBy, priceMin, priceMax };

        console.log(`✅ Fetched ${data?.length || 0} medicines (Page ${page}/${pages})`);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError('An unexpected error occurred');
          console.error('❌ Exception:', err);
        }
      } finally {
        setLoading(false);
      }
    },
    [initialLimit]
  );

  /**
   * Navigate to next page
   */
  const nextPage = useCallback(async () => {
    if (pagination.hasMore) {
      const nextPageNum = pagination.page + 1;
      await fetchMedicines(
        nextPageNum,
        currentQueryRef.current.search,
        currentQueryRef.current.category,
        currentQueryRef.current.sortBy,
        currentQueryRef.current.priceMin,
        currentQueryRef.current.priceMax
      );
    }
  }, [pagination, fetchMedicines]);

  /**
   * Navigate to previous page
   */
  const prevPage = useCallback(async () => {
    if (pagination.page > 1) {
      const prevPageNum = pagination.page - 1;
      await fetchMedicines(
        prevPageNum,
        currentQueryRef.current.search,
        currentQueryRef.current.category,
        currentQueryRef.current.sortBy,
        currentQueryRef.current.priceMin,
        currentQueryRef.current.priceMax
      );
    }
  }, [pagination, fetchMedicines]);

  /**
   * Go to specific page
   */
  const goToPage = useCallback(
    async (pageNum: number) => {
      await fetchMedicines(
        pageNum,
        currentQueryRef.current.search,
        currentQueryRef.current.category,
        currentQueryRef.current.sortBy,
        currentQueryRef.current.priceMin,
        currentQueryRef.current.priceMax
      );
    },
    [fetchMedicines]
  );

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    medicinesCache.clear();
    setMedicines([]);
    setTotal(0);
    setPagination({ page: 1, limit: initialLimit, pages: 0, hasMore: false });
    currentQueryRef.current = { page: 1, search: '', category: '', sortBy: 'recent', priceMin: 0, priceMax: 10000 };
  }, [initialLimit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    medicines,
    total,
    loading,
    error,
    pagination,
    fetchMedicines,
    nextPage,
    prevPage,
    goToPage,
    reset
  };
};

export default useMedicines;
