import React from 'react';
import { Shield } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center">
      <div className="relative w-20 h-20 flex items-center justify-center mb-4">
        <div className="absolute inset-0 bg-primary-500 rounded-full blur-[30px] opacity-20 animate-pulse"></div>
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-glow animate-bounce-subtle z-10">
          <Shield className="w-8 h-8 text-white" />
        </div>
      </div>
      <h2 className="text-xl font-bold gradient-text animate-pulse">Loading GiftVault...</h2>
    </div>
  );
}
