/**
 * ViewSlider Component
 * Carousel for browsing multiple views/images of a node
 * Swipe left = older views, swipe right = newer views
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { IconChevronLeft, IconChevronRight } from '@/icons';
import styles from './ViewSlider.module.css';

interface MediaItem {
  id: string;
  url: string;
  createdAt: string;
  metadata?: {
    prompt?: string;
    [key: string]: any;
  };
}

interface ViewSliderProps {
  views: MediaItem[];
  currentViewId: string | null;
  onViewChange: (mediaId: string) => void;
  onLoad?: () => void;
  alt?: string;
}

export function ViewSlider({ 
  views, 
  currentViewId, 
  onViewChange, 
  onLoad,
  alt = 'View' 
}: ViewSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  // Sort views by createdAt (oldest first, so index 0 = oldest)
  const sortedViews = [...views].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Find current view index
  const currentIndex = sortedViews.findIndex(v => v.id === currentViewId);
  const safeIndex = currentIndex >= 0 ? currentIndex : sortedViews.length - 1;

  // Get current view
  const currentView = sortedViews[safeIndex];

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && safeIndex > 0) {
      // Swipe left = go to older (lower index)
      onViewChange(sortedViews[safeIndex - 1].id);
    } else if (isRightSwipe && safeIndex < sortedViews.length - 1) {
      // Swipe right = go to newer (higher index)
      onViewChange(sortedViews[safeIndex + 1].id);
    }
  };

  const goToPrevious = useCallback(() => {
    if (safeIndex > 0) {
      onViewChange(sortedViews[safeIndex - 1].id);
    }
  }, [safeIndex, sortedViews, onViewChange]);

  const goToNext = useCallback(() => {
    if (safeIndex < sortedViews.length - 1) {
      onViewChange(sortedViews[safeIndex + 1].id);
    }
  }, [safeIndex, sortedViews, onViewChange]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext]);

  // Reset loading state when view changes
  useEffect(() => {
    setImageLoading(true);
  }, [currentViewId]);

  const handleImageLoad = () => {
    setImageLoading(false);
    onLoad?.();
  };

  // If no views, show nothing
  if (sortedViews.length === 0 || !currentView) {
    return null;
  }

  // Single view - no slider UI needed
  if (sortedViews.length === 1) {
    return (
      <div className={styles.singleView}>
        {imageLoading && (
          <div className={styles.skeleton}>
            <div className={styles.skeletonBreathing} />
          </div>
        )}
        <img 
          src={currentView.url} 
          alt={alt}
          className={styles.image}
          onLoad={handleImageLoad}
          style={{ opacity: imageLoading ? 0 : 1 }}
        />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={styles.container}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-component="view-slider"
    >
      {/* Image */}
      {imageLoading && (
        <div className={styles.skeleton}>
          <div className={styles.skeletonBreathing} />
        </div>
      )}
      <img 
        src={currentView.url} 
        alt={alt}
        className={styles.image}
        onLoad={handleImageLoad}
        style={{ opacity: imageLoading ? 0 : 1 }}
      />

      {/* Arrow buttons */}
      {safeIndex > 0 && (
        <button 
          className={`${styles.arrowButton} ${styles.arrowLeft}`}
          onClick={goToPrevious}
          title="Previous view (older)"
        >
          <IconChevronLeft size={24} />
        </button>
      )}
      {safeIndex < sortedViews.length - 1 && (
        <button 
          className={`${styles.arrowButton} ${styles.arrowRight}`}
          onClick={goToNext}
          title="Next view (newer)"
        >
          <IconChevronRight size={24} />
        </button>
      )}

      {/* Dot indicators */}
      <div className={styles.dots}>
        {sortedViews.map((view, index) => (
          <button
            key={view.id}
            className={`${styles.dot} ${index === safeIndex ? styles.dotActive : ''}`}
            onClick={() => onViewChange(view.id)}
            title={`View ${index + 1} of ${sortedViews.length}`}
          />
        ))}
      </div>
    </div>
  );
}
