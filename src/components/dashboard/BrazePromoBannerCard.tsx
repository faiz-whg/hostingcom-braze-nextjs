/**
 * @file BrazePromoBannerCard.tsx
 * @description A client component that displays promotional banners from Braze Content Cards.
 * Includes caching mechanism to persist content across page reloads.
 */
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card as BrazeBaseCard, ContentCards } from '@braze/web-sdk';
import type { AppBrazeCard } from '@/types/braze'; // Import the shared type
import brazeService from '@/lib/services/braze';
import Image from 'next/image';
import BrazePromoBannerCardSkeleton from './BrazePromoBannerCardSkeleton';

// --- Custom Type Definitions for Braze Cards ---
// Remove local AppBrazeCard definition
// interface AppBrazeCard extends Omit<BrazeBaseCard, 'extras'> {
//   title?: string;
//   description?: string;
//   imageUrl?: string;
//   url?: string;
//   linkText?: string;
//   extras?: Record<string, string | number | boolean | null | undefined> & {
//     slot_target?: string;
//     count_down_hours?: string | number;
//     alt_text?: string;
//   };
// }
// --- End Custom Type Definitions ---


/**
 * @constant BRAZE_DATA_TIMEOUT_MS
 * @description Timeout in milliseconds to wait for Braze data before falling back.
 */
const BRAZE_DATA_TIMEOUT_MS = 3000;

/**
 * @interface BrazePromoBannerCardProps
 * @description Props for the BrazePromoBannerCard component
 */
interface BrazePromoBannerCardProps {
  slotId: string;
}

