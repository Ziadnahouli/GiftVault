"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, RefreshCw, Eye, Check, Download, X, ZoomIn, ZoomOut, Layers, User, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fetchApi, getImageUrl } from '@/lib/api';

interface AIImageSearchModalProps {
  productName: string;
  currentImage: string;
  onSelectImage: (localPath: string) => void;
}

const POPULAR_TAGS = [
  "Steam", "PlayStation", "Xbox", "Apple", "Google Play", "Roblox", 
  "PUBG", "Free Fire", "Valorant", "Netflix", "Razer", "Amazon", "Spotify", "Discord"
];

export function AIImageSearchModal({ productName, currentImage, onSelectImage }: AIImageSearchModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(productName || '');
  const [extractedKeyword, setExtractedKeyword] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('giftvault_recent_image_searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    try {
      const updated = Array.from(new Set([query.trim(), ...recentSearches])).slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('giftvault_recent_image_searches', JSON.stringify(updated));
    } catch {}
  };

  const performSearch = async (queryToSearch: string) => {
    if (!queryToSearch.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetchApi(`/admin/images/search?query=${encodeURIComponent(queryToSearch.trim())}`);
      setResults(res.results || []);
      setExtractedKeyword(res.extractedKeyword || queryToSearch);
      saveRecentSearch(queryToSearch);
    } catch (error) {
      console.error('Failed to search images:', error);
      toast.error('Search failed. Using preset gallery.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto search when modal opens or when productName changes
  useEffect(() => {
    if (isOpen && productName) {
      setSearchQuery(productName);
      performSearch(productName);
    }
  }, [isOpen, productName]);

  // Debounced auto-search as user types
  const handleQueryChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (val.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(val);
      }, 400);
    }
  };

  const handleSelectAndDownload = async (item: any) => {
    setIsDownloading(true);
    const toastId = toast.loading('Downloading image to server & converting to WebP...');
    try {
      const res = await fetchApi('/admin/images/select', {
        method: 'POST',
        body: JSON.stringify({
          downloadUrl: item.downloadUrl || item.fullUrl,
          provider: item.provider,
          photographer: item.photographer,
          width: item.width,
          height: item.height
        })
      });

      toast.success(res.cached ? 'Reused cached local image!' : 'Image saved to /uploads/products/!', { id: toastId });
      onSelectImage(res.localPath);
      setIsOpen(false);
      setPreviewItem(null);
    } catch (error: any) {
      console.error('Failed to save image to server:', error);
      toast.error(error.message || 'Failed to download image to server', { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-2 transition-all shadow-glow-sm cursor-pointer"
      >
        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
        <span>AI Auto-Find Image for "{productName || 'Product'}"</span>
      </button>

      {/* Main Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-dark-900 border border-dark-700 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-dark-800 flex items-center justify-between bg-dark-950/80">
              <div>
                <div className="flex items-center gap-2 text-primary-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>AI Multi-Provider Image Search (Unsplash • Pexels • Pixabay)</span>
                </div>
                <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Search Cover Images</span>
                  {extractedKeyword && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30">
                      Extracted Keyword: "{extractedKeyword}"
                    </span>
                  )}
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

            {/* Search Input Bar & Controls */}
            <div className="p-5 bg-dark-950/50 border-b border-dark-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-grow">
                  <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input
                    type="text"
                    placeholder="Type product name or keywords (e.g. Steam, PlayStation, Xbox, Roblox, Apple, PUBG...)"
                    value={searchQuery}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && performSearch(searchQuery)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setResults([]); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => performSearch(searchQuery)}
                  disabled={isLoading}
                  className="btn-primary py-3 px-5 text-xs font-bold rounded-xl flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Searching...' : 'Search'}</span>
                </button>
              </div>

              {/* Popular Tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-dark-400 mr-1 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-primary-400" /> Popular:
                </span>
                {POPULAR_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => { setSearchQuery(tag); performSearch(tag); }}
                    className="px-2.5 py-1 bg-dark-800 hover:bg-primary-500/20 border border-dark-700 hover:border-primary-500/50 rounded-lg text-[11px] font-semibold text-dark-300 hover:text-white transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="flex items-center gap-2 text-[11px] text-dark-400 pt-0.5">
                  <span className="font-semibold">Recent:</span>
                  {recentSearches.map((recent, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setSearchQuery(recent); performSearch(recent); }}
                      className="hover:text-primary-400 underline cursor-pointer"
                    >
                      {recent}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Results Grid */}
            <div className="p-6 overflow-y-auto flex-grow">
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-pulse">
                  {Array(8).fill(0).map((_, i) => (
                    <div key={i} className="aspect-square bg-dark-800 rounded-2xl border border-dark-700"></div>
                  ))}
                </div>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {results.map((item) => {
                    const isCurrent = currentImage === item.previewUrl || currentImage === item.fullUrl;
                    return (
                      <div
                        key={item.id}
                        className={`group relative aspect-square rounded-2xl overflow-hidden border-2 bg-dark-950 transition-all transform hover:-translate-y-1 shadow-lg ${
                          isCurrent ? 'border-emerald-500 shadow-glow-sm' : 'border-dark-800 hover:border-primary-500'
                        }`}
                      >
                        <img
                          src={item.previewUrl}
                          alt={item.photographer}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Top Badges */}
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-black/70 text-white backdrop-blur-md border border-white/10">
                            {item.provider}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/70 text-dark-300 backdrop-blur-md border border-white/10">
                            {item.width}x{item.height}
                          </span>
                        </div>

                        {/* Hover Actions Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end gap-2">
                          <p className="text-[11px] font-medium text-dark-200 truncate flex items-center gap-1">
                            <User className="w-3 h-3 text-primary-400 shrink-0" />
                            <span>{item.photographer}</span>
                          </p>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => { setPreviewItem(item); setZoomScale(1); }}
                              className="py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-md flex items-center justify-center gap-1 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" /> Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectAndDownload(item)}
                              disabled={isDownloading}
                              className="py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-glow-sm transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" /> Select
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 space-y-3">
                  <ImageIcon className="w-12 h-12 text-dark-600 mx-auto" />
                  <h4 className="text-base font-bold text-white">No images found for "{searchQuery}"</h4>
                  <p className="text-xs text-dark-400">Try searching for keywords like "Steam", "PSN", "Xbox", or "Gaming".</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-dark-800 bg-dark-950/80 flex items-center justify-between text-xs text-dark-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Selected images are automatically saved to your server as optimized WebP files.</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn-secondary py-2 px-5 text-xs rounded-xl"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Large Image Preview Modal (Lightbox) */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fade-in">
          <div className="bg-dark-900 border border-dark-700 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* Lightbox Header */}
            <div className="p-4 border-b border-dark-800 flex items-center justify-between bg-dark-950/80">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-primary-500/20 text-primary-300 rounded-lg text-xs font-bold border border-primary-500/30">
                  {previewItem.provider}
                </span>
                <span className="text-xs font-medium text-dark-300">
                  {previewItem.width} × {previewItem.height} px
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomScale(s => s === 1 ? 1.5 : s === 1.5 ? 2 : 1)}
                  className="p-2 bg-dark-800 hover:bg-dark-700 text-white rounded-xl text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  {zoomScale > 1 ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                  <span>{zoomScale}x</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="p-2 text-dark-400 hover:text-white rounded-xl hover:bg-dark-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lightbox Image Preview */}
            <div className="p-6 overflow-auto flex-grow flex items-center justify-center bg-black/50">
              <img
                src={previewItem.fullUrl || previewItem.previewUrl}
                alt={previewItem.photographer}
                style={{ transform: `scale(${zoomScale})`, transition: 'transform 0.2s ease-in-out' }}
                className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-2xl"
              />
            </div>

            {/* Lightbox Footer & Confirm Button */}
            <div className="p-5 border-t border-dark-800 bg-dark-950/90 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-dark-300">
                <p className="font-semibold text-white">Photographer / Credit: {previewItem.photographer}</p>
                <p className="text-dark-400">High-resolution HD image suitable for store covers.</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="btn-secondary py-2.5 px-4 text-xs w-full sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectAndDownload(previewItem)}
                  disabled={isDownloading}
                  className="btn-primary py-2.5 px-6 text-xs font-bold w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download to Server & Select</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
