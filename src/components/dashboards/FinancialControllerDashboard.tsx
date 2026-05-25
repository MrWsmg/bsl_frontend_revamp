"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Layout } from '../layout/Layout';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { User } from '../../types';
import {
  BarChart3, ClipboardList, TrendingUp, FileText, PackageCheck,
  Warehouse, CalendarDays, ReceiptText, ArrowRight, AlertCircle,
  Users, BarChart2, AlertTriangle,
} from 'lucide-react';
import { FinancialControllerPayrollSection } from './sections/FinancialControllerPayrollSection';
import {
  SharedSmrSection,
  SharedLpoSection,
  SharedGrnSection,
  SharedGinSection,
  SharedCardexSection,
  SharedWeeklySheetSection,
  SharedPaymentSummarySection,
  SharedPayslipSection,
  SharedCalendarSection,
  SharedBudgetManagerSection,
  SharedBudgetSummarySection,
  SharedBudgetTrackingSection,
  ManagerWorkersSection,
  ManagerReportsSection,
  ManagerWarningsSection,
  MandayBudgetSection,
} from './sections';
import apiService from '../../services/api';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '../common/LoadingSpinner';

type Tab =
  | 'overview'
  | 'payroll'
  | 'weekly_sheet'
  | 'payment_summary'
  | 'payslip'
  | 'proc-smr'
  | 'proc-lpo'
  | 'proc-grn'
  | 'proc-gin'
  | 'proc-cardex'
  | 'calendar'
  | 'budget-manager'
  | 'budget-summary'
  | 'budget-tracking'
  | 'workers'
  | 'reports'
  | 'warnings'
  | 'manday';

interface Props {
  user: User;
  onLogout: () => void;
}

const SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  {
    id: 'payroll-group',
    label: 'Payroll',
    icon: ClipboardList,
    children: [
      { id: 'payroll',         label: 'Payroll Approval', icon: ClipboardList },
      { id: 'weekly_sheet',    label: 'Weekly Sheet',     icon: CalendarDays  },
      { id: 'payment_summary', label: 'Payment Summary',  icon: ReceiptText   },
      { id: 'payslip',         label: 'Payslip',          icon: FileText      },
    ],
  },
  {
    id: 'procurement-group',
    label: 'Procurement',
    icon: PackageCheck,
    children: [
      { id: 'proc-smr',    label: 'SMR',    icon: FileText      },
      { id: 'proc-lpo',    label: 'LPO',    icon: ClipboardList },
      { id: 'proc-grn',    label: 'GRN',    icon: PackageCheck  },
      { id: 'proc-gin',    label: 'GIN',    icon: PackageCheck  },
      { id: 'proc-cardex', label: 'CARDEX', icon: Warehouse     },
    ],
  },
  { id: 'workers',  label: 'Workers',   icon: Users        },
  { id: 'reports',  label: 'Reports',   icon: BarChart2    },
  { id: 'warnings', label: 'Warnings',  icon: AlertTriangle },
  { id: 'manday',   label: 'Manday Budget', icon: TrendingUp },
  { id: 'calendar', label: 'Calendar',  icon: CalendarDays },
  {
    id: 'budgets-group', label: 'Budgets', icon: BarChart3,
    children: [
      { id: 'budget-manager',  label: 'Budget Manager', icon: BarChart3    },
      { id: 'budget-summary',  label: 'Summary Tree',   icon: BarChart3    },
      { id: 'budget-tracking', label: 'Live Tracking',  icon: TrendingUp   },
    ],
  },
];

export const FinancialControllerDashboard: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const mountedTabs = useRef<Set<Tab>>(new Set(['overview']));

  const handleTabChange = (id: string) => {
    const tab = id as Tab;
    mountedTabs.current.add(tab);
    setActiveTab(tab);
  };

  return (
    <ErrorBoundary>
      <Layout
        user={user}
        onLogout={onLogout}
        sidebarItems={SIDEBAR_ITEMS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        title="Financial Controller"
      >
        <div className="p-6">
          <div hidden={activeTab !== 'overview'}>
            {mountedTabs.current.has('overview') && <OverviewSection onNavigate={handleTabChange} />}
          </div>
          <div hidden={activeTab !== 'payroll'}>
            {mountedTabs.current.has('payroll') && <FinancialControllerPayrollSection />}
          </div>
          <div hidden={activeTab !== 'weekly_sheet'}>
            {mountedTabs.current.has('weekly_sheet') && <SharedWeeklySheetSection />}
          </div>
          <div hidden={activeTab !== 'payment_summary'}>
            {mountedTabs.current.has('payment_summary') && <SharedPaymentSummarySection />}
          </div>
          <div hidden={activeTab !== 'payslip'}>
            {mountedTabs.current.has('payslip') && <SharedPayslipSection />}
          </div>
          <div hidden={activeTab !== 'proc-smr'}>
            {mountedTabs.current.has('proc-smr') && <SharedSmrSection userRole="financial_controller" />}
          </div>
          <div hidden={activeTab !== 'proc-lpo'}>
            {mountedTabs.current.has('proc-lpo') && <SharedLpoSection userRole="financial_controller" />}
          </div>
          <div hidden={activeTab !== 'proc-grn'}>
            {mountedTabs.current.has('proc-grn') && <SharedGrnSection userRole="financial_controller" />}
          </div>
          <div hidden={activeTab !== 'proc-gin'}>
            {mountedTabs.current.has('proc-gin') && <SharedGinSection userRole="financial_controller" />}
          </div>
          <div hidden={activeTab !== 'proc-cardex'}>
            {mountedTabs.current.has('proc-cardex') && <SharedCardexSection userRole="financial_controller" />}
          </div>
          <div hidden={activeTab !== 'workers'}>
            {mountedTabs.current.has('workers') && <ManagerWorkersSection />}
          </div>
          <div hidden={activeTab !== 'reports'}>
            {mountedTabs.current.has('reports') && <ManagerReportsSection />}
          </div>
          <div hidden={activeTab !== 'warnings'}>
            {mountedTabs.current.has('warnings') && <ManagerWarningsSection />}
          </div>
          <div hidden={activeTab !== 'calendar'}>
            {mountedTabs.current.has('calendar') && <SharedCalendarSection userRole="financial_controller" />}
          </div>
          <div hidden={activeTab !== 'budget-manager'}>
            {mountedTabs.current.has('budget-manager') && <SharedBudgetManagerSection userRole="financial_controller" />}
          </div>
          <div hidden={activeTab !== 'budget-summary'}>
            {mountedTabs.current.has('budget-summary') && <SharedBudgetSummarySection userRole="financial_controller" />}
          </div>
          <div hidden={activeTab !== 'budget-tracking'}>
            {mountedTabs.current.has('budget-tracking') && <SharedBudgetTrackingSection userRole="financial_controller" />}
          </div>
          <div hidden={activeTab !== 'manday'}>
            {mountedTabs.current.has('manday') && <MandayBudgetSection />}
          </div>
        </div>
      </Layout>
    </ErrorBoundary>
  );
};

