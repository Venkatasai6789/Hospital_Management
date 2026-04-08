import express from 'express';
import multer from 'multer';
import { supabase } from '../config/supabase.js';
import { uploadDoctorDocument } from '../services/fileService.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow PDF, JPG, JPEG, PNG
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
        }
    },
});

/**
 * GET /api/doctors/:userId
 * Get doctor profile by user ID
 */
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const { data, error } = await supabase
            .from('doctors')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        res.json(data);
    } catch (error) {
        console.error('[Doctor Routes] Get doctor error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/doctors/:userId/documents
 * Get all documents for a doctor
 */
router.get('/:userId/documents', async (req, res) => {
    try {
        const { userId } = req.params;

        // First get doctor_id from user_id
        const { data: doctor, error: doctorError } = await supabase
            .from('doctors')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (doctorError) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        // Get documents
        const { data: documents, error: docsError } = await supabase
            .from('doctor_documents')
            .select('*')
            .eq('doctor_id', doctor.id);

        if (docsError) {
            return res.status(400).json({ error: docsError.message });
        }

        res.json(documents);
    } catch (error) {
        console.error('[Doctor Routes] Get documents error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/doctors/:userId/documents
 * Upload doctor documents
 */
router.post('/:userId/documents', upload.array('documents', 10), async (req, res) => {
    try {
        const { userId } = req.params;
        const files = req.files;
        const documentTypes = JSON.parse(req.body.documentTypes || '[]');

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        // Get doctor_id
        const { data: doctor, error: doctorError } = await supabase
            .from('doctors')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (doctorError) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        // Upload each file
        const uploadedDocs = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const documentType = documentTypes[i] || 'other';

            const result = await uploadDoctorDocument(
                doctor.id,
                userId,
                file,
                documentType
            );

            if (result.success) {
                uploadedDocs.push(result.document);
            }
        }

        res.status(201).json({
            message: 'Documents uploaded successfully',
            documents: uploadedDocs,
        });
    } catch (error) {
        console.error('[Doctor Routes] Upload documents error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /api/doctors/:userId/approve
 * Approve a doctor (admin only)
 */
router.put('/:userId/approve', async (req, res) => {
    try {
        const { userId } = req.params;
        const { approvedBy } = req.body;

        const { data, error } = await supabase
            .from('doctors')
            .update({
                approval_status: 'approved',
                approved_by: approvedBy,
                approved_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({
            message: 'Doctor approved successfully',
            data,
        });
    } catch (error) {
        console.error('[Doctor Routes] Approve doctor error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /api/doctors/:userId
 * Update doctor profile
 */
router.put('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;

        const { data, error } = await supabase
            .from('doctors')
            .update(updates)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({
            message: 'Doctor profile updated successfully',
            data,
        });
    } catch (error) {
        console.error('[Doctor Routes] Update doctor error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
