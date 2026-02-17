'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

type FeedbackType = 'success' | 'danger' | 'neutral';

interface FeedbackContextType {
  triggerFeedback: (type: FeedbackType) => void;
  feedback: FeedbackType | null;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [feedback, setFeedback] = useState<FeedbackType | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerFeedback = useCallback((type: FeedbackType) => {
    if (type === 'neutral') return;
    
    // Clear existing timer if any
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Reset feedback first to allow re-triggering same type
    setFeedback(null);
    
    // Use a small delay to ensure the state change is picked up for animation
    setTimeout(() => {
      setFeedback(type);
      timerRef.current = setTimeout(() => {
        setFeedback(null);
      }, 800); // Duration of the flash effect
    }, 10);
  }, []);

  return (
    <FeedbackContext.Provider value={{ triggerFeedback, feedback }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    // Return a fallback so it doesn't crash if used outside provider
    return {
      triggerFeedback: () => {},
      feedback: null,
    };
  }
  return context;
}
