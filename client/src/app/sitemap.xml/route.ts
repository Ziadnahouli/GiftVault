import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_CLIENT_URL || 'https://www.gift-vault.me').replace(/\/$/, '');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://giftvault-production-c9ab.up.railway.app/api';
  const now = new Date().toISOString();

  let productUrls: string[] = [];

  try {
    const productsRes = await fetch(`${apiUrl}/products?limit=200`, { next: { revalidate: 3600 } }).catch(() => null);
    if (productsRes && productsRes.ok) {
      const data = await productsRes.json();
      if (data.products && Array.isArray(data.products)) {
        productUrls = data.products.map((p: any) => {
          const dateStr = p.updated_at || p.created_at;
          let formattedDate = now;
          try {
            if (dateStr) formattedDate = new Date(dateStr).toISOString();
          } catch {}

          return `
  <url>
    <loc>${baseUrl}/product/${p.slug}</loc>
    <lastmod>${formattedDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
        });
      }
    }
  } catch (error) {
    console.error('Sitemap product fetch error:', error);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/shop</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/support</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/login</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${baseUrl}/register</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>${productUrls.join('')}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
