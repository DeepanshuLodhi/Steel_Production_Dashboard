import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  orderBy,
  query,
  Timestamp,
  FieldValue
} from 'firebase/firestore';
import { KPICardData } from '../types';

// Firebase configuration - Steel Production Dashboard
const firebaseConfig = {
  apiKey: "AIzaSyC3wKEjw8CP086b_JgyOexLOJ4wwD2OYkg",
  authDomain: "steel-311d5.firebaseapp.com",
  projectId: "steel-311d5",
  storageBucket: "steel-311d5.firebasestorage.app",
  messagingSenderId: "327560152960",
  appId: "1:327560152960:web:aa297387163e60f4286365"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Collection references
const COLLECTIONS = {
  CARDS: 'kpi_cards',
  SETTINGS: 'dashboard_settings',
  ANALYTICS: 'analytics_data'
} as const;

// Database interfaces
interface FirebaseKPICard extends Omit<KPICardData, 'data'> {
  createdAt?: FieldValue | Timestamp;
  updatedAt?: FieldValue | Timestamp;
  isActive?: boolean;
}

interface DashboardSettings {
  id: string;
  defaultPeriod: 'daily' | 'weekly' | 'monthly';
  refreshRate: number;
  theme: string;
  updatedAt?: FieldValue | Timestamp;
}

// Card Management Functions
export const cardService = {
  // Save all cards to Firebase
  async saveCards(cards: KPICardData[]): Promise<void> {
    try {
      const batch = cards.map(async (card) => {
        const cardRef = doc(db, COLLECTIONS.CARDS, card.id);
        const firebaseCard: FirebaseKPICard = {
          id: card.id,
          title: card.title,
          type: card.type,
          position: card.position,
          updatedAt: serverTimestamp(),
          isActive: true
        };
        
        return setDoc(cardRef, firebaseCard, { merge: true });
      });

      await Promise.all(batch);
      console.log('Cards saved successfully to Firebase');
    } catch (error) {
      console.error('Error saving cards to Firebase:', error);
      throw new Error('Failed to save cards to database');
    }
  },

  // Load all cards from Firebase
  async loadCards(): Promise<KPICardData[]> {
    try {
      const cardsRef = collection(db, COLLECTIONS.CARDS);
      const q = query(cardsRef, orderBy('position', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const cards: KPICardData[] = [];
      
      querySnapshot.forEach((doc) => {
        const firebaseCard = doc.data() as FirebaseKPICard;
        
        // Skip inactive cards
        if (firebaseCard.isActive === false) return;
        
        // Convert Firebase card to KPICardData
        const card: KPICardData = {
          id: firebaseCard.id,
          title: firebaseCard.title,
          type: firebaseCard.type,
          position: firebaseCard.position,
          // Data will be generated on the client side
          data: {
            actual: 0,
            benchmark: 0,
            percentage: 0
          }
        };
        
        cards.push(card);
      });

      console.log(`Loaded ${cards.length} cards from Firebase`);
      return cards;
    } catch (error) {
      console.error('Error loading cards from Firebase:', error);
      return [];
    }
  },

  // Create a new card
  async createCard(cardData: Omit<KPICardData, 'id' | 'data'>): Promise<string> {
    try {
      const cardId = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const cardRef = doc(db, COLLECTIONS.CARDS, cardId);
      
      const firebaseCard: FirebaseKPICard = {
        id: cardId,
        title: cardData.title,
        type: cardData.type,
        position: cardData.position,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      };
      
      await setDoc(cardRef, firebaseCard);
      console.log('Card created successfully:', cardId);
      return cardId;
    } catch (error) {
      console.error('Error creating card:', error);
      throw new Error('Failed to create card');
    }
  },

  // Update card position
  async updateCardPosition(cardId: string, newPosition: number): Promise<void> {
    try {
      const cardRef = doc(db, COLLECTIONS.CARDS, cardId);
      await updateDoc(cardRef, {
        position: newPosition,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating card position:', error);
      throw new Error('Failed to update card position');
    }
  },

  // Update card title
  async updateCardTitle(cardId: string, newTitle: string): Promise<void> {
    try {
      const cardRef = doc(db, COLLECTIONS.CARDS, cardId);
      await updateDoc(cardRef, {
        title: newTitle,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating card title:', error);
      throw new Error('Failed to update card title');
    }
  },

  // Delete card (soft delete)
  async deleteCard(cardId: string): Promise<void> {
    try {
      const cardRef = doc(db, COLLECTIONS.CARDS, cardId);
      await updateDoc(cardRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
      console.log('Card deleted successfully:', cardId);
    } catch (error) {
      console.error('Error deleting card:', error);
      throw new Error('Failed to delete card');
    }
  },

  // Permanently delete card
  async permanentlyDeleteCard(cardId: string): Promise<void> {
    try {
      const cardRef = doc(db, COLLECTIONS.CARDS, cardId);
      await deleteDoc(cardRef);
      console.log('Card permanently deleted:', cardId);
    } catch (error) {
      console.error('Error permanently deleting card:', error);
      throw new Error('Failed to permanently delete card');
    }
  },

  // Real-time listener for cards
  subscribeToCards(callback: (cards: KPICardData[]) => void): () => void {
    const cardsRef = collection(db, COLLECTIONS.CARDS);
    const q = query(cardsRef, orderBy('position', 'asc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const cards: KPICardData[] = [];
      
      querySnapshot.forEach((doc) => {
        const firebaseCard = doc.data() as FirebaseKPICard;
        
        if (firebaseCard.isActive === false) return;
        
        const card: KPICardData = {
          id: firebaseCard.id,
          title: firebaseCard.title,
          type: firebaseCard.type,
          position: firebaseCard.position,
          data: {
            actual: 0,
            benchmark: 0,
            percentage: 0
          }
        };
        
        cards.push(card);
      });
      
      callback(cards);
    }, (error) => {
      console.error('Error in cards subscription:', error);
    });
    
    return unsubscribe;
  }
};

// Settings Management
export const settingsService = {
  // Save dashboard settings
  async saveSettings(settings: Partial<DashboardSettings>): Promise<void> {
    try {
      const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'dashboard');
      const settingsData = {
        ...settings,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(settingsRef, settingsData, { merge: true });
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      throw new Error('Failed to save settings');
    }
  },

  // Load dashboard settings
  async loadSettings(): Promise<DashboardSettings | null> {
    try {
      const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'dashboard');
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        return settingsDoc.data() as DashboardSettings;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading settings:', error);
      return null;
    }
  }
};

// Analytics and Logging
export const analyticsService = {
  // Log dashboard events
  async logEvent(eventType: string, eventData: Record<string, any>): Promise<void> {
    try {
      const eventRef = doc(collection(db, COLLECTIONS.ANALYTICS));
      const analyticsData = {
        eventType,
        eventData,
        timestamp: serverTimestamp(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      };
      
      await setDoc(eventRef, analyticsData);
    } catch (error) {
      console.error('Error logging event:', error);
      // Don't throw error for analytics - it's not critical
    }
  },

  // Log card interactions
  async logCardInteraction(cardId: string, action: string, metadata?: Record<string, any>): Promise<void> {
    await this.logEvent('card_interaction', {
      cardId,
      action,
      metadata,
      timestamp: new Date().toISOString()
    });
  },

  // Log performance metrics
  async logPerformanceMetric(metricName: string, value: number, unit: string): Promise<void> {
    await this.logEvent('performance_metric', {
      metricName,
      value,
      unit,
      timestamp: new Date().toISOString()
    });
  }
};

// Utility functions
export const firebaseUtils = {
  // Check Firebase connection
  async testConnection(): Promise<boolean> {
    try {
      const testRef = doc(db, 'connection_test', 'test');
      await setDoc(testRef, { timestamp: serverTimestamp() });
      await deleteDoc(testRef);
      return true;
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      return false;
    }
  },

  // Get server timestamp
  getServerTimestamp() {
    return serverTimestamp();
  },

  // Convert Firestore timestamp to Date
  timestampToDate(timestamp: Timestamp): Date {
    return timestamp.toDate();
  },

  // Format timestamp for display
  formatTimestamp(timestamp: Timestamp): string {
    return timestamp.toDate().toLocaleString();
  }
};

// Export default app
export default app;