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
  const categories = [
    { name_en: 'Gaming', name_ar: 'ألعاب', slug: 'gaming', icon: 'Gamepad2', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80', sort_order: 1 },
    { name_en: 'Entertainment', name_ar: 'ترفيه', slug: 'entertainment', icon: 'Film', image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop&q=80', sort_order: 2 },
    { name_en: 'Shopping', name_ar: 'تسوق', slug: 'shopping', icon: 'ShoppingBag', image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&auto=format&fit=crop&q=80', sort_order: 3 },
    { name_en: 'Subscriptions', name_ar: 'اشتراكات', slug: 'subscriptions', icon: 'CreditCard', image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&auto=format&fit=crop&q=80', sort_order: 4 },
  ];

  for (const c of categories) {
    const existing = db.prepare('SELECT id FROM categories WHERE slug = ?').get(c.slug) as any;
    if (existing) {
      db.prepare('UPDATE categories SET image = ?, icon = ?, sort_order = ? WHERE id = ?').run(c.image, c.icon, c.sort_order, existing.id);
    } else {
      db.prepare('INSERT INTO categories (name_en, name_ar, slug, icon, image, sort_order) VALUES (?, ?, ?, ?, ?, ?)').run(c.name_en, c.name_ar, c.slug, c.icon, c.image, c.sort_order);
    }
  }
  console.log('✅ Categories seeded with images');

  // Seed Products
  const prodCount = (db.prepare('SELECT COUNT(*) as c FROM products').get() as any).c;
  if (prodCount === 0) {
    console.log('🌱 Seeding products...');
    const catMap: Record<string, number> = {};
    const catRows = db.prepare('SELECT id, slug FROM categories').all() as any[];
    for (const row of catRows) {
      catMap[row.slug] = row.id;
    }

    const regRows = db.prepare('SELECT id, code FROM regions').all() as any[];
    const usRegion = regRows.find(r => r.code === 'US') || regRows[0];

    const sampleProducts = [
      {
        category_slug: 'gaming',
        name_en: 'Steam Wallet Gift Card',
        name_ar: 'بطاقة محفظة ستيم',
        slug: 'steam-wallet-gift-card',
        description_en: 'Top up your Steam Wallet to buy games, software, and in-game items.',
        description_ar: 'شحن محفظة ستيم لشراء الألعاب والبرامج والعناصر داخل الألعاب.',
        image: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&auto=format&fit=crop&q=80',
        featured: 1,
        best_seller: 1,
        values: [
          { face: 10, price: 10.5 },
          { face: 25, price: 26.0 },
          { face: 50, price: 51.5 },
          { face: 100, price: 102.0 },
        ]
      },
      {
        category_slug: 'gaming',
        name_en: 'PlayStation Network Card',
        name_ar: 'بطاقة بلايستيشن ستور',
        slug: 'playstation-network-card',
        description_en: 'Purchase games, add-ons, subscriptions, and more on PlayStation Store.',
        description_ar: 'اشترِ الألعاب والإضافات والاشتراكات والمزيد من متجر بلايستيشن.',
        image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop&q=80',
        featured: 1,
        best_seller: 1,
        values: [
          { face: 10, price: 10.0 },
          { face: 25, price: 25.0 },
          { face: 50, price: 50.0 },
          { face: 100, price: 98.0 },
        ]
      },
      {
        category_slug: 'gaming',
        name_en: 'Xbox Live & Gift Card',
        name_ar: 'بطاقة إكس بوكس',
        slug: 'xbox-live-gift-card',
        description_en: 'Get games, entertainment apps, and Xbox Game Pass subscriptions.',
        description_ar: 'احصل على الألعاب والتطبيقات الترفيهية واشتراكات إكس بوكس جيم باس.',
        image: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800&auto=format&fit=crop&q=80',
        featured: 1,
        best_seller: 0,
        values: [
          { face: 15, price: 15.0 },
          { face: 25, price: 25.0 },
          { face: 50, price: 49.0 },
        ]
      },
      {
        category_slug: 'gaming',
        name_en: 'Nintendo eShop Card',
        name_ar: 'بطاقة نينتندو إيشوب',
        slug: 'nintendo-eshop-card',
        description_en: 'Download your favorite games directly to your Nintendo Switch console.',
        description_ar: 'قم بتنزيل ألعابك المفضلة مباشرة إلى جهاز نينتندو سويتش الخاص بك.',
        image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&auto=format&fit=crop&q=80',
        featured: 0,
        best_seller: 0,
        values: [
          { face: 10, price: 10.0 },
          { face: 20, price: 20.0 },
          { face: 50, price: 49.5 },
        ]
      },
      {
        category_slug: 'gaming',
        name_en: 'Roblox Robux Gift Card',
        name_ar: 'بطاقة روبلوكس روبوكس',
        slug: 'roblox-robux-gift-card',
        description_en: 'Get Robux to upgrade your avatar and unlock special perks in Roblox.',
        description_ar: 'احصل على روبوكس لتطوير شخصيتك وفتح الميزات الخاصة في روبلوكس.',
        image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
        featured: 1,
        best_seller: 1,
        values: [
          { face: 10, price: 10.0 },
          { face: 25, price: 25.0 },
          { face: 50, price: 49.0 },
        ]
      },
      {
        category_slug: 'entertainment',
        name_en: 'Netflix Gift Card',
        name_ar: 'بطاقة نتفليكس',
        slug: 'netflix-gift-card',
        description_en: 'Stream thousands of movies, TV shows, and anime with Netflix.',
        description_ar: 'شاهد آلاف الأفلام والبرامج التلفزيونية والأنمي عبر نتفليكس.',
        image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop&q=80',
        featured: 1,
        best_seller: 1,
        values: [
          { face: 15, price: 15.0 },
          { face: 30, price: 30.0 },
          { face: 60, price: 59.0 },
        ]
      },
      {
        category_slug: 'subscriptions',
        name_en: 'Spotify Premium Gift Card',
        name_ar: 'بطاقة سبوتيفاي بريميوم',
        slug: 'spotify-premium-gift-card',
        description_en: 'Enjoy ad-free music streaming with offline downloads on Spotify.',
        description_ar: 'استمتع بالموسيقى بدون إعلانات وتنزيل الأغاني للاستماع أوفلاين على سبوتيفاي.',
        image: 'https://images.unsplash.com/photo-1614680376593-902f749f7edc?w=800&auto=format&fit=crop&q=80',
        featured: 1,
        best_seller: 0,
        values: [
          { face: 10, price: 10.0 },
          { face: 30, price: 30.0 },
        ]
      },
      {
        category_slug: 'subscriptions',
        name_en: 'Apple & iTunes Gift Card',
        name_ar: 'بطاقة آبل وآيتيونز',
        slug: 'apple-itunes-gift-card',
        description_en: 'Use for App Store, Apple Music, iCloud storage, apps, and games.',
        description_ar: 'استخدمها لشراء التطبيقات، آبل ميوزك، مساحة iCloud، والألعاب.',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
        featured: 1,
        best_seller: 1,
        values: [
          { face: 10, price: 10.0 },
          { face: 25, price: 25.0 },
          { face: 50, price: 50.0 },
          { face: 100, price: 99.0 },
        ]
      },
      {
        category_slug: 'shopping',
        name_en: 'Amazon Gift Card',
        name_ar: 'بطاقة أمازون',
        slug: 'amazon-gift-card',
        description_en: 'Shop millions of items online with instant Amazon gift balance.',
        description_ar: 'تسوق ملايين المنتجات عبر الإنترنت باستخدام رصيد بطاقة أمازون.',
        image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80',
        featured: 1,
        best_seller: 1,
        values: [
          { face: 25, price: 25.5 },
          { face: 50, price: 51.0 },
          { face: 100, price: 101.5 },
        ]
      },
      {
        category_slug: 'gaming',
        name_en: 'Razer Gold Gift Card',
        name_ar: 'بطاقة ريزر جولد',
        slug: 'razer-gold-gift-card',
        description_en: 'Unified virtual credits for gamers worldwide to buy games & in-game content.',
        description_ar: 'رصيد افتراضي موحد للاعبين لشراء الألعاب والمحتويات داخل اللعبة.',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
        featured: 0,
        best_seller: 1,
        values: [
          { face: 10, price: 10.0 },
          { face: 20, price: 20.0 },
          { face: 50, price: 49.5 },
        ]
      },
      {
        category_slug: 'subscriptions',
        name_en: 'Google Play Gift Card',
        name_ar: 'بطاقة جوجل بلاي',
        slug: 'google-play-gift-card',
        description_en: 'Power up in your favorite games and apps on Android devices.',
        description_ar: 'اشحن ألعابك وتطبيقاتك المفضلة على أجهزة أندرويد.',
        image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
        featured: 1,
        best_seller: 1,
        values: [
          { face: 10, price: 10.0 },
          { face: 25, price: 25.0 },
          { face: 50, price: 49.5 },
        ]
      },
      {
        category_slug: 'gaming',
        name_en: 'PUBG Mobile Unknown Cash (UC)',
        name_ar: 'شدات ببجي موبايل (UC)',
        slug: 'pubg-mobile-uc',
        description_en: 'Get UC for Royale Pass, weapon skins, and outfits in PUBG Mobile.',
        description_ar: 'احصل على UC لشراء الرويال باس، ومظاهر الأسلحة والأزياء في ببجي موبايل.',
        image: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=800&auto=format&fit=crop&q=80',
        featured: 1,
        best_seller: 1,
        values: [
          { face: 5, price: 5.0 },
          { face: 10, price: 10.0 },
          { face: 25, price: 24.5 },
        ]
      }
    ];

    const insertProdStmt = db.prepare(
      `INSERT INTO products (category_id, name_en, name_ar, slug, description_en, description_ar, short_description_en, short_description_ar, image, featured, best_seller, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
    );

    const insertProdRegionStmt = db.prepare(
      `INSERT INTO product_regions (product_id, region_id, currency_code, description_en, description_ar, sort_order, is_active)
       VALUES (?, ?, 'USD', '', '', 1, 1)`
    );

    const insertGcvStmt = db.prepare(
      `INSERT INTO gift_card_values (product_region_id, face_value, price_usd, stock, is_active, is_hidden)
       VALUES (?, ?, ?, 100, 1, 0)`
    );

    let idx = 1;
    for (const p of sampleProducts) {
      const catId = catMap[p.category_slug] || 1;
      const res = insertProdStmt.run(
        catId, p.name_en, p.name_ar, p.slug, p.description_en, p.description_ar,
        p.description_en, p.description_ar, p.image, p.featured, p.best_seller, idx
      );
      const prodId = res.lastInsertRowid;

      if (usRegion) {
        const prRes = insertProdRegionStmt.run(prodId, usRegion.id);
        const prId = prRes.lastInsertRowid;
        for (const val of p.values) {
          insertGcvStmt.run(prId, val.face, val.price);
        }
      }
      idx++;
    }
    console.log('✅ Sample products seeded with images and denominations');
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
