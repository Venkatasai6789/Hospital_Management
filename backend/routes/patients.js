import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

/**
 * GET /api/patients/:userId
 * Get patient profile by user ID
 */
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const { data, error } = await supabase
            .from('patients')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json(data);
    } catch (error) {
        console.error('[Patient Routes] Get patient error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /api/patients/:userId
 * Update patient profile
 */
router.put('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;

        const { data, error } = await supabase
            .from('patients')
            .update(updates)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({
            message: 'Patient profile updated successfully',
            data,
        });
    } catch (error) {
        console.error('[Patient Routes] Update patient error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
