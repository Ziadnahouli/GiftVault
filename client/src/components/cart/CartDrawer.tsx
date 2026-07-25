"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';

export function CartDrawer() {
  const { isCartOpen, setIsCartOpen, items, updateQuantity, removeFromCart, subtotalUsd } = useCart();
  const { formatPrice } = useCurrency();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleCheckout = () => {
    setIsCartOpen(false);
    router.push('/checkout');
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-[100] transition-opacity duration-300 ${
          isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div 
        className={`fixed top-0 bottom-0 ${language === 'ar' ? 'left-0' : 'right-0'} w-full max-w-md bg-dark-900 border-${language === 'ar' ? 'r' : 'l'} border-dark-800 z-[101] shadow-2xl flex flex-col transition-transform duration-300 transform ${
          isCartOpen ? 'translate-x-0' : language === 'ar' ? '-translate-x-full' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" /> {t('cart.title')}
          </h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="w-8 h-8 rounded-full bg-dark-800 hover:bg-dark-700 flex items-center justify-center text-dark-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-grow overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-dark-400">
              <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg">{t('cart.empty')}</p>
              <button 
                onClick={() => {
                  setIsCartOpen(false);
                  router.push('/shop');
                }}
                className="mt-6 text-primary-400 hover:text-primary-300 font-medium"
              >
                {t('cart.continue_shopping')}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  {/* Image */}
                  <div className="w-20 h-24 bg-dark-800 rounded-lg flex-shrink-0 relative overflow-hidden border border-white/5">
                    {item.image ? (
                      <img src={item.image} alt={item.productNameEn} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-dark-500">No Image</div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-white text-sm line-clamp-1">
                          {language === 'ar' ? item.productNameAr : item.productNameEn}
                        </h4>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-dark-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-dark-800 text-dark-300 border border-dark-700">
                          {item.regionCode}
                        </span>
                        <span className="text-xs font-mono text-dark-400">{item.faceValue} {item.currencyCode}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-primary-400">
                        {formatPrice(item.priceUsd * item.quantity)}
                      </div>
                      
                      <div className="flex items-center bg-dark-800 rounded-lg h-8 border border-dark-700">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-full flex items-center justify-center text-dark-300 hover:text-white"
                        >-</button>
                        <span className="w-8 text-center text-sm font-medium text-white">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-full flex items-center justify-center text-dark-300 hover:text-white"
                        >+</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 bg-dark-950 border-t border-dark-800">
            <div className="flex justify-between mb-4 text-dark-300">
              <span>{t('cart.subtotal')}</span>
              <span className="text-white font-bold text-lg">{formatPrice(subtotalUsd)}</span>
            </div>
            <button 
              onClick={handleCheckout}
              className="btn-primary w-full py-4 text-lg"
            >
              {t('cart.checkout')} <ArrowRight className="w-5 h-5 rtl-flip" />
            </button>
            <button 
              onClick={() => {
                setIsCartOpen(false);
                router.push('/cart');
              }}
              className="w-full text-center mt-4 text-sm text-dark-400 hover:text-white transition-colors"
            >
              View Full Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
