"use client";

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Shield, Globe, Zap, HeartHandshake } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-dark-950">
      <Navbar />
      
      <main className="flex-grow">
        {/* Header Hero */}
        <div className="relative py-24 md:py-32 overflow-hidden border-b border-dark-800">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-dark-950/50 via-dark-950/80 to-dark-950"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-primary-500/20 blur-[120px] rounded-full pointer-events-none"></div>
          
          <div className="page-container relative z-10 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Powering Global <span className="gradient-text">Gaming</span>
            </h1>
            <p className="text-dark-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              We are on a mission to break down regional barriers. Get instant access to your favorite digital platforms from anywhere in the world.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="border-b border-dark-800 bg-dark-900/50">
          <div className="page-container py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-dark-800/50">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">5+</div>
                <div className="text-dark-400 text-sm font-medium uppercase tracking-wider">Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">1M+</div>
                <div className="text-dark-400 text-sm font-medium uppercase tracking-wider">Cards Delivered</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">24/7</div>
                <div className="text-dark-400 text-sm font-medium uppercase tracking-wider">Customer Support</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">99%</div>
                <div className="text-dark-400 text-sm font-medium uppercase tracking-wider">Happy Customers</div>
              </div>
            </div>
          </div>
        </div>

        <div className="page-container py-20 md:py-32">
          
          {/* Our Story */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Our Story</h2>
              <div className="space-y-4 text-dark-300 leading-relaxed text-lg">
                <p>
                  GiftVault was founded with a simple realization: buying digital goods across borders was entirely too complicated. Gamers and digital consumers were constantly facing payment rejections, regional lockouts, and shady reseller markets.
                </p>
                <p>
                  We built a platform that eliminates these hurdles. By providing a secure, automated, and regionally diverse inventory of gift cards, we enable anyone to enjoy their favorite entertainment without borders.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden glass-card p-2">
                <img 
                  src="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80" 
                  alt="Gaming setup" 
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
              {/* Floating Element */}
              <div className="absolute -bottom-6 -left-6 glass-card p-6 rounded-2xl flex items-center gap-4 animate-float">
                <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <div className="text-white font-bold">100% Secure</div>
                  <div className="text-dark-400 text-sm">Official Reseller</div>
                </div>
              </div>
            </div>
          </div>

          {/* Why Choose Us */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Choose GiftVault?</h2>
            <p className="text-dark-400 text-lg max-w-2xl mx-auto">
              We focus on the three pillars of a great digital experience: Speed, Security, and Support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 bg-primary-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Instant Delivery</h3>
              <p className="text-dark-300 leading-relaxed">
                Our automated systems ensure your digital codes are delivered directly to your WhatsApp the moment your payment clears. No waiting.
              </p>
            </div>
            
            <div className="glass-card p-8 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Globe className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Global Regions</h3>
              <p className="text-dark-300 leading-relaxed">
                Whether you need a US iTunes card or a Turkish Steam Wallet, we hold inventory for virtually every major region in the world.
              </p>
            </div>

            <div className="glass-card p-8 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6">
                <HeartHandshake className="w-7 h-7 text-rose-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Human Support</h3>
              <p className="text-dark-300 leading-relaxed">
                Bots don't solve complex issues. That's why our WhatsApp support line connects you directly to real humans ready to assist you.
              </p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
