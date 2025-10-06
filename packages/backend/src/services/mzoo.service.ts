/**
 * MZOO API service layer
 */

import { HTTP_STATUS } from '../config';

interface MzooResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Generate text using MZOO Gemini API
 */
export const generateText = async (
  apiKey: string,
  messages: any[],
  model: string = 'gemini-2.5-flash'
): Promise<MzooResponse> => {
  // Format messages array into a single prompt with conversation history
  const prompt = messages.map((msg: any) => {
    const role = msg.role === 'system' ? 'System' : msg.role === 'user' ? 'User' : 'Assistant';
    return `${role}: ${msg.content}`;
  }).join('\n\n');

  const response = await fetch('https://www.mzoo.app/api/v1/ai/gemini/text', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      model
    })
  });
  
  if (!response.ok) {
    return {
      status: response.status,
      error: `HTTP error! status: ${response.status}`
    };
  }
  
  const data = await response.json();
  return {
    status: HTTP_STATUS.OK,
    data: data.data
  };
};

/**
 * Analyze image using MZOO Vision API
 */
export const analyzeImage = async (
  apiKey: string,
  base64Image: string,
  mimeType: string = 'image/png',
  model: string = 'gemini-2.5-flash'
): Promise<MzooResponse> => {
  const response = await fetch('https://www.mzoo.app/api/v1/ai/vision', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      image: {
        mimeType,
        data: base64Image
      }
    })
  });
  
  if (!response.ok) {
    return {
      status: response.status,
      error: `HTTP error! status: ${response.status}`
    };
  }
  
  const data = await response.json();
  return {
    status: HTTP_STATUS.OK,
    data: data.data
  };
};

/**
 * Generate image using MZOO FAL Flux API
 */
export const generateImage = async (
  apiKey: string,
  prompt: string,
  num_images: number = 1,
  image_size: string = 'landscape_16_9',
  acceleration: string = 'high'
): Promise<MzooResponse> => {
  const response = await fetch('https://www.mzoo.app/api/v1/ai/fal-flux-srpo/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      num_images,
      image_size,
      acceleration
    })
  });
  
  if (!response.ok) {
    return {
      status: response.status,
      error: `HTTP error! status: ${response.status}`
    };
  }
  
  const data = await response.json();
  return {
    status: HTTP_STATUS.OK,
    data: data.data
  };
};
