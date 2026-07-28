"use client";

import React, { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { InvoiceModal } from '@/components/orders/InvoiceModal';
import {
  Search, Filter, Eye, CheckCircle, XCircle, Clock, MessageSquare,
  DollarSign, ShoppingBag, AlertTriangle, Printer, Trash2, Edit3, ArrowUpDown, RefreshCw, ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // Drawer & Modal state
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);
  const [statusNotes, setStatusNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const { formatPrice } = useCurrency();

  const loadData = () => {
    setIsLoading(true);
    let url = `/admin/orders?limit=100&sortBy=${sortBy}`;
    if (statusFilter) url += `&status=${statusFilter}`;
    if (paymentStatusFilter) url += `&payment_status=${paymentStatusFilter}`;
    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

    Promise.all([
      fetchApi(url).catch(() => ({ orders: [] })),
      fetchApi('/admin/orders/stats').catch(() => ({ stats: null })),
    ])
      .then(([ordersRes, statsRes]) => {
        setOrders(ordersRes.orders || []);
        if (statsRes.stats) setStats(statsRes.stats);
      })
      .catch(() => toast.error('Failed to load orders data'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, paymentStatusFilter, sortBy]);

  const handleOpenDetails = async (order: any) => {
    setSelectedOrder(order);
    setAdminNotes(order.admin_notes || '');
    setNewStatus(order.status || 'pending');
    setStatusNotes('');

    // Fetch full order details with timeline
    try {
      const res = await fetchApi(`/admin/orders/${order.id}`);
      if (res.order) {
        setSelectedOrder(res.order);
        setAdminNotes(res.order.admin_notes || '');
        setNewStatus(res.order.status || 'pending');
      }
    } catch {}
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !newStatus) return;

    setIsChangingStatus(true);
    try {
      const res = await fetchApi(`/admin/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus, notes: statusNotes }),
      });
      toast.success('Order status updated successfully');
      
      const updated = res.order || { ...selectedOrder, status: newStatus };
      setSelectedOrder(updated);
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: newStatus } : o));
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedOrder) return;
    setIsUpdatingNotes(true);
    try {
      await fetchApi(`/admin/orders/${selectedOrder.id}/notes`, {
        method: 'PUT',
        body: JSON.stringify({ admin_notes: adminNotes }),
      });
      toast.success('Admin notes saved');
      setSelectedOrder({ ...selectedOrder, admin_notes: adminNotes });
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setIsUpdatingNotes(false);
    }
  };

  const handleMarkPaymentStatus = async (payment_status: string) => {
    if (!selectedOrder) return;
    try {
      await fetchApi(`/admin/orders/${selectedOrder.id}/payment-status`, {
        method: 'PUT',
        body: JSON.stringify({ payment_status }),
      });
      toast.success(`Payment marked as ${payment_status}`);
      setSelectedOrder({ ...selectedOrder, payment_status });
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, payment_status } : o));
    } catch {
      toast.error('Failed to update payment status');
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this order?')) return;
    try {
      await fetchApi(`/admin/orders/${id}`, { method: 'DELETE' });
      toast.success('Order deleted');
      if (selectedOrder?.id === id) setSelectedOrder(null);
      setOrders(orders.filter(o => o.id !== id));
      loadData();
    } catch {
      toast.error('Failed to delete order');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1 inline" /> Completed</Badge>;
      case 'paid':
        return <Badge variant="success" className="bg-emerald-500/20 text-emerald-300"><DollarSign className="w-3 h-3 mr-1 inline" /> Paid</Badge>;
      case 'processing':
        return <Badge variant="primary"><Clock className="w-3 h-3 mr-1 inline" /> Processing</Badge>;
      case 'awaiting_payment':
      case 'pending':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1 inline" /> Pending</Badge>;
      case 'cancelled':
        return <Badge variant="default" className="bg-rose-500/20 text-rose-400"><XCircle className="w-3 h-3 mr-1 inline" /> Cancelled</Badge>;
      case 'refunded':
        return <Badge variant="default" className="bg-purple-500/20 text-purple-300"><RefreshCw className="w-3 h-3 mr-1 inline" /> Refunded</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Orders Management</h1>
          <p className="text-dark-400 text-sm">Track customer purchases, update fulfillment statuses, and issue invoices.</p>
        </div>
        <button
          onClick={loadData}
          className="btn-secondary py-2 px-4 text-xs rounded-xl flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between text-dark-400 mb-2">
            <span className="text-xs font-semibold uppercase">Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-primary-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{stats?.totalOrders ?? '-'}</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between text-dark-400 mb-2">
            <span className="text-xs font-semibold uppercase">Pending</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-400">{stats?.pendingOrders ?? '-'}</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between text-dark-400 mb-2">
            <span className="text-xs font-semibold uppercase">Completed</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-400">{stats?.completedOrders ?? '-'}</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between text-dark-400 mb-2">
            <span className="text-xs font-semibold uppercase">Cancelled</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-extrabold text-rose-400">{stats?.cancelledOrders ?? '-'}</p>
        </div>

        <div className="glass-card p-5 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-dark-400 mb-2">
            <span className="text-xs font-semibold uppercase">Total Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-400">
            {stats?.revenue ? formatPrice(stats.revenue) : '-'}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-4 bg-dark-900/50">
        <div className="relative flex-grow max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Search by Order ID (GV-...), Name, Email, WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-950 border border-dark-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-dark-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-dark-950 border border-dark-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="awaiting_payment">Awaiting Payment</option>
            <option value="paid">Paid</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Payment Status Filter */}
        <select
          value={paymentStatusFilter}
          onChange={e => setPaymentStatusFilter(e.target.value)}
          className="bg-dark-950 border border-dark-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500"
        >
          <option value="">All Payment Statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>

        {/* Sorting */}
        <div className="flex items-center gap-2 ml-auto">
          <ArrowUpDown className="w-4 h-4 text-dark-400" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-dark-950 border border-dark-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest_value">Highest Value</option>
            <option value="lowest_value">Lowest Value</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-dark-900/80 text-dark-400 text-xs font-semibold uppercase border-b border-dark-800">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800/60">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-36" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-white">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{order.full_name}</div>
                      <div className="text-xs text-dark-400">{order.email}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-white">
                      {order.display_currency && order.display_currency !== 'USD'
                        ? `${order.display_currency} ${order.display_total?.toFixed(2)}`
                        : formatPrice(order.total_usd)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${
                        order.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        order.payment_status === 'refunded' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {order.payment_status || 'unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-dark-300">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenDetails(order)}
                          className="p-2 text-dark-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setInvoiceOrder(order)}
                          className="p-2 text-dark-300 hover:text-primary-400 hover:bg-white/10 rounded-xl transition-colors"
                          title="Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-2 text-dark-300 hover:text-rose-400 hover:bg-white/10 rounded-xl transition-colors"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-dark-400">
                    No orders found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Drawer Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-dark-900 border border-dark-700 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-dark-800 pb-4">
              <div>
                <span className="text-xs font-semibold text-primary-400 uppercase tracking-wider">Order Details</span>
                <h2 className="text-2xl font-extrabold text-white font-mono">{selectedOrder.order_number}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInvoiceOrder(selectedOrder)}
                  className="btn-secondary py-1.5 px-3 text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Invoice</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  aria-label="Close modal"
                  className="p-2 text-dark-400 hover:text-white rounded-xl hover:bg-dark-800 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Customer Details & Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-dark-950/60 p-5 rounded-2xl border border-dark-800">
              <div>
                <h3 className="text-xs font-bold text-dark-400 uppercase tracking-wider mb-2">Customer Information</h3>
                <p className="font-semibold text-white text-base">{selectedOrder.full_name}</p>
                <p className="text-xs text-dark-300">{selectedOrder.email}</p>
                <p className="text-xs text-dark-300 font-mono mt-0.5">{selectedOrder.whatsapp}</p>
                {selectedOrder.country && <p className="text-xs text-dark-400 mt-0.5">Country: {selectedOrder.country}</p>}
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-dark-400 uppercase tracking-wider">Quick Actions</h3>
                {selectedOrder.whatsapp_link ? (
                  <a
                    href={selectedOrder.whatsapp_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-glow-sm transition-all w-full justify-center"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Open WhatsApp Chat</span>
                  </a>
                ) : (
                  <a
                    href={`https://wa.me/${selectedOrder.whatsapp?.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-glow-sm transition-all w-full justify-center"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Open Customer WhatsApp</span>
                  </a>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleMarkPaymentStatus('paid')}
                    className="btn-secondary py-1.5 px-3 text-xs flex-1 rounded-xl"
                  >
                    Mark Paid
                  </button>
                  <button
                    onClick={() => handleMarkPaymentStatus('refunded')}
                    className="btn-secondary py-1.5 px-3 text-xs flex-1 rounded-xl text-purple-300"
                  >
                    Mark Refunded
                  </button>
                </div>
              </div>
            </div>

            {/* Change Status Form */}
            <form onSubmit={handleUpdateStatus} className="bg-dark-950/60 p-5 rounded-2xl border border-dark-800 space-y-4">
              <h3 className="text-xs font-bold text-dark-400 uppercase tracking-wider">Update Fulfillment Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-dark-300 mb-1 font-medium">Status</label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="awaiting_payment">Awaiting Payment</option>
                    <option value="paid">Paid</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-dark-300 mb-1 font-medium">Status Note (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Code sent via WhatsApp"
                    value={statusNotes}
                    onChange={e => setStatusNotes(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isChangingStatus}
                className="btn-primary py-2 px-5 text-xs font-semibold rounded-xl flex items-center gap-2"
              >
                {isChangingStatus ? 'Updating Status...' : 'Save New Status'}
              </button>
            </form>

            {/* Purchased Products List */}
            <div>
              <h3 className="text-xs font-bold text-dark-400 uppercase tracking-wider mb-3">Purchased Items</h3>
              <div className="border border-dark-800 rounded-2xl overflow-hidden bg-dark-950/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-dark-900 text-dark-400 border-b border-dark-800">
                    <tr>
                      <th className="p-3">Product Name</th>
                      <th className="p-3 text-center">Face Value</th>
                      <th className="p-3 text-center">Quantity</th>
                      <th className="p-3 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800/60">
                    {selectedOrder.items && selectedOrder.items.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-3 font-semibold text-white">
                          {item.product_name}
                          {item.region_name && <span className="text-[11px] text-dark-400 block">{item.region_name}</span>}
                        </td>
                        <td className="p-3 text-center font-mono text-dark-300">
                          {item.face_value ? `${item.face_value} ${item.currency_code || ''}` : '-'}
                        </td>
                        <td className="p-3 text-center font-bold text-white">x{item.quantity}</td>
                        <td className="p-3 text-right font-mono font-bold text-white">
                          {formatPrice(item.price_usd * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Timeline History */}
            {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-dark-400 uppercase tracking-wider mb-3">Order Status History</h3>
                <div className="space-y-2 border-l-2 border-primary-500/30 pl-4">
                  {selectedOrder.timeline.map((entry: any, i: number) => (
                    <div key={i} className="text-xs space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white capitalize">{entry.new_status}</span>
                        <span className="text-[10px] text-dark-400">{new Date(entry.created_at).toLocaleString()}</span>
                      </div>
                      {entry.notes && <p className="text-dark-300 italic text-[11px]">{entry.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Notes Editor */}
            <div className="space-y-2 pt-2 border-t border-dark-800">
              <label className="block text-xs font-bold text-dark-400 uppercase tracking-wider">Internal Admin Notes</label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                placeholder="Private notes for team reference..."
                className="w-full bg-dark-950 border border-dark-700 rounded-xl p-3 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
              />
              <button
                onClick={handleSaveNotes}
                disabled={isUpdatingNotes}
                className="btn-secondary py-1.5 px-4 text-xs rounded-xl"
              >
                {isUpdatingNotes ? 'Saving Notes...' : 'Save Internal Notes'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      <InvoiceModal
        order={invoiceOrder}
        isOpen={Boolean(invoiceOrder)}
        onClose={() => setInvoiceOrder(null)}
      />
    </div>
  );
}
