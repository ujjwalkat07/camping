import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const bucketName = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'payment-screenshots';

const isConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  !supabaseUrl.includes('your-supabase-project') &&
  !supabaseAnonKey.includes('your-supabase-anon-key');

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface UploadResult {
  publicUrl: string;
  filePath?: string;
  error?: string;
}

/**
 * Uploads a payment screenshot File to Supabase Storage and returns the public URL.
 * Fallbacks to a Data URL if Supabase credentials are not configured yet.
 */
export async function uploadPaymentScreenshot(file: File, bookingId: string): Promise<UploadResult> {
  const fileExt = file.name.split('.').pop() || 'png';
  const cleanBookingId = bookingId.replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = `${cleanBookingId}_${Date.now()}.${fileExt}`;
  const filePath = `payments/${fileName}`;

  if (!supabase) {
    //warn(
    'Supabase client is not fully configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.'
    );
    // Convert to Data URL as fallback so user flow continues
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          publicUrl: reader.result as string,
          filePath,
          error: 'Supabase credentials not configured. Temporary Data URL generated.'
        });
      };
      reader.onerror = () => {
        resolve({
          publicUrl: '',
          filePath,
          error: 'Failed to read file locally.'
        });
      };
      reader.readAsDataURL(file);
    });
  }

  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'image/png'
      });

    if (uploadError) {
      //warn('Supabase storage upload error:', uploadError.message);
      // Fallback to Data URL if RLS policy prevents public upload
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            publicUrl: reader.result as string,
            filePath,
            error: uploadError.message
          });
        };
        reader.onerror = () => {
          resolve({
            publicUrl: '',
            filePath,
            error: uploadError.message
          });
        };
        reader.readAsDataURL(file);
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(uploadData.path || filePath);

    return {
      publicUrl: publicUrlData.publicUrl,
      filePath: uploadData.path || filePath
    };
  } catch (err: any) {
    //error('Unexpected error uploading to Supabase Storage:', err);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          publicUrl: reader.result as string,
          filePath,
          error: err?.message || 'Upload failed'
        });
      };
      reader.onerror = () => {
        resolve({
          publicUrl: '',
          filePath,
          error: err?.message || 'Upload failed'
        });
      };
      reader.readAsDataURL(file);
    });
  }
}
