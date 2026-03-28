"use client";

// Manager Dashboard component
import React, { useState } from 'react';
import { Layout } from '../layout/Layout';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { MANAGER_TABS } from '../../constants';
import { User } from '../../types';
import {
  BarChart3, ClipboardList, CheckSquare, User as UserIcon, Package, Wrench,
  TrendingUp, Calendar, Truck, FileText, Receipt, PackageCheck, ArrowLeftRight,
  PackageOpen, SendHorizontal, ShieldCheck, LayoutGrid, CalendarDays, ReceiptText, Wallet,
} from 'lucide-react';

// Import dashboard sections
import {
  ManagerOverviewSection,
  ManagerPayrollSection,
  ManagerTasksSection,
  ManagerWorkersSection,
  ManagerStockSection,
  ManagerEquipmentSection,
  ManagerReportsSection,
  ManagerAttendanceSection,
  ManagerPerformanceSection,
  ManagerBlocksSection,
  SharedSmrSection,
  SharedPfiSection,
  SharedLpoSection,
  SharedGrnSection,
  SharedSimrSection,
  SharedGinSection,
  SharedTransportVoucherSection,
  SharedDeliveryNoteSection,
  SharedTransferSection,
  SharedCardexSection,
  SharedGatePassSection,
  SharedWeeklySheetSection,
  SharedPaymentSummarySection,
  SharedPayslipSection,
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
  overview:        ManagerOverviewSection,
  payroll:         ManagerPayrollSection,
  weekly_sheet:    SharedWeeklySheetSection,
  payment_summary: SharedPaymentSummarySection,
  payslip:         SharedPayslipSection,
  tasks:           ManagerTasksSection,
  inter_farm:      ManagerInterFarmSection,
  workers:         ManagerWorkersSection,
  attendance:      ManagerAttendanceSection,
  performance:     ManagerPerformanceSection,
  stock:           ManagerStockSection,
  equipment:       ManagerEquipmentSection,
  reports:         ManagerReportsSection,
  blocks:          ManagerBlocksSection,
};

const PROCUREMENT_GROUP = {
  id: 'procurement',
  label: 'Procurement',
  icon: FileText,
  children: [
    { id: 'proc-smr',      label: 'SMR',          icon: FileText },
    { id: 'proc-pfi',      label: 'PFI',          icon: Receipt },
    { id: 'proc-lpo',      label: 'LPO',          icon: ClipboardList },
    { id: 'proc-grn',      label: 'GRN',          icon: PackageCheck },
    { id: 'proc-cardex',   label: 'CARDEX',       icon: TrendingUp },
    { id: 'proc-simr',     label: 'SIMR',         icon: Package },
    { id: 'proc-gin',      label: 'GIN',          icon: PackageOpen },
    { id: 'proc-tv',       label: 'Transport',    icon: Truck },
    { id: 'proc-dn',       label: 'Delivery',     icon: SendHorizontal },
    { id: 'proc-transfer', label: 'Transfers',    icon: ArrowLeftRight },
    { id: 'proc-gatepass', label: 'Gate Pass',    icon: ShieldCheck },
  ],
};

const PAYROLL_GROUP = {
  id: 'payroll_group',
  label: 'Payroll',
  icon: Wallet,
  children: [
    { id: 'payroll',         label: 'Approval Queue',  icon: ClipboardList },
    { id: 'weekly_sheet',    label: 'Weekly Sheet',    icon: CalendarDays  },
    { id: 'payment_summary', label: 'Payment Summary', icon: ReceiptText   },
    { id: 'payslip',         label: 'Payslip',         icon: FileText      },
  ],
};

const MANAGER_SIDEBAR = (() => {
  const tabs = MANAGER_TABS
    .filter(tab => tab.id !== 'item_requests' && tab.id !== 'payroll')
    .map(tab => ({ id: tab.id, label: tab.label, icon: iconMap[tab.icon as keyof typeof iconMap] }));
  // Insert Payroll group at start (after overview)
  const overviewIdx = tabs.findIndex(t => t.id === 'overview');
  // Insert Procurement after Tasks
  const tasksIdx = tabs.findIndex(t => t.id === 'tasks');
  const result: any[] = [];
  tabs.forEach((tab, i) => {
    result.push(tab);
    if (i === overviewIdx) result.push(PAYROLL_GROUP as any);
    if (i === tasksIdx) result.push(PROCUREMENT_GROUP as any);
  });
  result.push({ id: 'blocks', label: 'Blocks', icon: LayoutGrid });
  return result;
})();

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(['overview']));

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMountedTabs(prev => new Set(prev).add(tabId));
  };

  const ROLE = 'manager';

  return (
    <ErrorBoundary>
      <Layout
        user={user}
        onLogout={onLogout}
        sidebarItems={MANAGER_SIDEBAR}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        title="AGENTIC Farm Tracking - Manager"
      >
        {/* Existing tabs */}
        {Object.entries(TAB_COMPONENTS).map(([tabId, Component]) => (
          <div key={tabId} className={activeTab === tabId ? '' : 'hidden'}>
            {mountedTabs.has(tabId) && <Component />}
          </div>
        ))}
        {/* Procurement tabs */}
        <div className={activeTab === 'proc-smr'      ? '' : 'hidden'}>{mountedTabs.has('proc-smr')      && <SharedSmrSection userRole={ROLE} />}</div>
        <div className={activeTab === 'proc-pfi'      ? '' : 'hidden'}>{mountedTabs.has('proc-pfi')      && <SharedPfiSection userRole={ROLE} />}</div>
        <div className={activeTab === 'proc-lpo'      ? '' : 'hidden'}>{mountedTabs.has('proc-lpo')      && <SharedLpoSection userRole={ROLE} />}</div>
        <div className={activeTab === 'proc-grn'      ? '' : 'hidden'}>{mountedTabs.has('proc-grn')      && <SharedGrnSection userRole={ROLE} />}</div>
        <div className={activeTab === 'proc-simr'     ? '' : 'hidden'}>{mountedTabs.has('proc-simr')     && <SharedSimrSection userRole={ROLE} />}</div>
        <div className={activeTab === 'proc-gin'      ? '' : 'hidden'}>{mountedTabs.has('proc-gin')      && <SharedGinSection userRole={ROLE} />}</div>
        <div className={activeTab === 'proc-tv'       ? '' : 'hidden'}>{mountedTabs.has('proc-tv')       && <SharedTransportVoucherSection userRole={ROLE} />}</div>
        <div className={activeTab === 'proc-dn'       ? '' : 'hidden'}>{mountedTabs.has('proc-dn')       && <SharedDeliveryNoteSection userRole={ROLE} />}</div>
        <div className={activeTab === 'proc-transfer' ? '' : 'hidden'}>{mountedTabs.has('proc-transfer') && <SharedTransferSection userRole={ROLE} />}</div>
        <div className={activeTab === 'proc-cardex'   ? '' : 'hidden'}>{mountedTabs.has('proc-cardex')   && <SharedCardexSection userRole={ROLE} />}</div>
        <div className={activeTab === 'proc-gatepass' ? '' : 'hidden'}>{mountedTabs.has('proc-gatepass') && <SharedGatePassSection userRole={ROLE} />}</div>
      </Layout>
    </ErrorBoundary>
  );
};