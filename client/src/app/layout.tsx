import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import { Providers } from "@/contexts/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cairo = Cairo({ subsets: ["arabic"], variable: "--font-cairo" });

export const metadata: Metadata = {
  title: 'GiftVault | Premium Digital Gift Cards',
  description: 'Your premier destination for instant digital gift cards across Steam, PlayStation, Xbox, and more. Global reach, local payments.',
  keywords: 'gift cards, digital cards, steam wallet, psn, xbox live, instant delivery',
  openGraph: {
    title: 'GiftVault | Premium Digital Gift Cards',
    description: 'Instant digital gift cards for Steam, PlayStation, Xbox, and more.',
    url: 'https://mydomain.com',
    siteName: 'GiftVault',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=630&fit=crop',
        width: 1200,
        height: 630,
        alt: 'GiftVault',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Default to LTR and English initially, LanguageContext will update if needed
    <html lang="en" dir="ltr" className={`${inter.variable} ${cairo.variable}`}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
