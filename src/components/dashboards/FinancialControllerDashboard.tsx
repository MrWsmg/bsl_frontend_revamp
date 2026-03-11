"use client";

// Financial Controller Dashboard component
import React, { useState } from 'react';
import { Layout } from '../layout/Layout';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { User } from '../../types';
import { BarChart3, ClipboardList, TrendingUp } from 'lucide-react';
import { FinancialControllerPayrollSection } from './sections/FinancialControllerPayrollSection';

interface FinancialControllerDashboardProps {
  user: User;
  onLogout: () => void;
}

export const FinancialControllerDashboard: React.FC<FinancialControllerDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('payroll');

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'payroll', label: 'Payroll Approval', icon: ClipboardList },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="p-6 text-gray-500">
            Financial Controller overview coming soon.
          </div>
        );
      case 'payroll':
        return <FinancialControllerPayrollSection />;
      case 'reports':
        return (
          <div className="p-6 text-gray-500">
            Financial reports coming soon.
          </div>
        );
      default:
        return <FinancialControllerPayrollSection />;
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