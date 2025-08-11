'use client';

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Activity, Target, BarChart3, ChevronUp, ChevronDown } from 'lucide-react';
import { KPICardData, TimePeriod, KPIDataPoint } from '../types';
import styles from './KPICard.module.css';

interface KPICardProps {
  card: KPICardData;
  period: TimePeriod;
  onDelete: (cardId: string) => void;
  isDragMode: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ 
  card, 
  period, 
  onDelete, 
  isDragMode,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false
}) => {
  const [currentData, setCurrentData] = useState<KPIDataPoint>(card.data);
  const [previousValue, setPreviousValue] = useState<number>(0);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');

  useEffect(() => {
    // Track previous value for trend calculation
    setPreviousValue(currentData.actual);
    setCurrentData(card.data);
    
    // Calculate trend
    if (card.data.actual > previousValue) {
      setTrend('up');
    } else if (card.data.actual < previousValue) {
      setTrend('down');
    } else {
      setTrend('stable');
    }
  }, [card.data]);

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'coils':
        return <Activity className={styles.cardIcon} />;
      case 'tons':
        return <BarChart3 className={styles.cardIcon} />;
      case 'shipped':
        return <Target className={styles.cardIcon} />;
      default:
        return <Activity className={styles.cardIcon} />;
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className={`${styles.trendIcon} ${styles.trendUp}`} />;
      case 'down':
        return <TrendingDown className={`${styles.trendIcon} ${styles.trendDown}`} />;
      default:
        return <Activity className={`${styles.trendIcon} ${styles.trendStable}`} />;
    }
  };

  const getPerformanceClass = (percentage: number) => {
    if (percentage >= 100) return styles.excellent;
    if (percentage >= 80) return styles.good;
    if (percentage >= 60) return styles.average;
    return styles.poor;
  };

  const formatValue = (value: number, type: string) => {
    if (type === 'tons') {
      return `${value.toFixed(1)} tons`;
    }
    return `${Math.round(value)} coils`;
  };

  const getPeriodMultiplier = (period: TimePeriod) => {
    switch (period) {
      case 'daily': return 24;
      case 'weekly': return 24 * 7;
      case 'monthly': return 24 * 30;
      default: return 24;
    }
  };

  const getPeriodLabel = (period: TimePeriod) => {
    switch (period) {
      case 'daily': return 'per Day';
      case 'weekly': return 'per Week';
      case 'monthly': return 'per Month';
      default: return 'per Day';
    }
  };

  const calculatePeriodValues = () => {
    const multiplier = getPeriodMultiplier(period);
    return {
      actual: currentData.actual * multiplier,
      benchmark: currentData.benchmark * multiplier,
      percentage: currentData.percentage
    };
  };

  const periodValues = calculatePeriodValues();

  return (
    <div className={`${styles.kpiCard} ${isDragMode ? styles.dragMode : ''}`}>
      {!isDragMode && (
        <button
          className={styles.deleteButton}
          onClick={() => onDelete(card.id)}
          title="Delete card"
        >
          <X size={16} />
        </button>
      )}

      {isDragMode && (
        <div className={styles.moveButtons}>
          <button
            className={`${styles.moveButton} ${!canMoveUp ? styles.disabled : ''}`}
            onClick={onMoveUp}
            disabled={!canMoveUp}
            title="Move up"
          >
            <ChevronUp size={16} />
          </button>
          <button
            className={`${styles.moveButton} ${!canMoveDown ? styles.disabled : ''}`}
            onClick={onMoveDown}
            disabled={!canMoveDown}
            title="Move down"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      )}

      <div className={styles.cardHeader}>
        <div className={styles.iconContainer}>
          {getCardIcon(card.type)}
        </div>
        <div className={styles.titleContainer}>
          <h3 className={styles.cardTitle}>{card.title}</h3>
          <span className={styles.periodLabel}>{getPeriodLabel(period)}</span>
        </div>
        <div className={styles.trendContainer}>
          {getTrendIcon()}
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.mainMetric}>
          <div className={styles.actualValue}>
            <span className={styles.value}>
              {formatValue(periodValues.actual, card.type)}
            </span>
            <span className={styles.label}>Actual</span>
          </div>
          
          <div className={styles.performanceIndicator}>
            <div 
              className={`${styles.performanceCircle} ${getPerformanceClass(periodValues.percentage)}`}
            >
              <span className={styles.percentage}>
                {Math.round(periodValues.percentage)}%
              </span>
            </div>
          </div>
        </div>

        <div className={styles.benchmarkSection}>
          <div className={styles.benchmarkItem}>
            <span className={styles.benchmarkLabel}>Benchmark</span>
            <span className={styles.benchmarkValue}>
              {formatValue(periodValues.benchmark, card.type)}
            </span>
          </div>
          
          <div className={styles.varianceItem}>
            <span className={styles.varianceLabel}>Variance</span>
            <span className={`${styles.varianceValue} ${
              periodValues.actual >= periodValues.benchmark ? styles.positive : styles.negative
            }`}>
              {periodValues.actual >= periodValues.benchmark ? '+' : ''}
              {formatValue(periodValues.actual - periodValues.benchmark, card.type)}
            </span>
          </div>
        </div>

        <div className={styles.progressBar}>
          <div 
            className={`${styles.progressFill} ${getPerformanceClass(periodValues.percentage)}`}
            style={{ width: `${Math.min(periodValues.percentage, 100)}%` }}
          >
            <div className={styles.progressGlow}></div>
          </div>
        </div>

        <div className={styles.hourlyRate}>
          <span className={styles.hourlyLabel}>Current Rate (per hour)</span>
          <div className={styles.hourlyValues}>
            <span className={styles.hourlyActual}>
              {formatValue(currentData.actual, card.type)}
            </span>
            <span className={styles.hourlySeparator}>|</span>
            <span className={styles.hourlyBenchmark}>
              Target: {formatValue(currentData.benchmark, card.type)}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.statusIndicator}>
          <div className={`${styles.statusDot} ${
            periodValues.percentage >= 100 ? styles.statusGreen :
            periodValues.percentage >= 80 ? styles.statusYellow :
            styles.statusRed
          }`}></div>
          <span className={styles.statusText}>
            {periodValues.percentage >= 100 ? 'Exceeding Target' :
             periodValues.percentage >= 80 ? 'On Track' :
             'Below Target'}
          </span>
        </div>
        
        <div className={styles.lastUpdated}>
          <span>Live Data</span>
        </div>
      </div>
    </div>
  );
};

export default KPICard;