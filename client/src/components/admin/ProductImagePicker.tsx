"use client";

import React, { useState } from 'react';
import { Search, Sparkles, Check, Image as ImageIcon, X, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ProductImagePickerProps {
  productName: string;
  currentImage: string;
  onSelectImage: (imageUrl: string) => void;
}

// Complete HD Brand Cover Photos for Gift Cards & Gaming
const ALL_BRAND_PRESETS = [
  {
    name: "Steam Wallet Card",
    brand: "Steam",
    keywords: ["steam", "valve", "wallet"],
    url: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&auto=format&fit=crop&q=80",
    badge: "Steam"
  },
  {
    name: "PlayStation Store Card",
    brand: "PlayStation",
    keywords: ["playstation", "psn", "ps4", "ps5", "sony"],
    url: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop&q=80",
    badge: "PSN"
  },
  {
    name: "Xbox Live & Game Pass",
    brand: "Xbox",
    keywords: ["xbox", "game pass", "microsoft", "gold"],
    url: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800&auto=format&fit=crop&q=80",
    badge: "Xbox"
  },
  {
    name: "Apple & iTunes Card",
    brand: "Apple",
    keywords: ["apple", "itunes", "app store", "ios"],
    url: "https://images.unsplash.com/photo-1616469829941-c7200edec809?w=800&auto=format&fit=crop&q=80",
    badge: "Apple"
  },
  {
    name: "Google Play Gift Card",
    brand: "Google Play",
    keywords: ["google", "google play", "android", "play store"],
    url: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=800&auto=format&fit=crop&q=80",
    badge: "Google Play"
  },
  {
    name: "PUBG Mobile UC",
    brand: "PUBG",
    keywords: ["pubg", "uc", "unknown cash", "pubg mobile"],
    url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
    badge: "PUBG"
  },
  {
    name: "Roblox Robux Card",
    brand: "Roblox",
    keywords: ["roblox", "robux"],
    url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80",
    badge: "Roblox"
  },
  {
    name: "Free Fire Diamonds",
    brand: "Free Fire",
    keywords: ["free fire", "garena", "diamonds", "ff"],
    url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80",
    badge: "Free Fire"
  },
  {
    name: "Valorant Points (VP)",
    brand: "Valorant",
    keywords: ["valorant", "vp", "riot", "points"],
    url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80",
    badge: "Valorant"
  },
  {
    name: "Razer Gold PIN",
    brand: "Razer Gold",
    keywords: ["razer", "razer gold", "pin", "gold"],
    url: "https://images.unsplash.com/photo-1526509867162-5b0c0d1b4b33?w=800&auto=format&fit=crop&q=80",
    badge: "Razer Gold"
  },
  {
    name: "Netflix Subscription",
    brand: "Netflix",
    keywords: ["netflix", "movies", "streaming"],
    url: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop&q=80",
    badge: "Netflix"
  },
  {
    name: "Nintendo eShop Card",
    brand: "Nintendo",
    keywords: ["nintendo", "switch", "eshop", "mario"],
    url: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&auto=format&fit=crop&q=80",
    badge: "Nintendo"
  },
  {
    name: "Spotify Premium",
    brand: "Spotify",
    keywords: ["spotify", "music", "premium"],
    url: "https://images.unsplash.com/photo-1614680376593-902f749f7cfc?w=800&auto=format&fit=crop&q=80",
    badge: "Spotify"
  },
  {
    name: "Amazon Gift Card",
    brand: "Amazon",
    keywords: ["amazon", "shopping", "gift card"],
    url: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=800&auto=format&fit=crop&q=80",
    badge: "Amazon"
  },
  {
    name: "Discord Nitro",
    brand: "Discord",
    keywords: ["discord", "nitro", "chat"],
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    badge: "Discord"
  },
  {
    name: "Twitch Gift Card",
    brand: "Twitch",
    keywords: ["twitch", "stream", "subs"],
    url: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&auto=format&fit=crop&q=80",
    badge: "Twitch"
  },
  {
    name: "EA FC / FIFA Points",
    brand: "EA Sports",
    keywords: ["ea", "fifa", "fc", "ea sports", "ultimateteam"],
    url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80",
    badge: "EA Sports"
  },
  {
    name: "League of Legends RP",
    brand: "League of Legends",
    keywords: ["lol", "league", "riot", "rp"],
    url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
    badge: "Riot Games"
  }
];

export function ProductImagePicker({ productName, currentImage, onSelectImage }: ProductImagePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  const handleOpen = () => {
    setFilterQuery(''); // Open showing ALL photos by default!
    setIsOpen(true);
  };

  const handlePick = (url: string, name: string) => {
    onSelectImage(url);
    toast.success(`Image selected for ${name}`);
    setIsOpen(false);
  };

  // Find exact match suggestion based on product name
  const suggestedPreset = ALL_BRAND_PRESETS.find(item => {
    if (!productName) return false;
    const nameLower = productName.toLowerCase();
    return item.keywords.some(k => nameLower.includes(k));
  });

  const displayedPresets = ALL_BRAND_PRESETS.filter(item => {
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
        <span>Select Cover Photo Gallery</span>
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
                  Pick Image for {productName || 'Product'}
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
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/20">
                    <img src={suggestedPreset.url} alt={suggestedPreset.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Auto-Detected Match
                    </span>
                    <h4 className="text-xs font-bold text-white">{suggestedPreset.name}</h4>
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
                  placeholder="Filter gallery (Steam, PlayStation, Xbox, Apple, Google Play, PUBG, Roblox, Free Fire, Valorant, Netflix, Razer...)"
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
                      className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all transform hover:-translate-y-1 shadow-lg ${
                        isSelected
                          ? 'border-emerald-500 shadow-glow-sm'
                          : 'border-dark-800 hover:border-primary-500'
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-3 flex flex-col justify-between">
                        <span className="self-start text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-md border border-white/10">
                          {item.badge}
                        </span>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white truncate drop-shadow-md">{item.name}</span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-dark-800 bg-dark-950/60 flex items-center justify-between text-xs text-dark-400">
              <span>Click any image to select it for your product.</span>
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
