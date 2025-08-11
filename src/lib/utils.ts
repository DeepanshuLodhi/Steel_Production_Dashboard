import { TimePeriod, KPIDataPoint, CardType } from '../types';

// Random number generation utilities
export const randomUtils = {
  // Generate random number between min and max (inclusive)
  between(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Generate random decimal between min and max
  betweenDecimal(min: number, max: number, decimals: number = 1): number {
    const random = Math.random() * (max - min) + min;
    return Number(random.toFixed(decimals));
  },

  // Generate random number with normal distribution
  normalDistribution(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + stdDev * z0;
  },

  // Generate random number with slight bias towards a target
  biasedRandom(min: number, max: number, target: number, bias: number = 0.3): number {
    const random1 = Math.random() * (max - min) + min;
    const random2 = Math.random() * (max - min) + min;
    return Math.round(random1 * (1 - bias) + target * bias);
  }
};

// Steel production specific calculations
export const steelProductionUtils = {
  // Generate coils per hour (base metric)
  generateCoilsPerHour(): number {
    return randomUtils.between(10, 15);
  },

  // Generate benchmark for coils
  generateCoilsBenchmark(): number {
    return randomUtils.between(12, 20);
  },

  // Generate weight per coil in tons
  generateCoilWeight(): number {
    return randomUtils.betweenDecimal(15, 30, 1);
  },

  // Calculate tons per hour based on coils and weight
  calculateTonsPerHour(coilsPerHour: number, weightPerCoil: number): number {
    return Number((coilsPerHour * weightPerCoil).toFixed(1));
  },

  // Generate tons benchmark based on industry standards
  generateTonsBenchmark(): number {
    // Steel plants typically produce 200-600 tons per hour
    return randomUtils.between(250, 500);
  },

  // Generate coils shipped per hour
  generateCoilsShipped(): number {
    return randomUtils.between(8, 14);
  },

  // Generate benchmark for shipped coils
  generateShippedBenchmark(): number {
    return randomUtils.between(10, 18);
  },

  // Generate yield percentage (85-98%)
  generateYield(): number {
    return randomUtils.betweenDecimal(85, 98, 1);
  },

  // Generate efficiency percentage (75-95%)
  generateEfficiency(): number {
    return randomUtils.betweenDecimal(75, 95, 1);
  },

  // Generate quality score (90-99.5%)
  generateQualityScore(): number {
    return randomUtils.betweenDecimal(90, 99.5, 1);
  },

  // Generate energy consumption (MWh per ton)
  generateEnergyConsumption(): number {
    return randomUtils.betweenDecimal(0.4, 0.8, 2);
  }
};

// KPI data generation
export const kpiDataGenerator = {
  // Generate KPI data based on card type
  generateKPIData(type: CardType, period: TimePeriod): KPIDataPoint {
    let actual: number;
    let benchmark: number;

    switch (type) {
      case 'coils':
        actual = steelProductionUtils.generateCoilsPerHour();
        benchmark = steelProductionUtils.generateCoilsBenchmark();
        break;

      case 'tons':
        const coilsPerHour = steelProductionUtils.generateCoilsPerHour();
        const weightPerCoil = steelProductionUtils.generateCoilWeight();
        actual = steelProductionUtils.calculateTonsPerHour(coilsPerHour, weightPerCoil);
        benchmark = steelProductionUtils.generateTonsBenchmark();
        break;

      case 'shipped':
        actual = steelProductionUtils.generateCoilsShipped();
        benchmark = steelProductionUtils.generateShippedBenchmark();
        break;

      case 'yield':
        actual = steelProductionUtils.generateYield();
        benchmark = randomUtils.between(92, 96);
        break;

      case 'efficiency':
        actual = steelProductionUtils.generateEfficiency();
        benchmark = randomUtils.between(85, 92);
        break;

      case 'quality':
        actual = steelProductionUtils.generateQualityScore();
        benchmark = randomUtils.betweenDecimal(95, 98, 1);
        break;

      case 'energy':
        actual = steelProductionUtils.generateEnergyConsumption();
        benchmark = randomUtils.betweenDecimal(0.5, 0.7, 2);
        break;

      case 'custom':
      default:
        // Generic KPI generation for custom cards
        actual = randomUtils.between(50, 100);
        benchmark = randomUtils.between(70, 90);
        break;
    }

    const percentage = this.calculateAchievementPercentage(actual, benchmark, type);

    return {
      actual,
      benchmark,
      percentage
    };
  },

  // Calculate achievement percentage based on KPI type
  calculateAchievementPercentage(actual: number, benchmark: number, type: CardType): number {
    switch (type) {
      case 'energy':
        // For energy consumption, lower is better
        return Number(((benchmark / actual) * 100).toFixed(1));
      
      default:
        // For most KPIs, higher is better
        return Number(((actual / benchmark) * 100).toFixed(1));
    }
  }
};

// Time period calculations
export const timePeriodUtils = {
  // Get multiplier for converting hourly data to period data
  getPeriodMultiplier(period: TimePeriod): number {
    switch (period) {
      case 'daily':
        return 24;
      case 'weekly':
        return 24 * 7; // 168 hours
      case 'monthly':
        return 24 * 30; // 720 hours (approximate)
      default:
        return 24;
    }
  },

  // Get period label for display
  getPeriodLabel(period: TimePeriod): string {
    switch (period) {
      case 'daily':
        return 'per Day';
      case 'weekly':
        return 'per Week';
      case 'monthly':
        return 'per Month';
      default:
        return 'per Day';
    }
  },

  // Convert hourly value to period value
  convertToPeriod(hourlyValue: number, period: TimePeriod): number {
    const multiplier = this.getPeriodMultiplier(period);
    return Number((hourlyValue * multiplier).toFixed(1));
  },

  // Get current time period info
  getCurrentPeriodInfo(period: TimePeriod) {
    const now = new Date();
    const startOfPeriod = new Date(now);
    const endOfPeriod = new Date(now);

    switch (period) {
      case 'daily':
        startOfPeriod.setHours(0, 0, 0, 0);
        endOfPeriod.setHours(23, 59, 59, 999);
        break;

      case 'weekly':
        const dayOfWeek = now.getDay();
        startOfPeriod.setDate(now.getDate() - dayOfWeek);
        startOfPeriod.setHours(0, 0, 0, 0);
        endOfPeriod.setDate(startOfPeriod.getDate() + 6);
        endOfPeriod.setHours(23, 59, 59, 999);
        break;

      case 'monthly':
        startOfPeriod.setDate(1);
        startOfPeriod.setHours(0, 0, 0, 0);
        endOfPeriod.setMonth(now.getMonth() + 1, 0);
        endOfPeriod.setHours(23, 59, 59, 999);
        break;
    }

    return {
      start: startOfPeriod,
      end: endOfPeriod,
      label: this.getPeriodLabel(period)
    };
  }
};

// Formatting utilities
export const formatUtils = {
  // Format numbers with appropriate units
  formatValue(value: number, type: CardType, period: TimePeriod = 'daily'): string {
    const periodValue = timePeriodUtils.convertToPeriod(value, period);

    switch (type) {
      case 'tons':
        return `${periodValue.toFixed(1)} tons`;
      
      case 'coils':
      case 'shipped':
        return `${Math.round(periodValue)} coils`;
      
      case 'yield':
      case 'efficiency':
      case 'quality':
        return `${value.toFixed(1)}%`;
      
      case 'energy':
        return `${value.toFixed(2)} MWh/ton`;
      
      default:
        return `${Math.round(periodValue)}`;
    }
  },

  // Format percentage with color coding
  formatPercentage(percentage: number): {
    value: string;
    status: 'excellent' | 'good' | 'average' | 'poor';
    color: string;
  } {
    const value = `${Math.round(percentage)}%`;
    
    let status: 'excellent' | 'good' | 'average' | 'poor';
    let color: string;

    if (percentage >= 100) {
      status = 'excellent';
      color = '#4caf50';
    } else if (percentage >= 80) {
      status = 'good';
      color = '#8bc34a';
    } else if (percentage >= 60) {
      status = 'average';
      color = '#ff9800';
    } else {
      status = 'poor';
      color = '#f44336';
    }

    return { value, status, color };
  },

  // Format large numbers with K, M, B suffixes
  formatLargeNumber(num: number): string {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  },

  // Format time duration
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }
};

