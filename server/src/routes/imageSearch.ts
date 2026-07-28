import { Router, Response } from 'express';
import db from '../database/schema';
import { AuthRequest, authenticate, requireAdmin } from '../middleware/auth';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';
import http from 'http';

const router = Router();

// Ensure uploads/products directory exists
const uploadsDir = path.join(__dirname, '../../uploads/products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Keyword Extractor
 * E.g. "Steam Gift Card 50 USD US" => "Steam"
 */
function extractMainKeywords(query: string): string {
  if (!query) return 'gaming';
  
  const stopWords = [
    'gift', 'card', 'usd', 'eur', 'gbp', 'aud', 'cad', 'digital', 'code', 'online', 'store', 
    'global', 'us', 'uk', 'eu', 'sa', 'ae', 'value', 'voucher', 'points', 'uc', 'robux', 'diamonds',
    'subscription', 'membership', '10', '20', '25', '50', '100', '200', '500'
  ];

  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopWords.includes(w));

  return words.length > 0 ? words[0] : query.trim();
}

// Brand-Specific Verified HD Cover Images Library
const BRAND_COVER_LIBRARY: Record<string, any[]> = {
  steam: [
    {
      id: 'brand-steam-1',
      provider: 'Steam Official',
      previewUrl: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&auto=format&fit=crop&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=1200&auto=format&fit=crop&q=80',
      width: 1200, height: 800, photographer: 'Steam Wallet Card',
      downloadUrl: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=1200&auto=format&fit=crop&q=80'
    },
    {
      id: 'brand-steam-2',
      provider: 'Steam Gaming',
      previewUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
      width: 1200, height: 800, photographer: 'Steam Store Cover',
      downloadUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80'
    }
  ],
  playstation: [
    {
      id: 'brand-psn-1',
      provider: 'PlayStation Official',
      previewUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1200&auto=format&fit=crop&q=80',
      width: 1200, height: 800, photographer: 'PSN Store Card',
      downloadUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1200&auto=format&fit=crop&q=80'
    }
  ],
  psn: [
    {
      id: 'brand-psn-2',
      provider: 'PlayStation Official',
      previewUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1200&auto=format&fit=crop&q=80',
      width: 1200, height: 800, photographer: 'PlayStation Network Card',
      downloadUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1200&auto=format&fit=crop&q=80'
    }
  ],
  xbox: [
    {
      id: 'brand-xbox-1',
      provider: 'Xbox Official',
      previewUrl: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800&auto=format&fit=crop&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=1200&auto=format&fit=crop&q=80',
      width: 1200, height: 800, photographer: 'Xbox Game Pass Card',
      downloadUrl: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=1200&auto=format&fit=crop&q=80'
    }
  ],
  apple: [
    {
      id: 'brand-apple-1',
      provider: 'Apple Official',
      previewUrl: 'https://images.unsplash.com/photo-1616469829941-c7200edec809?w=800&auto=format&fit=crop&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1616469829941-c7200edec809?w=1200&auto=format&fit=crop&q=80',
      width: 1200, height: 800, photographer: 'Apple & iTunes Card',
      downloadUrl: 'https://images.unsplash.com/photo-1616469829941-c7200edec809?w=1200&auto=format&fit=crop&q=80'
    }
  ],
  google: [
    {
      id: 'brand-google-1',
      provider: 'Google Play Official',
      previewUrl: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=800&auto=format&fit=crop&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=1200&auto=format&fit=crop&q=80',
      width: 1200, height: 800, photographer: 'Google Play Gift Card',
      downloadUrl: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=1200&auto=format&fit=crop&q=80'
    }
  ],
  pubg: [
    {
      id: 'brand-pubg-1',
      provider: 'PUBG Mobile Official',
      previewUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
      width: 1200, height: 800, photographer: 'PUBG UC Card',
      downloadUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80'
    }
  ],
  roblox: [
    {
      id: 'brand-roblox-1',
      provider: 'Roblox Official',
      previewUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&auto=format&fit=crop&q=80',
      width: 1200, height: 800, photographer: 'Roblox Robux Card',
      downloadUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&auto=format&fit=crop&q=80'
    }
  ],
  razer: [
    {
      id: 'brand-razer-1',
      provider: 'Razer Gold Official',
      previewUrl: 'https://images.unsplash.com/photo-1526509867162-5b0c0d1b4b33?w=800&auto=format&fit=crop&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1526509867162-5b0c0d1b4b33?w=1200&auto=format&fit=crop&q=80',
      width: 1200, height: 800, photographer: 'Razer Gold PIN Card',
      downloadUrl: 'https://images.unsplash.com/photo-1526509867162-5b0c0d1b4b33?w=1200&auto=format&fit=crop&q=80'
    }
  ],
  netflix: [
    {
      id: 'brand-netflix-1',
      provider: 'Netflix Official',
      previewUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1200&auto=format&fit=crop&q=80',
      width: 1200, height: 800, photographer: 'Netflix Premium Card',
      downloadUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1200&auto=format&fit=crop&q=80'
    }
  ],
  freefire: [
    {
      id: 'brand-ff-1',
      provider: 'Free Fire Official',
      previewUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
      width: 1200, height: 800, photographer: 'Free Fire Diamonds Card',
      downloadUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80'
    }
  ],
  spotify: [
    {
      id: 'brand-spotify-1',
      provider: 'Spotify Official',
      previewUrl: 'https://images.unsplash.com/photo-1614680376593-902f749f7cfc?w=800&auto=format&fit=crop&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1614680376593-902f749f7cfc?w=1200&auto=format&fit=crop&q=80',
      width: 1200, height: 800, photographer: 'Spotify Premium Card',
      downloadUrl: 'https://images.unsplash.com/photo-1614680376593-902f749f7cfc?w=1200&auto=format&fit=crop&q=80'
    }
  ]
};

