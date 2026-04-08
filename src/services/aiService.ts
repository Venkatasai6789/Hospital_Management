import axios from 'axios';
import api from './api'; // Import the configured api instance with interceptors

// Base URL for the AI Backend (Ngrok)
const API_BASE_URL = 'https://secernent-unremotely-wade.ngrok-free.dev';

export interface DiseasePredictionResponse {
    disease: string;
    confidence: string;
    patient_response: string;
    doctor_report: string;
    refined_response?: string;
}

export interface MedicineAlternativeResponse {
    status: string;
    original_brand: string;
    alternatives: string[];
    message: string;
    refined_message?: string;
}

export const aiService = {
    /**
     * Predicts disease based on symptoms and refines with Backend AI.
     */
    async predictDisease(symptoms: string, language: string = 'english'): Promise<DiseasePredictionResponse> {
        try {
            // 1. Get raw prediction from Python/Ngrok backend
            const response = await axios.post(`${API_BASE_URL}/predict_disease`, {
                symptoms: symptoms
            });
            const data = response.data;

            // 2. Refine the raw backend response with Node.js Backend (which uses Gemini + Language)
            try {
                const refinedRes = await api.post('/ai/refine-symptom', {
                    disease: data.disease,
                    confidence: data.confidence,
                    originalPatientResponse: data.patient_response,
                    doctorReport: data.doctor_report,
                    language: language
                });

                if (refinedRes.data.refinedResponse) {
                    data.patient_response = refinedRes.data.refinedResponse;
                }

                // Also translate the doctor report if possible or ask backend to do it
                if (refinedRes.data.refinedReport) {
                    data.doctor_report = refinedRes.data.refinedReport;
                }

            } catch (refineError) {
                console.error('Refinement failed, using original:', refineError);
            }

            return data;
        } catch (error) {
            console.error('Error calling /predict_disease:', error);
            throw error;
        }
    },

    /**
     * Finds generic alternatives and refines with Backend AI.
     */
    async findGeneric(brandName: string, language: string = 'english'): Promise<MedicineAlternativeResponse> {
        try {
            // 1. Get raw alterantives from Python/Ngrok
            const response = await axios.post(`${API_BASE_URL}/find_generic`, {
                brand_name: brandName
            });
            const data = response.data;

            // 2. Refine with Node.js Backend
            try {
                const refinedRes = await api.post('/ai/refine-medicine', {
                    brandName: data.original_brand || brandName,
                    alternatives: data.alternatives || [],
                    originalMessage: data.message,
                    language: language
                });

                if (refinedRes.data.refinedResponse) {
                    data.message = refinedRes.data.refinedResponse;
                }
            } catch (refineError) {
                console.error('Refinement failed:', refineError);
            }

            return data;
        } catch (error) {
            console.error('Error calling /find_generic:', error);
            throw error;
        }
    }
};