// Validation utilities
export const validationUtils = {
  // Validate card title
  isValidCardTitle(title: string): boolean {
    return title.trim().length > 0 && title.trim().length <= 50;
  },

  // Validate KPI value
  isValidKPIValue(value: number): boolean {
    return !isNaN(value) && isFinite(value) && value >= 0;
  },

  // Validate period
  isValidPeriod(period: string): period is TimePeriod {
    return ['daily', 'weekly', 'monthly'].includes(period);
  },

  // Validate card type
  isValidCardType(type: string): type is CardType {
    return ['coils', 'tons', 'shipped', 'yield', 'efficiency', 'quality', 'energy', 'custom'].includes(type);
  }
};

// Performance utilities
export const performanceUtils = {
  // Debounce function for search/input
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for scroll/resize events
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Measure execution time
  measureTime<T>(func: () => T, label?: string): T {
    const start = performance.now();
    const result = func();
    const end = performance.now();
    
    if (label) {
      console.log(`${label}: ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  }
};

// Local storage utilities (fallback when Firebase is unavailable)
export const storageUtils = {
  // Save data to localStorage
  save(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  // Load data from localStorage
  load<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return defaultValue;
    }
  },

  // Remove data from localStorage
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  // Clear all localStorage data for the app
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('steel-dashboard-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

// Export all utilities as default
export default {
  randomUtils,
  steelProductionUtils,
  kpiDataGenerator,
  timePeriodUtils,
  formatUtils,
  validationUtils,
  performanceUtils,
  storageUtils
};