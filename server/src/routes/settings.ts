import { Router, Request, Response } from 'express';
import db from '../database/schema';
import { getExchangeRates } from '../utils/currency';

const router = Router();

// GET /api/settings/public
router.get('/public', (req: Request, res: Response) => {
  try {
    const settings = db.prepare('SELECT key, value FROM settings').all() as any[];
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    res.json({ settings: settingsMap });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// GET /api/settings/currencies
router.get('/currencies', (req: Request, res: Response) => {
  try {
    const rates = getExchangeRates();
    const supportedCurrencies = [
      { code: 'USD', symbol: '$', name_en: 'US Dollar', name_ar: 'دولار أمريكي' },
      { code: 'EUR', symbol: '€', name_en: 'Euro', name_ar: 'يورو' },
      { code: 'GBP', symbol: '£', name_en: 'British Pound', name_ar: 'جنيه إسترليني' },
      { code: 'SAR', symbol: '﷼', name_en: 'Saudi Riyal', name_ar: 'ريال سعودي' },
      { code: 'AED', symbol: 'د.إ', name_en: 'UAE Dirham', name_ar: 'درهم إماراتي' },
      { code: 'LBP', symbol: 'ل.ل', name_en: 'Lebanese Pound', name_ar: 'ليرة لبنانية' },
      { code: 'TRY', symbol: '₺', name_en: 'Turkish Lira', name_ar: 'ليرة تركية' },
    ];

    res.json({
      currencies: supportedCurrencies.map(c => ({
        ...c,
        rate: rates[c.code] || 1,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get currencies' });
  }
});

// GET /api/settings/exchange-rates
router.get('/exchange-rates', (req: Request, res: Response) => {
  try {
    const rates = getExchangeRates();
    res.json({ base: 'USD', rates });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get exchange rates' });
  }
});

export default router;
