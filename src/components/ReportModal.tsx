'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity">
      
      <div className="relative w-full max-w-md rounded-2xl border border-white/40 bg-white/30 p-8 shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-xl">
        
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-700 transition-colors hover:text-gray-900"
        >
          ✖
        </button>

        <h2 className="text-2xl font-black text-gray-900 drop-shadow-sm">📢 Report an Issue</h2>
        <p className="mb-6 text-sm font-medium text-gray-800">Help improve your community.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <select 
            className="w-full rounded-lg border border-white/50 bg-white/50 p-3 text-gray-900 outline-none backdrop-blur-md focus:border-transparent focus:ring-2 focus:ring-ph-blue-500"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Roads">Potholes / Broken Roads</option>
            <option value="Lights">Streetlights Out</option>
            <option value="Trash">Uncollected Garbage</option>
          </select>

          <textarea 
            className="h-28 w-full rounded-lg border border-white/50 bg-white/50 p-3 text-gray-900 outline-none backdrop-blur-md placeholder:text-gray-600 focus:border-transparent focus:ring-2 focus:ring-ph-blue-500"
            placeholder="Briefly describe the problem..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            required
          />

          <div className="rounded-lg border-2 border-dashed border-ph-blue-500/40 bg-white/40 p-4 text-center backdrop-blur-md">
            <label className="mb-2 block cursor-pointer text-sm font-bold text-gray-900 drop-shadow-sm">
              📸 Attach Photo Evidence
            </label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setPhoto(e.target.files ? e.target.files[0] : null)}
              className="w-full text-sm text-gray-800 file:mr-4 file:rounded-lg file:border-0 file:bg-ph-blue-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white transition-colors hover:file:bg-ph-blue-600"
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`mt-2 rounded-lg p-4 font-bold text-white transition-all ${
              isSubmitting 
                ? 'cursor-not-allowed bg-gray-400/80 backdrop-blur-md' 
                : 'bg-ph-blue-500 shadow-md hover:bg-ph-blue-600 hover:shadow-lg'
            }`}
          >
            {isSubmitting ? 'Processing...' : '📍 Submit Report'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm font-bold text-gray-900 drop-shadow-sm">
          {status}
        </div>
      </div>
    </div>
  );
}