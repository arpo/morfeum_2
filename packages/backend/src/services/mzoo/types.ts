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
  model?: string;
  candidates?: Array<{ content: { parts: Array<{ text: string }>; role: string }; finishReason: string; index: number }>;
  usage?: Record<string, unknown>;
}

export interface ImageGenerationResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
}

export interface DepthMapRequest {
  image_url: string;
  output_format?: 'png' | 'jpeg';
  high_quality?: boolean;
}

export interface DepthMapResponse {
  depth_map_url: string;
  depth_map_image: string | null;
  original_image_url: string;
  metadata: {
    output_format: string;
    high_quality: boolean;
    processing_time: number;
    model: string;
    timestamp: string;
  };
}

export interface ImageEditRequest {
  prompt: string;
  inputImage?: string;
  num_images?: number;
  image_size?: 'square_hd' | 'square' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9';
  guidance_scale?: number;
  output_format?: 'jpeg' | 'png';
  enable_safety_checker?: boolean;
}

export interface ImageEditResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  metadata: {
    prompt: string;
    image_size: string;
    guidance_scale: number;
    input_image_provided: boolean;
  };
}

export interface ImageUpscaleRequest {
  inputImage: string;
  upscale_mode?: 'factor' | 'resolution';
  upscale_factor?: 2 | 4;
  target_resolution?: '1080p' | '2k' | '4k';
  noise_scale?: number;
  output_format?: 'jpg' | 'png';
}

export interface ImageUpscaleResponse {
  image: {
    url: string;
    width: number;
    height: number;
  };
  metadata: {
    upscale_mode: string;
    upscale_factor: number;
    target_resolution: string;
    noise_scale: number;
    output_format: string;
  };
}
