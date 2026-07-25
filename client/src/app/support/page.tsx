"use client";

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Mail, MessageCircle, Phone, ChevronDown, HelpCircle, Shield, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SupportPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'policies'>('faq');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "How fast will I receive my gift card?",
      a: "All gift cards are delivered instantly via WhatsApp once your payment is confirmed. Usually, this takes less than 5 minutes."
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept payments through various secure local and international methods via our automated WhatsApp system."
    },
    {
      q: "Can I return a digital gift card?",
      a: "Due to the nature of digital codes, all sales are final. We cannot issue refunds once a code has been delivered. Please ensure you are buying for the correct region."
    },
    {
      q: "The code says invalid or already redeemed?",
      a: "First, verify you are redeeming it on an account matching the card's region. If you still have issues, contact our support team on WhatsApp immediately with a screenshot of the error."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-dark-950">
      <Navbar />
      
      <main className="flex-grow">
        {/* Header Hero */}
        <div className="relative py-20 overflow-hidden border-b border-dark-800">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-900/20 to-transparent pointer-events-none"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-primary-500/10 blur-[120px] rounded-full pointer-events-none"></div>
          
          <div className="page-container relative z-10 text-center">
            <div className="w-16 h-16 mx-auto bg-dark-900 border border-dark-800 rounded-2xl flex items-center justify-center mb-6 shadow-glow-sm shadow-primary-500/20">
              <HelpCircle className="w-8 h-8 text-primary-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">How can we help?</h1>
            <p className="text-dark-400 text-lg max-w-2xl mx-auto">
              Find answers to common questions or reach out to our support team directly. We are here 24/7 to ensure your experience is flawless.
            </p>
          </div>
        </div>

        <div className="page-container py-12 md:py-20">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <button 
              onClick={() => setActiveTab('faq')}
              className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                activeTab === 'faq' ? 'bg-primary-500 text-white shadow-glow-sm shadow-primary-500/30' : 'bg-dark-900 border border-dark-800 text-dark-300 hover:text-white hover:bg-dark-800'
              }`}
            >
              <HelpCircle className="w-5 h-5" /> FAQ
            </button>
            <button 
              onClick={() => setActiveTab('contact')}
              className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                activeTab === 'contact' ? 'bg-primary-500 text-white shadow-glow-sm shadow-primary-500/30' : 'bg-dark-900 border border-dark-800 text-dark-300 hover:text-white hover:bg-dark-800'
              }`}
            >
              <MessageCircle className="w-5 h-5" /> Contact Us
            </button>
            <button 
              onClick={() => setActiveTab('policies')}
              className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                activeTab === 'policies' ? 'bg-primary-500 text-white shadow-glow-sm shadow-primary-500/30' : 'bg-dark-900 border border-dark-800 text-dark-300 hover:text-white hover:bg-dark-800'
              }`}
            >
              <Shield className="w-5 h-5" /> Policies
            </button>
          </div>

          {/* Tab Content */}
          <div className="max-w-4xl mx-auto">
            
            {/* FAQ Tab */}
            {activeTab === 'faq' && (
              <div className="space-y-4 animate-fade-in-up">
                <h2 className="text-2xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
                {faqs.map((faq, index) => (
                  <div key={index} className="glass-card overflow-hidden transition-all duration-300">
                    <button 
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="w-full text-left p-6 flex justify-between items-center focus:outline-none"
                    >
                      <span className="font-semibold text-white text-lg pr-8">{faq.q}</span>
                      <ChevronDown className={`w-5 h-5 text-primary-400 shrink-0 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} />
                    </button>
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                      <div className="p-6 pt-0 text-dark-300 leading-relaxed">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div className="animate-fade-in-up">
                <h2 className="text-2xl font-bold text-white mb-8 text-center">Get in Touch</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="glass-card p-8 text-center flex flex-col items-center hover:-translate-y-1 transition-transform duration-300">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                      <MessageCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">WhatsApp Support</h3>
                    <p className="text-dark-400 mb-6 flex-grow">
                      Fastest response time. Available 24/7 for order issues and inquiries.
                    </p>
                    <a href="https://wa.me/96103794986" target="_blank" rel="noopener noreferrer" className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                      Chat on WhatsApp
                    </a>
                  </div>

                  <div className="glass-card p-8 text-center flex flex-col items-center hover:-translate-y-1 transition-transform duration-300">
                    <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center mb-6">
                      <Mail className="w-8 h-8 text-primary-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Email Support</h3>
                    <p className="text-dark-400 mb-6 flex-grow">
                      For business inquiries, partnerships, and detailed support requests.
                    </p>
                    <a href="mailto:support@giftvault.com" className="w-full h-12 bg-dark-800 hover:bg-dark-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-dark-700">
                      support@giftvault.com
                    </a>
                  </div>

                </div>
              </div>
            )}

            {/* Policies Tab */}
            {activeTab === 'policies' && (
              <div className="space-y-6 animate-fade-in-up">
                <h2 className="text-2xl font-bold text-white mb-8 text-center">Legal & Policies</h2>
                
                <div className="glass-card p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-6 h-6 text-primary-400" />
                    <h3 className="text-xl font-bold text-white">Terms of Service</h3>
                  </div>
                  <p className="text-dark-300 leading-relaxed mb-4">
                    By using GiftVault, you agree to our terms. All digital products are tied to specific regions. It is your responsibility to verify the region of the product before purchasing. Reselling of our codes without explicit permission is prohibited.
                  </p>
                </div>

                <div className="glass-card p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-6 h-6 text-primary-400" />
                    <h3 className="text-xl font-bold text-white">Privacy Policy</h3>
                  </div>
                  <p className="text-dark-300 leading-relaxed mb-4">
                    We value your privacy. We only collect essential information required to process your orders (Email, WhatsApp number, Country). We do not share your personal data with third-party advertisers. All order processing is handled securely.
                  </p>
                </div>

              </div>
            )}

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
