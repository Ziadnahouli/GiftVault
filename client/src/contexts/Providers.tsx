"use client";

import React from 'react';
import { AuthProvider } from './AuthContext';
import { LanguageProvider } from './LanguageContext';
import { CurrencyProvider } from './CurrencyContext';
import { CartProvider } from './CartContext';

import { Toaster } from 'react-hot-toast';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <CartProvider>
              {children}
              <CartDrawer />
              <Toaster position="bottom-right" toastOptions={{
                className: '!bg-dark-800 !text-white !border !border-dark-700',
                style: { backdropFilter: 'blur(10px)' }
              }} />
            </CartProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
