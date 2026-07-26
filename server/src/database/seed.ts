import bcrypt from 'bcryptjs';
import db, { initializeDatabase } from './schema';
import { config } from '../config';

export function seedDatabase(): void {
  console.log('🌱 Seeding database...');

  // Create Super Admin user (seeded account always has full privileges)
  const adminExists = db.prepare('SELECT id, role FROM users WHERE email = ?').get(config.admin.email) as
    | { id: number; role: string }
    | undefined;
  if (!adminExists) {
    const hash = bcrypt.hashSync(config.admin.password, 12);
    db.prepare(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    ).run('Super Admin', config.admin.email, hash, 'super_admin');
    console.log('✅ Super Admin user created');
  } else if (adminExists.role !== 'super_admin') {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run('super_admin', adminExists.id);
    console.log('✅ Seeded admin promoted to Super Admin');
  }

  // Ensure at least one Super Admin exists (promote first admin if needed)
  const superAdminCount = (
    db.prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'super_admin'`).get() as { c: number }
  ).c;
  if (superAdminCount === 0) {
    const firstAdmin = db.prepare(`SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1`).get() as
      | { id: number }
      | undefined;
    if (firstAdmin) {
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run('super_admin', firstAdmin.id);
      console.log('✅ Existing admin promoted to Super Admin');
    }
  }

  // Seed regions
  const regionCount = (db.prepare('SELECT COUNT(*) as c FROM regions').get() as any).c;
  if (regionCount === 0) {
    const regions = [
      { name_en: 'United States', name_ar: 'الولايات المتحدة', code: 'US', flag_emoji: '🇺🇸', sort_order: 1 },
      { name_en: 'Europe', name_ar: 'أوروبا', code: 'EU', flag_emoji: '🇪🇺', sort_order: 2 },
      { name_en: 'United Kingdom', name_ar: 'المملكة المتحدة', code: 'GB', flag_emoji: '🇬🇧', sort_order: 3 },
      { name_en: 'Turkey', name_ar: 'تركيا', code: 'TR', flag_emoji: '🇹🇷', sort_order: 4 },
      { name_en: 'Saudi Arabia', name_ar: 'المملكة العربية السعودية', code: 'SA', flag_emoji: '🇸🇦', sort_order: 5 },
      { name_en: 'United Arab Emirates', name_ar: 'الإمارات العربية المتحدة', code: 'AE', flag_emoji: '🇦🇪', sort_order: 6 },
    ];

    const insertRegion = db.prepare('INSERT INTO regions (name_en, name_ar, code, flag_emoji, sort_order) VALUES (?, ?, ?, ?, ?)');
    for (const r of regions) {
      insertRegion.run(r.name_en, r.name_ar, r.code, r.flag_emoji, r.sort_order);
    }
    console.log('✅ Regions seeded');
  }

  // Seed categories
  const catCount = (db.prepare('SELECT COUNT(*) as c FROM categories').get() as any).c;
  if (catCount === 0) {
    const categories = [
      { name_en: 'Gaming', name_ar: 'ألعاب', slug: 'gaming', icon: 'Gamepad2', sort_order: 1 },
      { name_en: 'Entertainment', name_ar: 'ترفيه', slug: 'entertainment', icon: 'Film', sort_order: 2 },
      { name_en: 'Shopping', name_ar: 'تسوق', slug: 'shopping', icon: 'ShoppingBag', sort_order: 3 },
      { name_en: 'Subscriptions', name_ar: 'اشتراكات', slug: 'subscriptions', icon: 'CreditCard', sort_order: 4 },
    ];

    const insertCat = db.prepare('INSERT INTO categories (name_en, name_ar, slug, icon, sort_order) VALUES (?, ?, ?, ?, ?)');
    for (const c of categories) {
      insertCat.run(c.name_en, c.name_ar, c.slug, c.icon, c.sort_order);
    }
    console.log('✅ Categories seeded');
  }

  // Seed default settings
  const settingsCount = (db.prepare('SELECT COUNT(*) as c FROM settings').get() as any).c;
  if (settingsCount === 0) {
    const settings = [
      { key: 'store_name', value: 'GiftVault' },
      { key: 'store_description', value: 'Premium Digital Gift Cards' },
      { key: 'whatsapp_number', value: config.whatsappNumber },
      { key: 'support_email', value: 'support@giftvault.com' },
      { key: 'default_language', value: 'en' },
      { key: 'default_currency', value: 'USD' },
      { key: 'maintenance_mode', value: 'false' },
      { key: 'tax_rate', value: '0' },
      { key: 'meta_title', value: 'GiftVault - Premium Digital Gift Cards' },
      { key: 'meta_description', value: 'Buy digital gift cards for Steam, PlayStation, Xbox, Netflix and more at the best prices.' },
    ];

    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    for (const s of settings) {
      insertSetting.run(s.key, s.value);
    }
    console.log('✅ Settings seeded');
  }

  // Seed sample FAQ
  const faqCount = (db.prepare('SELECT COUNT(*) as c FROM faq').get() as any).c;
  if (faqCount === 0) {
    const faqs = [
      {
        question_en: 'How do I purchase a gift card?',
        question_ar: 'كيف أشتري بطاقة هدية؟',
        answer_en: 'Browse our store, select your gift card, choose the region and value, add to cart, and complete checkout via WhatsApp.',
        answer_ar: 'تصفح متجرنا، اختر بطاقة الهدية، حدد المنطقة والقيمة، أضف إلى السلة، وأكمل الطلب عبر واتساب.',
        sort_order: 1,
      },
      {
        question_en: 'How long does delivery take?',
        question_ar: 'كم يستغرق التوصيل؟',
        answer_en: 'Digital gift cards are delivered instantly after payment confirmation via WhatsApp.',
        answer_ar: 'يتم تسليم بطاقات الهدايا الرقمية فوراً بعد تأكيد الدفع عبر واتساب.',
        sort_order: 2,
      },
      {
        question_en: 'What payment methods do you accept?',
        question_ar: 'ما هي طرق الدفع المقبولة؟',
        answer_en: 'We currently process payments through WhatsApp. Contact us for available payment options.',
        answer_ar: 'نقوم حالياً بمعالجة المدفوعات عبر واتساب. تواصل معنا لمعرفة خيارات الدفع المتاحة.',
        sort_order: 3,
      },
      {
        question_en: 'Can I get a refund?',
        question_ar: 'هل يمكنني استرداد المبلغ؟',
        answer_en: 'Once a gift card code is delivered, refunds are not possible. Please verify your order before confirming.',
        answer_ar: 'بمجرد تسليم رمز بطاقة الهدية، لا يمكن استرداد المبلغ. يرجى التحقق من طلبك قبل التأكيد.',
        sort_order: 4,
      },
    ];

    const insertFaq = db.prepare('INSERT INTO faq (question_en, question_ar, answer_en, answer_ar, sort_order) VALUES (?, ?, ?, ?, ?)');
    for (const f of faqs) {
      insertFaq.run(f.question_en, f.question_ar, f.answer_en, f.answer_ar, f.sort_order);
    }
    console.log('✅ FAQ seeded');
  }

  // Seed banners
  const bannerCount = (db.prepare('SELECT COUNT(*) as c FROM banners').get() as any).c;
  if (bannerCount === 0) {
    const banners = [
      {
        title_en: 'Premium Gift Cards',
        title_ar: 'بطاقات هدايا مميزة',
        subtitle_en: 'Steam, PlayStation, Xbox & More — Instant Delivery',
        subtitle_ar: 'ستيم، بلايستيشن، إكس بوكس والمزيد — توصيل فوري',
        sort_order: 1,
      },
      {
        title_en: 'Best Prices Guaranteed',
        title_ar: 'أفضل الأسعار مضمونة',
        subtitle_en: 'Save big on digital gift cards from all regions',
        subtitle_ar: 'وفر أكثر على بطاقات الهدايا الرقمية من جميع المناطق',
        sort_order: 2,
      },
    ];

    const insertBanner = db.prepare('INSERT INTO banners (title_en, title_ar, subtitle_en, subtitle_ar, sort_order) VALUES (?, ?, ?, ?, ?)');
    for (const b of banners) {
      insertBanner.run(b.title_en, b.title_ar, b.subtitle_en, b.subtitle_ar, b.sort_order);
    }
    console.log('✅ Banners seeded');
  }

  console.log('✅ Database seeding complete!');
}

// Run directly
if (require.main === module) {
  initializeDatabase();
  seedDatabase();
  console.log('Done!');
  process.exit(0);
}
