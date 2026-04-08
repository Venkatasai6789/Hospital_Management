import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY);
const MODELS = ["gemini-2.5-flash", "gemini-3-flash", "gemini-2.5-flash-lite"];

const getSystemPrompt = (lang, context, data) => {
    if (context === 'symptom') {
        if (lang === 'ta') {
            return `
            நீங்கள் MediConnect-ன் மருத்துவ உதவியாளர். 
            பின்வரும் தரவை பகுப்பாய்வு செய்து நோயாளிக்கு பயனுள்ள பதிலை தமிழில் வழங்கவும்.
      
            --- தரவு ---
            சந்தேகிக்கப்படும் நோய்: ${data.disease}
            AI நம்பிக்கை: ${data.confidence}
            அசல் பதில்: ${data.originalPatientResponse}
            மருத்துவர் அறிக்கை: ${data.doctorReport}
            --- முடிவு ---
      
            பணிகள்:
            1. கனிவாகவும், தொழில்முறையாகவும் இருக்கவும்.
            2. தெளிவான தலைப்புகள் மற்றும் புள்ளிகளைப் பயன்படுத்தவும்.
            3. அறிகுறிகளை அங்கீகரித்து, நோயை எளிய தமிழில் விளக்கவும்.
            4. மருத்துவரை அணுகுமாறு அறிவுறுத்தவும் (தீவிரமாக இருந்தால்).
            5. புதிய நோய்களைக் கண்டறிய வேண்டாம். கொடுக்கப்பட்டதை மட்டும் பயன்படுத்தவும்.
            
            சுருக்கமாக (150 வார்த்தைகளுக்குள்) இருக்கவும்.
            `;
        } else {
            return `
            You are a premium medical AI assistant for MediConnect. 
            Analyze the following backend response and provide a refined, user-friendly version for the patient.

            --- DATA FROM BACKEND ---
            Suspected Condition: ${data.disease}
            AI Confidence Score: ${data.confidence}
            Original Patient Response: ${data.originalPatientResponse}
            Internal Doctor Report: ${data.doctorReport}
            --- END DATA ---

            TASKS:
            1. **Tone**: Empathetic, calm, and professional.
            2. **Structure**: Use proper markdown (bold headings, bullet points).
            3. **Content**: 
               - Acknowledge the symptoms.
               - Explain the suspected condition in simple terms.
               - Mention the confidence level politely.
               - Strongly advise consulting specialists if serious.
            4. **Constraint**: DO NOT diagnose new conditions.
            5. **Brevity**: Keep it under 150 words.
            `;
        }
    } else if (context === 'medicine') {
        if (lang === 'ta') {
            return `
            நீங்கள் MediConnect-ன் மருந்தக உதவியாளர்.
            பின்வரும் மாற்று மருந்து பட்டியலை நோயாளிக்கு தமிழில் வழங்கவும்.

            --- தரவு ---
            அசல் பிராண்ட்: ${data.brandName}
            மாற்று மருந்துகள்: ${data.alternatives.join(", ")}
            அசல் செய்தி: ${data.originalMessage}
            --- முடிவு ---

            பணிகள்:
            1. அசல் பிராண்ட் மற்றும் அதன் மாற்று மருந்துகளை தெளிவாக பட்டியலிடவும்.
            2. **எச்சரிக்கை**: மருந்துகளை மாற்றும் முன் மருத்துவர் அல்லது மருந்தாளரை அணுக வேண்டும் என்று கண்டிப்பாக கூறவும்.
            3. தெளிவான புள்ளிகளைப் பயன்படுத்தவும்.
            4. சுருக்கமாகவும் நம்பிக்கையானதாகவும் இருக்கவும்.
            `;
        } else {
            return `
            You are a pharmacy assistant for MediConnect. 
            Refine the following generic medicine alternatives list for a patient.

            --- DATA FROM BACKEND ---
            Original Brand: ${data.brandName}
            Found Alternatives: ${data.alternatives.join(", ")}
            Original Message: ${data.originalMessage}
            --- END DATA ---

            TASKS:
            1. **Clarity**: Present the original brand and its generic alternatives in a clear list.
            2. **Safety**: Explicitly state that a qualified medical professional or pharmacist MUST be consulted before switching medications.
            3. **Structure**: Use markdown bullet points.
            4. **Brevity**: Keep it concise and trustworthy.
            `;
        }
    }
    return '';
};

// Helper to call Gemini
async function callGemini(prompt) {
    for (const modelName of MODELS) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.warn(`Gemini Error (${modelName}):`, error.message);
            if (modelName === MODELS[MODELS.length - 1]) return null;
        }
    }
    return null;
}

// Route: Refine Symptom Assessment
router.post('/refine-symptom', async (req, res) => {
    try {
        const { disease, confidence, originalPatientResponse, doctorReport } = req.body;
        const lang = req.language; // From middleware

        const prompt = getSystemPrompt(lang, 'symptom', {
            disease, confidence, originalPatientResponse, doctorReport
        });

        const refinedResponse = await callGemini(prompt);

        if (refinedResponse) {
            res.json({ refinedResponse });
        } else {
            // Fallback to original if AI fails
            res.json({ refinedResponse: originalPatientResponse });
        }

    } catch (error) {
        console.error('AI Refine Error:', error);
        res.status(500).json({ error: 'AI processing failed' });
    }
});

// Route: Refine Medicine Alternatives
router.post('/refine-medicine', async (req, res) => {
    try {
        const { brandName, alternatives, originalMessage } = req.body;
        const lang = req.language;

        const prompt = getSystemPrompt(lang, 'medicine', {
            brandName, alternatives, originalMessage
        });

        const refinedResponse = await callGemini(prompt);

        if (refinedResponse) {
            res.json({ refinedResponse });
        } else {
            res.json({ refinedResponse: originalMessage });
        }

    } catch (error) {
        console.error('AI Medicine Refine Error:', error);
        res.status(500).json({ error: 'AI processing failed' });
    }
});

export default router;
