/**
 * MZOO Service Types
 */

export interface MzooResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Type guard to check if MZOO response has data
 */
export function hasMzooData<T>(response: MzooResponse<T>): response is MzooResponse<T> & { data: T } {
  return response.data !== undefined && response.error === undefined;
}

export interface TextGenerationRequest {
  prompt: string;
  model: string;
}

export interface VisionAnalysisRequest {
  model: string;
  prompt: string;
  image: {
    mimeType: string;
    data: string;
  };
}

export interface ImageGenerationRequest {
  prompt: string;
  num_images: number;
  image_size: string;
  acceleration: string;
}

export interface TextGenerationResponse {
  text: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface VisionAnalysisResponse {
  text: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface ImageGenerationResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
}
