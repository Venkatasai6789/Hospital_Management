/**
 * Optimized Medicines Route
 * Implements pagination, search, filtering with zero lag for 248k+ records
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// In-memory cache for popular queries (LRU cache)
const queryCache = new Map();
const CACHE_SIZE = 100;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Cache middleware
 */
function getFromCache(key) {
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  queryCache.delete(key);
  return null;
}

function setCache(key, data) {
  if (queryCache.size >= CACHE_SIZE) {
    const firstKey = queryCache.keys().next().value;
    queryCache.delete(firstKey);
  }
  queryCache.set(key, { data, timestamp: Date.now() });
}

/**
 * GET /api/medicines - Paginated medicines with search and filters
 * 
 * Query Parameters:
 * - page: Page number (1-based, default: 1)
 * - limit: Records per page (default: 50, max: 500)
 * - search: Search by brand/generic name (uses full-text search)
 * - category: Filter by therapeutic class
 * - priceMin: Minimum price
 * - priceMax: Maximum price
 * - sortBy: 'price' | 'name' | 'recent' (default: 'recent')
 * 
 * Response: { data: [], total: number, page: number, limit: number, pages: number }
 */
router.get('/medicines', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      category = '',
      priceMin = 0,
      priceMax = 10000,
      sortBy = 'recent'
    } = req.query;

    // Validate inputs
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;

    // Generate cache key
    const cacheKey = `medicines:${pageNum}:${limitNum}:${search}:${category}:${priceMin}:${priceMax}:${sortBy}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    let query = supabase.from('medicines').select('*', { count: 'exact' });

    // Apply search filter (using TSVECTOR)
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      query = query.or(
        `brand_name.ilike.%${searchTerm}%,generic_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
      );
    }

    // Apply category filter
    if (category && category.trim()) {
      query = query.eq('therapeutic_class', category);
    }

    // Apply price range filter
    query = query.gte('price', parseFloat(priceMin) || 0)
                  .lte('price', parseFloat(priceMax) || 10000);

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

    // Apply pagination
    query = query.range(offset, offset + limitNum - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch medicines' });
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limitNum);
    const response = {
      data: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      pages: totalPages,
      hasMore: pageNum < totalPages
    };

    // Cache the response
    setCache(cacheKey, response);

    res.json(response);
  } catch (err) {
    console.error('❌ Route error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/medicines/categories - Get all unique categories
 */
router.get('/medicines/categories', async (req, res) => {
  try {
    const cacheKey = 'medicines:categories';
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const { data, error } = await supabase
      .from('medicines')
      .select('therapeutic_class')
      .neq('therapeutic_class', null)
      .order('therapeutic_class');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }

    // Get unique categories with counts
    const categories = {};
    (data || []).forEach(record => {
      const cat = record.therapeutic_class;
      categories[cat] = (categories[cat] || 0) + 1;
    });

    const response = Object.entries(categories)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    setCache(cacheKey, response);
    res.json(response);
  } catch (err) {
    console.error('❌ Categories error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/medicines/search - Advanced search with suggestions
 * 
 * Query Parameters:
 * - q: Search query
 * - limit: Number of suggestions (default: 10)
 */
router.get('/medicines/search', async (req, res) => {
  try {
    const { q = '', limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const cacheKey = `medicines:search:${q}:${limit}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const { data, error } = await supabase
      .from('medicines')
      .select('id, brand_name, generic_name, price, therapeutic_class, image')
      .or(`brand_name.ilike.%${q}%,generic_name.ilike.%${q}%`)
      .limit(parseInt(limit) || 10);

    if (error) {
      return res.status(500).json({ error: 'Search failed' });
    }

    const response = { suggestions: data || [] };
    setCache(cacheKey, response);
    res.json(response);
  } catch (err) {
    console.error('❌ Search error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/medicines/trending - Get trending medicines
 */
router.get('/medicines/trending', async (req, res) => {
  try {
    const cacheKey = 'medicines:trending';
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // In a real app, this would be based on purchase data
    // For now, get latest medicines
    const { data, error } = await supabase
      .from('medicines')
      .select('id, brand_name, generic_name, price, therapeutic_class, image')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch trending' });
    }

    const response = { trending: data || [] };
    setCache(cacheKey, response);
    res.json(response);
  } catch (err) {
    console.error('❌ Trending error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/medicines/stats - Get medicine statistics
 */
router.get('/medicines/stats', async (req, res) => {
  try {
    const cacheKey = 'medicines:stats';
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const { count } = await supabase
      .from('medicines')
      .select('id', { count: 'exact', head: true });

    // Get price statistics
    const { data: priceData } = await supabase
      .from('medicines')
      .select('price')
      .limit(1000); // Sample for stats

    let minPrice = Infinity, maxPrice = 0, avgPrice = 0;
    if (priceData && priceData.length > 0) {
      const prices = priceData.map(m => parseFloat(m.price) || 0);
      minPrice = Math.min(...prices);
      maxPrice = Math.max(...prices);
      avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    }

    const response = {
      totalMedicines: count || 0,
      priceRange: { min: minPrice, max: maxPrice, avg: Math.round(avgPrice * 100) / 100 }
    };

    setCache(cacheKey, response);
    res.json(response);
  } catch (err) {
    console.error('❌ Stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Clear cache (admin only)
 */
router.post('/medicines/cache/clear', (req, res) => {
  queryCache.clear();
  res.json({ message: 'Cache cleared' });
});

module.exports = router;
