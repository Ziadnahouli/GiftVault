"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Plus, Trash2, Settings, Globe, Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fetchApi, getImageUrl } from '@/lib/api';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ProductEditor({ params }: { params: { id: string } }) {
  const isNew = params.id === 'new';
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('basic');
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [allRegions, setAllRegions] = useState<any[]>([]);

  const [formData, setFormData] = useState<any>({
    name_en: '',
    name_ar: '',
    category_id: '',
    description_en: '',
    description_ar: '',
    short_description_en: '',
    short_description_ar: '',
    image: '',
    featured: false,
    best_seller: false,
    is_active: true,
    sort_order: 0,
    regions: []
  });

  useEffect(() => {
    Promise.all([
      fetchApi('/categories'),
      fetchApi('/regions')
    ]).then(([catsRes, regsRes]) => {
      setCategories(catsRes.categories || []);
      setAllRegions(regsRes.regions || []);
    });

    if (!isNew) {
      fetchApi(`/admin/products/${params.id}`)
        .then(res => {
          if (res.product) {
            setFormData(res.product);
          }
        })
        .catch(() => toast.error('Failed to load product'))
        .finally(() => setIsLoading(false));
    }
  }, [params.id, isNew]);

  const handleSave = async () => {
    if (formData.regions) {
      const regionIds = formData.regions.map((r: any) => r.region_id);
      if (new Set(regionIds).size !== regionIds.length) {
        toast.error('Cannot save: You have added the same region multiple times.');
        return;
      }
    }

    setIsSaving(true);
    try {
      if (isNew) {
        await fetchApi('/admin/products', { method: 'POST', body: JSON.stringify(formData) });
        toast.success('Product created');
        router.push('/admin/products');
      } else {
        await fetchApi(`/admin/products/${params.id}`, { method: 'PUT', body: JSON.stringify(formData) });
        toast.success('Product updated');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-96 rounded-2xl" /></div>;
  }

  return (
    <div className="pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="p-2 rounded-xl bg-dark-800 text-dark-300 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{isNew ? 'Create Product' : 'Edit Product'}</h1>
            <p className="text-dark-400">Manage product details and inventory</p>
          </div>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="btn-primary"
        >
          {isSaving ? 'Saving...' : <><Save className="w-5 h-5" /> Save Changes</>}
        </button>
      </div>

      <div className="flex gap-2 mb-6 border-b border-dark-800 pb-2 overflow-x-auto">
        <button 
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === 'basic' ? 'bg-primary-500 text-white' : 'text-dark-400 hover:text-white'}`}
          onClick={() => setActiveTab('basic')}
        >
          Basic Information
        </button>
        <button 
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === 'regions' ? 'bg-primary-500 text-white' : 'text-dark-400 hover:text-white'}`}
          onClick={() => setActiveTab('regions')}
        >
          Regions & Inventory
        </button>
      </div>

      {activeTab === 'basic' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 space-y-4">
              <h2 className="text-lg font-bold text-white border-b border-dark-800 pb-4">General Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1">Name (English)</label>
                  <input type="text" value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1">Name (Arabic)</label>
                  <input type="text" value={formData.name_ar} onChange={e => setFormData({...formData, name_ar: e.target.value})} className="input-field text-right" dir="rtl" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Category</label>
                <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: parseInt(e.target.value)})} className="input-field">
                  <option value="">Select Category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1">Short Description (English)</label>
                  <textarea value={formData.short_description_en} onChange={e => setFormData({...formData, short_description_en: e.target.value})} className="input-field h-24" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1">Short Description (Arabic)</label>
                  <textarea value={formData.short_description_ar} onChange={e => setFormData({...formData, short_description_ar: e.target.value})} className="input-field h-24 text-right" dir="rtl" />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="glass-card p-6 space-y-4">
              <h2 className="text-lg font-bold text-white border-b border-dark-800 pb-4">Status & Visibility</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="rounded border-dark-700 bg-dark-900 text-primary-500 focus:ring-primary-500" />
                <span className="text-dark-300">Active (Visible on store)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={formData.featured} onChange={e => setFormData({...formData, featured: e.target.checked})} className="rounded border-dark-700 bg-dark-900 text-primary-500 focus:ring-primary-500" />
                <span className="text-dark-300">Featured Product</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={formData.best_seller} onChange={e => setFormData({...formData, best_seller: e.target.checked})} className="rounded border-dark-700 bg-dark-900 text-primary-500 focus:ring-primary-500" />
                <span className="text-dark-300">Best Seller</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Sort Order</label>
                <input type="number" value={formData.sort_order} onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value)})} className="input-field" />
              </div>
            </div>
            
            <div className="glass-card p-6 space-y-4">
              <h2 className="text-lg font-bold text-white border-b border-dark-800 pb-4">Main Image</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-400 uppercase tracking-wider mb-1">Image URL / Path</label>
                  <input type="text" placeholder="https://... or /uploads/..." value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="input-field" />
                </div>

                {formData.image ? (
                  <div className="w-full aspect-square rounded-xl bg-dark-900 overflow-hidden border border-dark-800">
                    <img src={getImageUrl(formData.image)} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full aspect-square rounded-xl bg-dark-900 border border-dark-800 flex items-center justify-center text-dark-500 text-xs">
                    No image selected yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'regions' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Product Regions</h2>
              <button 
                onClick={() => {
                  const newRegion = {
                    id: Date.now(),
                    region_id: allRegions[0]?.id || '',
                    currency_code: 'USD',
                    description_en: '',
                    description_ar: '',
                    image: '',
                    sort_order: 0,
                    is_active: true,
                    values: []
                  };
                  setFormData({...formData, regions: [...(formData.regions || []), newRegion]});
                }}
                className="btn-secondary text-sm py-1.5"
              >
                <Plus className="w-4 h-4" /> Add Region
              </button>
            </div>

            <div className="space-y-8">
              {(formData.regions || []).map((region: any, rIndex: number) => (
                <div key={rIndex} className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
                  <div className="p-4 bg-dark-800 border-b border-dark-700 flex flex-wrap gap-4 justify-between items-center">
                    <div className="flex gap-4 flex-1">
                      <select 
                        value={region.region_id} 
                        onChange={e => {
                          const newRegions = [...formData.regions];
                          newRegions[rIndex].region_id = parseInt(e.target.value);
                          setFormData({...formData, regions: newRegions});
                        }} 
                        className="input-field py-1"
                      >
                        <option value="">Select Region...</option>
                        {allRegions.map(r => <option key={r.id} value={r.id}>{r.name_en}</option>)}
                      </select>
                      <input 
                        type="text" 
                        placeholder="Currency (e.g. USD)" 
                        value={region.currency_code}
                        onChange={e => {
                          const newRegions = [...formData.regions];
                          newRegions[rIndex].currency_code = e.target.value;
                          setFormData({...formData, regions: newRegions});
                        }}
                        className="input-field py-1 w-32" 
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const newRegions = [...formData.regions];
                        newRegions.splice(rIndex, 1);
                        setFormData({...formData, regions: newRegions});
                      }}
                      className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium text-dark-300 flex items-center gap-3">
                        Denominations
                        <span className="text-primary-400 text-xs bg-primary-500/10 px-2.5 py-1 rounded-full font-bold">
                          Total: ${(region.values || []).reduce((sum: number, val: any) => sum + (Number(val.price_usd) || 0), 0).toFixed(2)}
                        </span>
                      </h3>
                      <button 
                        onClick={() => {
                          const newRegions = [...formData.regions];
                          newRegions[rIndex].values.push({
                            id: Date.now(),
                            face_value: '',
                            price_usd: 0,
                            discount_price_usd: null,
                            stock: 0,
                            sku: '',
                            is_active: true,
                            is_hidden: false
                          });
                          setFormData({...formData, regions: newRegions});
                        }}
                        className="text-primary-400 text-sm flex items-center gap-1 hover:text-primary-300"
                      >
                        <Plus className="w-4 h-4" /> Add Value
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(region.values || []).map((val: any, vIndex: number) => (
                        <div key={vIndex} className="flex flex-wrap gap-3 items-center bg-dark-950 p-3 rounded-lg border border-dark-800">
                          <div className="flex-1 min-w-[150px]">
                            <label className="text-xs text-dark-400 mb-1 block">Face Value</label>
                            <input type="text" placeholder="e.g. $50, 3 Months" value={val.face_value} onChange={e => {
                              const newRegions = [...formData.regions];
                              newRegions[rIndex].values[vIndex].face_value = e.target.value;
                              setFormData({...formData, regions: newRegions});
                            }} className="input-field py-1 text-sm" />
                          </div>
                          <div className="flex-1 min-w-[150px]">
                            <label className="text-xs text-dark-400 mb-1 block">Price (USD)</label>
                            <input type="number" step="0.01" value={val.price_usd} onChange={e => {
                              const newRegions = [...formData.regions];
                              newRegions[rIndex].values[vIndex].price_usd = parseFloat(e.target.value);
                              setFormData({...formData, regions: newRegions});
                            }} className="input-field py-1 text-sm" />
                          </div>
                          <div className="flex-1 min-w-[150px]">
                            <label className="text-xs text-dark-400 mb-1 block">Stock</label>
                            <select value={val.stock > 0 ? 1 : 0} onChange={e => {
                              const newRegions = [...formData.regions];
                              newRegions[rIndex].values[vIndex].stock = parseInt(e.target.value);
                              setFormData({...formData, regions: newRegions});
                            }} className="input-field py-1.5 text-sm">
                              <option value={1}>In Stock</option>
                              <option value={0}>Out of Stock</option>
                            </select>
                          </div>
                          <div className="flex-1 min-w-[150px]">
                            <label className="text-xs text-dark-400 mb-1 block">SKU (Optional)</label>
                            <input type="text" value={val.sku} onChange={e => {
                              const newRegions = [...formData.regions];
                              newRegions[rIndex].values[vIndex].sku = e.target.value;
                              setFormData({...formData, regions: newRegions});
                            }} className="input-field py-1 text-sm" />
                          </div>
                          <div className="flex items-center justify-end w-full sm:w-auto mt-4 sm:mt-0 pt-2">
                            <button onClick={() => {
                              const newRegions = [...formData.regions];
                              newRegions[rIndex].values.splice(vIndex, 1);
                              setFormData({...formData, regions: newRegions});
                            }} className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {(!region.values || region.values.length === 0) && (
                        <div className="text-center p-4 text-dark-500 text-sm border border-dashed border-dark-700 rounded-lg">
                          No denominations added yet. Add one to start selling this region.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(!formData.regions || formData.regions.length === 0) && (
                <div className="text-center p-8 text-dark-500 border border-dashed border-dark-700 rounded-xl">
                  No regions configured for this product.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
