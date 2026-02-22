'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';
import { FiMapPin, FiCrosshair, FiEdit2 } from 'react-icons/fi';

// Updated interface to receive coordinates from page.tsx
interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestPinDrop: () => void;
  pinCoords: { lat: number; lng: number } | null;
}

export default function ReportModal({ isOpen, onClose, onRequestPinDrop, pinCoords }: ReportModalProps) {
  const [category, setCategory] = useState('Roads');
  const [desc, setDesc] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  
  // Track whether we are using GPS or the manual Pin
  const [locationMode, setLocationMode] = useState<'gps' | 'manual'>('gps');
  const [status, setStatus] = useState('Ready to help.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Automatically switch to manual mode if pinCoords are passed back from the map
  useEffect(() => {
    if (pinCoords) setLocationMode('manual');
  }, [pinCoords]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("⏳ Processing report...");

    try {
      let lat: number;
      let lng: number;

      if (locationMode === 'manual' && pinCoords) {
        lat = pinCoords.lat;
        lng = pinCoords.lng;
      } else {
        setStatus("🛰️ Fetching exact GPS location...");
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }

      let finalPhotoUrl = 'https://placehold.co/600x400?text=No+Photo+Provided';
      if (photo) {
        setStatus("📸 Uploading photo evidence...");
        const fileExt = photo.name.split('.').pop();
        const fileName = `report_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('bayanihan-photos').upload(fileName, photo);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('bayanihan-photos').getPublicUrl(fileName);
        finalPhotoUrl = data.publicUrl;
      }

      setStatus("🚀 Dropping pin on the Bayanihan Network...");
      const { error: dbError } = await supabase.from('reports').insert([{
        category, description: desc, latitude: lat, longitude: lng, municipality: locationMode === 'manual' ? 'Manual Pin' : 'Auto-GPS', photo_url: finalPhotoUrl
      }]);

      if (dbError) throw dbError;
      alert("Success! Your evidence is now live on the map.");
      onClose();
      window.location.reload(); 

    } catch (error: any) {
      setStatus(`❌ Error: ${error.message === 'User denied Geolocation' ? 'Please enable GPS or use a Manual Pin.' : error.message}`);
      setIsSubmitting(false);
    }
  };

 return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[2000] grid place-items-center overflow-y-scroll bg-black/40 p-4 backdrop-blur-sm cursor-pointer"
        >
          <motion.div
            initial={{ scale: 0, rotate: "12.5deg" }}
            animate={{ scale: 1, rotate: "0deg" }}
            exit={{ scale: 0, rotate: "0deg" }}
            onClick={(e) => e.stopPropagation()} 
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl cursor-default border border-gray-100"
          >
            {/* 1. Subtle watermark color remains same or use text-blue-50/10 */}
            <FiMapPin className="absolute -left-24 -top-24 z-0 text-[250px] text-gray-50 rotate-12" />
            
            <div className="relative z-10">
              {/* 2. Icon Badge Colors */}
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-bayanihan-light text-3xl text-bayanihan-blue">
                <FiMapPin />
              </div>

              <h3 className="mb-2 text-center text-3xl font-black text-gray-900">Report an Issue</h3>
              <p className="mb-6 text-center font-medium text-gray-500">Help improve your community.</p>

              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                
                {/* 3. Toggle Button Colors */}
                <div className="flex w-full rounded-lg bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => setLocationMode('gps')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-bold transition-all ${
                      locationMode === 'gps' ? 'bg-white text-bayanihan-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <FiCrosshair /> Use GPS
                  </button>
                  <button
                    type="button"
                    onClick={onRequestPinDrop}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-bold transition-all ${
                      locationMode === 'manual' ? 'bg-white text-bayanihan-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <FiEdit2 /> Drop Pin
                  </button>
                </div>

                {/* 4. Select & Textarea Focus Rings */}
                <select 
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-900 outline-none transition-all focus:ring-2 focus:ring-bayanihan-blue" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Roads">Potholes / Broken Roads</option>
                  <option value="Lights">Streetlights Out</option>
                  <option value="Trash">Uncollected Garbage</option>
                </select>

                <textarea 
                  className="h-28 w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-900 placeholder-gray-400 outline-none transition-all focus:ring-2 focus:ring-bayanihan-blue" 
                  placeholder="Briefly describe the problem..." 
                  value={desc} 
                  onChange={(e) => setDesc(e.target.value)} 
                  required 
                />

                {/* 5. Photo Upload Accents */}
                <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-center hover:border-bayanihan-blue/50">
                  <label className="mb-2 block cursor-pointer text-sm font-bold text-gray-700">📸 Attach Photo Evidence</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setPhoto(e.target.files ? e.target.files[0] : null)} 
                    className="w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-bayanihan-light file:px-4 file:py-2 file:text-sm file:font-bold file:text-bayanihan-blue" 
                  />
                </div>

                {/* 6. Primary Submit Button */}
                <div className="mt-4 flex gap-2">
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className={`w-full rounded-lg py-3 font-bold text-white shadow-md transition-all ${
                      isSubmitting 
                        ? 'cursor-not-allowed bg-gray-400' 
                        : 'bg-bayanihan-blue hover:bg-bayanihan-dark active:scale-95'
                    }`}
                  >
                    {isSubmitting ? 'Processing...' : '📍 Submit Report'}
                  </button>
                </div>
              </form>
              <div className="mt-4 text-center text-sm font-bold text-gray-600">{status}</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}