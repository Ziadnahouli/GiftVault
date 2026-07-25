"use client";

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Package,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    // In a real app, this would fetch actual admin stats
    // For now, we mock it or fetch basic counts
    const loadStats = async () => {
      try {
        const res = await fetchApi('/admin/dashboard');
        setStats(res.stats || {});
      } catch (error) {
        console.error('Failed to load stats', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white mb-6">Dashboard Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      title: 'Revenue', 
      value: formatPrice(stats?.revenue || 0), 
      icon: <TrendingUp className="w-6 h-6 text-emerald-400" />,
      color: 'from-emerald-500/20 to-emerald-500/5'
    },
    { 
      title: 'Completed Orders', 
      value: stats?.orders || 0, 
      icon: <ShoppingCart className="w-6 h-6 text-primary-400" />,
      color: 'from-primary-500/20 to-primary-500/5'
    },
    { 
      title: 'Pending Orders', 
      value: stats?.pendingOrders || 0, 
      icon: <ShoppingCart className="w-6 h-6 text-amber-400" />,
      color: 'from-amber-500/20 to-amber-500/5'
    },
    { 
      title: 'Total Customers', 
      value: stats?.customers || 0, 
      icon: <Users className="w-6 h-6 text-blue-400" />,
      color: 'from-blue-500/20 to-blue-500/5'
    },
    { 
      title: 'Total Products', 
      value: stats?.products || 0, 
      icon: <Package className="w-6 h-6 text-indigo-400" />,
      color: 'from-indigo-500/20 to-indigo-500/5'
    },
    { 
      title: 'Total Regions', 
      value: stats?.regions || 0, 
      icon: <Package className="w-6 h-6 text-purple-400" />,
      color: 'from-purple-500/20 to-purple-500/5'
    },
    { 
      title: 'Total Denominations', 
      value: stats?.denominations || 0, 
      icon: <Package className="w-6 h-6 text-pink-400" />,
      color: 'from-pink-500/20 to-pink-500/5'
    },
    { 
      title: 'Out of Stock', 
      value: stats?.outOfStock || 0, 
      icon: <Package className="w-6 h-6 text-rose-400" />,
      color: 'from-rose-500/20 to-rose-500/5'
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard Overview</h1>
        <p className="text-dark-400">Welcome back, here's what's happening with your store today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className={`glass-card p-6 bg-gradient-to-br ${stat.color} border-white/5`}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-dark-900 border border-dark-800">
                {stat.icon}
              </div>
            </div>
            <div>
              <div className="text-dark-400 text-sm mb-1">{stat.title}</div>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-dark-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Recent Orders</h2>
          <button className="text-primary-400 text-sm hover:text-primary-300">View All</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-dark-900 text-dark-400 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {stats?.recentOrders?.length > 0 ? (
                stats.recentOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-dark-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-white">{order.order_number}</td>
                    <td className="px-6 py-4">
                      <div className="text-white text-sm font-medium">{order.full_name}</div>
                      <div className="text-dark-400 text-xs">{order.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-300">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-500/20 text-primary-400 border border-primary-500/20">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white">
                      {formatPrice(order.total_usd)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-dark-500">
                    No recent orders found.
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
