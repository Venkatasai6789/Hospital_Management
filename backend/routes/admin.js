import express from 'express';
// import { supabase } from '../config/supabase.js'; // REMOVE: Use req.supabase
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply admin middleware to all routes in this router
router.use(requireAdmin);

// GET Pending Doctors
router.get('/doctors/pending', async (req, res) => {
    try {
        // Use req.supabase for RLS
        // Note: We fetch doctors first, then separately get emails from auth.users
        const { data, error } = await req.supabase
            .from('doctors')
            .select('*')
            .eq('approval_status', 'pending');

        if (error) throw error;

        // Fetch documents and email for each doctor
        const doctorsWithDocs = await Promise.all(data.map(async (doc) => {
            // Get documents
            const { data: docs } = await req.supabase
                .from('doctor_documents')
                .select('*')
                .eq('doctor_id', doc.id);

            // Return with email directly from doctors table (it has email column)
            return {
                ...doc,
                documents: docs || [],
                user: { email: doc.email } // Email is stored in doctors table
            };
        }));

        res.json(doctorsWithDocs);
    } catch (error) {
        console.error('Error fetching pending doctors:', error);
        res.status(500).json({ error: error.message });
    }
});

// Approve Doctor (Legacy)
router.put('/doctors/:id/approve', async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await req.supabase
            .from('doctors')
            .update({
                approval_status: 'approved',
                approved_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json({ message: 'Doctor approved', doctor: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reject Doctor (Legacy)
router.put('/doctors/:id/reject', async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await req.supabase
            .from('doctors')
            .update({ approval_status: 'rejected' })
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json({ message: 'Doctor rejected', doctor: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify Doctor (New Requirement: PATCH /api/admin/verify-doctor/:id)
// Logic: Update target doctor's status to 'VERIFIED' (approved) or 'REJECTED' based on request body.
router.patch('/verify-doctor/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // Expect 'approved' or 'rejected' or 'VERIFIED'/'REJECTED'

    try {
        let newStatus;
        if (status === 'VERIFIED' || status === 'approved') newStatus = 'approved';
        else if (status === 'REJECTED' || status === 'rejected') newStatus = 'rejected';
        else return res.status(400).json({ error: 'Invalid status. Use VERIFIED or REJECTED' });

        const updateData = { approval_status: newStatus };
        if (newStatus === 'approved') {
            updateData.approved_at = new Date().toISOString();
        }

        const { data, error } = await req.supabase
            .from('doctors')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json({ message: `Doctor ${newStatus}`, doctor: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET Medicine Orders
router.get('/medicine-orders', async (req, res) => {
    try {
        console.log('[Admin] Fetching medicine orders for admin user:', req.user?.id);

        const { data, error } = await req.supabase
            .from('medicine_orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Admin] Error fetching medicine orders:', error);
            throw error;
        }

        console.log(`[Admin] Found ${data?.length || 0} medicine orders`);
        res.json(data);
    } catch (error) {
        console.error('[Admin] Error fetching medicine orders:', error.message, error);
        res.status(500).json({ error: error.message, details: error });
    }
});

// UPDATE Order Status
router.patch('/medicine-orders/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const { data, error } = await req.supabase
            .from('medicine_orders')
            .update({ status })
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
