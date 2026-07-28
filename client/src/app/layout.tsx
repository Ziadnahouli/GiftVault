import type { Metadata, Viewport } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import { Providers } from "@/contexts/Providers";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  display: "swap",
  preload: false,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#090d16',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_CLIENT_URL || 'https://gift-vault.me'),
  title: {
    default: 'GiftVault | Premium Digital Gift Cards',
    template: '%s | GiftVault',
  },
  description: 'Your premier destination for instant digital gift cards across Steam, PlayStation, Xbox, and more. Global reach, local payments.',
  keywords: ['gift cards', 'digital cards', 'steam wallet', 'psn', 'xbox live', 'instant delivery', 'gift cards lebanon'],
  authors: [{ name: 'GiftVault Team' }],
  creator: 'GiftVault Inc.',
  publisher: 'GiftVault Inc.',
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'GiftVault | Premium Digital Gift Cards',
    description: 'Instant digital gift cards for Steam, PlayStation, Xbox, and more.',
    url: 'https://gift-vault.me',
    siteName: 'GiftVault',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=630&fit=crop',
        width: 1200,
        height: 630,
        alt: 'GiftVault Digital Gift Cards',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GiftVault | Premium Digital Gift Cards',
    description: 'Instant digital gift cards for Steam, PlayStation, Xbox, and more.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'OnlineStore',
  name: 'GiftVault',
  url: 'https://gift-vault.me',
  description: 'Instant digital gift cards for Steam, PlayStation, Xbox, Apple, and Google Play.',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://gift-vault.me/shop?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" className={`${inter.variable} ${cairo.variable}`}>
      <head>
        <GoogleAnalytics />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-dark-950 text-dark-100 antialiased selection:bg-primary-500 selection:text-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
