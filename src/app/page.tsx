'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import ReportModal from '@/components/ReportModal'; 


const MapWithNoSSR = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 font-bold text-blue-600 animate-pulse">
      Loading Bayanihan Map...
    </div>
  ),
});

export default function Home() {
  // REACT STATE: Is the modal visible or hidden? Starts as hidden (false)
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="relative h-screen w-full overflow-hidden">
      {/* The Map Background */}
      <MapWithNoSSR />

      {/* Floating Info Panel (Top Right) */}
      <div className="absolute right-4 top-4 z-[1000] w-64 rounded-xl bg-white p-5 shadow-lg">
        <h1 className="text-xl font-black text-gray-900">🇵🇭 Bayanihan Map</h1>
        <p className="mt-1 text-sm text-gray-500">Real-time community reports.</p>
        <div className="mt-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
          System Active
        </div>
      </div>

      {/* Floating Action Button (Bottom Right) */}
      <button 
        onClick={() => setIsModalOpen(true)} 
        className="absolute bottom-8 right-8 z-[1000] rounded-full bg-blue-600 px-6 py-4 font-bold text-white shadow-xl transition-transform hover:scale-105 hover:bg-blue-700"
      >
        ➕ Report Issue
      </button>

      <ReportModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </main>
  );
}