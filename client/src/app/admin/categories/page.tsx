"use client";

import React, { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Plus, Edit, Trash2, Search, X, Check, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const defaultForm = {
    name_en: '',
    name_ar: '',
    icon: '',
    description_en: '',
    description_ar: '',
    sort_order: 0,
    is_active: true
  };
  const [formData, setFormData] = useState(defaultForm);

  const loadCategories = () => {
    setIsLoading(true);
    fetchApi('/admin/categories')
      .then(res => setCategories(res.categories || []))
      .catch(err => toast.error('Failed to load categories'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openNewModal = () => {
    setEditingCategory(null);
    setFormData(defaultForm);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setFormData({
      name_en: cat.name_en,
      name_ar: cat.name_ar,
      icon: cat.icon || '',
      description_en: cat.description_en || '',
      description_ar: cat.description_ar || '',
      sort_order: cat.sort_order || 0,
      is_active: cat.is_active === 1
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editingCategory) {
        await fetchApi(`/admin/categories/${editingCategory.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        toast.success('Category updated');
      } else {
        await fetchApi('/admin/categories', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        toast.success('Category created');
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (error) {
      toast.error('Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category? All associated products must be re-categorized.')) return;
    try {
      await fetchApi(`/admin/categories/${id}`, { method: 'DELETE' });
      toast.success('Category deleted');
      setCategories(categories.filter(c => c.id !== id));
    } catch (error) {
      toast.error('Failed to delete category. Ensure no products are attached.');
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name_en.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.name_ar.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Categories</h1>
          <p className="text-dark-400">Manage product collections and types.</p>
        </div>
        <button onClick={openNewModal} className="btn-primary">
          <Plus className="w-5 h-5" /> Add Category
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-dark-800 flex items-center gap-4 bg-dark-900/50">
          <div className="relative flex-grow max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input 
              type="text" 
              placeholder="Search categories..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-950 border border-dark-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-dark-900/50 text-dark-400 text-sm border-b border-dark-800">
              <tr>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium text-center">Products</th>
                <th className="px-6 py-4 font-medium text-center">Sort Order</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-10 mx-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-10 mx-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 mx-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredCategories.length > 0 ? (
                filteredCategories.map(cat => (
                  <tr key={cat.id} className="hover:bg-dark-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center text-primary-400 shrink-0 border border-dark-700 text-xl" dangerouslySetInnerHTML={{ __html: cat.icon || '' }} />
                        <div>
                          <div className="font-bold text-white">{cat.name_en}</div>
                          <div className="text-xs text-dark-400">{cat.name_ar}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-white font-bold">
                      {cat.product_count || 0}
                    </td>
                    <td className="px-6 py-4 text-center text-dark-300 font-mono">
                      {cat.sort_order}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {cat.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="default" className="bg-dark-700 text-dark-400">Hidden</Badge>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(cat)}
                          className="p-2 rounded-lg bg-dark-800 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(cat.id)}
                          className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-dark-500">
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-dark-950 border border-dark-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-dark-800 flex justify-between items-center bg-dark-900/50">
              <h2 className="text-xl font-bold text-white">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-dark-400 hover:text-white rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium text-dark-300 mb-1">Icon (SVG or Emoji)</label>
                <input type="text" value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} className="input-field" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1">Sort Order</label>
                  <input type="number" value={formData.sort_order} onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})} className="input-field" />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="rounded border-dark-700 bg-dark-900 text-primary-500 focus:ring-primary-500" />
                  <span className="text-dark-300">Active (Visible on store)</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-dark-800 bg-dark-900/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 rounded-lg font-medium text-dark-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary py-2 px-8"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
