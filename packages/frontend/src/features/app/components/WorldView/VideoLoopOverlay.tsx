/**
 * VideoLoopOverlay Component
 * Renders video with seamless loop crossfade using two overlapping video elements
 * Uses requestAnimationFrame for precise timing control
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { VIDEO_LOOP_CONFIG } from '@/config';
import styles from './VideoLoopOverlay.module.css';

interface VideoLoopOverlayProps {
  videoUrl: string | null;
  isVisible: boolean;
  onFadeComplete?: () => void;
}

// Convert ms to seconds for lead time detection
const CROSSFADE_DURATION = VIDEO_LOOP_CONFIG.CROSSFADE_DURATION_MS / 1000;
const CSS_TRANSITION_DURATION = VIDEO_LOOP_CONFIG.CROSSFADE_DURATION_MS;

export function VideoLoopOverlay({ videoUrl, isVisible, onFadeComplete }: VideoLoopOverlayProps) {
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [activeVideo, setActiveVideo] = useState<'A' | 'B'>('A');
  const [isFading, setIsFading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Trigger crossfade to the other video
  const triggerCrossfade = useCallback(() => {
    if (isFading) return;
    
    setIsFading(true);

    // Get the other video element and start it
    const otherVideo = activeVideo === 'A' ? videoBRef.current : videoARef.current;
    
    if (otherVideo) {
      otherVideo.currentTime = 0;
      otherVideo.play().catch(() => {});
    }

    // After CSS transition completes, swap active video
    setTimeout(() => {
      const currentVideo = activeVideo === 'A' ? videoARef.current : videoBRef.current;
      if (currentVideo) {
        currentVideo.pause();
        currentVideo.currentTime = 0;
      }
      setActiveVideo(prev => prev === 'A' ? 'B' : 'A');
      setIsFading(false);
    }, CSS_TRANSITION_DURATION);
  }, [activeVideo, isFading]);

  // Poll video progress using requestAnimationFrame
  useEffect(() => {
    if (!isLoaded || !isVisible) return;

    const checkVideoProgress = () => {
      const video = activeVideo === 'A' ? videoARef.current : videoBRef.current;
      
      if (video && !isFading && video.duration && !isNaN(video.duration)) {
        const timeRemaining = video.duration - video.currentTime;
        
        // Trigger crossfade when approaching end
        if (timeRemaining <= CROSSFADE_DURATION && timeRemaining > 0) {
          triggerCrossfade();
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(checkVideoProgress);
    };
    
    animationFrameRef.current = requestAnimationFrame(checkVideoProgress);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [activeVideo, isFading, isLoaded, isVisible, triggerCrossfade]);

  // Handle video URL changes
  useEffect(() => {
    const videoA = videoARef.current;
    const videoB = videoBRef.current;

    if (!videoUrl || !videoA || !videoB) {
      setIsLoaded(false);
      return;
    }

    // Reset state
    setActiveVideo('A');
    setIsFading(false);
    setIsLoaded(false);

    // Load video in both elements
    videoA.src = videoUrl;
    videoB.src = videoUrl;
    videoA.load();
    videoB.load();

    // Start playing video A when ready
    const handleCanPlay = () => {
      setIsLoaded(true);
      videoA.play().then(() => {
        // Signal that video is playing and ready for overlay to fade out
        // Add small delay to let video stabilize
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('videoLoopReady'));
        }, 150);
      }).catch(() => {});
    };

    videoA.addEventListener('canplay', handleCanPlay, { once: true });

    return () => {
      videoA.removeEventListener('canplay', handleCanPlay);
    };
  }, [videoUrl]);

  // Handle video ended event as fallback (if crossfade timing missed)
  useEffect(() => {
    const videoA = videoARef.current;
    const videoB = videoBRef.current;

    if (!videoA || !videoB) return;

    const handleEndedA = () => {
      if (activeVideo === 'A' && !isFading) {
        triggerCrossfade();
      }
    };

    const handleEndedB = () => {
      if (activeVideo === 'B' && !isFading) {
        triggerCrossfade();
      }
    };

    videoA.addEventListener('ended', handleEndedA);
    videoB.addEventListener('ended', handleEndedB);

    return () => {
      videoA.removeEventListener('ended', handleEndedA);
      videoB.removeEventListener('ended', handleEndedB);
    };
  }, [activeVideo, isFading, triggerCrossfade]);

  // When not visible, immediately remove from DOM to eliminate all overhead
  // No fade-out transition - instant removal for better node transition performance
  if (!videoUrl || !isVisible) {
    return null;
  }

  return (
    <div 
      className={styles.container}
      data-component="video-loop-overlay"
    >
      <video
        ref={videoARef}
        className={`${styles.video} ${
          activeVideo === 'A' && !isFading ? styles.active : 
          activeVideo === 'A' && isFading ? styles.fadingOut :
          activeVideo === 'B' && isFading ? styles.fadingIn : styles.inactive
        }`}
        style={{ transitionDuration: `${CSS_TRANSITION_DURATION}ms` }}
        muted
        playsInline
        preload="auto"
      />
      <video
        ref={videoBRef}
        className={`${styles.video} ${
          activeVideo === 'B' && !isFading ? styles.active : 
          activeVideo === 'B' && isFading ? styles.fadingOut :
          activeVideo === 'A' && isFading ? styles.fadingIn : styles.inactive
        }`}
        style={{ transitionDuration: `${CSS_TRANSITION_DURATION}ms` }}
        muted
        playsInline
        preload="auto"
      />
    </div>
  );
}
