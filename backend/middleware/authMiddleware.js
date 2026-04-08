
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { supabase as globalSupabase } from '../config/supabase.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'No authorization token provided' });
        }

        const token = authHeader.replace('Bearer ', '');

        // 1. Verify token
        const { data: { user }, error } = await globalSupabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // 2. Attach user to request
        req.user = user;

        // 3. Create scoped client for RLS
        req.supabase = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: {
                    Authorization: authHeader,
                },
            },
        });

        next();
    } catch (error) {
        console.error('[Auth Middleware] Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const requireAdmin = async (req, res, next) => {
    // Run requireAuth first
    await requireAuth(req, res, async () => {
        try {
            // Check role in users_profiles
            // Use the scoped client so RLS works (or global client since profiles might be public read)
            // But we already have the user, so simpler to just query profiles table directly.
            // Using globalSupabase is fine if users_profiles is readable by authenticated users.

            const { data: profile, error } = await globalSupabase
                .from('users_profiles')
                .select('role')
                .eq('id', req.user.id)
                .single();

            if (error || !profile) {
                return res.status(403).json({ error: 'Failed to fetch user profile' });
            }

            if (profile.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied: Admins only' });
            }

            next();
        } catch (error) {
            console.error('[Admin Middleware] Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
};
