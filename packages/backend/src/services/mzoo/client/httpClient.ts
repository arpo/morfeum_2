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
 * Make a GET request to MZOO API
 */
export async function mzooGet<TResponse>(
  endpoint: string,
  apiKey: string
): Promise<MzooResponse<TResponse>> {
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
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
      data: data.data ?? data
    };
  } catch (error) {
    return {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Make a DELETE request to MZOO API
 */
export async function mzooDelete(
  endpoint: string,
  apiKey: string
): Promise<MzooResponse<void>> {
  try {
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return {
        status: response.status,
        error: `HTTP error! status: ${response.status}`
      };
    }
    
    return {
      status: HTTP_STATUS.OK,
      data: undefined
    };
  } catch (error) {
    return {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Make a PATCH request to MZOO API
 */
export async function mzooPatch<TRequest, TResponse>(
  endpoint: string,
  apiKey: string,
  body: TRequest
): Promise<MzooResponse<TResponse>> {
  try {
    const response = await fetch(endpoint, {
      method: 'PATCH',
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
      data: data.data ?? data
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
