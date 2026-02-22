'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

const iconFix = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

const userLocationIcon = new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div class="user-pulse"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

interface Report {
  id: number; latitude: number; longitude: number;
  category: string; description: string; photo_url: string; status: string;
}

// 1. RECENTER BUTTON FIX
function MapController({ userLocation }: { userLocation: [number, number] | null }) {
  const [showRecenter, setShowRecenter] = useState(false);
  const map = useMap();

  useMapEvents({
    dragstart: () => setShowRecenter(true),
    moveend: () => {
      if (!userLocation) return;
      const center = map.getCenter();
      if (map.distance(center, L.latLng(userLocation[0], userLocation[1])) < 50) setShowRecenter(false);
    }
  });

  if (!userLocation) return null;

  return (
    // Pushed up and z-index cranked so it stays above the map layer
    <div className="absolute bottom-28 right-4 md:bottom-28 md:right-8 z-[9999] flex flex-col items-center gap-2">
      {showRecenter && (
        <button
          onClick={() => { map.flyTo(userLocation, 16, { animate: true }); setShowRecenter(false); }}
          className="flex items-center gap-2 rounded-full bg-white px-4 py-3 shadow-xl ring-1 ring-black/10 transition-all hover:bg-gray-50 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0038a7" className="h-5 w-5">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
          </svg>
          <span className="text-sm font-bold text-bayanihan-blue">Recenter</span>
        </button>
      )}
    </div>
  );
}

// 2. DROP PIN CONFIRM BUTTON FIX
function DraggablePinMode({ onConfirm, onCancel }: { onConfirm: (lat: number, lng: number) => void, onCancel: () => void }) {
  const map = useMap();
  const [pos, setPos] = useState(map.getCenter());
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = useMemo(() => ({
    dragend() { if (markerRef.current) setPos(markerRef.current.getLatLng()); },
  }), []);

  return (
    <>
      <Marker draggable={true} eventHandlers={eventHandlers} position={pos} ref={markerRef}>
        <Popup>Drag me exactly where the issue is!</Popup>
      </Marker>

      {/* Floating Action Buttons securely positioned for mobile */}
      <div className="absolute bottom-16 left-1/2 z-[9999] flex w-full max-w-sm -translate-x-1/2 justify-center gap-3 px-4">
        <button onClick={onCancel} className="rounded-full bg-white px-6 py-4 font-bold text-gray-800 shadow-2xl ring-1 ring-gray-200 transition-transform active:scale-95">
          Cancel
        </button>
        <button onClick={() => onConfirm(pos.lat, pos.lng)} className="rounded-full bg-[#0038a7] px-6 py-4 font-bold text-white shadow-2xl transition-transform hover:bg-[#00308f] active:scale-95">
          📍 Confirm Location
        </button>
      </div>
    </>
  );
}

export default function MapComponent({ isDroppingPin, onPinDropConfirm, onPinDropCancel }: any) {
  const [reports, setReports] = useState<Report[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    iconFix();
    fetchPins();
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      (err) => console.error("GPS Error:", err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  async function fetchPins() {
    const { data } = await supabase.from('reports').select('*');
    if (data) setReports(data);
  }

  return (
    // 3. HEIGHT FIX: Changed h-screen to h-full so it fits safely inside the screen
    <div className="relative h-full w-full">
      <MapContainer 
        center={[14.6507, 121.1029]} zoom={13} minZoom={6}
        maxBounds={[[4.0, 112.0], [22.0, 128.0]]} maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {userLocation && <Marker position={userLocation} icon={userLocationIcon}><Popup>You are here</Popup></Marker>}
        
        {reports.map((report) => (
          <Marker key={report.id} position={[report.latitude, report.longitude]}>
            <Popup>
              <div className="flex w-48 flex-col gap-2">
                <span className="text-lg font-black text-gray-900">{report.category}</span>
                <p className="m-0 text-sm text-gray-700">{report.description}</p>
                {report.photo_url && <img src={report.photo_url} alt="Evidence" className="w-full rounded-md object-cover shadow-sm" />}
                <span className={`text-xs font-bold ${report.status === 'PENDING' ? 'text-red-500' : 'text-green-500'}`}>Status: {report.status}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        <MapController userLocation={userLocation} />
        {isDroppingPin && <DraggablePinMode onConfirm={onPinDropConfirm} onCancel={onPinDropCancel} />}
      </MapContainer>
    </div>
  );
}