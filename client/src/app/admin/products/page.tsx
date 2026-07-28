"use client";

import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fetchApi, getImageUrl } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { formatPrice } = useCurrency();

  const loadProducts = () => {
    setIsLoading(true);
    fetchApi('/products?limit=100')
      .then(res => setProducts(res.products || []))
      .catch(err => {
        console.error(err);
        toast.error('Failed to load products');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await fetchApi(`/admin/products/${id}`, { method: 'DELETE' });
      toast.success('Product deleted');
      setProducts(products.filter(p => p.id !== id));
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      const res = await fetchApi(`/admin/inventory/products/${id}/duplicate`, { method: 'POST' });
      toast.success('Product duplicated');
      loadProducts();
    } catch (error) {
      toast.error('Failed to duplicate product');
    }
  };

  const handleToggleActive = async (id: number, currentStatus: number) => {
    try {
      await fetchApi(`/admin/inventory/products/${id}/toggle`, { 
        method: 'PATCH',
        body: JSON.stringify({ is_active: currentStatus ? 0 : 1 })
      });
      toast.success('Product visibility updated');
      setProducts(products.map(p => p.id === id ? { ...p, is_active: currentStatus ? 0 : 1 } : p));
    } catch (error) {
      toast.error('Failed to update product visibility');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name_en.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.name_ar.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Products</h1>
          <p className="text-dark-400">Manage your store's gift cards and inventory.</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          <Plus className="w-5 h-5" /> Add Product
        </Link>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-dark-800 flex items-center gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-900 border border-dark-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-dark-900 text-dark-400 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Starting Price</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-dark-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-dark-800 overflow-hidden shrink-0 border border-dark-700">
                          {product.image ? (
                            <img src={getImageUrl(product.image)} alt={product.name_en} className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                        <div>
                          <div className="text-white text-sm font-bold line-clamp-1">{product.name_en}</div>
                          <div className="text-dark-400 text-xs line-clamp-1">{product.name_ar}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-300">
                      {product.category_name_en}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-white">
                      {product.min_price ? formatPrice(product.min_price) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {product.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="default" className="bg-dark-700 text-dark-300 border-dark-600">Hidden</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          title="Toggle Visibility"
                          onClick={() => handleToggleActive(product.id, product.is_active)} 
                          className="p-2 rounded-lg bg-dark-800 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                        >
                          {product.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-amber-400" />}
                        </button>
                        <button 
                          title="Duplicate"
                          onClick={() => handleDuplicate(product.id)} 
                          className="p-2 rounded-lg bg-dark-800 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <Link 
                          title="Edit"
                          href={`/admin/products/${product.id}`} 
                          className="p-2 rounded-lg bg-dark-800 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          title="Delete"
                          onClick={() => handleDelete(product.id)} 
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
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
