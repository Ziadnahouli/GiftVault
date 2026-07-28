"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchApi, getImageUrl } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function CheckoutPage() {
  const { items, subtotalUsd, clearCart } = useCart();
  const { currency, formatPrice, convertPrice } = useCurrency();
  const { t, language } = useLanguage();
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    whatsapp: '',
    country: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feeUsd = subtotalUsd * 0.05;
  const totalUsd = subtotalUsd + feeUsd;

  // If cart is empty, redirect to shop
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center text-center p-6">
          <ShoppingBag className="w-20 h-20 text-dark-700 mb-6" />
          <h1 className="text-2xl font-bold text-white mb-2">{t('cart.empty')}</h1>
          <p className="text-dark-400 mb-8">Add items to your cart before checking out.</p>
          <Link href="/shop" className="btn-primary px-8">
            {t('common.shop')}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.whatsapp) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create order in database
      const orderPayload = {
        full_name: formData.fullName,
        email: formData.email,
        whatsapp: formData.whatsapp,
        country: formData.country,
        notes: formData.notes,
        display_currency: currency,
        items: items.map(item => ({
          product_id: item.productId,
          region_name: item.regionName,
          currency_code: item.currencyCode,
          face_value: item.faceValue,
          quantity: item.quantity,
          gift_card_value_id: item.giftCardValueId
        }))
      };

      const res = await fetchApi('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload)
      });

      // 2. Generate WhatsApp message — match checkout UI / server total (includes 5% fee)
      const orderNumber = res.order.order_number;
      const orderTotalUsd = Number(res.order.total_usd);
      
      let message = `*NEW ORDER: ${orderNumber}*\n\n`;
      message += `*Customer Details:*\n`;
      message += `Name: ${formData.fullName}\n`;
      message += `Email: ${formData.email}\n`;
      message += `WhatsApp: ${formData.whatsapp}\n`;
      if (formData.country) message += `Country: ${formData.country}\n`;
      if (formData.notes) message += `Notes: ${formData.notes}\n\n`;
      
      message += `*Order Items:*\n`;
      items.forEach((item, index) => {
        message += `${index + 1}. ${item.productNameEn}\n`;
        message += `   Region: ${item.regionName} (${item.regionCode})\n`;
        message += `   Value: ${item.faceValue} ${item.currencyCode}\n`;
        message += `   Qty: ${item.quantity} × ${formatPrice(item.priceUsd)}\n`;
      });
      
      message += `\nSubtotal: ${formatPrice(subtotalUsd)}\n`;
      message += `Fees (5%): ${formatPrice(feeUsd)}\n`;
      message += `*Total: ${formatPrice(orderTotalUsd)}*\n`;
      
      // Fetch whatsapp number from settings
      const settingsRes = await fetchApi('/settings/public');
      const waNumber = settingsRes.settings.whatsapp_number || '96103794986';

      // 3. Clear cart and open WhatsApp
      clearCart();
      toast.success('Order placed successfully!');
      
      const waUrl = `https://wa.me/${waNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
      window.location.href = waUrl;

    } catch (error: any) {
      toast.error(error.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow page-container py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{t('checkout.title')}</h1>
          <p className="text-dark-400">{t('checkout.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Customer Details Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-card p-6 md:p-8">
              <h2 className="text-xl font-bold text-white mb-6">Your Details</h2>
              <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4">
                
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1">
                    {t('checkout.full_name')} <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="John Doe"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">
                      {t('checkout.email')} <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">
                      {t('checkout.whatsapp')} <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="tel" 
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="+1234567890"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1">
                    {t('checkout.country')}
                  </label>
                  <input 
                    type="text" 
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="United States"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1">
                    {t('checkout.notes')}
                  </label>
                  <textarea 
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Any special instructions..."
                  />
                </div>
              </form>
            </div>
            
            <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20 flex gap-3 text-primary-200">
              <ShieldCheck className="w-6 h-6 shrink-0 mt-0.5 text-primary-400" />
              <div>
                <h4 className="font-bold mb-1 text-primary-300">{t('checkout.important')}</h4>
                <p className="text-sm leading-relaxed opacity-90">{t('checkout.payment_info')}</p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="glass-card p-6 md:p-8 sticky top-28">
              <h2 className="text-xl font-bold text-white mb-6">{t('checkout.order_summary')}</h2>
              
              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-20 bg-dark-800 rounded-lg shrink-0 overflow-hidden">
                      {item.image ? (
                        <img src={getImageUrl(item.image)} alt={item.productNameEn} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-white font-medium text-sm line-clamp-1">{language === 'ar' ? item.productNameAr : item.productNameEn}</h4>
                      <div className="text-xs text-dark-400 mb-1">{item.regionName} • {item.faceValue} {item.currencyCode}</div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-dark-400 text-sm">Qty: {item.quantity}</span>
                        <span className="text-primary-400 font-bold">{formatPrice(item.priceUsd * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="divider mb-6"></div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-dark-300">
                  <span>{t('cart.subtotal')}</span>
                  <span>{formatPrice(subtotalUsd)}</span>
                </div>
                <div className="flex justify-between text-dark-300">
                  <span>Fees (5%)</span>
                  <span>{formatPrice(feeUsd)}</span>
                </div>
                <div className="flex justify-between text-white text-lg font-bold mt-4 pt-4 border-t border-dark-800">
                  <span>{t('cart.total')}</span>
                  <span className="text-primary-400">{formatPrice(totalUsd)}</span>
                </div>
              </div>

              <button 
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-colors shadow-glow-sm hover:shadow-glow disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.89-4.443 9.893-9.892.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.738-.974zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.463 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                    {t('checkout.place_order')}
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
