"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Star, ShieldCheck, Zap, AlertCircle, ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fetchApi, getImageUrl } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { ProductReviews } from '@/components/reviews/ProductReviews';

export default function ProductPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { formatPrice, convertPrice } = useCurrency();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Selection State
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [selectedValueId, setSelectedValueId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetchApi(`/products/${slug}`);
        setProduct(res.product);
        
        // Auto-select first region and first value if available
        if (res.product.regions && res.product.regions.length > 0) {
          const firstRegion = res.product.regions[0];
          setSelectedRegionId(firstRegion.id);
          if (firstRegion.values && firstRegion.values.length > 0) {
            setSelectedValueId(firstRegion.values[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load product', error);
        toast.error('Product not found');
        router.push('/shop');
      } finally {
        setIsLoading(false);
      }
    }
    
    if (slug) {
      loadProduct();
    }
  }, [slug, router]);

  // Derived state
  const selectedRegion = product?.regions?.find((r: any) => r.id === selectedRegionId);
  const selectedValue = selectedRegion?.values?.find((v: any) => v.id === selectedValueId);
  const inStock = selectedValue?.stock > 0;

  // Handle region change
  const handleRegionChange = (regionId: number) => {
    setSelectedRegionId(regionId);
    const region = product.regions.find((r: any) => r.id === regionId);
    if (region && region.values.length > 0) {
      setSelectedValueId(region.values[0].id);
    } else {
      setSelectedValueId(null);
    }
    setQuantity(1);
  };

  const handleAddToCart = () => {
    if (!product || !selectedRegion || !selectedValue) return;

    if (quantity > 99) {
      toast.error(`Maximum 99 items allowed per order.`);
      return;
    }

    addToCart({
      productId: product.id,
      productNameEn: product.name_en,
      productNameAr: product.name_ar,
      image: product.image,
      regionId: selectedRegion.region_id,
      regionName: language === 'ar' ? selectedRegion.region_name_ar : selectedRegion.region_name_en,
      regionCode: selectedRegion.region_code,
      currencyCode: selectedRegion.currency_code,
      faceValue: selectedValue.face_value,
      priceUsd: selectedValue.discount_price_usd || selectedValue.price_usd,
      originalPriceUsd: selectedValue.discount_price_usd ? selectedValue.price_usd : null,
      quantity,
      giftCardValueId: selectedValue.id,
    });

    toast.success('Added to cart!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow page-container py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) return null;

  const title = language === 'ar' ? product.name_ar : product.name_en;
  const description = language === 'ar' ? product.description_ar : product.description_en;
  const categoryName = language === 'ar' ? product.category_name_ar : product.category_name_en;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pb-20">
        {/* Breadcrumb */}
        <div className="bg-dark-900 border-b border-dark-800">
          <div className="page-container py-4">
            <div className="flex items-center gap-2 text-sm text-dark-400">
              <Link href="/" className="hover:text-primary-400 transition-colors">{t('common.home')}</Link>
              <span>/</span>
              <Link href={`/shop?category=${product.category_slug}`} className="hover:text-primary-400 transition-colors">{categoryName}</Link>
              <span>/</span>
              <span className="text-white truncate">{title}</span>
            </div>
          </div>
        </div>

        <div className="page-container pt-8 md:pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left: Image Gallery */}
            <div className="lg:col-span-5 space-y-4">
              <div className="glass-card aspect-[3/4] md:aspect-square relative overflow-hidden flex items-center justify-center p-8">
                {product.image ? (
                  <img src={getImageUrl(product.image)} alt={title} className="w-full h-full object-contain rounded-xl drop-shadow-2xl" />
                ) : (
                  <div className="text-dark-500">No Image</div>
                )}
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.best_seller === 1 && <Badge variant="warning" className="px-3 py-1 bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold backdrop-blur-md">BEST SELLER</Badge>}
                  {product.featured === 1 && <Badge variant="primary" className="px-3 py-1 font-bold backdrop-blur-md">FEATURED</Badge>}
                </div>
              </div>
              
              {/* Trust Indicators */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="text-sm">
                    <div className="text-white font-medium">Secure</div>
                    <div className="text-dark-400 text-xs">Verified Vendor</div>
                  </div>
                </div>
                <div className="glass-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-400 shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="text-sm">
                    <div className="text-white font-medium">Instant</div>
                    <div className="text-dark-400 text-xs">WhatsApp Delivery</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Product Details & Configurator */}
            <div className="lg:col-span-7">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{title}</h1>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="font-bold">{product.avg_rating || 0}</span>
                </div>
                <span className="text-dark-400">({product.review_count || 0} {t('product.reviews')})</span>
                <span className="text-dark-600">•</span>
                <span className="text-primary-400 font-medium">{categoryName}</span>
              </div>

              {/* The Region & Value Configurator */}
              <div className="glass-card p-6 md:p-8 mb-8 space-y-8 border-primary-500/20 shadow-glow-sm">
                
                {/* STEP 1: REGION */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-xs">1</span>
                      {t('product.select_region')}
                    </h3>
                  </div>
                  
                  {product.regions && product.regions.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {product.regions.map((region: any) => {
                        const isSelected = region.id === selectedRegionId;
                        return (
                          <button
                            key={region.id}
                            onClick={() => handleRegionChange(region.id)}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                              isSelected 
                                ? 'bg-primary-500/20 border-primary-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                                : 'bg-dark-900 border-dark-700 hover:border-primary-500/50 hover:bg-dark-800'
                            }`}
                          >
                            <span className="text-2xl drop-shadow-md">{region.flag_emoji}</span>
                            <div>
                              <div className={`font-medium ${isSelected ? 'text-white' : 'text-dark-300'}`}>
                                {language === 'ar' ? region.region_name_ar : region.region_name_en}
                              </div>
                              <div className="text-xs text-dark-400 font-mono">{region.currency_code}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-300">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p>This product is currently not available in any region.</p>
                    </div>
                  )}
                </div>

                {/* STEP 2: VALUE */}
                {selectedRegion && (
                  <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-xs">2</span>
                        {t('product.select_value')}
                      </h3>
                      <Badge variant="primary" className="font-mono text-sm px-3">
                        Currency: {selectedRegion.currency_code}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {selectedRegion.values.map((val: any) => {
                        const isSelected = val.id === selectedValueId;
                        const isOutOfStock = val.stock === 0;
                        return (
                          <button
                            key={val.id}
                            onClick={() => !isOutOfStock && setSelectedValueId(val.id)}
                            disabled={isOutOfStock}
                            className={`relative p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                              isSelected 
                                ? 'bg-secondary-500/20 border-secondary-500 shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
                                : isOutOfStock
                                  ? 'bg-dark-900 border-dark-800 opacity-50 cursor-not-allowed'
                                  : 'bg-dark-900 border-dark-700 hover:border-secondary-500/50 hover:bg-dark-800'
                            }`}
                          >
                            <span className={`text-xl font-bold ${isSelected ? 'text-white' : isOutOfStock ? 'text-dark-500' : 'text-dark-300'}`}>
                              {val.face_value}
                            </span>
                            {val.discount_price_usd && !isOutOfStock && (
                              <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-bold rounded shadow-lg whitespace-nowrap">
                                SALE
                              </span>
                            )}
                            {isOutOfStock && (
                              <span className="absolute -top-2 right-[-5px] px-1.5 py-0.5 bg-dark-700 text-dark-300 text-[9px] font-bold rounded shadow-lg transform rotate-12 border border-dark-600">
                                OUT OF STOCK
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="divider"></div>

                {/* STEP 3: SUMMARY & ADD TO CART */}
                {selectedValue && (
                  <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-6 animate-fade-in">
                    <div>
                      <div className="text-dark-400 mb-1">Total Price</div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-extrabold gradient-text">
                          {formatPrice((selectedValue.discount_price_usd || selectedValue.price_usd) * quantity)}
                        </span>
                        {selectedValue.discount_price_usd && (
                          <span className="text-xl font-bold text-dark-500 line-through">
                            {formatPrice(selectedValue.price_usd * quantity)}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium mt-1">
                        {inStock ? (
                          <span className="text-emerald-400 flex items-center gap-1"><CheckIcon /> {t('product.in_stock')}</span>
                        ) : (
                          <span className="text-rose-400">{t('product.out_of_stock')}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="flex items-center bg-dark-900 border border-dark-700 rounded-xl overflow-hidden h-14">
                        <button 
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="px-4 h-full text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
                        >-</button>
                        <span className="w-10 text-center font-bold text-white">{quantity}</span>
                        <button 
                          onClick={() => setQuantity(Math.min(99, quantity + 1))}
                          className="px-4 h-full text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
                        >+</button>
                      </div>
                      
                      <button 
                        onClick={handleAddToCart}
                        disabled={!inStock}
                        className={`flex-grow sm:flex-grow-0 h-14 px-8 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                          inStock 
                            ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:shadow-glow transform hover:-translate-y-1' 
                            : 'bg-dark-800 text-dark-500 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingCart className="w-5 h-5" />
                        {t('product.add_to_cart')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="mt-12">
                <div className="flex border-b border-dark-800 mb-6 overflow-x-auto hide-scrollbar">
                  <button 
                    onClick={() => setActiveTab('description')}
                    className={`px-6 py-3 font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'description' ? 'border-primary-500 text-white' : 'border-transparent text-dark-400 hover:text-white'}`}
                  >
                    {t('product.description')}
                  </button>
                  <button 
                    onClick={() => setActiveTab('how_to_use')}
                    className={`px-6 py-3 font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'how_to_use' ? 'border-primary-500 text-white' : 'border-transparent text-dark-400 hover:text-white'}`}
                  >
                    How to Redeem
                  </button>
                  <button 
                    onClick={() => setActiveTab('reviews')}
                    className={`px-6 py-3 font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'reviews' ? 'border-primary-500 text-white' : 'border-transparent text-dark-400 hover:text-white'}`}
                  >
                    {t('product.reviews')} ({product.review_count || 0})
                  </button>
                </div>

                <div className="prose prose-invert max-w-none prose-p:text-dark-300 prose-headings:text-white">
                  {activeTab === 'description' && (
                    <div dangerouslySetInnerHTML={{ __html: description || 'No description available.' }} />
                  )}
                  {activeTab === 'how_to_use' && (
                    <div>
                      <p>1. Receive your unique code via WhatsApp instantly after purchase.</p>
                      <p>2. Open your console, app, or website.</p>
                      <p>3. Navigate to "Redeem Code" or "Add Funds".</p>
                      <p>4. Enter the code carefully exactly as shown.</p>
                      <p>5. Enjoy your new balance or subscription!</p>
                      <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
                        Note: Ensure you are redeeming the code on an account matching the region you purchased.
                      </div>
                    </div>
                  )}
                  {activeTab === 'reviews' && (
                    <ProductReviews productId={product.id} />
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}
