import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z.string().min(6).max(100),
  country: z.string().max(100).optional(),
  whatsapp: z.string().max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  country: z.string().max(100).optional(),
  whatsapp: z.string().max(20).optional(),
  preferred_lang: z.enum(['en', 'ar']).optional(),
  preferred_currency: z.string().max(3).optional(),
});

export const productSchema = z.object({
  name_en: z.string().min(1).max(255),
  name_ar: z.string().min(1).max(255),
  category_id: z.number().int().positive(),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  short_description_en: z.string().max(500).optional(),
  short_description_ar: z.string().max(500).optional(),
  image: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  best_seller: z.boolean().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  regions: z.array(z.object({
    region_id: z.number().int().positive(),
    currency_code: z.string().min(1).max(10),
    description_en: z.string().optional(),
    description_ar: z.string().optional(),
    image: z.string().optional(),
    sort_order: z.number().int().optional(),
    values: z.array(z.object({
      face_value: z.union([z.string(), z.number()]),
      price_usd: z.number().positive(),
      discount_price_usd: z.number().positive().nullable().optional(),
      stock: z.number().int().min(0),
      sku: z.string().max(100).optional(),
      is_featured: z.boolean().optional(),
      is_hidden: z.boolean().optional(),
      supplier_id: z.string().max(255).optional(),
      supplier_product_id: z.string().max(255).optional(),
      supplier_region_id: z.string().max(255).optional(),
      api_mapping: z.string().optional(),
    })),
  })).optional(),
});

export const productRegionSchema = z.object({
  region_id: z.number().int().positive(),
  currency_code: z.string().min(1).max(10),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  image: z.string().optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

export const denominationSchema = z.object({
  face_value: z.union([z.string(), z.number()]),
  price_usd: z.number().positive(),
  discount_price_usd: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0).optional(),
  sku: z.string().max(100).optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  is_hidden: z.boolean().optional(),
  supplier_id: z.string().max(255).optional(),
  supplier_product_id: z.string().max(255).optional(),
  supplier_region_id: z.string().max(255).optional(),
  api_mapping: z.string().optional(),
});

export const categorySchema = z.object({
  name_en: z.string().min(1).max(255),
  name_ar: z.string().min(1).max(255),
  icon: z.string().optional(),
  image: z.string().optional(),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

export const regionSchema = z.object({
  name_en: z.string().min(1).max(255),
  name_ar: z.string().min(1).max(255),
  code: z.string().min(1).max(10),
  flag_emoji: z.string().optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

export const orderSchema = z.object({
  full_name: z.string().min(2).max(255),
  email: z.string().email(),
  whatsapp: z.string().min(5).max(20),
  country: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  coupon_code: z.string().max(50).optional(),
  display_currency: z.string().max(3).optional(),
  items: z.array(z.object({
    product_id: z.number().int().positive(),
    region_name: z.string().optional(),
    currency_code: z.string().optional(),
    face_value: z.number().optional(),
    quantity: z.number().int().min(1).max(100),
    gift_card_value_id: z.number().int().positive().optional(),
  })).min(1),
});

export const reviewSchema = z.object({
  product_id: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const bannerSchema = z.object({
  title_en: z.string().max(255).optional(),
  title_ar: z.string().max(255).optional(),
  subtitle_en: z.string().max(500).optional(),
  subtitle_ar: z.string().max(500).optional(),
  image: z.string().optional(),
  link: z.string().max(500).optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

export const faqSchema = z.object({
  question_en: z.string().min(1).max(500),
  question_ar: z.string().min(1).max(500),
  answer_en: z.string().min(1),
  answer_ar: z.string().min(1),
  category: z.string().max(100).optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

export const couponSchema = z.object({
  code: z.string().min(1).max(50),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().positive(),
  min_order: z.number().min(0).optional(),
  max_uses: z.number().int().min(0).optional(),
  expires_at: z.string().optional(),
  is_active: z.boolean().optional(),
});