const BrazePromoBannerCard: React.FC<BrazePromoBannerCardProps> = ({ slotId }) => {
  // Store BrazeBaseCard objects from the SDK
  const [brazeSDKCards, setBrazeSDKCards] = useState<BrazeBaseCard[]>([]);
  const [currentCardIndexForDisplay, setCurrentCardIndexForDisplay] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showIncomingContent, setShowIncomingContent] = useState(false);
  const [displayedCountdown, setDisplayedCountdown] = useState<string>("");
  const [countdownParts, setCountdownParts] = useState<{ hours: string; minutes: string; seconds: string } | null>(null);
  const [isCountdownActive, setIsCountdownActive] = useState<boolean>(false);
  const [targetEndTimes, setTargetEndTimes] = useState<Record<string, number>>({});
  const [initialCountdownHoursMap, setInitialCountdownHoursMap] = useState<Record<string, number>>({});
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cardIdForCurrentCountdownPartsRef = useRef<string | undefined>(undefined);
  const dataFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Store the ID of the card for which an impression has been logged
  const loggedImpressionCardIdRef = useRef<string | null>(null);

  // Effect to handle initialization and subscription setup
  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      loggedImpressionCardIdRef.current = null;
      
      // Clear any existing timeouts
      if (dataFetchTimeoutRef.current) {
        clearTimeout(dataFetchTimeoutRef.current);
      }

      // Check for cached cards first
      const cachedBrazeSDKResult = brazeService.getCachedContentCards();
      const slotIdUnderscore = slotId.replace(/-/g, '_');
      
      if (cachedBrazeSDKResult?.cards?.length) {
        const filteredForSlot = (cachedBrazeSDKResult.cards as BrazeBaseCard[]).filter(
          (card) => (card.extras as { slot_target?: string })?.slot_target === slotId || 
                    (card.extras as { slot_target?: string })?.slot_target === slotIdUnderscore
        );
        
        if (filteredForSlot.length > 0 && isMounted) {
          console.log(`[BrazePromo '${slotId}'] Using cached cards:`, filteredForSlot.map(c => c.id));
          setBrazeSDKCards(filteredForSlot);
          setCurrentCardIndexForDisplay(0);
          setIsLoading(false);
          return;
        }
      }

      // Set a timeout to handle cases where Braze takes too long to initialize
      dataFetchTimeoutRef.current = setTimeout(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      }, BRAZE_DATA_TIMEOUT_MS);

      // Initialize Braze and subscribe to updates
      let unsubscribeId: string | undefined = undefined;
      
      try {
        let attempts = 0;
        while (!brazeService.isInitialized && attempts < 20) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!brazeService.isInitialized) {
          console.error('[BrazePromo] Braze service initialization timed out.');
          if (isMounted) setIsLoading(false);
          return;
        }

        // Only set up the subscription if we're still mounted
        if (isMounted) {
          // Store the subscription ID for cleanup
          unsubscribeId = brazeService.subscribeToContentCardsUpdates((contentCardsObject: ContentCards) => {
            if (!isMounted) return;
            
            const allCardsFromSDK = contentCardsObject.cards as BrazeBaseCard[];
            const filteredForSlot = allCardsFromSDK.filter(
              (card) => (card.extras as { slot_target?: string })?.slot_target === slotId || 
                        (card.extras as { slot_target?: string })?.slot_target === slotIdUnderscore
            );
            
            console.log(`[BrazePromo '${slotId}'] Received card update:`, filteredForSlot.map(c => c.id));

            setBrazeSDKCards(prevBanners => {
              const prevIds = new Set(prevBanners.map(b => b.id));
              const newIds = new Set(filteredForSlot.map(b => b.id));
              
              if (prevIds.size !== newIds.size || 
                  filteredForSlot.some(card => card.id && !prevIds.has(card.id)) || // Ensure card.id is checked
                  prevBanners.some(card => card.id && !newIds.has(card.id))) { // Ensure card.id is checked
                return filteredForSlot;
              }
              return prevBanners;
            });
            
            if (filteredForSlot.length > 0) {
              setCurrentCardIndexForDisplay(prev => 
                prev < filteredForSlot.length ? prev : 0
              );
            } else {
              // If no cards for the slot, reset index
              setCurrentCardIndexForDisplay(0);
            }
            
            setIsLoading(false);
          });

          // Return cleanup function
          return () => {
            isMounted = false;
            if (dataFetchTimeoutRef.current) {
              clearTimeout(dataFetchTimeoutRef.current);
            }
            if (unsubscribeId) {
              brazeService.unsubscribeFromContentCardsUpdates(unsubscribeId);
            }
          };
        }
      } catch (error) {
        console.error('[BrazePromo] Error during initialization or subscription:', error);
        if (isMounted) setIsLoading(false);
      }
    };

    initialize();

    // Cleanup function
    return () => {
      isMounted = false;
      if (dataFetchTimeoutRef.current) {
        clearTimeout(dataFetchTimeoutRef.current);
      }
    };
  }, [slotId]); // Only depend on slotId

  // THIS IS THE EFFECT IN QUESTION (around original line 133)
  // Update initialCountdownHoursMap when brazeSDKCards changes
  useEffect(() => {
    if (isLoading) return;
    
    const newMap: Record<string, number> = {};
    let shouldUpdate = false;
    
    brazeSDKCards.forEach(card => {
      const cardExtras = card.extras as { count_down_hours?: string | number };
      if (card?.id?.trim() && cardExtras?.count_down_hours != null) {
        const initialHours = parseInt(String(cardExtras.count_down_hours), 10);
        if (!isNaN(initialHours) && initialHours > 0) {
          // Ensure card.id is a string before using as key
          if (typeof card.id === 'string') {
            newMap[card.id] = initialHours;
            shouldUpdate = true;
          }
        }
      }
    });
    
    if (shouldUpdate) {
      setInitialCountdownHoursMap(prev => {
        const prevStr = JSON.stringify(prev);
        const newStr = JSON.stringify(newMap);
        return prevStr === newStr ? prev : newMap;
      });
    }
  }, [brazeSDKCards, isLoading]);
  
  // Memoize cardToDisplay to prevent unnecessary re-renders
  // cardToDisplay is now a BrazeBaseCard or undefined
  const cardToDisplay = React.useMemo<BrazeBaseCard | undefined>(() => {
    return brazeSDKCards[currentCardIndexForDisplay];
  }, [brazeSDKCards, currentCardIndexForDisplay]);

  // Autoplay slideshow logic
  useEffect(() => {
    if (brazeSDKCards.length <= 1 || isLoading || !cardToDisplay) {
      return;
    }

    const displayDurationConfig = (cardToDisplay.extras as { display_duration_ms?: number })?.display_duration_ms ?? 6000;
    const exitAnimationDuration = 1000;

    const slideshowTimer = setTimeout(() => {
      setIsTransitioning(true);
      
      setTimeout(() => {
        // Impression for the *next* card will be logged by its own effect when cardToDisplay changes.
        // No need to reset loggedImpressionCardIdRef.current here directly, the check against card ID handles it.
        setCurrentCardIndexForDisplay((prevIndex) => (prevIndex + 1) % brazeSDKCards.length);
        setIsTransitioning(false);
      }, exitAnimationDuration); 
    }, displayDurationConfig);

    return () => {
      clearTimeout(slideshowTimer);
    };
  }, [isLoading, brazeSDKCards, currentCardIndexForDisplay, cardToDisplay]); // Added cardToDisplay dependency

  // Effect to manage the animation states for incoming content
  useEffect(() => {
    if (!isLoading && !isTransitioning) {
      setShowIncomingContent(false);
      const rafTimer = requestAnimationFrame(() => {
        setShowIncomingContent(true);
      });
      return () => cancelAnimationFrame(rafTimer);
    } else if (isTransitioning) {
      setShowIncomingContent(false);
    }
  }, [isTransitioning, cardToDisplay, isLoading]);

  // Countdown Timer Logic
  useEffect(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setIsCountdownActive(false);
    setDisplayedCountdown("");
    setCountdownParts(null);

    if (cardToDisplay && typeof cardToDisplay.id === 'string' && cardToDisplay.id.trim() !== '') {
      const currentCardId = cardToDisplay.id;
      // cardToDisplay is BrazeBaseCard, extras are generic.
      const cardExtras = cardToDisplay.extras as { count_down_hours?: string | number };
      if (cardExtras && cardExtras.count_down_hours !== undefined && cardExtras.count_down_hours !== null) {
        const rawCountdownHours = cardExtras.count_down_hours;
        const hoursFromExtras = parseInt(String(rawCountdownHours), 10);

        if (!isNaN(hoursFromExtras) && hoursFromExtras > 0) {
          let cardSpecificTargetEndTime = targetEndTimes[currentCardId];

          if (!cardSpecificTargetEndTime) {
            const now = new Date();
            cardSpecificTargetEndTime = new Date(now.getTime() + hoursFromExtras * 60 * 60 * 1000).getTime();
            setTargetEndTimes(prev => ({ ...prev, [currentCardId]: cardSpecificTargetEndTime }));
          } 

          const updateDisplay = () => {
            if (!cardSpecificTargetEndTime) return;
            const now = new Date().getTime();
            const distance = cardSpecificTargetEndTime - now;

            if (distance < 0) {
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
              }
              setIsCountdownActive(false);
              setCountdownParts(null);
              setDisplayedCountdown("Ended");
              return;
            }
            const hoursLeft = Math.floor(distance / (1000 * 60 * 60));
            const minutesLeft = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const secondsLeft = Math.floor((distance % (1000 * 60)) / 1000);
            setCountdownParts({
              hours: String(hoursLeft).padStart(2, '0'),
              minutes: String(minutesLeft).padStart(2, '0'),
              seconds: String(secondsLeft).padStart(2, '0'),
            });
            setIsCountdownActive(true);
            setDisplayedCountdown("");
          };
          updateDisplay();
          countdownIntervalRef.current = setInterval(updateDisplay, 1000);
        } else {
          setIsCountdownActive(false);
          setCountdownParts(null);
        }
      } else {
        setIsCountdownActive(false);
        setCountdownParts(null);
      }
    } else {
      setIsCountdownActive(false);
      setCountdownParts(null);
    }
    if (cardToDisplay && typeof cardToDisplay.id === 'string' && cardToDisplay.id.trim() !== '' && cardToDisplay.extras && cardToDisplay.extras.count_down_hours !== undefined) {
      cardIdForCurrentCountdownPartsRef.current = cardToDisplay.id;
    } else {
      cardIdForCurrentCountdownPartsRef.current = undefined;
    }
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [cardToDisplay, initialCountdownHoursMap, targetEndTimes]);

  useEffect(() => {
    if (cardToDisplay && cardToDisplay.id && loggedImpressionCardIdRef.current !== cardToDisplay.id) {
      console.log(`[BrazePromo '${slotId}'] Logging impression for card ID: ${cardToDisplay.id}`);
      brazeService.logContentCardImpression(cardToDisplay);
      loggedImpressionCardIdRef.current = cardToDisplay.id;
    } else if (!cardToDisplay && loggedImpressionCardIdRef.current) {
      loggedImpressionCardIdRef.current = null;
    }
  }, [cardToDisplay, slotId]);

  // Properties for rendering, derived from cardToDisplay with type assertions
  // This approach helps if the linter struggles with direct casting to AppBrazeCard in JSX
  const title = cardToDisplay ? (cardToDisplay as any).title as string | undefined : undefined;
  const description = cardToDisplay ? (cardToDisplay as any).description as string | undefined : undefined;
  const imageUrl = cardToDisplay ? (cardToDisplay as any).imageUrl as string | undefined : undefined;
  const linkText = cardToDisplay ? (cardToDisplay as any).linkText as string | undefined : undefined;
  const clickUrl = cardToDisplay ? (cardToDisplay as any).url as string | undefined : undefined;

  const altText = cardToDisplay?.extras?.alt_text as string | undefined || 'Promotional image';
  // const countDownHours = cardToDisplay?.extras?.count_down_hours as string | number | undefined; // Already handled in countdown effect
  // const displayDurationMs = cardToDisplay?.extras?.display_duration_ms as number | undefined ?? 6000; // Already handled in autoplay effect

  const handleCardClick = () => {
    if (!cardToDisplay || !cardToDisplay.id || !clickUrl) return;
    
    window.open(clickUrl, '_blank');
    brazeService.logContentCardClick(cardToDisplay);
  };

  // renderableCardData can still be useful for id or other direct AppBrazeCard specific logic if any.
  const renderableCardData = cardToDisplay as AppBrazeCard | undefined;

  const exitAnimationDuration = 1000; // This was defined after imageUrl, moved it here for grouping constants

  const handleNext = () => {
    if (isTransitioning || brazeSDKCards.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentCardIndexForDisplay((prevIndex) =>
        prevIndex === brazeSDKCards.length - 1 ? 0 : prevIndex + 1
      );
      setIsTransitioning(false);
    }, exitAnimationDuration);
  };

  const handlePrev = () => {
    if (isTransitioning || brazeSDKCards.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentCardIndexForDisplay((prevIndex) =>
        prevIndex === 0 ? brazeSDKCards.length - 1 : prevIndex - 1
      );
      setIsTransitioning(false);
    }, exitAnimationDuration);
  };

  if (isLoading && !cardToDisplay) {
    return <BrazePromoBannerCardSkeleton />;
  }
  
  const easingClass = "ease-[cubic-bezier(0.18,1.25,0.4,1.1)]";
  let animationContainerClasses = "absolute inset-0 flex transition-all";

  if (isTransitioning) {
    animationContainerClasses += ` duration-1000 ${easingClass} opacity-0 -translate-y-full`;
  } else {
    animationContainerClasses += ` duration-700 ${easingClass}`;
    if (showIncomingContent) {
      animationContainerClasses += " opacity-100 translate-y-0";
    } else {
      // Initial state of entrance animation (hidden, further below)
      animationContainerClasses += " opacity-0 translate-y-6"; // 24px down
    }
  }

  return (
    <div 
      className="relative flex h-[160px] w-full rounded-lg shadow-md overflow-hidden bg-gradient-to-br from-[#46fdae] to-[#c6fb4b] cursor-pointer"
      onClick={!cardToDisplay || !clickUrl ? undefined : handleCardClick}
    >
      <div className="h-full aspect-square bg-white/40 flex-shrink-0"></div>

      {cardToDisplay && brazeSDKCards.length > 1 && (
        <div className="absolute top-2 right-2 flex space-x-1 z-20">
          <button 
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm hover:shadow transition-all duration-200 hover:scale-105"
            aria-label="Previous slide"
            disabled={isTransitioning}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm hover:shadow transition-all duration-200 hover:scale-105"
            aria-label="Next slide"
            disabled={isTransitioning}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}

      <div
        key={cardToDisplay ? cardToDisplay.id : 'no-card-state'}
        className={animationContainerClasses}
      >
        {!cardToDisplay ? (
          <div className="w-full h-full flex items-center justify-center p-4">
            <p className="text-lg font-medium">No promotional offers available.</p>
          </div>
        ) : (
          <div className="flex w-full h-full">
            <div className="h-full aspect-square flex items-center justify-center flex-shrink-0">
              {imageUrl ? (
                <div className="w-[calc(100%-16px)] h-[calc(100%-16px)] relative">
                  <Image
                    src={imageUrl}
                    alt={altText}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain"
                    priority={currentCardIndexForDisplay === 0 && !isTransitioning}
                  />
                </div>
              ) : (
                <svg className="w-12 h-12 stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 22v-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>

            <div className="flex-1 p-4 flex flex-col justify-between items-start min-w-0">
              <div className="min-w-0">
                {title && 
                  <h3 className="text-lg font-medium mb-1 truncate">
                    {title}
                  </h3>}
                {description &&
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {description}
                  </p>}
              </div>
              {linkText && (
                <div className="mt-auto pt-2 flex items-center self-stretch"> 
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleCardClick(); }} 
                    className="group relative inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-[#2e4a45] rounded-lg hover:bg-[#253c37] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#253c37] overflow-hidden"
                  >
                    {linkText || 'Learn More'}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-1.5 transform transition-transform duration-200 ease-in-out group-hover:translate-x-1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                  <AnimatePresence mode="wait">
                    {isCountdownActive && countdownParts && cardToDisplay && cardToDisplay.id && (
                      <motion.div 
                        key={`countdown-block-${cardToDisplay.id}`}
                        className="ml-3 flex items-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        {(() => {
                          let initialTotalHoursForCurrentCardDisplay: number | undefined;
                          const cardExtras = cardToDisplay.extras as { count_down_hours?: string | number} | undefined;
                          if (cardExtras && (cardExtras.count_down_hours !== undefined && cardExtras.count_down_hours !== null)) {
                            const parsedHours = parseInt(String(cardExtras.count_down_hours), 10);
                            if (!isNaN(parsedHours) && parsedHours > 0) {
                              initialTotalHoursForCurrentCardDisplay = parsedHours;
                            }
                          }
                          if (initialTotalHoursForCurrentCardDisplay === undefined && cardToDisplay.id && typeof cardToDisplay.id === 'string') {
                            initialTotalHoursForCurrentCardDisplay = initialCountdownHoursMap[cardToDisplay.id];
                          }
                          let currentHourValue = parseInt(countdownParts.hours, 10);
                          if (cardIdForCurrentCountdownPartsRef.current !== cardToDisplay.id) {
                            if (initialTotalHoursForCurrentCardDisplay !== undefined && !isNaN(initialTotalHoursForCurrentCardDisplay)) {
                              currentHourValue = initialTotalHoursForCurrentCardDisplay;
                            }
                          }
                          const denominator = initialTotalHoursForCurrentCardDisplay && initialTotalHoursForCurrentCardDisplay > 0 
                                              ? initialTotalHoursForCurrentCardDisplay 
                                              : Math.max(1, currentHourValue);
                          const calculatedPercentage = denominator > 0 ? (currentHourValue / denominator) * 100 : 0;
                          return (
                            <CircularProgress
                              key={`hours-progress-${cardToDisplay.id}`}
                              value={countdownParts.hours}
                              percentage={calculatedPercentage}
                              size={36} 
                              strokeWidth={2.5}
                              textSize="text-[10px]"
                            />
                          );
                        })()}
                        <span className="mx-0.5 font-medium text-[#2e4a45] text-sm">:</span>
                        <CircularProgress 
                          key={`minutes-progress-${cardToDisplay.id}`}
                          value={countdownParts.minutes}
                          percentage={(parseInt(countdownParts.minutes, 10) / 59) * 100}
                          size={36}
                          strokeWidth={2.5}
                          textSize="text-[10px]"
                        />
                        <span className="mx-0.5 font-medium text-[#2e4a45] text-sm">:</span>
                        <CircularProgress 
                          key={`seconds-progress-${cardToDisplay.id}`}
                          value={countdownParts.seconds}
                          percentage={(parseInt(countdownParts.seconds, 10) / 59) * 100}
                          size={36}
                          strokeWidth={2.5}
                          textSize="text-[10px]"
                        />
                      </motion.div>
                    )}
                    {isCountdownActive && !countdownParts && displayedCountdown === "Ended" && (
                      <motion.span 
                        key="countdown-ended"
                        className="ml-3 text-sm font-medium text-[#2e4a45]"
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                      >
                        {displayedCountdown}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface CircularProgressProps {
  percentage: number;
  value: string;
  size?: number;
  strokeWidth?: number;
  baseColor?: string;
  progressColor?: string;
  textColor?: string;
  textSize?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  value,
  size = 40,
  strokeWidth = 3,
  baseColor = '#e0e0e0',
  progressColor = '#2e4a45',
  textColor = '#2e4a45',
  textSize = 'text-xs'
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedPercentage = Math.max(0, Math.min(100, percentage));
  const offset = circumference - (normalizedPercentage / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center mx-1">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={baseColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: "linear" }}
        />
      </svg>
      <span className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-medium ${textSize}`} style={{ color: textColor }}>
        {value}
      </span>
    </div>
  );
};

export default BrazePromoBannerCard;