const AI_BASE_URL = 'https://secernent-unremotely-wade.ngrok-free.dev';

export interface GenericAlternativeResponse {
    status: string;
    original_brand: string;
    alternatives: string[];
    message: string;
}

export const pharmacyService = {
    async findGenericAlternatives(brandName: string): Promise<GenericAlternativeResponse | null> {
        try {
            const response = await fetch(`${AI_BASE_URL}/find_generic`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ brand_name: brandName }),
            });

            if (!response.ok) {
                console.error('AI Service Error:', response.statusText);
                return null;
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to fetch generic alternatives:', error);
            return null;
        }
    }
};
