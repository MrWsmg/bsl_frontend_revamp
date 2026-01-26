"use client";

// Worker Dashboard component
import React, { useState } from 'react';
import { Layout } from '../layout/Layout';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { User } from '../../types';
import { BarChart3, ClipboardList, TrendingUp } from 'lucide-react';

interface WorkerDashboardProps {
  user: User;
  onLogout: () => void;
}

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'tasks', label: 'My Tasks', icon: ClipboardList },
    { id: 'reports', label: 'My Reports', icon: TrendingUp },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <div>Worker Overview</div>;
      case 'tasks':
        return <div>My Tasks</div>;
      case 'reports':
        return <div>My Reports</div>;
      default:
        return <div>Worker Overview</div>;
    }
  };

  return (
    <ErrorBoundary>
      <Layout
        user={user}
        onLogout={onLogout}
        sidebarItems={sidebarItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        title="BSL Farm Tracking - Worker"
      >
        {renderContent()}
      </Layout>
    </ErrorBoundary>
  );
};