import { useState, useCallback, useEffect } from 'react';
import type { EntityGeneratorLogicReturn, EntitySeed } from './types';

export function useEntityGeneratorLogic(): EntityGeneratorLogicReturn {
  const [textPrompt, setTextPrompt] = useState('');
  const [generatedSeed, setGeneratedSeed] = useState<EntitySeed | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [samplePrompts, setSamplePrompts] = useState<string[]>([]);

  // Fetch sample prompts on mount
  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const response = await fetch('/api/mzoo/prompts/entity-samples');
        if (response.ok) {
          const result = await response.json();
          setSamplePrompts(result.data.samples);
        }
      } catch (err) {
        console.error('Failed to fetch sample prompts:', err);
      }
    };
    
    fetchSamples();
  }, []);

  const generateSeed = useCallback(async () => {
    if (!textPrompt.trim()) return;

    setLoading(true);
    setError(null);
    setGeneratedSeed(null);

    try {
      const response = await fetch('/api/mzoo/entity/generate-seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          textPrompt: textPrompt.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('=== SEED DATA ===');
      console.log('Seed Data:', result.data);
      console.log('================');
      
      // Set seed without image first
      setGeneratedSeed(result.data);
      setLoading(false);

      // Then generate image
      setImageLoading(true);
      try {
        const imageResponse = await fetch('/api/mzoo/entity/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            originalPrompt: result.data.originalPrompt || textPrompt.trim(),
            name: result.data.name,
            looks: result.data.looks,
            wearing: result.data.wearing,
            personality: result.data.personality,
            presence: result.data.presence,
            setting: result.data.setting
          })
        });

        if (imageResponse.ok) {
          const imageResult = await imageResponse.json();
          const imageUrl = imageResult.data.imageUrl;
          
          // Update seed with image URL
          setGeneratedSeed(prev => prev ? {
            ...prev,
            imageUrl
          } : null);
          
          // Then analyze the image
          setImageLoading(false);
          setAnalysisLoading(true);
          
          try {
            const analysisResponse = await fetch('/api/mzoo/entity/analyze-image', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                imageUrl,
                looks: result.data.looks,
                wearing: result.data.wearing
              })
            });
            
            if (analysisResponse.ok) {
              const analysisResult = await analysisResponse.json();
              const visualAnalysis = analysisResult.data;
              
              console.log('=== VISUAL ANALYSIS DATA ===');
              console.log('Visual Analysis:', visualAnalysis);
              console.log('===========================');
              
              // Update seed with visual analysis
              setGeneratedSeed(prev => prev ? {
                ...prev,
                visualAnalysis
              } : null);
              
              // Then enrich the profile
              setAnalysisLoading(false);
              setProfileLoading(true);
              
              try {
                const enrichResponse = await fetch('/api/mzoo/entity/enrich-profile', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    seedData: result.data,
                    visualAnalysis
                  })
                });
                
                if (enrichResponse.ok) {
                  const enrichResult = await enrichResponse.json();
                  
                  console.log('=== DEEP PROFILE DATA ===');
                  console.log('Deep Profile Data:', enrichResult.data);
                  console.log('========================');
                  
                  // Update seed with deep profile
                  setGeneratedSeed(prev => prev ? {
                    ...prev,
                    deepProfile: enrichResult.data
                  } : null);
                }
              } catch (enrichErr) {
                console.error('Failed to enrich profile:', enrichErr);
              } finally {
                setProfileLoading(false);
              }
            } else {
              setAnalysisLoading(false);
            }
          } catch (analysisErr) {
            console.error('Failed to analyze image:', analysisErr);
            setAnalysisLoading(false);
          }
        } else {
          setImageLoading(false);
        }
      } catch (imageErr) {
        console.error('Failed to generate image:', imageErr);
        setImageLoading(false);
      }
    } catch (err) {
      const errorMessage = 'Error: Could not generate entity seed.';
      setError(errorMessage);
      setLoading(false);
    }
  }, [textPrompt]);

  const shufflePrompt = useCallback(() => {
    if (samplePrompts.length > 0) {
      const randomIndex = Math.floor(Math.random() * samplePrompts.length);
      setTextPrompt(samplePrompts[randomIndex]);
    }
  }, [samplePrompts]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    state: {
      textPrompt,
      generatedSeed,
      loading,
      imageLoading,
      analysisLoading,
      profileLoading,
      error
    },
    handlers: {
      setTextPrompt,
      generateSeed,
      shufflePrompt,
      clearError
    }
  };
}
