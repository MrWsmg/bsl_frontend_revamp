"use client";

// Manager Dashboard component
import React, { useState } from 'react';
import { Layout } from '../layout/Layout';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { MANAGER_TABS } from '../../constants';
import { User } from '../../types';
import { BarChart3, ClipboardList, CheckSquare, User as UserIcon, Package, Wrench, TrendingUp, Calendar, Truck } from 'lucide-react';

// Import dashboard sections
import {
  ManagerOverviewSection,
  ManagerPayrollSection,
  ManagerTasksSection,
  ManagerItemRequestsSection,
  ManagerWorkersSection,
  ManagerStockSection,
  ManagerEquipmentSection,
  ManagerReportsSection,
  ManagerAttendanceSection,
  ManagerPerformanceSection
} from './sections';
import { ManagerInterFarmSection } from './sections/ManagerInterFarmSection';

// Icon mapping
const iconMap = {
  BarChart3,
  ClipboardList,
  CheckSquare,
  User: UserIcon,
  Package,
  Wrench,
  TrendingUp,
  Calendar,
  Truck
} as const;

interface ManagerDashboardProps {
  user: User;
  onLogout: () => void;
}

// Tab content configuration - keeps components mounted to preserve data
const TAB_COMPONENTS: Record<string, React.FC> = {
  overview: ManagerOverviewSection,
  payroll: ManagerPayrollSection,
  tasks: ManagerTasksSection,
  item_requests: ManagerItemRequestsSection,
  inter_farm: ManagerInterFarmSection,
  workers: ManagerWorkersSection,
  attendance: ManagerAttendanceSection,
  performance: ManagerPerformanceSection,
  stock: ManagerStockSection,
  equipment: ManagerEquipmentSection,
  reports: ManagerReportsSection,
};

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(['overview']));

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMountedTabs(prev => new Set(prev).add(tabId));
  };

  return (
    <ErrorBoundary>
      <Layout
        user={user}
        onLogout={onLogout}
        sidebarItems={MANAGER_TABS.map(tab => ({
          id: tab.id,
          label: tab.label,
          icon: iconMap[tab.icon as keyof typeof iconMap]
        }))}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        title="BSL Farm Tracking - Manager"
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