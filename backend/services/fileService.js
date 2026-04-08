import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

// Helper to create scoped client
const createScopedClient = (token) => {
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    });
};

/**
 * Upload doctor document to Supabase Storage
 * @param {string} doctorId - Doctor's database ID
 * @param {string} userId - User's auth ID
 * @param {object} file - Multer file object
 * @param {string} documentType - Type of document
 * @param {string} token - User's JWT token
 */
export async function uploadDoctorDocument(doctorId, userId, file, documentType, token) {
    try {
        // Create authenticated client for this request
        const supabase = createScopedClient(token);

        const fileExt = file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('doctor-documents')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600',
            });

        if (uploadError) throw uploadError;

        // Get public URL (storage.getPublicUrl doesn't need auth usually, but we use scoped anyway)
        const { data: urlData } = supabase.storage
            .from('doctor-documents')
            .getPublicUrl(filePath);

        const fileUrl = urlData.publicUrl;

        // Save document record to database
        const { data: docData, error: docError } = await supabase
            .from('doctor_documents')
            .insert({
                doctor_id: doctorId,
                document_type: documentType,
                file_name: file.originalname,
                file_url: fileUrl,
                file_size: file.size,
            })
            .select()
            .single();

        if (docError) throw docError;

        return {
            success: true,
            document: docData,
        };
    } catch (error) {
        console.error('[File Service] Upload error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Delete doctor document
 */
export async function deleteDoctorDocument(documentId, userId) {
    try {
        // Get document info
        const { data: doc, error: docError } = await supabase
            .from('doctor_documents')
            .select('file_url')
            .eq('id', documentId)
            .single();

        if (docError) throw docError;

        // Extract file path from URL
        const urlParts = doc.file_url.split('/doctor-documents/');
        const filePath = urlParts[1];

        // Delete from storage
        const { error: storageError } = await supabase.storage
            .from('doctor-documents')
            .remove([filePath]);

        if (storageError) throw storageError;

        // Delete from database
        const { error: deleteError } = await supabase
            .from('doctor_documents')
            .delete()
            .eq('id', documentId);

        if (deleteError) throw deleteError;

        return {
            success: true,
            message: 'Document deleted successfully',
        };
    } catch (error) {
        console.error('[File Service] Delete error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}
