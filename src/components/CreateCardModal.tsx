'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Activity, 
  BarChart3, 
  Target, 
  TrendingUp, 
  Zap, 
  Package,
  Gauge,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { KPICardData } from '../types';
import styles from './CreateCardModal.module.css';

interface CreateCardModalProps {
  onClose: () => void;
  onCreate: (cardData: Omit<KPICardData, 'id' | 'position' | 'data'>) => void;
}

type CardType = 'coils' | 'tons' | 'shipped' | 'yield' | 'efficiency' | 'quality' | 'energy' | 'custom';

interface CardOption {
  type: CardType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const CreateCardModal: React.FC<CreateCardModalProps> = ({ onClose, onCreate }) => {
  const [selectedType, setSelectedType] = useState<CardType>('coils');
  const [customTitle, setCustomTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState<'select' | 'customize' | 'confirm'>('select');

  const cardOptions: CardOption[] = [
    {
      type: 'coils',
      title: 'Coils Production',
      description: 'Monitor coil production per hour with benchmarks',
      icon: <Activity size={24} />,
      color: '#4fc3f7'
    },
    {
      type: 'tons',
      title: 'Tons Production',
      description: 'Track steel tonnage production metrics',
      icon: <BarChart3 size={24} />,
      color: '#66bb6a'
    },
    {
      type: 'shipped',
      title: 'Coils Shipped',
      description: 'Monitor shipping performance and delivery rates',
      icon: <Target size={24} />,
      color: '#ff9800'
    },
    {
      type: 'yield',
      title: 'Production Yield',
      description: 'Track yield percentage and efficiency metrics',
      icon: <TrendingUp size={24} />,
      color: '#9c27b0'
    },
    {
      type: 'efficiency',
      title: 'Machine Efficiency',
      description: 'Monitor equipment efficiency and uptime',
      icon: <Gauge size={24} />,
      color: '#f44336'
    },
    {
      type: 'quality',
      title: 'Quality Score',
      description: 'Track product quality and defect rates',
      icon: <CheckCircle size={24} />,
      color: '#4caf50'
    },
    {
      type: 'energy',
      title: 'Energy Consumption',
      description: 'Monitor power usage and energy efficiency',
      icon: <Zap size={24} />,
      color: '#ffeb3b'
    },
    {
      type: 'custom',
      title: 'Custom Metric',
      description: 'Create a custom KPI card with your own title',
      icon: <Package size={24} />,
      color: '#607d8b'
    }
  ];

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const getSelectedOption = () => {
    return cardOptions.find(option => option.type === selectedType);
  };

  const handleNext = () => {
    if (step === 'select') {
      setStep('customize');
    } else if (step === 'customize') {
      setStep('confirm');
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('customize');
    } else if (step === 'customize') {
      setStep('select');
    }
  };

  const handleCreate = async () => {
    if (isCreating) return;

    setIsCreating(true);
    
    const selectedOption = getSelectedOption();
    if (!selectedOption) return;

    const title = selectedType === 'custom' && customTitle.trim() 
      ? customTitle.trim() 
      : selectedOption.title;

    try {
      // Simulate creation delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onCreate({
        title,
        type: selectedType
      });
    } catch (error) {
      console.error('Error creating card:', error);
      setIsCreating(false);
    }
  };

  const canProceed = () => {
    if (step === 'select') return true;
    if (step === 'customize') {
      return selectedType !== 'custom' || customTitle.trim().length > 0;
    }
    return true;
  };