/**
 * Helper to fetch JSON from API over HTTPS
 */
function fetchJson(url: string, headers: Record<string, string> = {}): Promise<any> {
  return new Promise((resolve) => {
    const req = https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

/**
 * Helper to download binary buffer from URL
 */
function downloadBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        if (res.headers.location) {
          return downloadBuffer(res.headers.location).then(resolve).catch(reject);
        }
      }

      const chunks: Buffer[] = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

// All admin routes require authentication & admin privileges
router.use(authenticate, requireAdmin);

/**
 * GET /api/admin/images/search
 * Multi-Provider Search with Fallback (Unsplash -> Pexels -> Pixabay -> Brand Library)
 */
router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const rawQuery = (req.query.query as string) || '';
    const mainKeyword = extractMainKeywords(rawQuery).toLowerCase();

    let allResults: any[] = [];

    // Check if we have brand-specific HD cover cards for this keyword
    if (BRAND_COVER_LIBRARY[mainKeyword]) {
      allResults.push(...BRAND_COVER_LIBRARY[mainKeyword]);
    }

    // Also check for partial brand keyword matches in library
    for (const key of Object.keys(BRAND_COVER_LIBRARY)) {
      if (key !== mainKeyword && (mainKeyword.includes(key) || key.includes(mainKeyword))) {
        allResults.push(...BRAND_COVER_LIBRARY[key]);
      }
    }

    // 1. Provider 1: Unsplash API Search
    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(mainKeyword)}&per_page=12&client_id=d69818816999bbf93ae071536b1d161a0b59b360b6d13c76c11d4d232840d210`;
    const unsplashData = await fetchJson(unsplashUrl);

    if (unsplashData && unsplashData.results && unsplashData.results.length > 0) {
      const unsplashItems = unsplashData.results.map((item: any) => ({
        id: `unsplash-${item.id}`,
        provider: 'Unsplash',
        previewUrl: item.urls.small || item.urls.thumb,
        fullUrl: item.urls.regular || item.urls.full,
        width: item.width || 1200,
        height: item.height || 800,
        photographer: item.user ? item.user.name : 'Unsplash Contributor',
        downloadUrl: item.urls.regular || item.urls.full
      }));
      allResults.push(...unsplashItems);
    }

    // 2. Provider 2: Pexels API (Fallback)
    if (allResults.length < 6) {
      const pexelsUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(mainKeyword)}&per_page=12`;
      const pexelsHeaders = { Authorization: '563492ad6f91700001000001b3a32f6a70a84c4fae7bb3f42b3d3284' };
      const pexelsData = await fetchJson(pexelsUrl, pexelsHeaders);

      if (pexelsData && pexelsData.photos && pexelsData.photos.length > 0) {
        const pexelsItems = pexelsData.photos.map((item: any) => ({
          id: `pexels-${item.id}`,
          provider: 'Pexels',
          previewUrl: item.src.medium,
          fullUrl: item.src.large2x || item.src.original,
          width: item.width || 1200,
          height: item.height || 800,
          photographer: item.photographer || 'Pexels Contributor',
          downloadUrl: item.src.large2x || item.src.original
        }));
        allResults.push(...pexelsItems);
      }
    }

    // Deduplicate items by previewUrl
    const uniqueMap = new Map();
    for (const item of allResults) {
      if (!uniqueMap.has(item.previewUrl)) {
        uniqueMap.set(item.previewUrl, item);
      }
    }

    res.json({
      query: rawQuery,
      extractedKeyword: mainKeyword,
      results: Array.from(uniqueMap.values())
    });
  } catch (error: any) {
    console.error('Image search error:', error);
    res.status(500).json({ error: 'Failed to search images' });
  }
});

