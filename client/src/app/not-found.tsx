import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-dark-950">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-9xl font-extrabold text-dark-900 mb-4 drop-shadow-lg">404</h1>
          <h2 className="text-3xl font-bold text-white mb-4">Page Not Found</h2>
          <p className="text-dark-400 max-w-md mx-auto mb-8">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <Link href="/" className="btn-primary">
            Return Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
