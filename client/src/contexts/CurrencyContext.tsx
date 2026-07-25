"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';

type Currency = 'USD' | 'EUR' | 'GBP' | 'SAR' | 'AED' | 'LBP' | 'TRY';

interface CurrencyData {
  code: string;
  symbol: string;
  rate: number;
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (priceInUsd: number) => string;
  convertPrice: (priceInUsd: number) => number;
  currencies: CurrencyData[];
}

const defaultCurrencies: CurrencyData[] = [
  { code: 'USD', symbol: '$', rate: 1 },
  { code: 'EUR', symbol: '€', rate: 0.92 },
  { code: 'GBP', symbol: '£', rate: 0.79 },
  { code: 'SAR', symbol: '﷼', rate: 3.75 },
  { code: 'AED', symbol: 'د.إ', rate: 3.67 },
  { code: 'LBP', symbol: 'ل.ل', rate: 89500 },
  { code: 'TRY', symbol: '₺', rate: 32.5 },
];

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('USD');
  const [currencies, setCurrencies] = useState<CurrencyData[]>(defaultCurrencies);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedCurrency = localStorage.getItem('currency') as Currency;
    if (storedCurrency && defaultCurrencies.some(c => c.code === storedCurrency)) {
      setCurrencyState(storedCurrency);
    }
    
    // Fetch live rates from our backend
    fetchApi('/settings/currencies')
      .then(data => {
        if (data.currencies) {
          setCurrencies(data.currencies);
        }
      })
      .catch(err => console.error('Failed to fetch currencies', err));

    setMounted(true);
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  const convertPrice = (priceInUsd: number) => {
    const activeCurrency = currencies.find(c => c.code === currency) || currencies[0];
    return priceInUsd * activeCurrency.rate;
  };

  const formatPrice = (priceInUsd: number) => {
    const activeCurrency = currencies.find(c => c.code === currency) || currencies[0];
    const converted = convertPrice(priceInUsd);
    
    // Format based on currency rules
    if (currency === 'LBP') {
      // LBP usually doesn't have decimals and uses commas
      return `${activeCurrency.symbol}${Math.round(converted).toLocaleString()}`;
    }
    
    return `${activeCurrency.symbol}${converted.toFixed(2)}`;
  };

  if (!mounted) {
    return null;
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, convertPrice, currencies }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
