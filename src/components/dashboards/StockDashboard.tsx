"use client";

// Stock Dashboard component
import React, { useState } from 'react';
import { Layout } from '../layout/Layout';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { User } from '../../types';
import { BarChart3, Package, TrendingUp } from 'lucide-react';
import {
  StockOverviewSection,
  StockRecordsSection,
  StockReportsSection
} from './sections';

interface StockDashboardProps {
  user: User;
  onLogout: () => void;
}

const TAB_COMPONENTS: Record<string, React.FC> = {
  overview: StockOverviewSection,
  stock: StockRecordsSection,
  reports: StockReportsSection,
};

export const StockDashboard: React.FC<StockDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(['overview']));

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'stock', label: 'Stock Records', icon: Package },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMountedTabs(prev => new Set(prev).add(tabId));
  };

  return (
    <ErrorBoundary>
      <Layout
        user={user}
        onLogout={onLogout}
        sidebarItems={sidebarItems}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        title="BSL Farm Tracking - Stock"
      >
        {Object.entries(TAB_COMPONENTS).map(([tabId, Component]) => (
          <div
            key={tabId}
            className={activeTab === tabId ? '' : 'hidden'}
          >
            {mountedTabs.has(tabId) && <Component />}
          </div>
        ))}
      </Layout>
    </ErrorBoundary>
  );
};