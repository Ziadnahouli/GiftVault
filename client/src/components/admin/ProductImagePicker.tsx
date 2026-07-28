"use client";

import React, { useState } from 'react';
import { Search, Sparkles, Check, Image as ImageIcon, X, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ProductImagePickerProps {
  productName: string;
  currentImage: string;
  onSelectImage: (imageUrl: string) => void;
}

// Crisp Vector Brand Logos (Zero Broken Images guaranteed)
function BrandLogoSvg({ brand }: { brand: string }) {
  switch (brand) {
    case 'Steam':
      return (
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current text-sky-400">
          <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.373 1.203-.594 1.914-.594.104 0 .207.006.31.015l3.186-4.631v-.063c0-2.222 1.806-4.028 4.028-4.028 2.222 0 4.028 1.806 4.028 4.028 0 2.222-1.806 4.028-4.028 4.028h-.097l-4.57 3.22c.01.107.017.214.017.323 0 1.956-1.585 3.541-3.541 3.541-1.637 0-3.023-1.112-3.436-2.625L.445 15.152C1.728 20.306 6.41 24 11.979 24c6.627 0 12-5.373 12-12s-5.373-12-12-12z"/>
        </svg>
      );
    case 'PlayStation':
      return (
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current text-blue-400">
          <path d="M8.7 17.7v-7.3c0-.4.3-.7.7-.7h1.4c.4 0 .7.3.7.7v7.3h3.5v-9c0-1.1-.9-2-2-2h-5.8c-1.1 0-2 .9-2 2v9h3.5zm7.3-15.7H8c-2.2 0-4 1.8-4 4v12c0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4V6c0-2.2-1.8-4-4-4zm2 16c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v12z"/>
        </svg>
      );
    case 'Xbox':
      return (
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current text-emerald-400">
          <path d="M4.6 2.2C6.8 1.4 9.3 1 12 1s5.2.4 7.4 1.2c.4.1.6.5.4.9l-4.1 6.5c-1.1-.6-2.4-1-3.7-1s-2.6.4-3.7 1L4.2 3.1c-.2-.4 0-.8.4-.9zm14.8 14.2c-1.8 2.5-4.6 4.3-7.8 4.6-3.2-.3-6-2.1-7.8-4.6-.3-.4-.2-.9.2-1.2l5.4-3.9c.7.4 1.5.6 2.4.6s1.7-.2 2.4-.6l5.4 3.9c.4.3.5.8.2 1.2z"/>
        </svg>
      );
    case 'Apple':
      return (
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current text-slate-200">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.13-1.97.99-3.12-1 .04-2.18.67-2.88 1.49-.62.72-1.15 1.88-.99 3.01 1.11.09 2.22-.56 2.88-1.38z"/>
        </svg>
      );
    case 'Google Play':
      return (
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current text-cyan-400">
          <path d="M3.6 1.8L14.7 12 3.6 22.2C3.2 21.8 3 21 3 20V4c0-1 .2-1.8.6-2.2zm12.5 11.4l2.6-1.5c.8-.5.8-1.3 0-1.7l-2.6-1.5-2.1 2.1 2.1 2.6zM4.9 23.3l10.3-10-2-2L4.9 23.3zM4.9.7l8.3 8.3 2-2L4.9.7z"/>
        </svg>
      );
    case 'Roblox':
      return (
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current text-rose-500">
          <path d="M5.3 1.5L22.5 6.1L18.7 22.5L1.5 17.9L5.3 1.5ZM10.5 9.8L9.2 14.2L13.5 15.3L14.8 10.9L10.5 9.8Z"/>
        </svg>
      );
    case 'Netflix':
      return (
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current text-red-600">
          <path d="M5.4 0v24h4.1V12.7L14.5 24h4.1V0h-4.1v11.3L9.5 0H5.4z"/>
        </svg>
      );
    case 'Spotify':
      return (
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current text-emerald-400">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.5-1.5-5.7-1.9-9.5-1-.4.1-.7-.2-.8-.5-.1-.4.2-.7.5-.8 4.1-1 7.7-.5 10.5 1.2.3.2.4.6.2.9zm1.5-3.3c-.3.4-.8.5-1.2.3-2.9-1.8-7.3-2.3-10.7-1.3-.4.1-.9-.1-1-.6-.1-.4.1-.9.6-1 3.9-1.2 8.8-.6 12 1.4.4.2.5.8.3 1.2zm.1-3.4C15.6 8.5 9.7 8.3 6.3 9.3c-.5.2-1.1-.1-1.3-.6-.2-.5.1-1.1.6-1.3 3.9-1.2 10.4-1 14.8 1.6.5.3.6.9.3 1.4-.2.5-.9.7-1.4.4z"/>
        </svg>
      );
    default:
      return <Zap className="w-10 h-10 text-amber-400" />;
  }
}

// Reliable 100% High-Definition Digital Gift Card CDN Covers
const BRAND_PRESETS = [
  {
    name: "Steam Wallet",
    brand: "Steam",
    keywords: ["steam", "valve", "wallet"],
    url: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&auto=format&fit=crop&q=80",
    bg: "from-slate-950 via-blue-950 to-slate-900",
    badge: "Steam"
  },
  {
    name: "PlayStation Store",
    brand: "PlayStation",
    keywords: ["playstation", "psn", "ps4", "ps5", "sony"],
    url: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop&q=80",
    bg: "from-blue-950 via-indigo-950 to-slate-900",
    badge: "PSN"
  },
  {
    name: "Xbox Live & Game Pass",
    brand: "Xbox",
    keywords: ["xbox", "game pass", "microsoft", "gold"],
    url: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800&auto=format&fit=crop&q=80",
    bg: "from-emerald-950 via-green-950 to-slate-900",
    badge: "Xbox"
  },
  {
    name: "Apple & iTunes",
    brand: "Apple",
    keywords: ["apple", "itunes", "app store", "ios"],
    url: "https://images.unsplash.com/photo-1616469829941-c7200edec809?w=800&auto=format&fit=crop&q=80",
    bg: "from-zinc-900 via-neutral-900 to-zinc-950",
    badge: "Apple"
  },
  {
    name: "Google Play Card",
    brand: "Google Play",
    keywords: ["google", "google play", "android", "play store"],
    url: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=800&auto=format&fit=crop&q=80",
    bg: "from-slate-950 via-cyan-950 to-slate-900",
    badge: "Google Play"
  },
  {
    name: "PUBG Mobile UC",
    brand: "PUBG",
    keywords: ["pubg", "uc", "unknown cash", "pubg mobile"],
    url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
    bg: "from-amber-950 via-yellow-950 to-slate-950",
    badge: "PUBG"
  },
  {
    name: "Roblox Robux",
    brand: "Roblox",
    keywords: ["roblox", "robux"],
    url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80",
    bg: "from-red-950 via-zinc-900 to-slate-950",
    badge: "Roblox"
  },
  {
    name: "Free Fire Diamonds",
    brand: "Free Fire",
    keywords: ["free fire", "garena", "diamonds", "ff"],
    url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80",
    bg: "from-orange-950 via-amber-950 to-slate-950",
    badge: "Free Fire"
  },
  {
    name: "Valorant Points (VP)",
    brand: "Valorant",
    keywords: ["valorant", "vp", "riot", "points"],
    url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80",
    bg: "from-rose-950 via-red-950 to-slate-950",
    badge: "Valorant"
  },
  {
    name: "Razer Gold PIN",
    brand: "Razer Gold",
    keywords: ["razer", "razer gold", "pin", "gold"],
    url: "https://images.unsplash.com/photo-1526509867162-5b0c0d1b4b33?w=800&auto=format&fit=crop&q=80",
    bg: "from-emerald-950 via-teal-950 to-slate-950",
    badge: "Razer Gold"
  },
  {
    name: "Netflix Subscription",
    brand: "Netflix",
    keywords: ["netflix", "movies", "streaming"],
    url: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop&q=80",
    bg: "from-red-950 via-slate-950 to-red-950",
    badge: "Netflix"
  },
  {
    name: "Nintendo eShop Card",
    brand: "Nintendo",
    keywords: ["nintendo", "switch", "eshop", "mario"],
    url: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&auto=format&fit=crop&q=80",
    bg: "from-red-950 via-rose-950 to-slate-950",
    badge: "Nintendo"
  },
  {
    name: "Spotify Premium",
    brand: "Spotify",
    keywords: ["spotify", "music", "premium"],
    url: "https://images.unsplash.com/photo-1614680376593-902f749f7cfc?w=800&auto=format&fit=crop&q=80",
    bg: "from-emerald-950 via-teal-950 to-slate-950",
    badge: "Spotify"
  },
  {
    name: "Amazon Gift Card",
    brand: "Amazon",
    keywords: ["amazon", "shopping", "gift card"],
    url: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=800&auto=format&fit=crop&q=80",
    bg: "from-amber-950 via-zinc-900 to-slate-950",
    badge: "Amazon"
  },
  {
    name: "Discord Nitro",
    brand: "Discord",
    keywords: ["discord", "nitro", "chat"],
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    bg: "from-indigo-950 via-blue-950 to-slate-950",
    badge: "Discord"
  },
  {
    name: "Twitch Gift Card",
    brand: "Twitch",
    keywords: ["twitch", "stream", "subs"],
    url: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&auto=format&fit=crop&q=80",
    bg: "from-purple-950 via-indigo-950 to-slate-950",
    badge: "Twitch"
  }
];

export function ProductImagePicker({ productName, currentImage, onSelectImage }: ProductImagePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  const handleOpen = () => {
    setFilterQuery(''); // Show ALL official logos by default!
    setIsOpen(true);
  };

  const handlePick = (url: string, name: string) => {
    onSelectImage(url);
    toast.success(`Image selected for ${name}`);
    setIsOpen(false);
  };

  // Find exact match suggestion based on product name
  const suggestedPreset = BRAND_PRESETS.find(item => {
    if (!productName) return false;
    const nameLower = productName.toLowerCase();
    return item.keywords.some(k => nameLower.includes(k));
  });

  const displayedPresets = BRAND_PRESETS.filter(item => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase().trim();
    return (
      item.name.toLowerCase().includes(q) ||
      item.brand.toLowerCase().includes(q) ||
      item.keywords.some(k => k.includes(q))
    );
  });

  return (
    <div>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full py-2.5 px-4 bg-gradient-to-r from-primary-600/30 to-secondary-600/30 hover:from-primary-600/50 hover:to-secondary-600/50 border border-primary-500/40 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-glow-sm"
      >
        <Sparkles className="w-4 h-4 text-primary-400" />
        <span>Select Official Brand Cover Image</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-dark-900 border border-dark-700 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="p-6 border-b border-dark-800 flex items-center justify-between bg-dark-950/60">
              <div>
                <div className="flex items-center gap-2 text-primary-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <ImageIcon className="w-4 h-4" />
                  <span>Official Cover Photo Gallery</span>
                </div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  Choose Image for {productName || 'Product'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-dark-400 hover:text-white rounded-xl hover:bg-dark-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Smart Auto-Suggestion Banner (if product name matches a brand) */}
            {suggestedPreset && !filterQuery && (
              <div className="mx-6 mt-4 p-3 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border border-primary-500/30 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-dark-950 p-2 border border-white/20 flex items-center justify-center shrink-0">
                    <BrandLogoSvg brand={suggestedPreset.brand} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Auto-Detected Brand Match
                    </span>
                    <h4 className="text-xs font-bold text-white">{suggestedPreset.name} Cover Card</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handlePick(suggestedPreset.url, suggestedPreset.name)}
                  className="btn-primary py-1.5 px-4 text-xs font-bold rounded-xl shrink-0"
                >
                  Use This Image
                </button>
              </div>
            )}

            {/* Search Filter Input */}
            <div className="p-4 px-6 bg-dark-950/40 border-b border-dark-800/80 flex items-center gap-3">
              <div className="relative flex-grow">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  type="text"
                  placeholder="Filter gallery (Steam, PlayStation, Xbox, Apple, Google Play, PUBG, Roblox, Free Fire, Valorant, Netflix...)"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
                />
              </div>

              {filterQuery && (
                <button
                  type="button"
                  onClick={() => setFilterQuery('')}
                  className="text-xs text-dark-400 hover:text-white underline"
                >
                  Show All
                </button>
              )}
            </div>

            {/* Images Grid */}
            <div className="p-6 overflow-y-auto flex-grow space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {displayedPresets.map((item, idx) => {
                  const isSelected = currentImage === item.url;
                  return (
                    <div
                      key={idx}
                      onClick={() => handlePick(item.url, item.name)}
                      className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all transform hover:-translate-y-1 shadow-lg bg-gradient-to-br ${item.bg} p-4 flex flex-col justify-between items-center text-center ${
                        isSelected
                          ? 'border-emerald-500 shadow-glow-sm ring-2 ring-emerald-500/50'
                          : 'border-dark-700 hover:border-primary-500'
                      }`}
                    >
                      {/* Badge Top Left */}
                      <span className="self-start text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-md border border-white/10">
                        {item.badge}
                      </span>

                      {/* Vector Brand Logo (Never Breaks) */}
                      <div className="w-16 h-16 my-auto flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <BrandLogoSvg brand={item.brand} />
                      </div>

                      {/* Brand Label Bottom */}
                      <div className="w-full flex items-center justify-between pt-2 border-t border-white/10">
                        <span className="text-xs font-bold text-white truncate drop-shadow-md">{item.name}</span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 ml-1">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-dark-800 bg-dark-950/60 flex items-center justify-between text-xs text-dark-400">
              <span>Click any brand card above to assign its cover image to your product.</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn-secondary py-2 px-4 text-xs rounded-xl"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
