/**
 * Voice Input Hook
 * Handles speech recognition using the browser's built-in Web Speech API
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export type VoiceInputState = 'idle' | 'listening' | 'processing';

export interface UseVoiceInputOptions {
  /** Language for speech recognition (default: 'en-US') */
  lang?: string;
  /** Callback when transcription is complete */
  onTranscript?: (text: string) => void;
  /** Callback for interim (partial) results */
  onInterimResult?: (text: string) => void;
  /** Callback when an error occurs */
  onError?: (error: string) => void;
}

export interface UseVoiceInputReturn {
  /** Current state of voice input */
  state: VoiceInputState;
  /** Whether currently listening */
  isListening: boolean;
  /** Whether speech recognition is supported */
  isSupported: boolean;
  /** Start listening for speech */
  startListening: () => void;
  /** Stop listening and get final result */
  stopListening: () => void;
  /** Last error message */
  error: string | null;
  /** Clear error */
  clearError: () => void;
  /** Current interim transcript (partial) */
  interimTranscript: string;
}

/**
 * Hook for voice input using browser's Web Speech API
 */
export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const { lang = 'en-US', onTranscript, onInterimResult, onError } = options;
  
  const [state, setState] = useState<VoiceInputState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check if Web Speech API is supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  /**
   * Start listening for speech
   */
  const startListening = useCallback(() => {
    if (state !== 'idle') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      const message = 'Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari.';
      setError(message);
      onError?.(message);
      return;
    }

    try {
      setError(null);
      setInterimTranscript('');

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onstart = () => {
        setState('listening');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimText += transcript;
          }
        }

        // Update interim transcript for UI feedback
        if (interimText) {
          setInterimTranscript(interimText);
          onInterimResult?.(interimText);
        }

        // If we have a final result, deliver it
        if (finalTranscript) {
          setInterimTranscript('');
          onTranscript?.(finalTranscript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        let message: string;
        
        switch (event.error) {
          case 'not-allowed':
            message = 'Microphone access denied. Please allow microphone access in your browser settings.';
            break;
          case 'no-speech':
            message = 'No speech detected. Please try again.';
            break;
          case 'network':
            message = 'Network error. Speech recognition requires an internet connection.';
            break;
          case 'aborted':
            // User aborted, not an error
            return;
          default:
            message = `Speech recognition error: ${event.error}`;
        }
        
        setError(message);
        onError?.(message);
        setState('idle');
      };

      recognition.onend = () => {
        setState('idle');
        recognitionRef.current = null;
      };

      recognition.start();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start speech recognition';
      setError(message);
      onError?.(message);
      setState('idle');
    }
  }, [state, lang, onTranscript, onInterimResult, onError]);

  /**
   * Stop listening for speech
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current && state === 'listening') {
      recognitionRef.current.stop();
    }
  }, [state]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    state,
    isListening: state === 'listening',
    isSupported,
    startListening,
    stopListening,
    error,
    clearError,
    interimTranscript
  };
}
