import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, ShoppingCart, Gift } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getImageUrl } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';

interface ProductCardProps {
  product: {
    id: number;
    name_en: string;
    name_ar: string;
    slug: string;
    image: string;
    category_name_en: string;
    category_name_ar: string;
    min_price: number;
    avg_rating: number;
    review_count: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [imageError, setImageError] = useState(false);

  const name = language === 'ar' ? product.name_ar : product.name_en;
  const categoryName = language === 'ar' ? product.category_name_ar : product.category_name_en;
  const rating = product.avg_rating || 0;
  const imageUrl = getImageUrl(product.image);

  return (
    <Link href={`/product/${product.slug}`} aria-label={`View ${name} gift card details`} className="group block h-full">
      <div className="glass-card h-full flex flex-col overflow-hidden relative">
        {/* Image Container */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-dark-900">
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent z-10 opacity-60"></div>
          
          {imageUrl && !imageError ? (
            <img 
              src={imageUrl} 
              alt={name}
              loading="lazy"
              decoding="async"
              onError={() => setImageError(true)}
              className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-dark-800 to-dark-900 text-dark-300 gap-2 p-4 text-center">
              <Gift className="w-10 h-10 text-primary-400 opacity-60" />
              <span className="text-xs font-semibold text-dark-200">{name}</span>
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute top-3 left-3 z-20">
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-dark-900/80 backdrop-blur-md text-white rounded-full border border-white/10">
              {categoryName}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-grow relative z-20 -mt-12 bg-gradient-to-t from-dark-800 via-dark-800 to-transparent pt-12">
          <h3 className="text-lg font-bold text-white mb-1 line-clamp-1 group-hover:text-primary-400 transition-colors">
            {name}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center gap-1 mb-4">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? 'fill-current' : 'text-dark-600'}`} />
              ))}
            </div>
            <span className="text-xs text-dark-300">({product.review_count || 0})</span>
          </div>

          <div className="mt-auto flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-dark-300 uppercase tracking-wider">Starting at</span>
              <span className="text-xl font-bold text-white">
                {product.min_price ? formatPrice(product.min_price) : 'N/A'}
              </span>
            </div>
            
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-primary-500 group-hover:border-primary-500 transition-colors">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="glass-card h-full flex flex-col overflow-hidden relative">
      <div className="relative aspect-[3/4] w-full bg-dark-900 overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="p-5 flex flex-col flex-grow relative z-20 -mt-12 bg-gradient-to-t from-dark-800 via-dark-800 to-transparent pt-12">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/3 mb-4" />
        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}
