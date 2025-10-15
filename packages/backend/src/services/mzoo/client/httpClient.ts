/**
 * MZOO HTTP Client
 * Shared HTTP client for all MZOO API requests
 */

import { HTTP_STATUS } from '../../../config';
import { MzooResponse } from '../types';

/**
 * Make a POST request to MZOO API
 */
export async function mzooPost<TRequest, TResponse>(
  endpoint: string,
  apiKey: string,
  body: TRequest
): Promise<MzooResponse<TResponse>> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
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
  } catch (error) {
    return {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Handle common response patterns from MZOO API
 */
export function handleMzooResponse<T>(response: MzooResponse<T>): MzooResponse<T> {
  if (response.error) {
    return response;
  }
  
  if (!response.data) {
    return {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error: 'No data returned from API'
    };
  }
  
  return response;
}
