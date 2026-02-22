'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiMapPin, FiCrosshair, FiEdit2, FiX, FiAlertCircle, FiLoader } from 'react-icons/fi';
import { submitReportAction } from '@/app/actions/report';
// 1. Import the compression library
import imageCompression from 'browser-image-compression';

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
  const [photoError, setPhotoError] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  
  const [locationMode, setLocationMode] = useState<'gps' | 'manual'>('gps');
  const [status, setStatus] = useState('Ready to help.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (pinCoords) setLocationMode('manual');
  }, [pinCoords]);

  const resetForm = () => {
    setCategory('Roads');
    setDesc('');
    setPhoto(null);
    setPhotoError('');
    setIsCompressing(false);
    setStatus('Ready to help.');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // --- VALIDATION LOGIC ---
  const isDescValid = desc.trim().length >= 5;
  const isLocationValid = locationMode === 'gps' || (locationMode === 'manual' && pinCoords !== null);
  const isFormValid = isDescValid && isLocationValid && !photoError && !isCompressing;

  // 2. Updated Photo Logic with Compression
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const imageFile = e.target.files?.[0];
    if (!imageFile) return;

    setPhotoError('');
    setIsCompressing(true);
    setStatus("📸 Optimizing image...");

    const options = {
      maxSizeMB: 0.8,          // Target size under 1MB
      maxWidthOrHeight: 1280, // Resize long edge to 1280px (plenty for map evidence)
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(imageFile, options);
      setPhoto(compressedFile);
      setStatus("✅ Image optimized.");
    } catch (error) {
      console.error(error);
      setPhotoError("Failed to process image. Try a different one.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    setStatus("⏳ Processing report...");

    try {
      let lat: number;
      let lng: number;

      if (locationMode === 'manual' && pinCoords) {
        lat = parseFloat(pinCoords.lat.toFixed(6));
        lng = parseFloat(pinCoords.lng.toFixed(6));
      } else {
        setStatus("🛰️ Fetching GPS location...");
        const getPosition = (opts: PositionOptions) => 
          new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, opts));

        try {
          // BUMPED: 5000 -> 10000 (10 seconds for High Accuracy)
          const pos = await getPosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
          lat = parseFloat(pos.coords.latitude.toFixed(6));
lng = parseFloat(pos.coords.longitude.toFixed(6));
        } catch (err: any) {
          setStatus("📡 Signal weak, using standard GPS...");
          // BUMPED: 10000 -> 15000 (15 seconds for Standard Fallback)
          const pos = await getPosition({ enableHighAccuracy: false, timeout: 15000 });
          lat = parseFloat(pos.coords.latitude.toFixed(6));
          lng = parseFloat(pos.coords.longitude.toFixed(6));
        }
      }

      setStatus("🚀 Sending to Bayanihan Network...");

      const formData = new FormData();
      formData.append('category', category);
      formData.append('description', desc);
      formData.append('lat', lat.toString());
      formData.append('lng', lng.toString());
      formData.append('locationMode', locationMode);
      if (photo) formData.append('photo', photo);

      const result = await submitReportAction(formData);

      if (result.success) {
        alert("Success! Your evidence is now live on the map.");
        handleClose();
      } else {
        setStatus(`❌ Error: ${result.message}`);
        setIsSubmitting(false);
      }
    } catch (error: any) {
      let msg = error.message;
      if (error.code === 1) msg = "Location denied. Use 'Drop Pin'.";
      if (error.code === 3 || error.message?.includes('timeout')) msg = "GPS timed out. Use 'Drop Pin'.";
      setStatus(`❌ ${msg}`);
      setIsSubmitting(false);
    }
  };

 return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 z-[2000] grid place-items-center overflow-y-scroll bg-black/40 p-4 backdrop-blur-sm cursor-pointer"
        >
          <motion.div
            initial={{ scale: 0, rotate: "12.5deg" }} animate={{ scale: 1, rotate: "0deg" }} exit={{ scale: 0, rotate: "0deg" }}
            onClick={(e) => e.stopPropagation()} 
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-gray-100"
          >
            <button onClick={handleClose} className="absolute right-4 top-4 z-20 rounded-full p-2 text-gray-400 hover:bg-gray-100">
              <FiX size={20} />
            </button>

            <FiMapPin className="absolute -left-24 -top-24 z-0 text-[250px] text-gray-50 rotate-12" />
            
            <div className="relative z-10">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-bayanihan-light text-3xl text-bayanihan-blue">
                <FiMapPin />
              </div>

              <h3 className="mb-2 text-center text-3xl font-black text-gray-900">Report an Issue</h3>
              <p className="mb-6 text-center font-medium text-gray-500">Help improve your community.</p>

              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                
                <div className="flex w-full flex-col gap-2">
                  <div className="flex w-full rounded-lg bg-gray-100 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setLocationMode('gps');
                        navigator.geolocation.getCurrentPosition(()=>{}, ()=>{}, {enableHighAccuracy: true});
                      }}
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
                  {locationMode === 'manual' && !pinCoords && (
                    <span className="flex items-center justify-center gap-1 text-xs font-bold text-red-500 italic">
                      <FiAlertCircle /> Please drop a pin on the map.
                    </span>
                  )}
                  {locationMode === 'manual' && pinCoords && (
                    <span className="text-center text-xs font-medium text-gray-600">
                      Selected: {pinCoords.lat.toFixed(6)}, {pinCoords.lng.toFixed(6)}
                    </span>
                  )}
                </div>

                <select 
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 p-3 font-bold text-black outline-none focus:ring-2 focus:ring-bayanihan-blue" 
                  value={category} onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Roads">Potholes / Broken Roads</option>
                  <option value="Lights">Streetlights Out</option>
                  <option value="Trash">Uncollected Garbage</option>
                </select>

                <textarea 
                  className={`h-28 w-full resize-none rounded-lg border bg-gray-50 p-3 text-black placeholder:text-gray-500 outline-none focus:ring-2 ${
                    desc.length > 0 && !isDescValid ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-bayanihan-blue'
                  }`}
                  placeholder="Describe the problem..." 
                  value={desc} onChange={(e) => setDesc(e.target.value)} 
                  required 
                />

                <div className={`rounded-lg border-2 border-dashed bg-gray-50 p-4 text-center transition-colors ${photoError ? 'border-red-300' : 'border-gray-200 hover:border-bayanihan-blue/50'}`}>
                  <label className="mb-2 block cursor-pointer text-sm font-bold text-gray-700">📸 Attach Photo</label>
                  <input 
                    type="file" accept="image/*" onChange={handlePhotoChange} 
                    className="w-full text-sm text-gray-900 file:mr-4 file:rounded-lg file:border-0 file:bg-bayanihan-light file:px-4 file:py-2 file:text-sm file:font-bold file:text-bayanihan-blue" 
                  />
                  {isCompressing && (
                    <div className="mt-2 flex items-center justify-center gap-2 text-xs font-bold text-bayanihan-blue animate-pulse">
                      <FiLoader className="animate-spin" /> Optimizing Image...
                    </div>
                  )}
                  {photoError && <p className="mt-2 text-xs font-bold text-red-500">{photoError}</p>}
                </div>

                <button 
                  type="submit" 
                  disabled={!isFormValid || isSubmitting} 
                  className={`w-full rounded-lg py-3 font-bold shadow-md transition-all ${
                    !isFormValid || isSubmitting ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-bayanihan-blue text-white hover:bg-opacity-90 active:scale-95'
                  }`}
                >
                  {isSubmitting ? 'Processing...' : '📍 Submit Report'}
                </button>
              </form>
              
              <div className="mt-4 text-center text-sm font-bold text-gray-700">{status}</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}