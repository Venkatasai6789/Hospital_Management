import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

const MODELS = [
    "gemini-2.5-flash",
    "gemini-3-flash",
    "gemini-2.5-flash-lite"
];

export const geminiService = {
    /**
     * Refines a symptom assessment from the backend using Gemini.
     */
    async refineSymptomAssessment(disease: string, confidence: string, originalPatientResponse: string, doctorReport: string): Promise<string> {
        const prompt = `
      You are a premium medical AI assistant for MediConnect. 
      Analyze the following backend response and provide a refined, user-friendly version for the patient.

      --- DATA FROM BACKEND ---
      Suspected Condition: ${disease}
      AI Confidence Score: ${confidence}
      Original Patient Response: ${originalPatientResponse}
      Internal Doctor Report: ${doctorReport}
      --- END DATA ---

      TASKS:
      1. **Tone**: Empathetic, calm, and professional.
      2. **Structure**: Use proper markdown (bold headings, bullet points).
      3. **Content**: 
         - Acknowledge the symptoms.
         - Explain the suspected condition in simple terms.
         - Mention the confidence level politely (e.g., "Our analysis shows a high probability of...").
         - If the condition seems serious based on the report, strongly advise consulting the recommended specialists.
      4. **Constraint**: DO NOT diagnose new conditions. stick to the provided suspected condition.
      5. **Brevity**: Keep it under 150 words.

      Refined Response:
    `;
        return this.callGemini(prompt);
    },

    /**
     * Refines medicine alternatives from the backend using Gemini.
     */
    async refineMedicineAlternatives(brandName: string, alternatives: string[], originalMessage: string): Promise<string> {
        const prompt = `
      You are a pharmacy assistant for MediConnect. 
      Refine the following generic medicine alternatives list for a patient.

      --- DATA FROM BACKEND ---
      Original Brand: ${brandName}
      Found Alternatives: ${alternatives.join(", ")}
      Original Message: ${originalMessage}
      --- END DATA ---

      TASKS:
      1. **Clarity**: Present the original brand and its generic alternatives in a very clear list.
      2. **Safety**: Explicitly state that a qualified medical professional or pharmacist MUST be consulted before switching medications.
      3. **Structure**: Use markdown bullet points.
      4. **Brevity**: Keep it concise and trustworthy.

      Refined Response:
    `;
        return this.callGemini(prompt);
    },

    /**
     * Core call to Gemini with model fallback logic.
     */
    async callGemini(prompt: string): Promise<string> {
        if (!API_KEY || API_KEY.includes('...')) {
            console.warn("Gemini API Key missing or incomplete. Skipping refinement.");
            return ""; // Return empty to allow fallback to original backend response
        }

        for (const modelName of MODELS) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text().trim();
            } catch (error: any) {
                const errorMsg = error?.message || "";
                const isRateLimit = errorMsg.includes('429') || errorMsg.includes('Resource has been exhausted');

                console.warn(`Gemini Error (${modelName}):`, errorMsg);

                // Fallback on Rate Limit if there's a backup model
                if (isRateLimit && modelName !== MODELS[MODELS.length - 1]) {
                    console.info(`Switching to backup model: ${MODELS[MODELS.length - 1]}`);
                    continue;
                }

                // Return blank to fallback to original backend response on any other major error
                return "";
            }
        }
        return "";
    }
};
