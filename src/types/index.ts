// Time period types
export type TimePeriod = 'daily' | 'weekly' | 'monthly';

// Card types for different KPI metrics
export type CardType = 
  | 'coils'        // Coils production per hour
  | 'tons'         // Tons production per hour
  | 'shipped'      // Coils shipped per hour
  | 'yield'        // Production yield percentage
  | 'efficiency'   // Machine efficiency percentage
  | 'quality'      // Quality score percentage
  | 'energy'       // Energy consumption (MWh per ton)
  | 'custom';      // Custom user-defined metric

// KPI data point structure
export interface KPIDataPoint {
  actual: number;      // Current actual value
  benchmark: number;   // Target/benchmark value
  percentage: number;  // Achievement percentage ((actual/benchmark) * 100)
}

// Main KPI card data structure
export interface KPICardData {
  id: string;           // Unique identifier for the card
  title: string;        // Display title of the card
  type: CardType;       // Type of KPI metric
  position: number;     // Position in the dashboard grid (for ordering)
  data: KPIDataPoint;   // Current KPI data values
}

// Extended KPI data with historical information
export interface ExtendedKPIData extends KPIDataPoint {
  previousValue?: number;    // Previous actual value for trend calculation
  trend: 'up' | 'down' | 'stable';  // Trend direction
  lastUpdated: Date;         // Timestamp of last update
  variance: number;          // Difference between actual and benchmark
  status: 'excellent' | 'good' | 'average' | 'poor';  // Performance status
}

// Dashboard configuration and settings
export interface DashboardSettings {
  id: string;
  defaultPeriod: TimePeriod;     // Default time period to display
  refreshRate: number;           // Data refresh interval in milliseconds
  theme: 'light' | 'dark' | 'auto';  // UI theme preference
  autoSave: boolean;             // Whether to auto-save changes
  notifications: boolean;        // Whether to show performance notifications
  compactMode: boolean;          // Whether to use compact card layout
  animationsEnabled: boolean;    // Whether to show animations
  soundEnabled: boolean;         // Whether to play notification sounds
  updatedAt?: Date;              // Last settings update timestamp
}

// User preferences and customization
export interface UserPreferences {
  userId?: string;               // User identifier (for future auth)
  favoriteCards: string[];       // Array of favorite card IDs
  hiddenCards: string[];         // Array of hidden card IDs
  customLayouts: DashboardLayout[];  // Saved custom layouts
  alertThresholds: AlertThreshold[]; // Performance alert settings
  exportFormats: ExportFormat[];     // Preferred export formats
}

// Dashboard layout configuration
export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  cardPositions: Record<string, CardPosition>;  // Card ID -> position mapping
  gridSettings: GridSettings;
  createdAt: Date;
  isDefault: boolean;
}

// Card position in the grid
export interface CardPosition {
  x: number;        // Grid column position
  y: number;        // Grid row position
  width: number;    // Card width in grid units
  height: number;   // Card height in grid units
}

// Grid layout settings
export interface GridSettings {
  columns: number;      // Number of grid columns
  rows: number;         // Number of grid rows
  gap: number;          // Gap between cards in pixels
  cardMinWidth: number; // Minimum card width in pixels
  cardMinHeight: number; // Minimum card height in pixels
  responsive: boolean;   // Whether to use responsive breakpoints
}

// Performance alert configuration
export interface AlertThreshold {
  cardId: string;
  cardTitle: string;
  metric: 'actual' | 'percentage' | 'variance';
  operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  value: number;
  enabled: boolean;
  notificationMethod: 'browser' | 'email' | 'both';
  message?: string;
}

// Data export configuration
export interface ExportFormat {
  format: 'csv' | 'json' | 'excel' | 'pdf';
  includeMetadata: boolean;
  dateRange: {
    start: Date;
    end: Date;
  };
  cardIds: string[];  // Specific cards to export (empty = all)
}

// Historical data point for analytics
export interface HistoricalDataPoint {
  timestamp: Date;
  cardId: string;
  data: KPIDataPoint;
  period: TimePeriod;
  metadata?: Record<string, any>;
}

// Analytics and reporting data
export interface AnalyticsData {
  cardId: string;
  cardTitle: string;
  period: TimePeriod;
  dataPoints: HistoricalDataPoint[];
  summary: {
    averageActual: number;
    averageBenchmark: number;
    averagePercentage: number;
    bestPerformance: number;
    worstPerformance: number;
    trend: 'improving' | 'declining' | 'stable';
    totalDataPoints: number;
  };
  generatedAt: Date;
}

// API response structures
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

// Error handling types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

// Modal and dialog types
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closable?: boolean;
  maskClosable?: boolean;
}

// Form field types for card creation/editing
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'radio';
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean | string;
  };
  options?: SelectOption[];  // For select/radio fields
  placeholder?: string;
  helpText?: string;
}

// Select option structure
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  description?: string;
}

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;  // Auto-dismiss time in milliseconds (0 = manual dismiss)
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: Date;
  read: boolean;
}

// Theme configuration
export interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

// Hook return types
export interface UseKPIDataReturn {
  cards: KPICardData[];
  loading: boolean;
  error: AppError | null;
  generateKPIData: (type: CardType, period: TimePeriod) => KPIDataPoint;
  saveCardsToFirebase: (cards: KPICardData[]) => Promise<void>;
  loadCardsFromFirebase: () => Promise<KPICardData[]>;
  createCard: (cardData: Omit<KPICardData, 'id' | 'data'>) => Promise<string>;
  updateCard: (cardId: string, updates: Partial<KPICardData>) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  refreshData: () => void;
}

// Animation and transition types
export interface AnimationConfig {
  duration: number;           // Animation duration in milliseconds
  easing: string;            // CSS easing function
  delay?: number;            // Animation delay in milliseconds
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  iterations?: number | 'infinite';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

// Performance monitoring types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  category: 'render' | 'network' | 'memory' | 'interaction';
  metadata?: Record<string, any>;
}

// Event tracking types
export interface TrackingEvent {
  eventType: string;
  eventData: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  userId?: string;
  userAgent?: string;
  url?: string;
}

// Utility type helpers
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Generic event handler types
export type EventHandler<T = any> = (event: T) => void;
export type AsyncEventHandler<T = any> = (event: T) => Promise<void>;

// Generic callback types
export type Callback<T = void> = () => T;
export type AsyncCallback<T = void> = () => Promise<T>;

// Data fetching states
export type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed';

// Sort and filter types
export type SortDirection = 'asc' | 'desc';
export type SortField = keyof KPICardData | keyof KPIDataPoint;

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export interface FilterConfig {
  cardTypes?: CardType[];
  performanceRange?: {
    min: number;
    max: number;
  };
  searchTerm?: string;
  period?: TimePeriod;
}

// Export validation schemas (for runtime type checking)
export const CARD_TYPES: readonly CardType[] = [
  'coils', 'tons', 'shipped', 'yield', 
  'efficiency', 'quality', 'energy', 'custom'
] as const;

export const TIME_PERIODS: readonly TimePeriod[] = [
  'daily', 'weekly', 'monthly'
] as const;

export const PERFORMANCE_STATUSES = [
  'excellent', 'good', 'average', 'poor'
] as const;