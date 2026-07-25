"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  Globe,
  Tag,
  ShieldCheck,
  Search
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/Skeleton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/');
    }
  }, [isLoading, isAdmin, router]);

  if (isLoading || !isAdmin) {
    return <div className="min-h-screen bg-dark-950 flex items-center justify-center"><Skeleton className="w-32 h-32 rounded-full" /></div>;
  }

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Orders', path: '/admin/orders', icon: <ShoppingCart className="w-5 h-5" /> },
    { name: 'Products', path: '/admin/products', icon: <Package className="w-5 h-5" /> },
    { name: 'Inventory', path: '/admin/inventory', icon: <Search className="w-5 h-5" /> },
    { name: 'Categories', path: '/admin/categories', icon: <Tag className="w-5 h-5" /> },
    { name: 'Regions', path: '/admin/regions', icon: <Globe className="w-5 h-5" /> },
    { name: 'Users', path: '/admin/users', icon: <Users className="w-5 h-5" /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-900 border-r border-dark-800 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0`}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-dark-800">
          <Link href="/admin" className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary-500" />
            <span className="text-xl font-bold text-white tracking-tight">GV Admin</span>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-dark-400">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20 shadow-[inset_4px_0_0_0_#3b82f6]' 
                    : 'text-dark-300 hover:bg-dark-800 hover:text-white border border-transparent'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-dark-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center text-primary-400 font-bold uppercase">
              {user?.name?.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-bold text-white truncate">{user?.name}</div>
              <div className="text-xs text-dark-400 truncate">Administrator</div>
            </div>
          </div>
          <button 
            onClick={() => { logout(); router.push('/'); }}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-dark-900 border-b border-dark-800 flex items-center justify-between px-6 sticky top-0 z-40">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="lg:hidden text-dark-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            <Link href="/" className="text-sm text-dark-300 hover:text-white transition-colors flex items-center gap-2">
              <Globe className="w-4 h-4" /> View Store
            </Link>
          </div>
        </header>
        
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-dark-950">
          {children}
        </main>
      </div>
    </div>
  );
}
