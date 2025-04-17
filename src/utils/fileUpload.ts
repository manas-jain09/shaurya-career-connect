
import { supabase } from '@/integrations/supabase/client';

export const uploadOfferLetter = async (
  file: File,
  studentId: string,
  jobId: string
): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${studentId}_${jobId}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${studentId}/${fileName}`;

    const { error } = await supabase.storage
      .from('offer_letters')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading offer letter:', error);
      return null;
    }

    // Get the public URL for the file
    const { data } = supabase.storage.from('offer_letters').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadOfferLetter:', error);
    return null;
  }
};
