import { useState, useCallback, useMemo, useEffect } from 'react';
import type { AppLogicReturn } from './types';

export function useAppLogic(): AppLogicReturn {
  // ALL STATE MANAGEMENT HERE
  const [backendMessage, setBackendMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // MZOO test data state
  const [testData, setTestData] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  
  // MZOO Gemini text generation state
  const [geminiPrompt, setGeminiPrompt] = useState('');
  const [geminiResponse, setGeminiResponse] = useState('');
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  
  // MZOO FAL Flux image generation state
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // ALL EVENT HANDLERS HERE
  const callBackend = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api');
      const text = await response.text();
      setBackendMessage(text);
    } catch (err) {
      const errorMessage = 'Error: Could not connect to backend.';
      setError(errorMessage);
      setBackendMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessage = useCallback(() => {
    setBackendMessage('');
    setError(null);
  }, []);

  const generateText = useCallback(async () => {
    if (!geminiPrompt.trim()) {
      setGeminiError('Please enter a prompt');
      return;
    }

    setGeminiLoading(true);
    setGeminiError(null);
    
    try {
      const response = await fetch('/api/gemini/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: geminiPrompt,
          model: 'gemini-2.5-flash'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setGeminiResponse(result.data.text);
    } catch (err) {
      const errorMessage = 'Error: Could not generate text from MZOO.';
      setGeminiError(errorMessage);
    } finally {
      setGeminiLoading(false);
    }
  }, [geminiPrompt]);

  const clearGeminiResponse = useCallback(() => {
    setGeminiResponse('');
    setGeminiError(null);
  }, []);

  const generateImage = useCallback(async () => {
    if (!imagePrompt.trim()) {
      setImageError('Please enter a prompt');
      return;
    }

    setImageLoading(true);
    setImageError(null);
    
    try {
      const response = await fetch('/api/fal-flux-srpo/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: imagePrompt,
          num_images: 1,
          image_size: 'landscape_16_9',
          acceleration: 'high'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setImageUrl(result.data.images[0].url);
    } catch (err) {
      const errorMessage = 'Error: Could not generate image from MZOO.';
      setImageError(errorMessage);
    } finally {
      setImageLoading(false);
    }
  }, [imagePrompt]);

  const clearImageResponse = useCallback(() => {
    setImageUrl('');
    setImageError(null);
  }, []);

  // Fetch test data on mount
  useEffect(() => {
    const fetchTestData = async () => {
      setTestLoading(true);
      setTestError(null);
      
      try {
        const response = await fetch('/api/test');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setTestData(result.data);
      } catch (err) {
        const errorMessage = 'Error: Could not fetch test data from MZOO.';
        setTestError(errorMessage);
      } finally {
        setTestLoading(false);
      }
    };

    fetchTestData();
  }, []);

  // ALL COMPUTED VALUES HERE
  const hasMessage = useMemo(() => {
    return backendMessage.length > 0;
  }, [backendMessage]);

  const displayMessage = useMemo(() => {
    if (error) return error;
    if (backendMessage) return `Backend says: ${backendMessage}`;
    return '';
  }, [backendMessage, error]);

  return {
    state: {
      backendMessage,
      loading,
      error,
      testData,
      testLoading,
      testError,
      geminiPrompt,
      geminiResponse,
      geminiLoading,
      geminiError,
      imagePrompt,
      imageUrl,
      imageLoading,
      imageError
    },
    handlers: {
      callBackend,
      clearMessage,
      setGeminiPrompt,
      generateText,
      clearGeminiResponse,
      setImagePrompt,
      generateImage,
      clearImageResponse
    },
    computed: {
      hasMessage,
      displayMessage
    }
  };
}
