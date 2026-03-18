"use client";

// Financial Controller Dashboard component
import React, { useState } from 'react';
import { Layout } from '../layout/Layout';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { User } from '../../types';
import { BarChart3, ClipboardList, TrendingUp, FileText, PackageCheck, Warehouse } from 'lucide-react';
import { FinancialControllerPayrollSection } from './sections/FinancialControllerPayrollSection';
import {
  SharedSmrSection,
  SharedLpoSection,
  SharedGrnSection,
  SharedCardexSection,
} from './sections';

interface FinancialControllerDashboardProps {
  user: User;
  onLogout: () => void;
}

export const FinancialControllerDashboard: React.FC<FinancialControllerDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('payroll');

  const sidebarItems = [
    { id: 'overview',    label: 'Overview',        icon: BarChart3 },
    { id: 'payroll',     label: 'Payroll Approval', icon: ClipboardList },
    { id: 'proc-smr',   label: 'SMR',              icon: FileText },
    { id: 'proc-lpo',   label: 'LPO',              icon: ClipboardList },
    { id: 'proc-grn',   label: 'GRN',              icon: PackageCheck },
    { id: 'proc-cardex',label: 'CARDEX',           icon: Warehouse },
    { id: 'reports',    label: 'Reports',           icon: TrendingUp },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <div className="p-6 text-gray-500">Financial Controller overview coming soon.</div>;
      case 'payroll':
        return <FinancialControllerPayrollSection />;
      case 'proc-smr':
        return <SharedSmrSection userRole="financial_controller" />;
      case 'proc-lpo':
        return <SharedLpoSection userRole="financial_controller" />;
      case 'proc-grn':
        return <SharedGrnSection userRole="financial_controller" />;
      case 'proc-cardex':
        return <SharedCardexSection userRole="financial_controller" />;
      case 'reports':
        return <div className="p-6 text-gray-500">Financial reports coming soon.</div>;
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