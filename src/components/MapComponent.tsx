'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase'; // Importing your DB connection

// FIX: Leaflet's default icons get lost in React. This restores them.
const iconFix = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

// TYPESCRIPT: Defining the exact shape of your database rows
interface Report {
  id: number;
  latitude: number;
  longitude: number;
  category: string;
  description: string;
  photo_url: string;
  status: string;
}

export default function MapComponent() {
  // STATE: This holds your pins. It starts as an empty array [].
  const [reports, setReports] = useState<Report[]>([]);

  // EFFECT: Runs exactly once when the map first loads on the screen
  useEffect(() => {
    iconFix();
    fetchPins();
  }, []);

  async function fetchPins() {
    const { data, error } = await supabase.from('reports').select('*');
    
    if (error) {
      console.error("❌ Error fetching pins:", error.message);
    } else if (data) {
      console.log(`✅ Loaded ${data.length} pins from Singapore`);
      setReports(data); // Saves the data into React state!
    }
  }

  return (
    <MapContainer 
      center={[14.6507, 121.1029]} 
      zoom={13} 
      style={{ height: '100vh', width: '100%', zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* REACT MAGIC: We "map" over the array and turn each row into a Pin */}
      {reports.map((report) => (
        <Marker key={report.id} position={[report.latitude, report.longitude]}>
          <Popup>
            {/* Using Tailwind CSS inside the Leaflet popup! */}
            <div className="flex w-48 flex-col gap-2">
              <span className="text-lg font-black text-gray-800">{report.category}</span>
              <p className="m-0 text-sm text-gray-600">{report.description}</p>
              
              {report.photo_url && (
                <img 
                  src={report.photo_url} 
                  alt="Evidence" 
                  className="w-full rounded-md object-cover shadow-sm"
                />
              )}
              
              <span className={`text-xs font-bold ${report.status === 'PENDING' ? 'text-red-500' : 'text-green-500'}`}>
                Status: {report.status}
              </span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}