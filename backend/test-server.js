import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test Supabase connection on startup
testConnection();

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'MediConnect API is running' });
});

app.listen(PORT, () => {
    console.log(`🚀 MediConnect Backend Server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});
