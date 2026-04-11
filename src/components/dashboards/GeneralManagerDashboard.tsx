"use client";

import React, { useState, useRef } from 'react';
import {
  LayoutDashboard, TrendingUp, BarChart3, Users, Calendar, CalendarDays,
  FileText, ShoppingCart, Package, Truck, ArrowLeftRight, BookOpen,
  CreditCard, Receipt, ReceiptText, Wallet, ClipboardList, PackageCheck,
  PackageOpen, SendHorizontal, ShieldCheck, Target, ShieldAlert, Scale,
  Building2, UserCog, Activity,
} from 'lucide-react';

import { Layout } from '../layout/Layout';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { User } from '../../types';

import {
  GmOverviewSection,
  GmFinancialMonitoringSection,
  GmPerformanceSection,
  GmMeetingsSection,
  GmPickingSection,
  GmKpiSection,
  GmHrSection,
  SharedSmrSection,
  SharedLpoSection,
  SharedGrnSection,
  SharedGinSection,
  SharedSimrSection,
  SharedTransportVoucherSection,
  SharedDeliveryNoteSection,
  SharedGatePassSection,
  SharedTransferSection,
  SharedCardexSection,
  SharedWeeklySheetSection,
  SharedPaymentSummarySection,
  SharedPayslipSection,
  SharedCalendarSection,
  SharedBudgetManagerSection,
  SharedBudgetSummarySection,
  SharedBudgetTrackingSection,
  ManagerPayrollSection,
  ManagerWorkersSection,
  UsersSection,
  ActivitiesSection,
} from './sections';

// ── Sidebar definition ────────────────────────────────────────────────────────