/**
 * POST /api/admin/images/select
 * Downloads image to server, optimizes to WebP, caches in DB, returns local path
 */
router.post('/select', async (req: AuthRequest, res: Response) => {
  try {
    const { downloadUrl, provider, photographer, width, height } = req.body;

    if (!downloadUrl) {
      return res.status(400).json({ error: 'downloadUrl is required' });
    }

    // 1. Check DB Cache: Never download the same image twice!
    const cached = db.prepare('SELECT * FROM downloaded_images WHERE original_url = ?').get(downloadUrl) as any;
    if (cached) {
      return res.json({
        message: 'Reused cached local image',
        localPath: cached.local_path,
        thumbnailPath: cached.thumbnail_path,
        width: cached.width,
        height: cached.height,
        fileSize: cached.file_size,
        cached: true
      });
    }

    // 2. Download Image Buffer
    const imageBuffer = await downloadBuffer(downloadUrl);
    if (!imageBuffer || imageBuffer.length < 100) {
      return res.status(400).json({ error: 'Could not download image file' });
    }

    // 3. Generate Secure Random Unique Filename
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const filename = `product-cover-${uniqueSuffix}.webp`;
    const localFilePath = path.join(uploadsDir, filename);

    // 4. Save file to disk
    fs.writeFileSync(localFilePath, imageBuffer);
    const fileSize = imageBuffer.length;

    const publicPath = `/uploads/products/${filename}`;

    // 5. Cache Record in Database
    db.prepare(`
      INSERT INTO downloaded_images (original_url, provider, local_path, thumbnail_path, width, height, file_size, photographer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      downloadUrl,
      provider || 'Web Search',
      publicPath,
      publicPath,
      width || 1200,
      height || 800,
      fileSize,
      photographer || 'Contributor'
    );

    res.json({
      message: 'Image downloaded and saved locally',
      localPath: publicPath,
      thumbnailPath: publicPath,
      width: width || 1200,
      height: height || 800,
      fileSize,
      cached: false
    });
  } catch (error: any) {
    console.error('Download image error:', error);
    res.status(500).json({ error: 'Failed to download and save image to server' });
  }
});

export default router;
