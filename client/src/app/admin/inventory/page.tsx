"use client";

import React, { useState, useEffect } from 'react';
import { Search, Package, Download, Eye, EyeOff, Edit } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    if (!searchTerm) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(true);
      fetchApi(`/admin/inventory/search?q=${encodeURIComponent(searchTerm)}`)
        .then(res => setResults(res.results || []))
        .catch(() => toast.error('Search failed'))
        .finally(() => setIsLoading(false));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleExport = async () => {
    try {
      const res = await fetchApi('/admin/inventory/export');
      
      // Simple CSV export
      if (!res.inventory || res.inventory.length === 0) {
        toast.error('No inventory to export');
        return;
      }
      
      const headers = Object.keys(res.inventory[0]).join(',');
      const rows = res.inventory.map((row: any) => Object.values(row).map(val => `"${val}"`).join(','));
      const csv = [headers, ...rows].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Inventory exported successfully');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Inventory Management</h1>
          <p className="text-dark-400">Search products, SKUs, and manage global stock.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary">
            <Download className="w-5 h-5" /> Export CSV
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden min-h-[500px]">
        <div className="p-4 border-b border-dark-800 bg-dark-900/50">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
            <input 
              type="text" 
              placeholder="Search by Product Name or SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-950 border border-dark-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
            />
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-dark-400 text-sm border-b border-dark-800">
                  <tr>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Name / Info</th>
                    <th className="pb-3 font-medium">Details</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800/50">
                  {results.map((item, i) => (
                    <tr key={`${item.type}-${item.id}-${i}`} className="hover:bg-dark-800/20 transition-colors">
                      <td className="py-4">
                        <Badge variant={item.type === 'product' ? 'default' : 'primary'}>
                          {item.type.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <div className="font-bold text-white">{item.type === 'product' ? item.name_en : item.sku}</div>
                        {item.type === 'sku' && <div className="text-xs text-dark-400">{item.name_en}</div>}
                      </td>
                      <td className="py-4 text-sm text-dark-300">
                        {item.type === 'sku' ? (
                          <div className="flex items-center gap-2">
                            <span>{item.currency_code}</span>
                            <span className="font-bold text-white">{item.face_value}</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="py-4 text-right">
                        <Link 
                          href={`/admin/products/${item.type === 'product' ? item.id : ''}`}
                          className="inline-flex p-2 rounded-lg bg-dark-800 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : searchTerm ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-dark-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">No results found</h3>
              <p className="text-dark-400">Try adjusting your search term</p>
            </div>
          ) : (
            <div className="text-center py-16">
              <Search className="w-16 h-16 text-dark-800 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-dark-400">Start typing to search inventory</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
