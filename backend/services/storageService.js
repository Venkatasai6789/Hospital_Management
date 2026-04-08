
import { supabase } from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload a file to Supabase Storage
 * @param {Object} file - The file object from multer
 * @param {string} bucket - The bucket name
 * @param {string} userId - The user ID (optional, for folder structure)
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
export async function uploadFile(file, bucket, userId) {
    try {
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${userId}/${uuidv4()}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error('[Storage Service] Upload error:', error);
        throw error;
    }
}