const GM_SIDEBAR = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    children: [
      { id: 'overview',     label: 'Overview',     icon: LayoutDashboard },
      { id: 'financial',    label: 'Financial',     icon: TrendingUp      },
      { id: 'performance',  label: 'Performance',   icon: BarChart3       },
      { id: 'meetings',     label: 'Meetings',      icon: CalendarDays    },
    ],
  },
  {
    id: 'procurement',
    label: 'Procurement',
    icon: ShoppingCart,
    children: [
      { id: 'proc-smr',      label: 'SMR',          icon: FileText       },
      { id: 'proc-lpo',      label: 'LPO',          icon: ClipboardList  },
      { id: 'proc-grn',      label: 'GRN',          icon: PackageCheck   },
      { id: 'proc-simr',     label: 'SIMR',         icon: Package        },
      { id: 'proc-gin',      label: 'GIN',          icon: PackageOpen    },
      { id: 'proc-tv',       label: 'Transport',    icon: Truck          },
      { id: 'proc-dn',       label: 'Delivery Note', icon: SendHorizontal },
      { id: 'proc-gatepass', label: 'Gate Pass',    icon: ShieldCheck    },
      { id: 'proc-transfer', label: 'Transfers',    icon: ArrowLeftRight },
      { id: 'proc-cardex',   label: 'CARDEX',       icon: BookOpen       },
    ],
  },
  {
    id: 'payroll_group',
    label: 'Payroll',
    icon: CreditCard,
    children: [
      { id: 'payroll-approval', label: 'Approval Queue', icon: ClipboardList },
      { id: 'weekly-sheet',     label: 'Weekly Sheet',   icon: Receipt       },
      { id: 'payment-summary',  label: 'Payment Summary', icon: ReceiptText  },
      { id: 'payslip',          label: 'Payslip',        icon: FileText      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: Activity,
    children: [
      { id: 'picking',  label: 'Picking',  icon: Scale       },
      { id: 'kpi',      label: 'KPIs',     icon: Target      },
      { id: 'hr',       label: 'HR / Disciplinary', icon: ShieldAlert },
    ],
  },
  { id: 'workers',    label: 'Workers',   icon: Users     },
  { id: 'calendar',   label: 'Calendar',  icon: Calendar  },
  {
    id: 'budgets-group', label: 'Budgets', icon: Wallet,
    children: [
      { id: 'budget-manager',  label: 'Budget Manager', icon: Wallet    },
      { id: 'budget-summary',  label: 'Summary Tree',   icon: BarChart3 },
      { id: 'budget-tracking', label: 'Live Tracking',  icon: TrendingUp },
    ],
  },
  { id: 'users',      label: 'Users',     icon: UserCog   },
  { id: 'activities', label: 'Activities', icon: Building2 },
];

type GmTab =
  | 'overview' | 'financial' | 'performance' | 'meetings'
  | 'proc-smr' | 'proc-lpo' | 'proc-grn' | 'proc-simr' | 'proc-gin'
  | 'proc-tv'  | 'proc-dn'  | 'proc-gatepass' | 'proc-transfer' | 'proc-cardex'
  | 'payroll-approval' | 'weekly-sheet' | 'payment-summary' | 'payslip'
  | 'picking'  | 'kpi' | 'hr'
  | 'workers'  | 'calendar' | 'users' | 'activities'
  | 'budget-manager' | 'budget-summary' | 'budget-tracking';

interface GeneralManagerDashboardProps {
  user: User;
  onLogout: () => void;
}

export const GeneralManagerDashboard: React.FC<GeneralManagerDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<GmTab>('overview');
  const mountedTabs = useRef<Set<GmTab>>(new Set(['overview']));

  const handleTabChange = (tab: string) => {
    mountedTabs.current.add(tab as GmTab);
    setActiveTab(tab as GmTab);
  };

  const show = (tab: GmTab) => activeTab !== tab ? 'hidden' : '';
  const mounted = (tab: GmTab) => mountedTabs.current.has(tab);

  const ROLE = 'general_manager';

  return (
    <ErrorBoundary>
      <Layout
        user={user}
        onLogout={onLogout}
        sidebarItems={GM_SIDEBAR}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        title="AGENTIC Farm Tracking - General Manager"
      >
        {/* ── Dashboard ── */}
        <div className={show('overview')}>
          {mounted('overview') && <GmOverviewSection />}
        </div>
        <div className={show('financial')}>
          {mounted('financial') && <GmFinancialMonitoringSection />}
        </div>
        <div className={show('performance')}>
          {mounted('performance') && <GmPerformanceSection />}
        </div>
        <div className={show('meetings')}>
          {mounted('meetings') && <GmMeetingsSection />}
        </div>

        {/* ── Procurement ── */}
        <div className={show('proc-smr')}>
          {mounted('proc-smr') && <SharedSmrSection userRole={ROLE} />}
        </div>
        <div className={show('proc-lpo')}>
          {mounted('proc-lpo') && <SharedLpoSection userRole={ROLE} />}
        </div>
        <div className={show('proc-grn')}>
          {mounted('proc-grn') && <SharedGrnSection userRole={ROLE} />}
        </div>
        <div className={show('proc-simr')}>
          {mounted('proc-simr') && <SharedSimrSection userRole={ROLE} />}
        </div>
        <div className={show('proc-gin')}>
          {mounted('proc-gin') && <SharedGinSection userRole={ROLE} />}
        </div>
        <div className={show('proc-tv')}>
          {mounted('proc-tv') && <SharedTransportVoucherSection userRole={ROLE} />}
        </div>
        <div className={show('proc-dn')}>
          {mounted('proc-dn') && <SharedDeliveryNoteSection userRole={ROLE} />}
        </div>
        <div className={show('proc-gatepass')}>
          {mounted('proc-gatepass') && <SharedGatePassSection userRole={ROLE} />}
        </div>
        <div className={show('proc-transfer')}>
          {mounted('proc-transfer') && <SharedTransferSection userRole={ROLE} />}
        </div>
        <div className={show('proc-cardex')}>
          {mounted('proc-cardex') && <SharedCardexSection userRole={ROLE} />}
        </div>

        {/* ── Payroll ── */}
        <div className={show('payroll-approval')}>
          {mounted('payroll-approval') && <ManagerPayrollSection />}
        </div>
        <div className={show('weekly-sheet')}>
          {mounted('weekly-sheet') && <SharedWeeklySheetSection userRole="general_manager" />}
        </div>
        <div className={show('payment-summary')}>
          {mounted('payment-summary') && <SharedPaymentSummarySection userRole="general_manager" />}
        </div>
        <div className={show('payslip')}>
          {mounted('payslip') && <SharedPayslipSection userRole="general_manager" />}
        </div>

        {/* ── Operations ── */}
        <div className={show('picking')}>
          {mounted('picking') && <GmPickingSection />}
        </div>
        <div className={show('kpi')}>
          {mounted('kpi') && <GmKpiSection />}
        </div>
        <div className={show('hr')}>
          {mounted('hr') && <GmHrSection />}
        </div>

        {/* ── Other ── */}
        <div className={show('workers')}>
          {mounted('workers') && <ManagerWorkersSection />}
        </div>
        <div className={show('calendar')}>
          {mounted('calendar') && <SharedCalendarSection userRole={ROLE} />}
        </div>
        <div className={show('users')}>
          {mounted('users') && <UsersSection />}
        </div>
        <div className={show('activities')}>
          {mounted('activities') && <ActivitiesSection />}
        </div>
        <div className={show('budget-manager')}>
          {mounted('budget-manager') && <SharedBudgetManagerSection userRole={ROLE} />}
        </div>
        <div className={show('budget-summary')}>
          {mounted('budget-summary') && <SharedBudgetSummarySection userRole={ROLE} />}
        </div>
        <div className={show('budget-tracking')}>
          {mounted('budget-tracking') && <SharedBudgetTrackingSection userRole={ROLE} />}
        </div>
      </Layout>
    </ErrorBoundary>
  );
};
