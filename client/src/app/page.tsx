"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchApi } from '@/lib/api';
import { ProductCard } from '@/components/store/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function Home() {
  const { t, language } = useLanguage();
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [featuredRes, bestSellersRes, categoriesRes] = await Promise.all([
          fetchApi('/products/featured?limit=4').catch(() => ({ products: [] })),
          fetchApi('/products/best-sellers?limit=8').catch(() => ({ products: [] })),
          fetchApi('/categories').catch(() => ({ categories: [] }))
        ]);

        setFeaturedProducts(featuredRes.products || []);
        setBestSellers(bestSellersRes.products || []);
        setCategories(categoriesRes.categories || []);
      } catch (error) {
        console.error('Failed to load home data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-hero-gradient opacity-10"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px] animate-pulse-glow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/20 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
          
          <div className="page-container relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary-300 text-sm font-medium mb-8 animate-fade-in-up">
              <Sparkles className="w-4 h-4" />
              <span>The #1 Digital Marketplace</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <span className="text-balance">{t('home.hero_title')}</span>
            </h1>
            
            <p className="text-lg md:text-xl text-dark-300 max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              {t('home.hero_subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Link href="/shop" className="btn-primary w-full sm:w-auto text-lg px-8">
                {t('home.shop_now')}
              </Link>
              <Link href="/shop" className="btn-secondary w-full sm:w-auto text-lg px-8">
                Explore Categories
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 bg-dark-900 border-y border-dark-800">
          <div className="page-container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-center gap-4 p-6 glass-card">
                <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base mb-1">Instant Delivery</h2>
                  <p className="text-dark-300 text-sm">Get your codes immediately via WhatsApp</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-6 glass-card">
                <div className="w-12 h-12 rounded-full bg-secondary-500/20 flex items-center justify-center text-secondary-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base mb-1">Secure Payments</h2>
                  <p className="text-dark-300 text-sm">100% safe and encrypted transactions</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-6 glass-card">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base mb-1">Best Prices</h2>
                  <p className="text-dark-300 text-sm">Unbeatable deals on all top brands</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="section">
          <div className="page-container">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="section-title">{t('home.featured_products')}</h2>
                <p className="section-subtitle">Handpicked deals just for you</p>
              </div>
              <Link href="/shop?featured=true" aria-label="View all featured products" className="hidden sm:flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium transition-colors">
                {t('home.view_all')} <ArrowRight className="w-4 h-4 rtl-flip" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4] w-full" />
                ))
              ) : featuredProducts.length > 0 ? (
                featuredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-dark-300 bg-dark-900 rounded-2xl border border-dark-800">
                  No featured products available.
                </div>
              )}
            </div>
            
            <div className="mt-8 text-center sm:hidden">
              <Link href="/shop?featured=true" aria-label="View all featured products" className="btn-secondary w-full">
                {t('home.view_all')}
              </Link>
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        {categories.length > 0 && (
          <section className="section bg-dark-900 border-y border-dark-800 relative overflow-hidden">
            <div className="page-container">
              <h2 className="section-title text-center mb-12">{t('home.categories')}</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map((cat: any) => {
                  const catName = language === 'ar' ? cat.name_ar : cat.name_en;
                  return (
                    <Link href={`/shop?category=${cat.slug}`} key={cat.id} aria-label={`Explore ${catName} category`} className="group relative aspect-square overflow-hidden rounded-2xl border border-white/5">
                      {cat.image ? (
                        <img src={cat.image} alt={catName} className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-dark-800 to-dark-900" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/60 to-transparent"></div>
                      <div className="absolute inset-0 p-6 flex flex-col justify-end">
                        <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors">
                          {catName}
                        </h3>
                        <p className="text-sm text-dark-300 mt-1">{cat.product_count} products</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Best Sellers */}
        <section className="section">
          <div className="page-container">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="section-title">{t('home.best_sellers')}</h2>
                <p className="section-subtitle">Our most popular gift cards</p>
              </div>
              <Link href="/shop?best_seller=true" aria-label="View all best seller gift cards" className="hidden sm:flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium transition-colors">
                {t('home.view_all')} <ArrowRight className="w-4 h-4 rtl-flip" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4] w-full" />
                ))
              ) : bestSellers.length > 0 ? (
                bestSellers.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-dark-300 bg-dark-900 rounded-2xl border border-dark-800">
                  No products available.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
