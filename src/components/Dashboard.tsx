'use client';

import React, { useState, useEffect } from 'react';
import KPICard from './KPICard';
import Sidebar from './Sidebar';
import CreateCardModal from './CreateCardModal';
import { useKPIData } from '../hooks/useKPIData';
import { KPICardData, TimePeriod } from '../types';
import styles from './Dashboard.module.css';

const Dashboard: React.FC = () => {
  const [cards, setCards] = useState<KPICardData[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<TimePeriod>('daily');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInterchangeMode, setIsInterchangeMode] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const { generateKPIData, saveCardsToFirebase, loadCardsFromFirebase } = useKPIData();

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize default cards on component mount (client-side only)
  useEffect(() => {
    if (isClient) {
      initializeDefaultCards();
      loadSavedCards();
    }
  }, [isClient]);

  // Update KPI data every 5 seconds (client-side only)
  useEffect(() => {
    if (!isClient) return;
    
    const interval = setInterval(() => {
      updateAllCardData();
    }, 5000);

    return () => clearInterval(interval);
  }, [cards, currentPeriod, isClient]);

  const initializeDefaultCards = () => {
    const defaultCards: KPICardData[] = [
      {
        id: 'card-1',
        title: 'Coils Production',
        type: 'coils',
        data: generateKPIData('coils', currentPeriod),
        position: 0
      },
      {
        id: 'card-2', 
        title: 'Tons Production',
        type: 'tons',
        data: generateKPIData('tons', currentPeriod),
        position: 1
      },
      {
        id: 'card-3',
        title: 'Coils Shipped', 
        type: 'shipped',
        data: generateKPIData('shipped', currentPeriod),
        position: 2
      }
    ];

    setCards(defaultCards);
  };

  const loadSavedCards = async () => {
    try {
      const savedCards = await loadCardsFromFirebase();
      if (savedCards && savedCards.length > 0) {
        setCards(savedCards);
      }
    } catch (error) {
      console.error('Error loading saved cards:', error);
    }
  };

  const updateAllCardData = () => {
    setCards(prevCards => 
      prevCards.map(card => ({
        ...card,
        data: generateKPIData(card.type, currentPeriod)
      }))
    );
  };

  const handlePeriodChange = (period: TimePeriod) => {
    setCurrentPeriod(period);
    updateAllCardData();
  };

  const handleCreateCard = (cardData: Omit<KPICardData, 'id' | 'position' | 'data'>) => {
    const newCard: KPICardData = {
      id: `card-${Date.now()}`,
      position: cards.length,
      data: generateKPIData(cardData.type, currentPeriod),
      ...cardData
    };

    const updatedCards = [...cards, newCard];
    setCards(updatedCards);
    saveCardsToFirebase(updatedCards);
    setIsCreateModalOpen(false);
  };

  const handleDeleteCard = (cardId: string) => {
    const updatedCards = cards
      .filter(card => card.id !== cardId)
      .map((card, index) => ({ ...card, position: index }));
    
    setCards(updatedCards);
    saveCardsToFirebase(updatedCards);
  };

  const handleDragEnd = () => {
    // Simple reorder functionality without drag-drop library
    // This will be a basic reorder system
  };

  const moveCardUp = (cardId: string) => {
    if (!isInterchangeMode) return;
    
    const cardIndex = cards.findIndex(card => card.id === cardId);
    if (cardIndex > 0) {
      const newCards = [...cards];
      [newCards[cardIndex], newCards[cardIndex - 1]] = [newCards[cardIndex - 1], newCards[cardIndex]];
      
      // Update positions
      const updatedCards = newCards.map((card, index) => ({
        ...card,
        position: index
      }));
      
      setCards(updatedCards);
      saveCardsToFirebase(updatedCards);
    }
  };

  const moveCardDown = (cardId: string) => {
    if (!isInterchangeMode) return;
    
    const cardIndex = cards.findIndex(card => card.id === cardId);
    if (cardIndex < cards.length - 1) {
      const newCards = [...cards];
      [newCards[cardIndex], newCards[cardIndex + 1]] = [newCards[cardIndex + 1], newCards[cardIndex]];
      
      // Update positions
      const updatedCards = newCards.map((card, index) => ({
        ...card,
        position: index
      }));
      
      setCards(updatedCards);
      saveCardsToFirebase(updatedCards);
    }
  };

  const toggleInterchangeMode = () => {
    setIsInterchangeMode(!isInterchangeMode);
  };

  return (
    <div className={styles.dashboard}>
      <Sidebar
        onCreateCard={() => setIsCreateModalOpen(true)}
        onToggleInterchange={toggleInterchangeMode}
        isInterchangeMode={isInterchangeMode}
        currentPeriod={currentPeriod}
        onPeriodChange={handlePeriodChange}
      />

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1 className={styles.title}>Steel Production Dashboard</h1>
          <div className={styles.periodSelector}>
            <button
              className={`${styles.periodButton} ${currentPeriod === 'daily' ? styles.active : ''}`}
              onClick={() => handlePeriodChange('daily')}
            >
              Daily
            </button>
            <button
              className={`${styles.periodButton} ${currentPeriod === 'weekly' ? styles.active : ''}`}
              onClick={() => handlePeriodChange('weekly')}
            >
              Weekly
            </button>
            <button
              className={`${styles.periodButton} ${currentPeriod === 'monthly' ? styles.active : ''}`}
              onClick={() => handlePeriodChange('monthly')}
            >
              Monthly
            </button>
          </div>
        </header>

        {!isClient ? (
          <div className={styles.loadingState}>
            <h2>Loading Dashboard...</h2>
            <p>Initializing KPI cards and connecting to database.</p>
          </div>
        ) : (
          <>
            <div className={`${styles.cardsGrid} ${isInterchangeMode ? styles.interchangeMode : ''}`}>
              {cards
                .sort((a, b) => a.position - b.position)
                .map((card, index) => (
                  <div
                    key={card.id}
                    className={`${styles.cardWrapper}`}
                  >
                    <KPICard
                      card={card}
                      period={currentPeriod}
                      onDelete={handleDeleteCard}
                      isDragMode={isInterchangeMode}
                      onMoveUp={() => moveCardUp(card.id)}
                      onMoveDown={() => moveCardDown(card.id)}
                      canMoveUp={index > 0}
                      canMoveDown={index < cards.length - 1}
                    />
                  </div>
                ))}
            </div>

            {cards.length === 0 && (
              <div className={styles.emptyState}>
                <h2>No KPI Cards</h2>
                <p>Click the "Create" button in the sidebar to add your first KPI card.</p>
              </div>
            )}
          </>
        )}
      </main>

      {isCreateModalOpen && (
        <CreateCardModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateCard}
        />
      )}
    </div>
  );
};

export default Dashboard;