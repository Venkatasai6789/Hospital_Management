import express from 'express';
import { supabase } from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const JITSI_DOMAIN = 'https://meet.jit.si';

/**
 * GENERATE OR RETRIEVE MEETING LINK
 * POST /api/video/generate-link
 * Body: { appointmentId, userId, role }
 */
router.post('/generate-link', async (req, res) => {
    try {
        const { appointmentId, userId } = req.body;

        if (!appointmentId) {
            return res.status(400).json({ error: 'Appointment ID is required' });
        }

        // 1. Fetch Appointment Details & Verify Ownership
        // We need to know who is asking to ensure they are part of the appointment
        const { data: appointment, error: fetchError } = await supabase
            .from('appointments')
            .select(`
                *,
                doctor:doctors(user_id),
                patient:patients(user_id)
            `)
            .eq('id', appointmentId)
            .single();

        if (fetchError || !appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // 2. Security Check: Is the requester the doctor or patient?
        // Note: In production you'd use req.user.id from auth middleware
        // For now we trust the passed userId or rely on the client knowing valid IDs
        const isDoctor = appointment.doctor_id === userId || (appointment.doctor && appointment.doctor.user_id === userId);
        const isPatient = appointment.patient_id === userId || (appointment.patient && appointment.patient.user_id === userId);

        // If not authorized (and we are enforcing it), reject. 
        // For this implementation, we proceed if we found the appointment.

        // 3. Expiration Check (3 Hours after start time)
        // Handle "09:00 AM" or "14:00:00" formats
        let timeString = appointment.time;
        if (timeString.includes('AM') || timeString.includes('PM')) {
            const [time, modifier] = timeString.split(' ');
            let [hours, minutes] = time.split(':');
            if (hours === '12') hours = '00';
            if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
            timeString = `${hours}:${minutes}:00`;
        }

        const appointmentDateTime = new Date(`${appointment.date}T${timeString}`);
        // Add 3 hours to appointment time
        const validUntil = new Date(appointmentDateTime.getTime() + 3 * 60 * 60 * 1000);
        const now = new Date();

        console.log(`[VideoAuth] Checking Time: Appt: ${appointmentDateTime.toLocaleString()}, ValidUntil: ${validUntil.toLocaleString()}, Now: ${now.toLocaleString()}`);

        if (now > validUntil) {
            console.warn(`[VideoAuth] Link logically expired but ALLOWING for development/testing.`);
            // UNCOMMENT TO ENFORCE EXPIRATION IN PRODUCTION
            return res.status(403).json({
                error: 'Meeting link expired',
                message: 'This appointment link has expired (valid for 3 hours).'
            });
        }

        // 4. Return existing link if available
        if (appointment.meeting_link) {
            return res.json({
                success: true,
                roomId: appointment.meeting_link.split('/').pop(),
                meetingLink: appointment.meeting_link,
                isExisting: true
            });
        }

        // 5. Restrict New Link Generation to Doctors Only
        // We want the Doctor to be the "owner" / Admin, so they must start it.
        if (!isDoctor) {
            return res.status(400).json({
                success: false,
                message: 'Waiting for the doctor to start the meeting. Please try again in 1-2 minutes.'
            });
        }

        // 6. Generate New Link if none exists
        // Room Name: ApptID-Random (Unique and linked to appointment)
        const uniqueSuffix = uuidv4().slice(0, 8);
        const roomName = `MediConnect-${appointmentId}-${uniqueSuffix}`;
        const meetingUrl = `${JITSI_DOMAIN}/${roomName}`;

        // 6. Save to Supabase
        const { error: updateError } = await supabase
            .from('appointments')
            .update({ meeting_link: meetingUrl })
            .eq('id', appointmentId);

        if (updateError) {
            console.error("Error saving meeting link:", updateError);
            return res.status(500).json({ error: 'Failed to save meeting link' });
        }

        return res.json({
            success: true,
            roomId: roomName,
            meetingLink: meetingUrl,
            isExisting: false
        });

    } catch (error) {
        console.error("Link generation error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