  const renderStepContent = () => {
    const selectedOption = getSelectedOption();

    switch (step) {
      case 'select':
        return (
          <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>Choose KPI Type</h3>
            <p className={styles.stepDescription}>
              Select the type of KPI card you want to create for your dashboard.
            </p>
            
            <div className={styles.cardGrid}>
              {cardOptions.map((option) => (
                <button
                  key={option.type}
                  className={`${styles.cardOption} ${selectedType === option.type ? styles.selected : ''}`}
                  onClick={() => setSelectedType(option.type)}
                  style={{ '--option-color': option.color } as React.CSSProperties}
                >
                  <div className={styles.optionIcon}>
                    {option.icon}
                  </div>
                  <div className={styles.optionContent}>
                    <h4 className={styles.optionTitle}>{option.title}</h4>
                    <p className={styles.optionDescription}>{option.description}</p>
                  </div>
                  <div className={styles.selectionIndicator}>
                    {selectedType === option.type && <CheckCircle size={20} />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'customize':
        return (
          <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>Customize Your Card</h3>
            <p className={styles.stepDescription}>
              {selectedType === 'custom' 
                ? 'Enter a custom title for your KPI card.'
                : 'Review and customize your card settings.'}
            </p>

            <div className={styles.previewCard}>
              <div 
                className={styles.previewIcon}
                style={{ '--preview-color': selectedOption?.color } as React.CSSProperties}
              >
                {selectedOption?.icon}
              </div>
              <div className={styles.previewContent}>
                <h4 className={styles.previewTitle}>
                  {selectedType === 'custom' && customTitle.trim() 
                    ? customTitle.trim() 
                    : selectedOption?.title}
                </h4>
                <p className={styles.previewDescription}>
                  {selectedOption?.description}
                </p>
              </div>
            </div>

            {selectedType === 'custom' && (
              <div className={styles.customInput}>
                <label className={styles.inputLabel} htmlFor="customTitle">
                  Card Title
                </label>
                <input
                  id="customTitle"
                  type="text"
                  className={styles.textInput}
                  placeholder="Enter card title (e.g., Defect Rate, Temperature)"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  maxLength={50}
                  autoFocus
                />
                <div className={styles.inputHelper}>
                  {customTitle.length}/50 characters
                </div>
              </div>
            )}

            <div className={styles.featureList}>
              <h5 className={styles.featureTitle}>This card will include:</h5>
              <ul className={styles.features}>
                <li>Real-time data updates every 5 seconds</li>
                <li>Daily, weekly, and monthly views</li>
                <li>Performance benchmarks and targets</li>
                <li>Visual progress indicators</li>
                <li>Trend analysis with directional arrows</li>
              </ul>
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>Ready to Create</h3>
            <p className={styles.stepDescription}>
              Your new KPI card is ready to be added to the dashboard.
            </p>

            <div className={styles.confirmationCard}>
              <div 
                className={styles.confirmIcon}
                style={{ '--confirm-color': selectedOption?.color } as React.CSSProperties}
              >
                {selectedOption?.icon}
              </div>
              <div className={styles.confirmContent}>
                <h4 className={styles.confirmTitle}>
                  {selectedType === 'custom' && customTitle.trim() 
                    ? customTitle.trim() 
                    : selectedOption?.title}
                </h4>
                <div className={styles.confirmDetails}>
                  <div className={styles.confirmItem}>
                    <Calendar size={16} />
                    <span>Updates every 5 seconds</span>
                  </div>
                  <div className={styles.confirmItem}>
                    <Activity size={16} />
                    <span>Live performance tracking</span>
                  </div>
                  <div className={styles.confirmItem}>
                    <BarChart3 size={16} />
                    <span>Multi-period analysis</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className={styles.modalOverlay}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <h2 className={styles.modalTitle}>Create New KPI Card</h2>
            <div className={styles.stepIndicator}>
              <span className={styles.stepText}>
                Step {step === 'select' ? 1 : step === 'customize' ? 2 : 3} of 3
              </span>
            </div>
          </div>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            title="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ 
              width: step === 'select' ? '33%' : step === 'customize' ? '66%' : '100%' 
            }}
          />
        </div>

        <div className={styles.modalBody}>
          {renderStepContent()}
        </div>

        <div className={styles.modalFooter}>
          <div className={styles.footerActions}>
            {step !== 'select' && (
              <button 
                className={styles.backButton}
                onClick={handleBack}
                disabled={isCreating}
              >
                Back
              </button>
            )}
            
            <div className={styles.primaryActions}>
              <button 
                className={styles.cancelButton}
                onClick={onClose}
                disabled={isCreating}
              >
                Cancel
              </button>
              
              {step === 'confirm' ? (
                <button 
                  className={`${styles.createButton} ${isCreating ? styles.creating : ''}`}
                  onClick={handleCreate}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <div className={styles.spinner} />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Create Card
                    </>
                  )}
                </button>
              ) : (
                <button 
                  className={styles.nextButton}
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCardModal;