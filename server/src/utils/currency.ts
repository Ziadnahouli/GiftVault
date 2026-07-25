import db from '../database/schema';
import { config } from '../config';

// Fallback exchange rates (USD base)
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  SAR: 3.75,
  AED: 3.67,
  LBP: 89500,
  TRY: 32.5,
};

let ratesCache: Record<string, number> = { ...FALLBACK_RATES };
let lastFetch: number = 0;
const CACHE_DURATION = 3600000; // 1 hour in ms

/**
 * Fetches latest exchange rates from the free API and caches them.
 */
export async function fetchExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();

  // Return cached rates if still fresh
  if (now - lastFetch < CACHE_DURATION && Object.keys(ratesCache).length > 1) {
    return ratesCache;
  }

  try {
    const response = await fetch(config.exchangeRateApiUrl);
    const data = await response.json();

    if (data && data.rates) {
      ratesCache = data.rates;
      lastFetch = now;

      // Cache in database
      const upsert = db.prepare(
        `INSERT INTO exchange_rates (currency_code, rate, updated_at) 
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(currency_code) DO UPDATE SET rate = ?, updated_at = CURRENT_TIMESTAMP`
      );

      const saveMany = db.transaction((rates: Record<string, number>) => {
        for (const [code, rate] of Object.entries(rates)) {
          upsert.run(code, rate, rate);
        }
      });

      saveMany(ratesCache);
      console.log('✅ Exchange rates updated from API');
    }
  } catch (error) {
    console.warn('⚠️ Failed to fetch exchange rates, using cached/fallback rates');

    // Try to load from database
    const dbRates = db.prepare('SELECT currency_code, rate FROM exchange_rates').all() as any[];
    if (dbRates.length > 0) {
      ratesCache = {};
      for (const row of dbRates) {
        ratesCache[row.currency_code] = row.rate;
      }
    }
  }

  return ratesCache;
}

/**
 * Converts a USD amount to the target currency.
 */
export function convertCurrency(amountUsd: number, targetCurrency: string): number {
  const rate = ratesCache[targetCurrency] || 1;
  return Math.round(amountUsd * rate * 100) / 100;
}

/**
 * Gets the current exchange rates (from cache).
 */
export function getExchangeRates(): Record<string, number> {
  return { ...ratesCache };
}

/**
 * Formats a price with currency symbol.
 */
export function formatPrice(amount: number, currencyCode: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    SAR: '﷼',
    AED: 'د.إ',
    LBP: 'ل.ل',
    TRY: '₺',
  };

  const symbol = symbols[currencyCode] || currencyCode;
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Initializes exchange rates on server start.
 */
export async function initExchangeRates(): Promise<void> {
  await fetchExchangeRates();
  // Refresh every hour
  setInterval(() => fetchExchangeRates(), CACHE_DURATION);
}
