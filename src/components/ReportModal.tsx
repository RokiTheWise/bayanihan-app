'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';
import { FiMapPin } from 'react-icons/fi';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportModal({ isOpen, onClose }: ReportModalProps) {
  const [category, setCategory] = useState('Roads');
  const [desc, setDesc] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [status, setStatus] = useState('Ready to help.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NOTICE: We removed `if (!isOpen) return null;` so AnimatePresence can handle the exit!

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("🛰️ Fetching exact GPS location...");

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        let finalPhotoUrl = 'https://placehold.co/600x400?text=No+Photo+Provided';

        if (photo) {
          setStatus("📸 Uploading photo evidence...");
          const fileExt = photo.name.split('.').pop();
          const fileName = `report_${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('bayanihan-photos')
            .upload(fileName, photo);

          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from('bayanihan-photos')
            .getPublicUrl(fileName);

          finalPhotoUrl = data.publicUrl;
        }

        setStatus("🚀 Dropping pin on the Bayanihan Network...");

        const { error: dbError } = await supabase
          .from('reports')
          .insert([{
            category,
            description: desc,
            latitude: lat,
            longitude: lng,
            municipality: 'Philippines',
            photo_url: finalPhotoUrl
          }]);

        if (dbError) throw dbError;

        alert("Success! Your evidence is now live on the map.");
        
        onClose();
        window.location.reload(); 
        
      } catch (error: any) {
        setStatus(`❌ Error: ${error.message}`);
        setIsSubmitting(false);
      }
    }, (err) => {
      setStatus("❌ Please enable GPS to report.");
      setIsSubmitting(false);
    }, { enableHighAccuracy: true, timeout: 10000 });
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
          {/* THE CLEAN SPRING MODAL CARD */}
          <motion.div
            initial={{ scale: 0, rotate: "12.5deg" }}
            animate={{ scale: 1, rotate: "0deg" }}
            exit={{ scale: 0, rotate: "0deg" }}
            onClick={(e) => e.stopPropagation()} 
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl cursor-default border border-gray-100"
          >
            <FiMapPin className="absolute -left-24 -top-24 z-0 text-[250px] text-gray-50 rotate-12" />
            
            <div className="relative z-10">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-blue-50 text-3xl text-[#0038a7]">
                <FiMapPin />
              </div>

              <h3 className="mb-2 text-center text-3xl font-black text-gray-900">Report an Issue</h3>
              <p className="mb-6 text-center font-medium text-gray-500">Help improve your community.</p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                
                {/* Clean, high-contrast inputs */}
                <select 
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-900 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#0038a7]"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Roads">Potholes / Broken Roads</option>
                  <option value="Lights">Streetlights Out</option>
                  <option value="Trash">Uncollected Garbage</option>
                </select>

                <textarea 
                  className="h-28 w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#0038a7]"
                  placeholder="Briefly describe the problem..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  required
                />

                <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-center transition-colors hover:border-[#0038a7]/50">
                  <label className="mb-2 block cursor-pointer text-sm font-bold text-gray-700">
                    📸 Attach Photo Evidence
                  </label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setPhoto(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-[#0038a7] transition-colors hover:file:bg-blue-100"
                  />
                </div>

                <div className="mt-4 flex gap-2">
                  <button 
                    type="button"
                    onClick={onClose}
                    className="w-full rounded-lg bg-transparent py-3 font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`w-full rounded-lg py-3 font-bold text-white transition-all shadow-md ${
                      isSubmitting 
                        ? 'cursor-not-allowed bg-gray-400' 
                        : 'bg-[#0038a7] hover:bg-[#00308f] hover:shadow-lg active:scale-95'
                    }`}
                  >
                    {isSubmitting ? 'Processing...' : '📍 Submit'}
                  </button>
                </div>
              </form>

              <div className="mt-4 text-center text-sm font-bold text-gray-600">
                {status}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}