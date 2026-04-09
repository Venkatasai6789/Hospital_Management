import express from 'express';
import * as authService from '../services/authService.js';

const router = express.Router();

/**
 * POST /api/auth/signup
 * Register a new user (patient or doctor)
 */
import { upload } from '../config/multerConfig.js';

/**
 * POST /api/auth/register-doctor
 * Register a new doctor with documents
 */
router.post('/register-doctor',
    upload.fields([
        { name: 'medicalLicense', maxCount: 1 },
        { name: 'degree', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            // req.body will contain text fields
            // req.files will contain files
            const { email, password, ...doctorData } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            const result = await authService.registerDoctor(email, password, doctorData, req.files);

            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }

            res.status(201).json({
                message: 'Doctor registration successful',
                user: result.user,
                session: result.session,
                verificationStatus: 'PENDING'
            });

        } catch (error) {
            console.error('[Auth Routes] Doctor Register error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

/**
 * POST /api/auth/signup
 * Register a new user (patient)
 */
router.post('/signup', async (req, res) => {
    try {
        const { email, password, userData } = req.body;

        if (!email || !password || !userData) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Ensure this endpoint is not used for doctors if we have a separate one
        if (userData.role === 'doctor') {
            return res.status(400).json({ error: 'Use /register-doctor endpoint for doctor registration' });
        }

        const result = await authService.signUp(email, password, userData);

        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        res.status(201).json({
            message: 'User created successfully',
            user: result.user,
            session: result.session,
        });
    } catch (error) {
        console.error('[Auth Routes] Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/signin
 * Sign in with email/mobile and password
 */
router.post('/signin', async (req, res) => {
    try {
        const { emailOrMobile, password } = req.body;

        if (!emailOrMobile || !password) {
            return res.status(400).json({ error: 'Email/Mobile and password are required' });
        }

        const result = await authService.signIn(emailOrMobile, password);

        if (!result.success) {
            const status = result.status || 401;
            return res.status(status).json({ error: result.error });
        }

        res.json({
            message: 'Login successful',
            user: result.user,
            session: result.session,
            profile: result.profile,
            verificationStatus: result.verificationStatus
        });
    } catch (error) {
        console.error('[Auth Routes] Signin error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/signout
 * Sign out current user
 */
router.post('/signout', async (req, res) => {
    try {
        const result = await authService.signOut();

        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('[Auth Routes] Signout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'No authorization token provided' });
        }

        const token = authHeader.replace('Bearer ', '');
        const result = await authService.getCurrentUser(token);

        if (!result.success) {
            return res.status(401).json({ error: result.error });
        }

        res.json({
            user: result.user,
            profile: result.profile,
        });
    } catch (error) {
        console.error('[Auth Routes] Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
