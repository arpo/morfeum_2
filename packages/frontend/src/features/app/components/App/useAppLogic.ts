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
      testError
    },
    handlers: {
      callBackend,
      clearMessage
    },
    computed: {
      hasMessage,
      displayMessage
    }
  };
}
