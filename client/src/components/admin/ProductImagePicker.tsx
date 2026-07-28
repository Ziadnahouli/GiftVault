"use client";

import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Check, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ProductImagePickerProps {
  productName: string;
  currentImage: string;
  onSelectImage: (imageUrl: string) => void;
}

// Preset Curated High-Definition Digital Gift Card & Game Cover Images
const CURATED_IMAGE_PRESETS = [
  {
    name: "Steam Wallet",
    keywords: ["steam", "valve", "steam wallet"],
    url: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&auto=format&fit=crop&q=80",
    badge: "Steam"
  },
  {
    name: "PlayStation Store",
    keywords: ["playstation", "psn", "ps5", "sony"],
    url: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop&q=80",
    badge: "PSN"
  },
  {
    name: "Xbox Live & Game Pass",
    keywords: ["xbox", "game pass", "microsoft"],
    url: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800&auto=format&fit=crop&q=80",
    badge: "Xbox"
  },
  {
    name: "Roblox Robux",
    keywords: ["roblox", "robux"],
    url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80",
    badge: "Roblox"
  },
  {
    name: "Apple & iTunes",
    keywords: ["apple", "itunes", "app store"],
    url: "https://images.unsplash.com/photo-1616469829941-c7200edec809?w=800&auto=format&fit=crop&q=80",
    badge: "Apple"
  },
  {
    name: "Google Play",
    keywords: ["google", "google play", "android"],
    url: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=800&auto=format&fit=crop&q=80",
    badge: "Google Play"
  },
  {
    name: "PUBG Mobile UC",
    keywords: ["pubg", "uc", "pubg mobile"],
    url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
    badge: "PUBG"
  },
  {
    name: "Free Fire Diamonds",
    keywords: ["free fire", "garena", "diamonds"],
    url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80",
    badge: "Free Fire"
  },
  {
    name: "Valorant Points",
    keywords: ["valorant", "vp", "riot"],
    url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80",
    badge: "Valorant"
  },
  {
    name: "Netflix Premium",
    keywords: ["netflix", "movies"],
    url: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop&q=80",
    badge: "Netflix"
  },
  {
    name: "Razer Gold",
    keywords: ["razer", "razer gold"],
    url: "https://images.unsplash.com/photo-1526509867162-5b0c0d1b4b33?w=800&auto=format&fit=crop&q=80",
    badge: "Razer Gold"
  },
  {
    name: "Nintendo eShop",
    keywords: ["nintendo", "switch", "eshop"],
    url: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&auto=format&fit=crop&q=80",
    badge: "Nintendo"
  },
  {
    name: "Spotify Premium",
    keywords: ["spotify", "music"],
    url: "https://images.unsplash.com/photo-1614680376593-902f749f7cfc?w=800&auto=format&fit=crop&q=80",
    badge: "Spotify"
  },
  {
    name: "Amazon Gift Card",
    keywords: ["amazon", "shopping"],
    url: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=800&auto=format&fit=crop&q=80",
    badge: "Amazon"
  },
  {
    name: "Discord Nitro",
    keywords: ["discord", "nitro"],
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    badge: "Discord"
  },
  {
    name: "Twitch Gift Card",
    keywords: ["twitch", "stream"],
    url: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&auto=format&fit=crop&q=80",
    badge: "Twitch"
  }
];

export function ProductImagePicker({ productName, currentImage, onSelectImage }: ProductImagePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(productName || '');
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [customUrlInput, setCustomUrlInput] = useState('');

  useEffect(() => {
    if (productName && !searchTerm) {
      setSearchTerm(productName);
    }
  }, [productName]);

  const handleOpen = () => {
    setSearchTerm(productName || '');
    setIsOpen(true);
  };

  const handlePickImage = (url: string, name: string) => {
    onSelectImage(url);
    toast.success(`Selected image for ${name}!`);
    setIsOpen(false);
  };

  const filteredPresets = CURATED_IMAGE_PRESETS.filter(item => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      item.name.toLowerCase().includes(term) ||
      item.keywords.some(k => k.includes(term) || term.includes(k)) ||
      item.badge.toLowerCase().includes(term)
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
        <span>Select Cover Photo for "{productName || 'Product'}"</span>
      </button>

      {/* Picker Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-dark-900 border border-dark-700 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-dark-800 flex items-center justify-between bg-dark-950/60">
              <div>
                <div className="flex items-center gap-2 text-primary-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <ImageIcon className="w-4 h-4" />
                  <span>Product Image Selector</span>
                </div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  Choose Cover Image
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

            {/* Search Input Bar */}
            <div className="p-4 bg-dark-950/40 border-b border-dark-800/80 flex items-center gap-3">
              <div className="relative flex-grow">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  type="text"
                  placeholder="Search images (e.g. Steam, PlayStation, Xbox, PUBG, Roblox, Netflix...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
                />
              </div>

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-xs text-dark-400 hover:text-white underline px-2"
                >
                  Show All
                </button>
              )}
            </div>

            {/* Images Grid Content */}
            <div className="p-6 overflow-y-auto flex-grow space-y-4">
              {filteredPresets.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredPresets.map((item, idx) => {
                    const isSelected = currentImage === item.url;
                    return (
                      <div
                        key={idx}
                        onClick={() => handlePickImage(item.url, item.name)}
                        className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all transform hover:-translate-y-1 shadow-lg ${
                          isSelected
                            ? 'border-emerald-500 shadow-glow-sm'
                            : 'border-dark-800 hover:border-primary-500/80'
                        }`}
                      >
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        
                        {/* Overlay Badge */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-between">
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
              ) : (
                <div className="text-center py-12 space-y-3">
                  <ImageIcon className="w-10 h-10 text-dark-600 mx-auto" />
                  <p className="text-sm text-white font-semibold">No preset images match "{searchTerm}"</p>
                  <p className="text-xs text-dark-400">Try searching for keywords like "Steam", "PSN", "Xbox", or "Gaming".</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-dark-800 bg-dark-950/60 flex items-center justify-between text-xs text-dark-400">
              <span>Click any image above to select it immediately.</span>
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
