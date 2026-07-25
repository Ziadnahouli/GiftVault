"use client";

import React, { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { Save, Settings, Globe, Mail, Phone, ShoppingBag } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = () => {
    setIsLoading(true);
    fetchApi('/admin/settings')
      .then(res => {
        setSettings(res.settings || {});
      })
      .catch(err => toast.error('Failed to load settings'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetchApi('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Store Settings</h1>
          <p className="text-dark-400">Configure global application variables.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary"
        >
          {isSaving ? 'Saving...' : <><Save className="w-5 h-5" /> Save Changes</>}
        </button>
      </div>

      <div className="space-y-8">
        
        {/* General Details */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-dark-800 bg-dark-900/50 flex items-center gap-3">
            <Globe className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-bold text-white">General Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Store Name</label>
                <input 
                  type="text" 
                  value={settings.store_name || ''} 
                  onChange={e => handleChange('store_name', e.target.value)} 
                  className="input-field" 
                  placeholder="e.g. GiftVault"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Default Language</label>
                <select 
                  value={settings.default_language || 'en'} 
                  onChange={e => handleChange('default_language', e.target.value)} 
                  className="input-field"
                >
                  <option value="en">English (EN)</option>
                  <option value="ar">Arabic (AR)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-dark-300 mb-1">Store Description (SEO)</label>
                <textarea 
                  value={settings.store_description || ''} 
                  onChange={e => handleChange('store_description', e.target.value)} 
                  className="input-field h-24" 
                  placeholder="Premium digital gift cards..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-dark-800 bg-dark-900/50 flex items-center gap-3">
            <Phone className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Contact & Support</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Support Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input 
                    type="email" 
                    value={settings.support_email || ''} 
                    onChange={e => handleChange('support_email', e.target.value)} 
                    className="input-field pl-10" 
                    placeholder="support@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Support WhatsApp</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input 
                    type="text" 
                    value={settings.support_whatsapp || ''} 
                    onChange={e => handleChange('support_whatsapp', e.target.value)} 
                    className="input-field pl-10" 
                    placeholder="+961..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* E-Commerce Logic */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-dark-800 bg-dark-900/50 flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-secondary-400" />
            <h2 className="text-lg font-bold text-white">E-Commerce Settings</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Exchange Rate API Fallback (USD to LBP)</label>
                <input 
                  type="number" 
                  value={settings.fallback_exchange_rate || '89500'} 
                  onChange={e => handleChange('fallback_exchange_rate', e.target.value)} 
                  className="input-field" 
                  placeholder="e.g. 89500"
                />
                <p className="text-xs text-dark-400 mt-1">Used if the live exchange rate API fails.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Maintenance Mode</label>
                <select 
                  value={settings.maintenance_mode || 'off'} 
                  onChange={e => handleChange('maintenance_mode', e.target.value)} 
                  className="input-field"
                >
                  <option value="off">Off (Store is Live)</option>
                  <option value="on">On (Store is Hidden)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
