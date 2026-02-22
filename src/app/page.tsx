'use client'; 

import dynamic from 'next/dynamic';

const MapWithNoSSR = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 text-blue-600 font-bold animate-pulse">
      Loading Bayanihan Map...
    </div>
  ),
});

export default function Home() {
  return (
    <main className="relative h-screen w-full overflow-hidden">

      <MapWithNoSSR />

      <div className="absolute top-4 right-4 z-[1000] w-64 rounded-xl bg-white p-5 shadow-lg">
        <h1 className="text-xl font-black text-gray-900">🇵🇭 Bayanihan Map</h1>
        <p className="mt-1 text-sm text-gray-500">Real-time community reports.</p>
        <div className="mt-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
          System Active
        </div>
      </div>
    </main>
  );
}