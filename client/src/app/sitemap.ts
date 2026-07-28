import { MetadataRoute } from 'next';
import { API_URL } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_CLIENT_URL || 'https://www.gift-vault.me').replace(/\/$/, '');

  // Core static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  let productPages: MetadataRoute.Sitemap = [];
  let categoryPages: MetadataRoute.Sitemap = [];

  try {
    // Fetch active categories
    const categoriesRes = await fetch(`${API_URL}/categories`, { next: { revalidate: 3600 } }).catch(() => null);
    if (categoriesRes && categoriesRes.ok) {
      const data = await categoriesRes.json();
      if (data.categories && Array.isArray(data.categories)) {
        categoryPages = data.categories.map((cat: any) => ({
          url: `${baseUrl}/shop?category=${cat.slug}`,
          lastModified: new Date(cat.created_at || Date.now()),
          changeFrequency: 'daily',
          priority: 0.8,
        }));
      }
    }
  } catch (error) {
    console.error('Sitemap categories fetch error:', error);
  }

  try {
    // Fetch active products
    const productsRes = await fetch(`${API_URL}/products?limit=200`, { next: { revalidate: 3600 } }).catch(() => null);
    if (productsRes && productsRes.ok) {
      const data = await productsRes.json();
      if (data.products && Array.isArray(data.products)) {
        productPages = data.products.map((prod: any) => ({
          url: `${baseUrl}/product/${prod.slug}`,
          lastModified: new Date(prod.updated_at || prod.created_at || Date.now()),
          changeFrequency: 'daily',
          priority: 0.8,
        }));
      }
    }
  } catch (error) {
    console.error('Sitemap products fetch error:', error);
  }

  return [...staticPages, ...categoryPages, ...productPages];
}
