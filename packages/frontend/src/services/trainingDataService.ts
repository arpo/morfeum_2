/**
 * Training Data Service
 * Handles saving image/text pairs for AI model training (LORA)
 */

interface SaveTrainingDataParams {
  imageUrl: string;
  text: string;
  name: string;
}

interface SaveTrainingDataResponse {
  success: boolean;
  files?: {
    image: string;
    text: string;
  };
  error?: string;
}

/**
 * Save training data pair (image + text) to the training-data folder
 */
export async function saveTrainingData(params: SaveTrainingDataParams): Promise<SaveTrainingDataResponse> {
  const response = await fetch('/api/training-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  return response.json();
}
