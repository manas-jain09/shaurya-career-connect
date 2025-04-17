
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from '@/utils/helpers';

interface OfferLetterUploadProps {
  applicationId: string;
  currentUrl: string | null;
  onUploadComplete: (url: string) => void;
}

export const OfferLetterUpload = ({ applicationId, currentUrl, onUploadComplete }: OfferLetterUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadFile(file, 'offer_letters', `application_${applicationId}`);
      
      if (!url) {
        throw new Error('Failed to upload file');
      }

      const { error } = await supabase
        .from('job_applications')
        .update({ offer_letter_url: url })
        .eq('id', applicationId);

      if (error) throw error;

      onUploadComplete(url);
      toast.success('Offer letter uploaded successfully');
    } catch (error) {
      console.error('Error uploading offer letter:', error);
      toast.error('Failed to upload offer letter');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {currentUrl && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.open(currentUrl, '_blank')}
        >
          <Download className="h-4 w-4 mr-1" />
          View
        </Button>
      )}
      <div className="relative">
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        <Button 
          variant="outline" 
          size="sm"
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-1" />
              Upload
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
