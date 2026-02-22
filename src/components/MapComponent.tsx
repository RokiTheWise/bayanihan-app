'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useRef, useMemo } from 'react';
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

// SUB-COMPONENT 1: Handles centering logic and "Recenter" button visibility
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
    <div className="absolute bottom-24 right-6 z-[1000] flex flex-col items-center gap-2">
      {showRecenter && (
        <button
          onClick={() => {
            map.flyTo(userLocation, 16, { animate: true, duration: 1.5 });
            setShowRecenter(false);
          }}
          className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-md ring-1 ring-black/5 transition-all hover:bg-gray-50 active:scale-95"
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

// SUB-COMPONENT 2: Handles the drag-and-drop manual pin
function DraggablePinMode({ onConfirm, onCancel }: { onConfirm: (lat: number, lng: number) => void, onCancel: () => void }) {
  const map = useMap();
  const [pos, setPos] = useState(map.getCenter()); // Starts pin in the center of their current view
  const markerRef = useRef<L.Marker>(null);

  // Updates coordinates when the user finishes dragging the pin
  const eventHandlers = useMemo(() => ({
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        setPos(marker.getLatLng());
      }
    },
  }), []);

  return (
    <>
      <Marker draggable={true} eventHandlers={eventHandlers} position={pos} ref={markerRef}>
        <Popup>Drag me exactly where the issue is!</Popup>
      </Marker>

      {/* Floating Action Buttons for the Drop Pin mode */}
      <div className="absolute bottom-12 left-1/2 z-[2000] flex w-full max-w-sm -translate-x-1/2 justify-center gap-3 px-4">
        <button 
          onClick={onCancel} 
          className="rounded-full bg-white px-6 py-3 font-bold text-gray-700 shadow-xl transition-transform active:scale-95"
        >
          Cancel
        </button>
        <button 
          onClick={() => onConfirm(pos.lat, pos.lng)} 
          className="rounded-full bg-[#0038a7] px-6 py-3 font-bold text-white shadow-xl transition-transform hover:bg-[#00308f] active:scale-95"
        >
          📍 Confirm Location
        </button>
      </div>
    </>
  );
}

// MAIN COMPONENT
export default function MapComponent({ 
  isDroppingPin, 
  onPinDropConfirm, 
  onPinDropCancel 
}: { 
  isDroppingPin?: boolean; 
  onPinDropConfirm?: (lat: number, lng: number) => void; 
  onPinDropCancel?: () => void; 
}) {
  const [reports, setReports] = useState<Report[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    iconFix();
    fetchPins();

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

        {/* Center Recenter logic */}
        <MapController userLocation={userLocation} />

        {/* NEW: Draggable Pin logic */}
        {isDroppingPin && onPinDropConfirm && onPinDropCancel && (
          <DraggablePinMode onConfirm={onPinDropConfirm} onCancel={onPinDropCancel} />
        )}
      </MapContainer>
    </div>
  );
}