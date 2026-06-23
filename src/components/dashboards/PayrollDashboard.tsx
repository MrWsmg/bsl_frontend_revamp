"use client";

// Payroll Dashboard component
import { useTabParam } from '@/hooks';
import React, { useState } from 'react';
import { Layout } from '../layout/Layout';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { User } from '../../types';
import {
  BarChart3,
  ClipboardList,
  Users,
  TrendingUp,
  FileText,
  NotebookPen,
  Boxes,
  Wallet,
  CalendarDays,
  ReceiptText,
  Link2,
  Upload,
} from 'lucide-react';
import {
  PayrollOverviewSection,
  PayrollRecordsSection,
  PayrollSummarySection,
  PayrollPickingSection,
  PayrollUploadSection,
  SharedWeeklySheetSection,
  SharedPaymentSummarySection,
  SharedPayslipSection,
  PayrollQuickBooksSection,
  SharedCalendarSection,
} from './sections';

interface PayrollDashboardProps {
  user: User;
  onLogout: () => void;
}

const TAB_COMPONENTS: Record<string, React.FC> = {
  overview:        PayrollOverviewSection,
  records:         PayrollRecordsSection,
  summary:         PayrollSummarySection,
  picking:         PayrollPickingSection,
  upload_sheet:    PayrollUploadSection,
  weekly_sheet:    SharedWeeklySheetSection,
  payment_summary: SharedPaymentSummarySection,
  payslip:         SharedPayslipSection,
  quickbooks:      PayrollQuickBooksSection,
};

export const PayrollDashboard: React.FC<PayrollDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useTabParam('overview');
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(['overview', activeTab]));

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    {
      id: 'payroll',
      label: 'Payroll',
      icon: Wallet,
      children: [
        { id: 'records',         label: 'Records',          icon: ClipboardList  },
        { id: 'summary',         label: 'Summary',          icon: NotebookPen    },
        { id: 'upload_sheet',    label: 'Upload Sheet',     icon: Upload         },
        { id: 'weekly_sheet',    label: 'Weekly Sheet',     icon: CalendarDays   },
        { id: 'payment_summary', label: 'Payment Summary',  icon: ReceiptText    },
        { id: 'payslip',         label: 'Payslip',          icon: FileText       },
        { id: 'quickbooks',      label: 'QuickBooks Sync',  icon: Link2          },
      ]
    },
    {
      id: 'workforce',
      label: 'Workforce',
      icon: Boxes,
      children: [
        { id: 'workers', label: 'Workers',         icon: Users      },
        { id: 'picking', label: 'Picking Records', icon: TrendingUp },
      ]
    },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
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
        title="AGENTIC Farm Tracking - Payroll"
      >
        {Object.entries(TAB_COMPONENTS).map(([tabId, Component]) => (
          <div
            key={tabId}
            className={activeTab === tabId ? '' : 'hidden'}
          >
            {mountedTabs.has(tabId) && <Component />}
          </div>
        ))}
        {/* Placeholder tabs */}
        {activeTab === 'workers' && (
          <div className="p-6 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Workers Management</h3>
            <p>Coming Soon</p>
          </div>
        )}
        {activeTab === 'reports' && (
          <div className="p-6 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Payroll Reports</h3>
            <p>Coming Soon</p>
          </div>
        )}
        <div className={activeTab === 'calendar' ? '' : 'hidden'}>
          {mountedTabs.has('calendar') && <SharedCalendarSection userRole="payroll" />}
        </div>
      </Layout>
    </ErrorBoundary>
  );
};
