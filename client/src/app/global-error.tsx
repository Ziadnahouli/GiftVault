"use client";

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-dark-950 text-white min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-dark-900 border border-dark-800 p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-400">
            <AlertTriangle size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Application Error</h1>
          <p className="text-dark-400 text-sm mb-6">
            We encountered a critical runtime issue. Please try refreshing or return to the main dashboard.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-primary-600/20"
            >
              <RefreshCw size={18} />
              Reload Page
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-dark-800 hover:bg-dark-700 text-dark-200 font-medium text-sm rounded-xl border border-dark-700 transition-all"
            >
              <Home size={18} />
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
