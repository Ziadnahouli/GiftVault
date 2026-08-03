"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Command, Tag, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCurrency } from '@/contexts/CurrencyContext';

interface Product {
  id: string;
  name: string;
  slug: string;
  cardImage?: string;
  basePrice: number;
  categoryName?: string;
  regionName?: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { formatPrice } = useCurrency();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Handle Cmd+K shortcut globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Instant debounced search API call
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${apiUrl}/api/products?search=${encodeURIComponent(query)}&limit=6`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.products || data || []);
        }
      } catch (err) {
        console.error('Search fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-dark-950/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-2xl bg-dark-900 border border-dark-700/80 rounded-2xl shadow-2xl overflow-hidden z-10"
          >
            {/* Search Input Bar */}
            <div className="relative flex items-center px-4 border-b border-dark-800">
              <Search className="w-5 h-5 text-dark-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search digital cards, games, Steam, PSN..."
                className="w-full px-4 py-4 bg-transparent text-white placeholder-dark-400 focus:outline-none text-base font-medium"
              />
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-primary-400 animate-spin shrink-0" />
              ) : query ? (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 text-dark-400 hover:text-white transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-dark-400 bg-dark-800 rounded border border-dark-700">
                  <Command className="w-3 h-3" /> K
                </kbd>
              )}
            </div>

            {/* Results Section */}
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
              {query.trim() === '' ? (
                <div className="py-8 text-center text-dark-400 text-sm">
                  Type to instantly search across all digital cards & categories.
                </div>
              ) : isLoading && results.length === 0 ? (
                <div className="py-8 text-center text-dark-400 text-sm flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary-400" /> Searching catalog...
                </div>
              ) : results.length === 0 ? (
                <div className="py-8 text-center text-dark-400 text-sm">
                  No cards found matching "<span className="text-white">{query}</span>"
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-dark-400 uppercase tracking-wider px-2 mb-2">
                    Found {results.length} Product{results.length > 1 ? 's' : ''}
                  </div>
                  {results.map((product) => (
                    <Link
                      key={product.id}
                      href={`/shop?q=${encodeURIComponent(product.name)}`}
                      onClick={onClose}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-dark-800/80 border border-transparent hover:border-dark-700 transition-all group"
                    >
                      <div className="w-12 h-12 relative rounded-lg bg-dark-800 overflow-hidden border border-dark-700 shrink-0">
                        {product.cardImage ? (
                          <Image
                            src={product.cardImage}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-dark-500">
                            <Tag className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold text-sm truncate group-hover:text-primary-400 transition-colors">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-dark-400 mt-0.5">
                          {product.categoryName && (
                            <span className="bg-dark-800 px-2 py-0.5 rounded border border-dark-700">
                              {product.categoryName}
                            </span>
                          )}
                          {product.regionName && (
                            <span className="text-dark-400">{product.regionName}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-primary-400 font-bold text-sm">
                          {formatPrice(product.basePrice)}
                        </div>
                        <span className="inline-flex items-center text-xs text-dark-400 group-hover:text-white transition-colors">
                          View <ArrowRight className="w-3 h-3 ml-1" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-3 bg-dark-950/60 border-t border-dark-800 flex items-center justify-between text-xs text-dark-400">
              <span>Press <kbd className="text-dark-300 bg-dark-800 px-1.5 py-0.5 rounded border border-dark-700">ESC</kbd> to exit</span>
              {query && (
                <Link
                  href={`/shop?q=${encodeURIComponent(query)}`}
                  onClick={onClose}
                  className="text-primary-400 hover:text-primary-300 font-medium inline-flex items-center gap-1"
                >
                  See all results in Shop <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
