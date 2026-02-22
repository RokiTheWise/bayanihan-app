'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Icon Fix
const iconFix = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

// Custom User Location Icon (Philippine Blue circle)
const userLocationIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div class="user-pulse"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

interface Report {
  id: number;
  latitude: number;
  longitude: number;
  category: string;
  description: string;
  photo_url: string;
  status: string;
}

// SUB-COMPONENT: Handles centering logic and "Recenter" button visibility
function MapController({ userLocation }: { userLocation: [number, number] | null }) {
  const [showRecenter, setShowRecenter] = useState(false);
  const map = useMap();

  useMapEvents({
    dragstart: () => setShowRecenter(true),
    moveend: () => {
      if (!userLocation) return;
      const center = map.getCenter();
      const distance = map.distance(center, L.latLng(userLocation[0], userLocation[1]));
      if (distance < 50) setShowRecenter(false); // Hide if very close
    }
  });

  if (!userLocation) return null;

  return (
    /* Positioning it bottom-right, above where your Report button usually sits */
    <div className="absolute bottom-24 right-6 z-[1000] flex flex-col items-center gap-2">
      {showRecenter && (
        <button
          onClick={() => {
            map.flyTo(userLocation, 16, { animate: true, duration: 1.5 });
            setShowRecenter(false);
          }}
          className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-md ring-1 ring-black/5 transition-all hover:bg-gray-50 active:scale-95"
        >
          {/* Using a simple SVG for that Google 'navigation' arrow look */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="#0038a7" 
            className="h-5 w-5"
          >
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
          </svg>
          <span className="text-sm font-bold text-ph-blue-500">Recenter</span>
        </button>
      )}
    </div>
  );
}

export default function MapComponent() {
  const [reports, setReports] = useState<Report[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    iconFix();
    fetchPins();

    // Watch user position in real-time
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => console.error("GPS Error:", err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  async function fetchPins() {
    const { data, error } = await supabase.from('reports').select('*');
    if (error) console.error("❌ Error fetching pins:", error.message);
    else if (data) setReports(data);
  }

  return (
    <div className="relative h-screen w-full">
      <MapContainer 
        center={[14.6507, 121.1029]} 
        zoom={13} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Marker */}
        {userLocation && (
          <Marker position={userLocation} icon={userLocationIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}
        
        {/* Report Markers */}
        {reports.map((report) => (
          <Marker key={report.id} position={[report.latitude, report.longitude]}>
            <Popup>
              <div className="flex w-48 flex-col gap-2">
                <span className="text-lg font-black text-gray-800">{report.category}</span>
                <p className="m-0 text-sm text-gray-600">{report.description}</p>
                {report.photo_url && (
                  <img src={report.photo_url} alt="Evidence" className="w-full rounded-md object-cover shadow-sm" />
                )}
                <span className={`text-xs font-bold ${report.status === 'PENDING' ? 'text-red-500' : 'text-green-500'}`}>
                  Status: {report.status}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Custom Logic for Auto-Centering and Button UI */}
        <MapController userLocation={userLocation} />
      </MapContainer>
    </div>
  );
}