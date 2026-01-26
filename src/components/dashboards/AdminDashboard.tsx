"use client";

// Admin Dashboard component
import React, { useState } from 'react';
import { Layout } from '../layout/Layout';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { User } from '../../types';
import { BarChart3, TrendingUp, PieChart, Calendar, Users, Warehouse, ClipboardList, Eye, LayoutDashboard, UserCog } from 'lucide-react';

// Import dashboard sections
import {
  OverviewSection,
  SummarySection,
  AnalyticsSection,
  UsersSection,
  ActivitiesSection,
  ReportsSection
} from './sections';

// Grouped navigation items with accordions
const ADMIN_NAV_ITEMS = [
  {
    id: 'dashboards',
    label: 'Dashboards',
    icon: LayoutDashboard,
    children: [
      { id: 'overview', label: 'Overview', icon: BarChart3 },
      { id: 'summary', label: 'Summary', icon: BarChart3 },
      { id: 'analytics', label: 'Analytics', icon: TrendingUp },
      { id: 'analytical', label: 'Analytical', icon: PieChart },
    ],
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: Calendar,
  },
  {
    id: 'people',
    label: 'People',
    icon: UserCog,
    children: [
      { id: 'users', label: 'Users', icon: Users },
      { id: 'managers', label: 'Managers', icon: Users },
    ],
  },
  {
    id: 'store',
    label: 'Store',
    icon: Warehouse,
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: ClipboardList,
  },
  {
    id: 'activities',
    label: 'Activities',
    icon: Eye,
  },
];

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

// Tab content configuration - keeps components mounted to preserve data
const TAB_COMPONENTS: Record<string, React.FC> = {
  overview: OverviewSection,
  summary: SummarySection,
  analytics: AnalyticsSection,
  users: UsersSection,
  reports: ReportsSection,
  activities: ActivitiesSection,
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(['overview']));

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Mount tab on first visit
    setMountedTabs(prev => new Set(prev).add(tabId));
  };

  return (
    <ErrorBoundary>
      <Layout
        user={user}
        onLogout={onLogout}
        sidebarItems={ADMIN_NAV_ITEMS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        title="BSL Farm Tracking - Admin"
      >
        {/* Keep mounted tabs in DOM but hidden to preserve state/data */}
        {Object.entries(TAB_COMPONENTS).map(([tabId, Component]) => (
          <div
            key={tabId}
            className={activeTab === tabId ? '' : 'hidden'}
          >
            {mountedTabs.has(tabId) && <Component />}
          </div>
        ))}
        {/* Placeholders for tabs without dedicated components */}
        {activeTab === 'analytical' && <AnalyticsSection />}
        {activeTab === 'calendar' && <div>Calendar View</div>}
        {activeTab === 'managers' && <div>Managers View</div>}
        {activeTab === 'store' && <div>Store View</div>}
      </Layout>
    </ErrorBoundary>
  );
};