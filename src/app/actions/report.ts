'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);

// Security constraints
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export async function submitReportAction(formData: FormData) {
  try {
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const lat = parseFloat(formData.get('lat') as string);
    const lng = parseFloat(formData.get('lng') as string);
    const locationMode = formData.get('locationMode') as string;
    const photo = formData.get('photo') as File | null;

    // --- 1. DATA VALIDATION ---
    if (!description || description.trim().length < 5) {
      throw new Error("Description is too short. Please provide more details.");
    }
    if (description.length > 1000) {
      throw new Error("Description is too long. Please keep it under 1000 characters.");
    }
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error("Invalid GPS coordinates provided.");
    }

    let finalPhotoUrl = 'https://placehold.co/600x400?text=No+Photo+Provided';

    // --- 2. FILE UPLOAD CHECK ---
    if (photo && photo.size > 0) {
      // Check file size
      if (photo.size > MAX_FILE_SIZE) {
        throw new Error("Photo is too large. Maximum size is 10MB.");
      }
      
      // Check file type
      if (!ALLOWED_IMAGE_TYPES.includes(photo.type)) {
        throw new Error("Invalid file type. Only JPG, PNG, and WebP images are allowed.");
      }

      const fileExt = photo.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '') || 'jpg';
      const fileName = `report_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('bayanihan-photos')
        .upload(fileName, photo);

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data } = supabase.storage
        .from('bayanihan-photos')
        .getPublicUrl(fileName);
        
      finalPhotoUrl = data.publicUrl;
    }

    // --- 3. DATABASE INSERT ---
    const { error: dbError } = await supabase.from('reports').insert([{
      category,
      description: description.trim(), 
      latitude: lat,
      longitude: lng,
      municipality: locationMode === 'manual' ? 'Manual Pin' : 'Auto-GPS',
      photo_url: finalPhotoUrl
    }]);

    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    revalidatePath('/');

    return { success: true, message: 'Report submitted successfully!' };
  } catch (error: any) {
    console.error("Report Submission Error:", error);
    return { success: false, message: error.message || 'An unexpected error occurred.' };
  }
}