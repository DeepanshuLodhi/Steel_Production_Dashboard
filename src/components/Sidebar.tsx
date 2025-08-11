'use client';


import React, { useState,useEffect } from 'react';
import { 
  Plus, 
  ArrowUpDown, 
  Calendar, 
  CalendarDays, 
  CalendarRange,
  Settings,
  BarChart3,
  Activity,
  Zap,
  Menu,
  X
} from 'lucide-react';
import { TimePeriod } from '../types';
import styles from './Sidebar.module.css';

interface SidebarProps {
  onCreateCard: () => void;
  onToggleInterchange: () => void;
  isInterchangeMode: boolean;
  currentPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onCreateCard,
  onToggleInterchange,
  isInterchangeMode,
  currentPeriod,
  onPeriodChange
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('--:--');
  const [currentDate, setCurrentDate] = useState('Loading...');
  const [isClient, setIsClient] = useState(false);

  // Handle client-side hydration and time updates
  useEffect(() => {
    setIsClient(true);
    
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit'
      }));
      setCurrentDate(now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    };

    // Update time immediately
    updateTime();
    
    // Update time every second
    const timeInterval = setInterval(updateTime, 1000);
    
    return () => clearInterval(timeInterval);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const getPeriodIcon = (period: TimePeriod) => {
    switch (period) {
      case 'daily':
        return <Calendar className={styles.periodIcon} />;
      case 'weekly':
        return <CalendarDays className={styles.periodIcon} />;
      case 'monthly':
        return <CalendarRange className={styles.periodIcon} />;
      default:
        return <Calendar className={styles.periodIcon} />;
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        className={styles.mobileMenuButton}
        onClick={toggleMobileMenu}
      >
        <Menu size={24} />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className={styles.mobileOverlay}
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${styles.sidebar} 
        ${isCollapsed ? styles.collapsed : ''} 
        ${isMobileOpen ? styles.mobileOpen : ''}
      `}>
        {/* Sidebar Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.logoContainer}>
            <div className={styles.logo}>
              <BarChart3 className={styles.logoIcon} />
            </div>
            {!isCollapsed && (
              <div className={styles.logoText}>
                <h2 className={styles.logoTitle}>Steel Dash</h2>
                <span className={styles.logoSubtitle}>Production Monitor</span>
              </div>
            )}
          </div>
          
          <button 
            className={styles.collapseButton}
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>

          {/* Mobile Close Button */}
          <button 
            className={styles.mobileCloseButton}
            onClick={toggleMobileMenu}
          >
            <X size={24} />
          </button>
        </div>

        {/* Time Display */}
        {!isCollapsed && isClient && (
          <div className={styles.timeDisplay}>
            <div className={styles.currentTime}>
              <Zap className={styles.timeIcon} />
              <span className={styles.time}>{currentTime}</span>
            </div>
            <div className={styles.currentDate}>
              {currentDate}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className={styles.navigation}>
          {/* Main Actions */}
          <div className={styles.actionSection}>
            {!isCollapsed && (
              <h3 className={styles.sectionTitle}>Actions</h3>
            )}
            
            <button 
              className={styles.actionButton}
              onClick={onCreateCard}
              title="Create new KPI card"
            >
              <Plus className={styles.actionIcon} />
              {!isCollapsed && <span>Create Card</span>}
            </button>

            <button 
              className={`${styles.actionButton} ${isInterchangeMode ? styles.active : ''}`}
              onClick={onToggleInterchange}
              title={isInterchangeMode ? 'Exit interchange mode' : 'Enable card reordering'}
            >
              <ArrowUpDown className={styles.actionIcon} />
              {!isCollapsed && (
                <span>{isInterchangeMode ? 'Exit Reorder' : 'Reorder Cards'}</span>
              )}
            </button>
          </div>

          {/* Period Selection */}
          <div className={styles.periodSection}>
            {!isCollapsed && (
              <h3 className={styles.sectionTitle}>Time Period</h3>
            )}
            
            <div className={styles.periodButtons}>
              {(['daily', 'weekly', 'monthly'] as TimePeriod[]).map((period) => (
                <button
                  key={period}
                  className={`${styles.periodButton} ${currentPeriod === period ? styles.active : ''}`}
                  onClick={() => onPeriodChange(period)}
                  title={`Switch to ${period} view`}
                >
                  {getPeriodIcon(period)}
                  {!isCollapsed && (
                    <span className={styles.periodLabel}>
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          {!isCollapsed && (
            <div className={styles.statsSection}>
              <h3 className={styles.sectionTitle}>Quick Stats</h3>
              
              <div className={styles.statItem}>
                <Activity className={styles.statIcon} />
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Live Updates</span>
                  <span className={styles.statValue}>Every 5s</span>
                </div>
              </div>

              <div className={styles.statItem}>
                <BarChart3 className={styles.statIcon} />
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Data Source</span>
                  <span className={styles.statValue}>Real-time</span>
                </div>
              </div>

              <div className={styles.statItem}>
                <Settings className={styles.statIcon} />
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Status</span>
                  <span className={styles.statValue}>Online</span>
                </div>
              </div>
            </div>
          )}

          {/* Interchange Mode Info */}
          {isInterchangeMode && !isCollapsed && (
            <div className={styles.interchangeInfo}>
              <div className={styles.interchangeIcon}>
                <ArrowUpDown size={24} />
              </div>
              <div className={styles.interchangeText}>
                <h4>Reorder Mode Active</h4>
                <p>Drag and drop cards to rearrange their positions on the dashboard.</p>
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className={styles.sidebarFooter}>
            <div className={styles.footerInfo}>
              <span className={styles.footerTitle}>Steel Production Dashboard</span>
              <span className={styles.footerVersion}>v1.0.0</span>
            </div>
            
            <div className={styles.statusIndicator}>
              <div className={styles.statusDot}></div>
              <span className={styles.statusText}>System Online</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;