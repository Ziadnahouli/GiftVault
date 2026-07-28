"use client";

import React from 'react';
import { X, Printer, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface InvoiceModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceModal({ order, isOpen, onClose }: InvoiceModalProps) {
  const { formatPrice } = useCurrency();

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const createdDate = order.created_at ? new Date(order.created_at).toLocaleString() : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white">
      <div className="bg-dark-900 border border-dark-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:w-full print:max-w-none">
        
        {/* Header (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800 bg-dark-950/60 print:hidden">
          <div className="flex items-center gap-2 text-white font-bold">
            <Printer className="w-5 h-5 text-primary-400" />
            <span>Order Invoice</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-primary py-1.5 px-4 text-xs font-semibold rounded-xl flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-dark-400 hover:text-white rounded-lg hover:bg-dark-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Area */}
        <div className="p-8 space-y-6 text-dark-100 print:text-black print:p-0">
          
          {/* Top Brand Banner */}
          <div className="flex justify-between items-start border-b border-dark-800 pb-6 print:border-gray-200">
            <div>
              <div className="flex items-center gap-2 text-xl font-extrabold text-white print:text-black tracking-tight mb-1">
                <ShieldCheck className="w-6 h-6 text-primary-500 print:text-blue-600" />
                <span>GiftVault</span>
              </div>
              <p className="text-xs text-dark-400 print:text-gray-500">Instant Digital Gift Cards Marketplace</p>
              <p className="text-xs text-dark-400 print:text-gray-500">Support: support@gift-vault.me</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-primary-500/10 text-primary-400 font-mono text-sm font-bold rounded-lg border border-primary-500/20 print:bg-gray-100 print:text-black print:border-gray-300">
                INVOICE #{order.order_number}
              </span>
              <p className="text-xs text-dark-400 print:text-gray-500 mt-2">Date: {createdDate}</p>
              <p className="text-xs text-dark-400 print:text-gray-500 capitalize">Payment Status: <strong className="text-emerald-400 print:text-black">{order.payment_status || 'Unpaid'}</strong></p>
            </div>
          </div>

          {/* Customer & Order Information */}
          <div className="grid grid-cols-2 gap-6 bg-dark-950/40 p-4 rounded-2xl border border-dark-800/80 print:bg-gray-50 print:border-gray-200 print:text-black">
            <div>
              <h4 className="text-xs font-bold text-dark-400 print:text-gray-500 uppercase tracking-wider mb-2">Billed To</h4>
              <p className="font-semibold text-white print:text-black text-sm">{order.full_name}</p>
              <p className="text-xs text-dark-300 print:text-gray-700">{order.email}</p>
              <p className="text-xs text-dark-300 print:text-gray-700">{order.whatsapp}</p>
              {order.country && <p className="text-xs text-dark-400 print:text-gray-600">{order.country}</p>}
            </div>
            <div>
              <h4 className="text-xs font-bold text-dark-400 print:text-gray-500 uppercase tracking-wider mb-2">Order Summary</h4>
              <p className="text-xs text-dark-300 print:text-gray-700">Order ID: <strong className="text-white print:text-black font-mono">{order.order_number}</strong></p>
              <p className="text-xs text-dark-300 print:text-gray-700 capitalize">Status: <strong className="text-white print:text-black">{order.status}</strong></p>
              <p className="text-xs text-dark-300 print:text-gray-700">Payment Method: <strong>WhatsApp Direct Transfer</strong></p>
            </div>
          </div>

          {/* Purchased Items Table */}
          <div>
            <h4 className="text-xs font-bold text-dark-400 print:text-gray-500 uppercase tracking-wider mb-3">Order Items</h4>
            <div className="border border-dark-800 rounded-2xl overflow-hidden print:border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-dark-950 text-dark-300 border-b border-dark-800 print:bg-gray-100 print:text-black print:border-gray-200">
                  <tr>
                    <th className="p-3">Product Item</th>
                    <th className="p-3 text-center">Face Value</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800/60 print:divide-gray-200">
                  {order.items && order.items.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-dark-800/30 print:hover:bg-transparent">
                      <td className="p-3 font-medium text-white print:text-black">
                        {item.product_name}
                        {item.region_name && <span className="text-[11px] text-dark-400 print:text-gray-500 block">{item.region_name}</span>}
                      </td>
                      <td className="p-3 text-center text-dark-300 print:text-gray-700 font-mono">
                        {item.face_value ? `${item.face_value} ${item.currency_code || ''}` : '-'}
                      </td>
                      <td className="p-3 text-center font-bold text-white print:text-black">
                        x{item.quantity}
                      </td>
                      <td className="p-3 text-right font-semibold text-white print:text-black font-mono">
                        {formatPrice(item.price_usd * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subtotal & Final Price breakdown */}
          <div className="flex justify-end pt-2">
            <div className="w-full max-w-xs space-y-2 text-xs">
              <div className="flex justify-between text-dark-300 print:text-gray-700">
                <span>Subtotal</span>
                <span>{formatPrice(order.total_usd + (order.discount_amount || 0))}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-400 print:text-emerald-700">
                  <span>Discount ({order.coupon_code})</span>
                  <span>-{formatPrice(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-white print:text-black border-t border-dark-800 pt-2 print:border-gray-200">
                <span>Total Amount Paid</span>
                <span className="text-primary-400 print:text-black font-mono">
                  {order.display_currency && order.display_currency !== 'USD'
                    ? `${order.display_currency} ${order.display_total?.toFixed(2)}`
                    : formatPrice(order.total_usd)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="border-t border-dark-800/80 pt-4 text-center text-[11px] text-dark-400 print:text-gray-500 print:border-gray-200">
            <p className="flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
              Thank you for shopping with GiftVault! Your digital codes are delivered instantly via WhatsApp.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
