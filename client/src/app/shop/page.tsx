"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, ChevronDown, Check } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProductCard, ProductCardSkeleton } from '@/components/store/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

function ShopContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentPage = searchParams.get('page') || '1';

  useEffect(() => {
    // Load categories
    fetchApi('/categories').then(res => setCategories(res.categories || []));
  }, []);

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (currentCategory) queryParams.set('category', currentCategory);
        if (currentSearch) queryParams.set('search', currentSearch);
        if (currentSort) queryParams.set('sort', currentSort);
        queryParams.set('page', currentPage);
        
        const res = await fetchApi(`/products?${queryParams.toString()}`);
        setProducts(res.products || []);
        setPagination(res.pagination || { page: 1, total: 0, pages: 1 });
      } catch (error) {
        console.error('Failed to fetch products', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadProducts();
  }, [currentCategory, currentSearch, currentSort, currentPage]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    if (key !== 'page') {
      params.delete('page');
    }
    router.push(`/shop?${params.toString()}`);
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest Arrivals' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow page-container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{t('common.shop')}</h1>
          <p className="text-dark-400">Find the perfect gift card for you or your loved ones.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Mobile Filter Toggle */}
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="lg:hidden w-full btn-secondary py-3 flex items-center justify-between"
          >
            <span className="flex items-center gap-2"><Filter className="w-5 h-5" /> Filters</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Sidebar / Filters */}
          <aside className={`lg:w-1/4 flex-shrink-0 space-y-6 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
            
            {/* Search */}
            <div className="glass-card p-5">
              <h3 className="text-white font-bold mb-4">Search</h3>
              <input
                type="text"
                placeholder={t('common.search')}
                value={currentSearch}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="input-field w-full"
              />
            </div>

            {/* Categories */}
            <div className="glass-card p-5">
              <h3 className="text-white font-bold mb-4">{t('home.categories')}</h3>
              <div className="space-y-2">
                <button
                  onClick={() => updateFilter('category', '')}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${!currentCategory ? 'bg-primary-500/20 text-primary-400' : 'text-dark-300 hover:bg-dark-800'}`}
                >
                  <span>All Categories</span>
                  {!currentCategory && <Check className="w-4 h-4" />}
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => updateFilter('category', cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${currentCategory === cat.slug ? 'bg-primary-500/20 text-primary-400' : 'text-dark-300 hover:bg-dark-800'}`}
                  >
                    <span>{language === 'ar' ? cat.name_ar : cat.name_en}</span>
                    {currentCategory === cat.slug && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

          </aside>

          {/* Product Grid */}
          <div className="flex-grow">
            
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-dark-800">
              <div className="text-dark-400 text-sm">
                Showing <span className="text-white font-medium">{products.length}</span> results
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-dark-400 text-sm">Sort by:</span>
                <select
                  value={currentSort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="bg-dark-900 border border-dark-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500 transition-colors cursor-pointer appearance-none min-w-[160px]"
                >
                  {sortOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {isLoading ? (
                Array(8).fill(0).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))
              ) : products.length > 0 ? (
                products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center text-dark-500 glass-card">
                  <p className="text-lg">No products found matching your criteria.</p>
                  <button 
                    onClick={() => router.push('/shop')}
                    className="btn-primary mt-4"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>

            {/* Pagination Placeholder (Basic) */}
            {!isLoading && pagination.pages > 1 && (
              <div className="mt-12 flex justify-center gap-2">
                {[...Array(pagination.pages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => updateFilter('page', (i + 1).toString())}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-medium transition-colors ${
                      pagination.page === i + 1 
                        ? 'bg-primary-500 text-white' 
                        : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-950 flex items-center justify-center"><Skeleton className="w-32 h-32 rounded-full" /></div>}>
      <ShopContent />
    </Suspense>
  );
}
