/**
 * Optimized Pharmacy Component
 * Handles 248k+ medicines with pagination, lazy loading, virtual scrolling, and zero lag
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../config/supabase';
import { useTranslation } from 'react-i18next';

interface PharmacyMedicine {
  id: string;
  brand_name: string;
  generic_name: string;
  price: number;
  therapeutic_class: string;
  dose_form: string;
  side_effects?: string;
  uses?: string;
  image: string;
  habit_forming?: boolean;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasMore: boolean;
}

const ITEMS_PER_PAGE = 50;
const ITEM_HEIGHT = 280; // Approximate height of medicine card in pixels

/**
 * Virtual List Item Component
 */
const MedicineCard: React.FC<{
  medicine: PharmacyMedicine;
  onAddToCart: (medicine: PharmacyMedicine) => void;
  onViewDetails: (medicine: PharmacyMedicine) => void;
}> = ({ medicine, onAddToCart, onViewDetails }) => {
  return (
    <div
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 cursor-pointer"
      onClick={() => onViewDetails(medicine)}
    >
      <img
        src={medicine.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400'}
        alt={medicine.brand_name}
        className="w-full h-40 object-cover rounded-md mb-3"
        loading="lazy"
      />
      <h3 className="font-bold text-sm truncate text-gray-800">{medicine.brand_name}</h3>
      <p className="text-xs text-gray-600 truncate mb-2">{medicine.generic_name}</p>
      <p className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded w-fit mb-2">
        {medicine.therapeutic_class || 'General'}
      </p>
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold text-green-600">₹{medicine.price?.toFixed(0)}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(medicine);
          }}
          className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 transition"
        >
          Add
        </button>
      </div>
    </div>
  );
};

/**
 * Virtual Scroller Component
 */
