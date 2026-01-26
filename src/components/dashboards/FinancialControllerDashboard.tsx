"use client";

// Financial Controller Dashboard component
import React, { useState } from 'react';
import { Layout } from '../layout/Layout';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { User } from '../../types';
import { BarChart3, ClipboardList, TrendingUp } from 'lucide-react';

interface FinancialControllerDashboardProps {
  user: User;
  onLogout: () => void;
}

export const FinancialControllerDashboard: React.FC<FinancialControllerDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'payroll', label: 'Payroll Approval', icon: ClipboardList },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <div>Financial Controller Overview</div>;
      case 'payroll':
        return <div>Payroll Approval</div>;
      case 'reports':
        return <div>Financial Controller Reports</div>;
      default:
        return <div>Financial Controller Overview</div>;
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
        title="BSL Farm Tracking - Financial Controller"
      >
        {renderContent()}
      </Layout>
    </ErrorBoundary>
  );
};