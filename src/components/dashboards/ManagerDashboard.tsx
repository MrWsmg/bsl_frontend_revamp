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
  PackageOpen, SendHorizontal, ShieldCheck, LayoutGrid,
} from 'lucide-react';

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
  blocks: ManagerBlocksSection,
};

const MANAGER_SIDEBAR = [
  ...MANAGER_TABS.map(tab => ({ id: tab.id, label: tab.label, icon: iconMap[tab.icon as keyof typeof iconMap] })),
  { id: 'blocks', label: 'Blocks', icon: LayoutGrid },
  {
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
  },
];

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
        title="BSL Farm Tracking - Manager"
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