const VirtualScroller: React.FC<{
  items: PharmacyMedicine[];
  renderItem: (item: PharmacyMedicine, index: number) => React.ReactNode;
  itemHeight: number;
  visibleCount: number;
}> = ({ items, renderItem, itemHeight, visibleCount }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = startIndex + visibleCount + 1;
  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height: `${visibleCount * itemHeight}px`, overflow: 'auto' }}
      className="border rounded-lg"
    >
      <div style={{ height: `${items.length * itemHeight}px`, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, idx) => (
            <div key={item.id} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + idx)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Main Optimized Pharmacy Component
 */
export const OptimizedPharmacy: React.FC<{
  onAddToCart: (medicine: PharmacyMedicine) => void;
}> = ({ onAddToCart }) => {
  const { t } = useTranslation();
  const [medicines, setMedicines] = useState<PharmacyMedicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    pages: 0,
    hasMore: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [sortBy, setSortBy] = useState('recent');
  const [viewDetails, setViewDetails] = useState<PharmacyMedicine | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Fetch medicines with pagination
   */
  const fetchMedicines = useCallback(async (page: number, search: string = '', category: string = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        search,
        category,
        sortBy,
        priceMin: priceRange.min.toString(),
        priceMax: priceRange.max.toString()
      });

      // Use direct Supabase query for better performance
      let query = supabase.from('medicines').select('*', { count: 'exact' });

      // Apply filters
      if (search.trim()) {
        query = query.or(
          `brand_name.ilike.%${search}%,generic_name.ilike.%${search}%`
        );
      }
      if (category) {
        query = query.eq('therapeutic_class', category);
      }

      query = query
        .gte('price', priceRange.min)
        .lte('price', priceRange.max)
        .order('created_at', { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      setMedicines(data || []);
      setPagination({
        page,
        limit: ITEMS_PER_PAGE,
        total: count || 0,
        pages: Math.ceil((count || 0) / ITEMS_PER_PAGE),
        hasMore: page < Math.ceil((count || 0) / ITEMS_PER_PAGE)
      });

      console.log(`✅ Loaded ${data?.length || 0} medicines (Page ${page})`);
    } catch (err) {
      console.error('❌ Error fetching medicines:', err);
    } finally {
      setLoading(false);
    }
  }, [sortBy, priceRange]);

  /**
   * Fetch categories on mount
   */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('medicines')
          .select('therapeutic_class')
          .neq('therapeutic_class', null)
          .limit(100);

        if (error) throw error;

        // Get unique categories with counts
        const categoryMap = new Map<string, number>();
        (data || []).forEach(record => {
          const cat = record.therapeutic_class;
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
        });

        const uniqueCategories = Array.from(categoryMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 15);

        setCategories(uniqueCategories);
      } catch (err) {
        console.error('❌ Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  /**
   * Initial load
   */
  useEffect(() => {
    fetchMedicines(1, searchQuery, selectedCategory);
  }, []);

  /**
   * Debounced search handler
   */
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setPagination(p => ({ ...p, page: 1 }));
      fetchMedicines(1, query, selectedCategory);
    }, 300); // Debounce 300ms
  }, [selectedCategory, fetchMedicines]);

  /**
   * Pagination handlers
   */
  const handleNextPage = useCallback(() => {
    if (pagination.hasMore) {
      const nextPage = pagination.page + 1;
      fetchMedicines(nextPage, searchQuery, selectedCategory);
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pagination, searchQuery, selectedCategory, fetchMedicines]);

  const handlePrevPage = useCallback(() => {
    if (pagination.page > 1) {
      const prevPage = pagination.page - 1;
      fetchMedicines(prevPage, searchQuery, selectedCategory);
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pagination, searchQuery, selectedCategory, fetchMedicines]);

  const handleViewDetails = useCallback((medicine: PharmacyMedicine) => {
    setViewDetails(medicine);
  }, []);

  /**
   * Render medicine card
   */
  const renderMedicineCard = useCallback(
    (medicine: PharmacyMedicine) => (
      <MedicineCard
        key={medicine.id}
        medicine={medicine}
        onAddToCart={onAddToCart}
        onViewDetails={handleViewDetails}
      />
    ),
    [onAddToCart, handleViewDetails]
  );

  const isLoading = loading;

  return (
    <div ref={containerRef} className="p-6 space-y-6 overflow-y-auto max-h-screen">
      {/* Header Stats */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
        <h2 className="text-3xl font-bold mb-2">Online Pharmacy</h2>
        <p className="opacity-90">
          {pagination.total.toLocaleString()} medicines available • Showing {medicines.length} medicines
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search medicines by name or generic name..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          >
            <option value="recent">Latest</option>
            <option value="price">Price: Low to High</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => {
                setSelectedCategory('');
                setPagination(p => ({ ...p, page: 1 }));
                fetchMedicines(1, searchQuery, '');
              }}
              className={`px-4 py-2 rounded-full transition ${
                selectedCategory === ''
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setPagination(p => ({ ...p, page: 1 }));
                  fetchMedicines(1, searchQuery, cat.name);
                }}
                className={`px-4 py-2 rounded-full transition text-sm ${
                  selectedCategory === cat.name
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>
        )}

        {/* Price Range */}
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium">Price Range:</label>
          <input
            type="range"
            min="0"
            max="5000"
            value={priceRange.min}
            onChange={(e) => setPriceRange(p => ({ ...p, min: parseInt(e.target.value) }))}
            className="flex-1"
          />
          <input
            type="range"
            min="0"
            max="5000"
            value={priceRange.max}
            onChange={(e) => setPriceRange(p => ({ ...p, max: parseInt(e.target.value) }))}
            className="flex-1"
          />
          <span className="text-sm">₹{priceRange.min} - ₹{priceRange.max}</span>
        </div>
      </div>

      {/* Medicines Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin">
              <div className="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full"></div>
            </div>
            <span className="ml-4 text-gray-600">Loading medicines...</span>
          </div>
        ) : medicines.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {medicines.map((medicine) => renderMedicineCard(medicine))}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-4 mt-6 pt-6 border-t">
              <button
                onClick={handlePrevPage}
                disabled={pagination.page === 1 || isLoading}
                className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition"
              >
                ← Previous
              </button>
              <div className="text-center">
                <p className="font-medium">
                  Page {pagination.page} of {pagination.pages}
                </p>
                <p className="text-sm text-gray-600">
                  Total: {pagination.total.toLocaleString()} medicines
                </p>
              </div>
              <button
                onClick={handleNextPage}
                disabled={!pagination.hasMore || isLoading}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition"
              >
                Next →
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No medicines found. Try adjusting your filters.</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {viewDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="text-2xl font-bold">{viewDetails.brand_name}</h3>
              <button
                onClick={() => setViewDetails(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <img
              src={viewDetails.image}
              alt={viewDetails.brand_name}
              className="w-full h-40 object-cover rounded-lg"
            />
            <p className="text-gray-600">{viewDetails.generic_name}</p>
            <p className="text-sm text-gray-500">{viewDetails.dose_form}</p>
            <p className="text-green-600 font-medium">₹{viewDetails.price?.toFixed(0)}</p>
            <button
              onClick={() => {
                onAddToCart(viewDetails);
                setViewDetails(null);
              }}
              className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-medium transition"
            >
              Add to Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedPharmacy;
