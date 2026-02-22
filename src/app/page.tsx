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
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // NEW STATES: For the drag-and-drop pin feature
  const [isDroppingPin, setIsDroppingPin] = useState(false);
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Triggered from inside the modal when they click "Drop Pin"
  const handleRequestPinDrop = () => {
    setIsModalOpen(false); // Hide modal temporarily
    setIsDroppingPin(true); // Tell map to show the draggable pin
  };

  return (
    <main className="relative h-screen w-full overflow-hidden">
      {/* Pass the new props to the Map */}
      <MapWithNoSSR 
        isDroppingPin={isDroppingPin}
        onPinDropConfirm={(lat: number, lng: number) => {
          setPinCoords({ lat, lng });
          setIsDroppingPin(false); // Exit map mode
          setIsModalOpen(true); // Bring modal back!
        }}
        onPinDropCancel={() => {
          setIsDroppingPin(false);
          setIsModalOpen(true); // Bring modal back without changing coords
        }}
      />

      <div className="absolute right-4 top-4 z-[1000] w-64 rounded-xl bg-white p-5 shadow-lg">
        <h1 className="text-xl font-black text-gray-900">🇵🇭 Bayanihan Map</h1>
        <p className="mt-1 text-sm text-gray-500">Real-time community reports.</p>
        <div className="mt-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
          System Active
        </div>
      </div>

      {/* Hide the main button if we are currently dragging a pin */}
      {!isDroppingPin && (
  <button 
    onClick={() => {  
      setPinCoords(null); 
      setIsModalOpen(true);
    }} 
    // Changed: Added bg-bayanihan-blue and updated hover
    className="absolute bottom-8 right-8 z-[1000] rounded-full bg-bayanihan-blue px-6 py-4 font-bold text-white shadow-xl transition-transform hover:scale-105 hover:bg-bayanihan-dark active:scale-95"
  >
    Report Issue
  </button>
)}

      {/* Pass the new props to the Modal */}
      <ReportModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRequestPinDrop={handleRequestPinDrop}
        pinCoords={pinCoords}
      />
    </main>
  );
}