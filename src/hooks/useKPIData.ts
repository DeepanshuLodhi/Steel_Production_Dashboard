import { useState, useEffect, useCallback, useRef } from 'react';
import { KPICardData, KPIDataPoint, CardType, TimePeriod, AppError, LoadingState } from '../types';
import { cardService, analyticsService } from '../lib/firebase';
import { kpiDataGenerator, validationUtils, storageUtils } from '../lib/utils';

// Hook configuration
interface UseKPIDataConfig {
  refreshInterval?: number;  // Data refresh interval in milliseconds (default: 5000)
  enableLocalStorage?: boolean;  // Whether to use localStorage as fallback (default: true)
  enableAnalytics?: boolean;  // Whether to log analytics events (default: true)
  retryAttempts?: number;  // Number of retry attempts for failed operations (default: 3)
  retryDelay?: number;  // Delay between retry attempts in milliseconds (default: 1000)
}

// Interface for offline changes
interface OfflineChange {
  action: 'save' | 'create' | 'update' | 'delete';
  cards?: KPICardData[];
  cardId?: string;
  timestamp: string;
}

export const useKPIData = (config: UseKPIDataConfig = {}) => {
  const {
    refreshInterval = 5000,
    enableLocalStorage = true,
    enableAnalytics = true,
    retryAttempts = 3,
    retryDelay = 1000
  } = config;

  // State management
  const [cards, setCards] = useState<KPICardData[]>([]);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<AppError | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Refs for cleanup and persistence
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Local storage keys
  const STORAGE_KEYS = {
    CARDS: 'steel-dashboard-cards',
    LAST_SYNC: 'steel-dashboard-last-sync',
    OFFLINE_CHANGES: 'steel-dashboard-offline-changes'
  } as const;

  // Error handling utility
  const createError = useCallback((code: string, message: string, details?: any): AppError => ({
    code,
    message,
    details,
    timestamp: new Date(),
    severity: 'medium'
  }), []);

  // Generate KPI data with validation
  const generateKPIData = useCallback((type: CardType, period: TimePeriod): KPIDataPoint => {
    try {
      if (!validationUtils.isValidCardType(type)) {
        throw new Error(`Invalid card type: ${type}`);
      }
      if (!validationUtils.isValidPeriod(period)) {
        throw new Error(`Invalid period: ${period}`);
      }

      const data = kpiDataGenerator.generateKPIData(type, period);
      
      // Validate generated data
      if (!validationUtils.isValidKPIValue(data.actual) || 
          !validationUtils.isValidKPIValue(data.benchmark) || 
          !validationUtils.isValidKPIValue(data.percentage)) {
        throw new Error('Generated invalid KPI data');
      }

      return data;
    } catch (err) {
      console.error('Error generating KPI data:', err);
      // Return fallback data
      return {
        actual: 0,
        benchmark: 1,
        percentage: 0
      };
    }
  }, []);

  // Retry logic for failed operations
  const withRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    context: string,
    attempts: number = retryAttempts
  ): Promise<T> => {
    try {
      return await operation();
    } catch (err) {
      if (attempts > 1) {
        console.warn(`${context} failed, retrying in ${retryDelay}ms. Attempts remaining: ${attempts - 1}`);
        
        await new Promise(resolve => {
          retryTimeoutRef.current = setTimeout(resolve, retryDelay);
        });
        
        return withRetry(operation, context, attempts - 1);
      }
      throw err;
    }
  }, [retryAttempts, retryDelay]);

  // Save cards to Firebase with local storage fallback
  const saveCardsToFirebase = useCallback(async (cardsToSave: KPICardData[]): Promise<void> => {
    try {
      setLoading('loading');
      setError(null);

      // Validate cards data
      const validCards = cardsToSave.filter(card => 
        validationUtils.isValidCardTitle(card.title) && 
        validationUtils.isValidCardType(card.type)
      );

      if (validCards.length !== cardsToSave.length) {
        console.warn('Some cards were filtered out due to validation errors');
      }

      if (isOnline) {
        await withRetry(
          () => cardService.saveCards(validCards),
          'Save cards to Firebase'
        );
        
        setLastSyncTime(new Date());
        
        // Clear offline changes after successful sync
        if (enableLocalStorage) {
          storageUtils.remove(STORAGE_KEYS.OFFLINE_CHANGES);
        }

        // Log analytics event
        if (enableAnalytics) {
          analyticsService.logEvent('cards_saved', {
            cardCount: validCards.length,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        // Store changes for later sync when online
        if (enableLocalStorage) {
          const offlineChanges: OfflineChange[] = storageUtils.load(STORAGE_KEYS.OFFLINE_CHANGES, []);
          const newChange: OfflineChange = {
            action: 'save',
            cards: validCards,
            timestamp: new Date().toISOString()
          };
          offlineChanges.push(newChange);
          storageUtils.save(STORAGE_KEYS.OFFLINE_CHANGES, offlineChanges);
        }
      }

      // Always update local storage as backup
      if (enableLocalStorage) {
        storageUtils.save(STORAGE_KEYS.CARDS, validCards);
        storageUtils.save(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
      }

      setLoading('succeeded');
    } catch (err) {
      const error = createError(
        'SAVE_CARDS_ERROR',
        'Failed to save cards to database',
        { originalError: err, cardCount: cardsToSave.length }
      );
      setError(error);
      setLoading('failed');
      throw error;
    }
  }, [isOnline, enableLocalStorage, enableAnalytics, withRetry, createError]);

  // Load cards from Firebase with local storage fallback
  const loadCardsFromFirebase = useCallback(async (): Promise<KPICardData[]> => {
    try {
      setLoading('loading');
      setError(null);

      let loadedCards: KPICardData[] = [];

      if (isOnline) {
        loadedCards = await withRetry(
          () => cardService.loadCards(),
          'Load cards from Firebase'
        );
        
        setLastSyncTime(new Date());

        // Update local storage with fresh data
        if (enableLocalStorage) {
          storageUtils.save(STORAGE_KEYS.CARDS, loadedCards);
          storageUtils.save(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
        }
      } else if (enableLocalStorage) {
        // Fallback to local storage when offline
        loadedCards = storageUtils.load(STORAGE_KEYS.CARDS, []);
        console.info('Loaded cards from local storage (offline mode)');
      }

      // Generate current data for all loaded cards
      const cardsWithData = loadedCards.map(card => ({
        ...card,
        data: generateKPIData(card.type, 'daily') // Default to daily for initial load
      }));

      setCards(cardsWithData);
      setLoading('succeeded');

      // Log analytics event
      if (enableAnalytics && isOnline) {
        analyticsService.logEvent('cards_loaded', {
          cardCount: cardsWithData.length,
          timestamp: new Date().toISOString()
        });
      }

      return cardsWithData;
    } catch (err) {
      const error = createError(
        'LOAD_CARDS_ERROR',
        'Failed to load cards from database',
        { originalError: err }
      );
      setError(error);
      setLoading('failed');
      
      // Try to return local storage data as last resort
      if (enableLocalStorage) {
        const fallbackCards = storageUtils.load(STORAGE_KEYS.CARDS, []);
        if (fallbackCards.length > 0) {
          console.warn('Using local storage fallback data');
          const cardsWithData = fallbackCards.map((card: KPICardData) => ({
            ...card,
            data: generateKPIData(card.type, 'daily')
          }));
          setCards(cardsWithData);
          return cardsWithData;
        }
      }
      
      return [];
    }
  }, [isOnline, enableLocalStorage, enableAnalytics, withRetry, createError, generateKPIData]);

  // Create a new card
  const createCard = useCallback(async (cardData: Omit<KPICardData, 'id' | 'data'>): Promise<string> => {
    try {
      // Validate input
      if (!validationUtils.isValidCardTitle(cardData.title)) {
        throw new Error('Invalid card title');
      }
      if (!validationUtils.isValidCardType(cardData.type)) {
        throw new Error('Invalid card type');
      }

      const newCard: KPICardData = {
        id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...cardData,
        data: generateKPIData(cardData.type, 'daily')
      };

      // Add to local state immediately for optimistic updates
      setCards(prevCards => [...prevCards, newCard]);

      // Save to database
      if (isOnline) {
        await withRetry(
          () => cardService.createCard(cardData),
          'Create new card'
        );
      }

      // Log analytics event
      if (enableAnalytics) {
        analyticsService.logCardInteraction(newCard.id, 'created', {
          cardType: cardData.type,
          cardTitle: cardData.title
        });
      }

      return newCard.id;
    } catch (err) {
      const error = createError(
        'CREATE_CARD_ERROR',
        'Failed to create new card',
        { originalError: err, cardData }
      );
      setError(error);
      throw error;
    }
  }, [isOnline, generateKPIData, enableAnalytics, withRetry, createError]);

  // Update an existing card
  const updateCard = useCallback(async (cardId: string, updates: Partial<KPICardData>): Promise<void> => {
    try {
      // Update local state immediately
      setCards(prevCards => 
        prevCards.map(card => 
          card.id === cardId ? { ...card, ...updates } : card
        )
      );

      // Update in database
      if (isOnline) {
        if (updates.title) {
          await withRetry(
            () => cardService.updateCardTitle(cardId, updates.title!),
            'Update card title'
          );
        }
        if (updates.position !== undefined) {
          await withRetry(
            () => cardService.updateCardPosition(cardId, updates.position!),
            'Update card position'
          );
        }
      }

      // Log analytics event
      if (enableAnalytics) {
        analyticsService.logCardInteraction(cardId, 'updated', { updates });
      }
    } catch (err) {
      const error = createError(
        'UPDATE_CARD_ERROR',
        'Failed to update card',
        { originalError: err, cardId, updates }
      );
      setError(error);
      throw error;
    }
  }, [isOnline, enableAnalytics, withRetry, createError]);

  // Delete a card
  const deleteCard = useCallback(async (cardId: string): Promise<void> => {
    try {
      // Remove from local state immediately
      setCards(prevCards => prevCards.filter(card => card.id !== cardId));

      // Delete from database
      if (isOnline) {
        await withRetry(
          () => cardService.deleteCard(cardId),
          'Delete card'
        );
      }

      // Log analytics event
      if (enableAnalytics) {
        analyticsService.logCardInteraction(cardId, 'deleted');
      }
    } catch (err) {
      const error = createError(
        'DELETE_CARD_ERROR',
        'Failed to delete card',
        { originalError: err, cardId }
      );
      setError(error);
      throw error;
    }
  }, [isOnline, enableAnalytics, withRetry, createError]);

  // Refresh all card data
  const refreshData = useCallback(() => {
    setCards(prevCards => 
      prevCards.map(card => ({
        ...card,
        data: generateKPIData(card.type, 'daily')
      }))
    );
  }, [generateKPIData]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      
      // Sync offline changes when coming back online
      if (enableLocalStorage) {
        const offlineChanges: OfflineChange[] = storageUtils.load(STORAGE_KEYS.OFFLINE_CHANGES, []);
        if (offlineChanges.length > 0) {
          console.info(`Syncing ${offlineChanges.length} offline changes`);
          // Process offline changes (simplified implementation)
          offlineChanges.forEach((change: OfflineChange) => {
            if (change.action === 'save' && change.cards) {
              saveCardsToFirebase(change.cards).catch(console.error);
            }
          });
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial online status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enableLocalStorage, saveCardsToFirebase]);

  // Set up real-time data refresh
  useEffect(() => {
    refreshIntervalRef.current = setInterval(refreshData, refreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [refreshData, refreshInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Initialize data on mount (client-side only)
  useEffect(() => {
    // Skip if running on server
    if (typeof window === 'undefined') return;
    
    loadCardsFromFirebase().catch(console.error);
  }, [loadCardsFromFirebase]);

  return {
    // State
    cards,
    loading,
    error,
    isOnline,
    lastSyncTime,
    
    // Actions
    generateKPIData,
    saveCardsToFirebase,
    loadCardsFromFirebase,
    createCard,
    updateCard,
    deleteCard,
    refreshData,
    
    // Utilities
    clearError: useCallback(() => setError(null), []),
    retryLastOperation: useCallback(() => {
      if (error?.code === 'LOAD_CARDS_ERROR') {
        loadCardsFromFirebase();
      }
    }, [error, loadCardsFromFirebase])
  };
};