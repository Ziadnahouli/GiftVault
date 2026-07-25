"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Heart, Settings, LogOut, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardPage() {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const { formatPrice } = useCurrency();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchApi('/orders')
        .then(res => setOrders(res.orders || []))
        .catch(err => {
          console.error(err);
          toast.error('Failed to load orders');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isAuthenticated]);

  if (authLoading || (!isAuthenticated && isLoading)) {
    return <div className="min-h-screen bg-dark-950 flex items-center justify-center"><Skeleton className="w-32 h-32 rounded-full" /></div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'processing': return <Badge variant="warning">Processing</Badge>;
      case 'cancelled': return <Badge variant="danger">Cancelled</Badge>;
      default: return <Badge variant="primary">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-950">
      <Navbar />
      
      <main className="flex-grow page-container py-12">
        <div className="flex flex-col md:flex-row items-start gap-8">
          
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0 space-y-2">
            <div className="glass-card p-6 mb-6 text-center">
              <div className="w-16 h-16 rounded-full bg-dark-800 border-2 border-dark-700 mx-auto mb-3 flex items-center justify-center text-xl font-bold text-white uppercase">
                {user?.name?.charAt(0)}
              </div>
              <h3 className="text-white font-bold">{user?.name}</h3>
              <p className="text-dark-400 text-sm truncate">{user?.email}</p>
            </div>

            <nav className="glass-card p-2">
              <button 
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${activeTab === 'orders' ? 'bg-primary-500/20 text-primary-400 font-medium' : 'text-dark-300 hover:bg-dark-800 hover:text-white'}`}
              >
                <Package className="w-4 h-4" /> Order History
              </button>
              <button 
                onClick={() => setActiveTab('wishlist')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${activeTab === 'wishlist' ? 'bg-primary-500/20 text-primary-400 font-medium' : 'text-dark-300 hover:bg-dark-800 hover:text-white'}`}
              >
                <Heart className="w-4 h-4" /> Wishlist
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${activeTab === 'settings' ? 'bg-primary-500/20 text-primary-400 font-medium' : 'text-dark-300 hover:bg-dark-800 hover:text-white'}`}
              >
                <Settings className="w-4 h-4" /> Account Settings
              </button>
              <button 
                onClick={() => { logout(); router.push('/'); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-rose-400 hover:bg-dark-800"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-grow w-full">
            <h1 className="text-2xl font-bold text-white mb-6 capitalize">{activeTab.replace('_', ' ')}</h1>
            
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
                ) : orders.length > 0 ? (
                  orders.map(order => (
                    <div key={order.id} className="glass-card p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-dark-800">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-mono text-white font-bold">{order.order_number}</span>
                            {getStatusBadge(order.status)}
                          </div>
                          <span className="text-sm text-dark-400">{new Date(order.created_at).toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-dark-400">Total Amount</div>
                          <div className="text-lg font-bold text-primary-400">{formatPrice(order.total_usd)}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {order.items?.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-white">{item.quantity}x</span>
                              <span className="text-dark-300">{item.product_name}</span>
                              <span className="text-dark-500">({item.face_value} {item.currency_code})</span>
                            </div>
                            <span className="text-dark-400">{formatPrice(item.price_usd * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="glass-card py-16 text-center">
                    <Package className="w-12 h-12 text-dark-700 mx-auto mb-4" />
                    <p className="text-lg text-white mb-2">No orders yet</p>
                    <p className="text-dark-400 mb-6">Looks like you haven't placed any orders.</p>
                    <button onClick={() => router.push('/shop')} className="btn-primary">Start Shopping</button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div className="glass-card py-16 text-center">
                <Heart className="w-12 h-12 text-dark-700 mx-auto mb-4" />
                <p className="text-lg text-white mb-2">Wishlist is empty</p>
                <p className="text-dark-400 mb-6">Save your favorite items here.</p>
                <button onClick={() => router.push('/shop')} className="btn-primary">Explore Products</button>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="glass-card p-6">
                <h3 className="text-white font-bold mb-4">Profile Information</h3>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Name</label>
                    <input type="text" defaultValue={user?.name} className="input-field" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Email</label>
                    <input type="email" defaultValue={user?.email} className="input-field" disabled />
                  </div>
                  <button className="btn-primary w-full mt-4 opacity-50 cursor-not-allowed">Update Profile (Coming Soon)</button>
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
