"use client";

import React, { useState } from 'react';
import { Search, Sparkles, Check, Image as ImageIcon, X, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ProductImagePickerProps {
  productName: string;
  currentImage: string;
  onSelectImage: (imageUrl: string) => void;
}

// Exact Official Brand Logos & Cover Artworks for Digital Gift Cards
const EXACT_OFFICIAL_BRAND_PRESETS = [
  {
    name: "Steam Wallet",
    brand: "Steam",
    keywords: ["steam", "valve", "wallet"],
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/1024px-Steam_icon_logo.svg.png",
    bgGradient: "from-slate-900 via-blue-950 to-slate-900",
    badge: "Steam"
  },
  {
    name: "PlayStation Store",
    brand: "PlayStation",
    keywords: ["playstation", "psn", "ps4", "ps5", "sony"],
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/PlayStation_logo.svg/1024px-PlayStation_logo.svg.png",
    bgGradient: "from-blue-950 via-indigo-900 to-blue-950",
    badge: "PSN"
  },
  {
    name: "Xbox Live & Game Pass",
    brand: "Xbox",
    keywords: ["xbox", "game pass", "microsoft", "gold"],
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Xbox_one_logo.svg/1024px-Xbox_one_logo.svg.png",
    bgGradient: "from-emerald-950 via-green-900 to-slate-900",
    badge: "Xbox"
  },
  {
    name: "Apple & iTunes Card",
    brand: "Apple",
    keywords: ["apple", "itunes", "app store", "ios"],
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/800px-Apple_logo_black.svg.png",
    bgGradient: "from-zinc-900 via-neutral-800 to-zinc-900",
    badge: "Apple"
  },
  {
    name: "Google Play Card",
    brand: "Google Play",
    keywords: ["google", "google play", "android", "play store"],
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Google_Play_2022_logo.svg/1024px-Google_Play_2022_logo.svg.png",
    bgGradient: "from-slate-900 via-cyan-950 to-slate-900",
    badge: "Google Play"
  },
  {
    name: "PUBG Mobile UC",
    brand: "PUBG",
    keywords: ["pubg", "uc", "unknown cash", "pubg mobile"],
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/PUBG_Mobile_logo.svg/1024px-PUBG_Mobile_logo.svg.png",
    bgGradient: "from-amber-950 via-yellow-900 to-slate-900",
    badge: "PUBG"
  },
  {
    name: "Roblox Robux",
    brand: "Roblox",
    keywords: ["roblox", "robux"],
    url: "https://upload.wikimedia.org/wikipedia/commons/3/3a/Roblox_player_icon_2022.svg",
    bgGradient: "from-red-950 via-zinc-900 to-red-950",
    badge: "Roblox"
  },
  {
    name: "Free Fire Diamonds",
    brand: "Free Fire",
    keywords: ["free fire", "garena", "diamonds", "ff"],
    url: "https://upload.wikimedia.org/wikipedia/en/thumb/0/02/Free_Fire_logo.svg/1024px-Free_Fire_logo.svg.png",
    bgGradient: "from-orange-950 via-amber-900 to-slate-900",
    badge: "Free Fire"
  },
  {
    name: "Valorant Points (VP)",
    brand: "Valorant",
    keywords: ["valorant", "vp", "riot", "points"],
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Valorant_logo_-_Executable_icon.svg/1024px-Valorant_logo_-_Executable_icon.svg.png",
    bgGradient: "from-rose-950 via-red-900 to-slate-900",
    badge: "Valorant"
  },
  {
    name: "Razer Gold PIN",
    brand: "Razer Gold",
    keywords: ["razer", "razer gold", "pin", "gold"],
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Razer_snake_logo.svg/1024px-Razer_snake_logo.svg.png",
    bgGradient: "from-emerald-950 via-green-900 to-slate-900",
    badge: "Razer Gold"
  },
  {
    name: "Netflix Subscription",
    brand: "Netflix",
    keywords: ["netflix", "movies", "streaming"],
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/1024px-Netflix_2015_logo.svg.png",
    bgGradient: "from-red-950 via-slate-950 to-red-950",
    badge: "Netflix"
  },
  {
    name: "Nintendo eShop Card",
    brand: "Nintendo",
    keywords: ["nintendo", "switch", "eshop", "mario"],
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Nintendo_Switch_logo.svg/1024px-Nintendo_Switch_logo.svg.png",
    bgGradient: "from-red-900 via-rose-950 to-red-900",
    badge: "Nintendo"
  },
  {
    name: "Spotify Premium",
    brand: "Spotify",
    keywords: ["spotify", "music", "premium"],
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/1024px-Spotify_logo_without_text.svg.png",
    bgGradient: "from-emerald-950 via-teal-900 to-slate-950",
    badge: "Spotify"
  },
  {
    name: "Amazon Gift Card",
    brand: "Amazon",
    keywords: ["amazon", "shopping", "gift card"],
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1024px-Amazon_logo.svg.png",
    bgGradient: "from-amber-950 via-zinc-900 to-slate-950",
    badge: "Amazon"
  },
  {
    name: "Discord Nitro",
    brand: "Discord",
    keywords: ["discord", "nitro", "chat"],
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Discord_logo_wordmark_2021.svg/1024px-Discord_logo_wordmark_2021.svg.png",
    bgGradient: "from-indigo-950 via-blue-900 to-slate-950",
    badge: "Discord"
  },
  {
    name: "Twitch Gift Card",
    brand: "Twitch",
    keywords: ["twitch", "stream", "subs"],
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Twitch_Glitch_Logo_Purple.svg/1024px-Twitch_Glitch_Logo_Purple.svg.png",
    bgGradient: "from-purple-950 via-indigo-900 to-slate-950",
    badge: "Twitch"
  },
  {
    name: "EA Sports / FC 24 Points",
    brand: "EA Sports",
    keywords: ["ea", "fifa", "fc", "ea sports", "ultimateteam"],
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/EA_Sports_logo.svg/1024px-EA_Sports_logo.svg.png",
    bgGradient: "from-slate-900 via-blue-950 to-slate-900",
    badge: "EA Sports"
  },
  {
    name: "League of Legends RP",
    brand: "League of Legends",
    keywords: ["lol", "league", "riot", "rp"],
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/League_of_Legends_Core_Riot_Authenticated_Icon.png/800px-League_of_Legends_Core_Riot_Authenticated_Icon.png",
    bgGradient: "from-cyan-950 via-blue-900 to-slate-950",
    badge: "Riot Games"
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
    toast.success(`Selected official logo for ${name}`);
    setIsOpen(false);
  };

  // Find exact match suggestion based on product name
  const suggestedPreset = EXACT_OFFICIAL_BRAND_PRESETS.find(item => {
    if (!productName) return false;
    const nameLower = productName.toLowerCase();
    return item.keywords.some(k => nameLower.includes(k));
  });

  const displayedPresets = EXACT_OFFICIAL_BRAND_PRESETS.filter(item => {
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
        <span>Select Official Brand Logo</span>
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
                  <span>Official Brand Logos & Card Covers</span>
                </div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  Choose Logo for {productName || 'Product'}
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
                    <img src={suggestedPreset.url} alt={suggestedPreset.name} className="max-w-full max-h-full object-contain" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Exact Logo Match Found
                    </span>
                    <h4 className="text-xs font-bold text-white">{suggestedPreset.name} Official Logo</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handlePick(suggestedPreset.url, suggestedPreset.name)}
                  className="btn-primary py-1.5 px-4 text-xs font-bold rounded-xl shrink-0"
                >
                  Use Official Logo
                </button>
              </div>
            )}

            {/* Search Filter Input */}
            <div className="p-4 px-6 bg-dark-950/40 border-b border-dark-800/80 flex items-center gap-3">
              <div className="relative flex-grow">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  type="text"
                  placeholder="Search brand logos (Steam, PlayStation, Xbox, Apple, Google Play, PUBG, Roblox, Free Fire, Valorant, Netflix...)"
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
                  Show All Logos
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
                      className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all transform hover:-translate-y-1 shadow-lg bg-gradient-to-br ${item.bgGradient} p-4 flex flex-col justify-between items-center text-center ${
                        isSelected
                          ? 'border-emerald-500 shadow-glow-sm ring-2 ring-emerald-500/50'
                          : 'border-dark-700 hover:border-primary-500'
                      }`}
                    >
                      {/* Badge Top Left */}
                      <span className="self-start text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-md border border-white/10">
                        {item.badge}
                      </span>

                      {/* Exact Official Brand Logo */}
                      <div className="w-16 h-16 my-auto flex items-center justify-center p-2 group-hover:scale-110 transition-transform duration-300">
                        <img
                          src={item.url}
                          alt={item.name}
                          className="max-w-full max-h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
                        />
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
              <span>Click any official logo above to assign it to your product instantly.</span>
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