// ── Overview ──────────────────────────────────────────────────────────────────

const OverviewSection: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [pendingPayroll, setPendingPayroll] = useState<any[] | null>(null);
  const [draftLpos, setDraftLpos]           = useState<any[] | null>(null);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      apiService.getFinancialControllerPendingPayroll(),
      apiService.getLpos({ status: 'draft' }),
    ]).then(([payrollRes, lposRes]) => {
      if (payrollRes.status === 'fulfilled') {
        const d = payrollRes.value;
        setPendingPayroll(Array.isArray(d) ? d : (d as any)?.records ?? []);
      } else {
        setPendingPayroll([]);
      }
      if (lposRes.status === 'fulfilled') {
        const d = lposRes.value;
        setDraftLpos(Array.isArray(d) ? d : (d as any)?.results ?? []);
      } else {
        setDraftLpos([]);
      }
      setLoading(false);
    });
  }, []);

  const pendingPayrollCount = pendingPayroll?.length ?? 0;
  const draftLpoCount       = draftLpos?.length ?? 0;

  const stats = [
    {
      label: 'Payroll Pending Approval',
      value: loading ? '—' : pendingPayrollCount,
      color: 'text-amber-700',
      bg:    'bg-amber-50',
      tab:   'payroll',
    },
    {
      label: 'LPOs Awaiting Approval',
      value: loading ? '—' : draftLpoCount,
      color: 'text-blue-700',
      bg:    'bg-blue-50',
      tab:   'proc-lpo',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map(stat => (
          <Card
            key={stat.label}
            className={`cursor-pointer hover:shadow-md transition-shadow ${stat.bg} border-0`}
            onClick={() => onNavigate(stat.tab)}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                <div className={`text-3xl font-bold ${stat.color}`}>
                  {loading ? <LoadingSpinner size="sm" /> : stat.value}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Needs attention */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Needs Attention
          </p>
          {loading ? (
            <div className="flex justify-center py-6"><LoadingSpinner size="lg" /></div>
          ) : (
            <div className="space-y-2">
              {pendingPayrollCount > 0 && (
                <button
                  onClick={() => onNavigate('payroll')}
                  className="w-full flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-sm hover:bg-amber-100 transition-colors"
                >
                  <span className="flex items-center gap-2 text-amber-800">
                    <ClipboardList className="w-3.5 h-3.5" />
                    {pendingPayrollCount} payroll record{pendingPayrollCount > 1 ? 's' : ''} awaiting FC approval
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                </button>
              )}
              {draftLpoCount > 0 && (
                <button
                  onClick={() => onNavigate('proc-lpo')}
                  className="w-full flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-sm hover:bg-blue-100 transition-colors"
                >
                  <span className="flex items-center gap-2 text-blue-800">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {draftLpoCount} LPO{draftLpoCount > 1 ? 's' : ''} awaiting FC approval
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                </button>
              )}
              {pendingPayrollCount === 0 && draftLpoCount === 0 && (
                <p className="text-sm text-gray-400 py-2">No items need immediate attention</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Authority summary */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Your Approval Authority
          </p>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-3 bg-amber-50 rounded-lg px-4 py-3">
              <ClipboardList className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800">Payroll — Level 3 Final</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Supervisor → Manager → <span className="font-semibold text-amber-700">You</span> → Approved &amp; budget deducted
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-blue-50 rounded-lg px-4 py-3">
              <PackageCheck className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-800">LPO — Exclusive Gatekeeper</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  SMR → LPO drafted → <span className="font-semibold text-blue-700">You approve</span> → PO sends to supplier
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
