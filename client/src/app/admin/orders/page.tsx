"use client";

import React, { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Search, Filter, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const { formatPrice } = useCurrency();

  const loadOrders = () => {
    setIsLoading(true);
    let url = '/admin/orders?limit=100';
    if (statusFilter) url += `&status=${statusFilter}`;
    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

    fetchApi(url)
      .then(res => setOrders(res.orders || []))
      .catch(err => toast.error('Failed to load orders'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await fetchApi(`/admin/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      toast.success('Order status updated');
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status });
      }
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1 inline" /> Completed</Badge>;
      case 'pending': return <Badge variant="warning"><Clock className="w-3 h-3 mr-1 inline" /> Pending</Badge>;
      case 'processing': return <Badge variant="primary"><Clock className="w-3 h-3 mr-1 inline" /> Processing</Badge>;
      case 'cancelled': return <Badge variant="default" className="bg-rose-500/20 text-rose-400"><XCircle className="w-3 h-3 mr-1 inline" /> Cancelled</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Orders</h1>
          <p className="text-dark-400">Manage customer purchases and fulfillment.</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-dark-800 flex flex-wrap items-center gap-4 bg-dark-900/50">
          <div className="relative flex-grow max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input 
              type="text" 
              placeholder="Search by order #, email, or name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-950 border border-dark-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-dark-400" />
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-dark-950 border border-dark-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-dark-900/50 text-dark-400 text-sm border-b border-dark-800">
              <tr>
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Total</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-10 ml-auto" /></td>
                  </tr>
                ))
              ) : orders.length > 0 ? (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-dark-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-white">
                      #{order.order_number}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{order.full_name}</div>
                      <div className="text-xs text-dark-400">{order.email}</div>
                      {order.whatsapp && <div className="text-xs text-emerald-400 mt-0.5">{order.whatsapp}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-300">
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      {formatPrice(order.total_usd)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 rounded-lg bg-dark-800 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors inline-flex"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-dark-500">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-dark-950 border border-dark-800 rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-dark-800 flex justify-between items-center bg-dark-900/50">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  Order #{selectedOrder.order_number}
                  {getStatusBadge(selectedOrder.status)}
                </h2>
                <div className="text-sm text-dark-400 mt-1">{new Date(selectedOrder.created_at).toLocaleString()}</div>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 bg-dark-800 text-dark-400 hover:text-white rounded-xl transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-grow space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-5">
                  <h3 className="text-sm font-bold text-dark-400 uppercase tracking-wider mb-3">Customer Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-dark-500 w-24 inline-block">Name:</span> <span className="text-white font-medium">{selectedOrder.full_name}</span></p>
                    <p><span className="text-dark-500 w-24 inline-block">Email:</span> <span className="text-white">{selectedOrder.email}</span></p>
                    <p><span className="text-dark-500 w-24 inline-block">WhatsApp:</span> <span className="text-emerald-400">{selectedOrder.whatsapp || 'N/A'}</span></p>
                  </div>
                </div>
                
                <div className="glass-card p-5">
                  <h3 className="text-sm font-bold text-dark-400 uppercase tracking-wider mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <p className="flex justify-between"><span className="text-dark-500">Subtotal:</span> <span className="text-white">{formatPrice(selectedOrder.subtotal_usd)}</span></p>
                    <p className="flex justify-between"><span className="text-dark-500">Discount:</span> <span className="text-emerald-400">-{formatPrice(selectedOrder.discount_usd)}</span></p>
                    <div className="border-t border-dark-800 pt-2 mt-2 flex justify-between font-bold text-lg">
                      <span className="text-white">Total:</span> 
                      <span className="text-primary-400">{formatPrice(selectedOrder.total_usd)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-dark-400 uppercase tracking-wider mb-3">Purchased Items</h3>
                <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-dark-950 text-dark-400">
                      <tr>
                        <th className="p-4 font-medium">Item</th>
                        <th className="p-4 font-medium text-center">Qty</th>
                        <th className="p-4 font-medium text-right">Price</th>
                        <th className="p-4 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-800">
                      {selectedOrder.items && selectedOrder.items.map((item: any) => (
                        <tr key={item.id}>
                          <td className="p-4">
                            <div className="font-bold text-white">{item.product_name_en}</div>
                            <div className="text-xs text-dark-400 mt-1">
                              {item.region_code} • {item.face_value} {item.currency_code}
                            </div>
                          </td>
                          <td className="p-4 text-center text-white">{item.quantity}</td>
                          <td className="p-4 text-right text-dark-300">{formatPrice(item.price_usd)}</td>
                          <td className="p-4 text-right font-bold text-white">{formatPrice(item.price_usd * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-dark-800 bg-dark-900/50 flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-dark-400">Update Status:</div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'pending')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${selectedOrder.status === 'pending' ? 'bg-warning-500/20 text-warning-400 border border-warning-500/50' : 'bg-dark-800 text-dark-400 hover:text-white'}`}
                >Pending</button>
                <button 
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'processing')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${selectedOrder.status === 'processing' ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50' : 'bg-dark-800 text-dark-400 hover:text-white'}`}
                >Processing</button>
                <button 
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${selectedOrder.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-dark-800 text-dark-400 hover:text-white'}`}
                >Completed</button>
                <button 
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${selectedOrder.status === 'cancelled' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' : 'bg-dark-800 text-dark-400 hover:text-white'}`}
                >Cancelled</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
