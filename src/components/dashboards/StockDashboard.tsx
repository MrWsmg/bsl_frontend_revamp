"use client";

import React, { useState } from 'react';
import { Layout } from '../layout/Layout';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { User } from '../../types';
import {
  BarChart3,
  Package,
  TrendingUp,
  ClipboardList,
  Leaf,
  Coffee,
  Fuel,
  Droplets,
  Fish,
  FileUp,
} from 'lucide-react';
import {
  StockOverviewSection,
  StockRecordsSection,
  StockReportsSection,
  SharedCardexSection,
  StockOtherCropsSection,
  StockMbuniSection,
  StockFertilizerSection,
  StockFuelChemicalsSection,
  StockIrrigationSection,
  StockFishFarmingSection,
  StockCsvImportSection,
} from './sections';

interface StockDashboardProps {
  user: User;
  onLogout: () => void;
}

const TAB_COMPONENTS: Record<string, React.FC> = {
  overview:      StockOverviewSection,
  stock:         StockRecordsSection,
  othercrops:    StockOtherCropsSection,
  mbuni:         StockMbuniSection,
  fertilizer:    StockFertilizerSection,
  fuelchem:      StockFuelChemicalsSection,
  irrigation:    StockIrrigationSection,
  csvimport:     StockCsvImportSection,
  reports:       StockReportsSection,
};

export const StockDashboard: React.FC<StockDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(['overview']));

  const sidebarItems = [
    { id: 'overview',   label: 'Overview',        icon: BarChart3 },
    { id: 'stock',      label: 'Stock Records',   icon: Package },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Leaf,
      children: [
        { id: 'othercrops', label: 'Other Crops',     icon: Leaf },
        { id: 'mbuni',      label: 'Mbuni',            icon: Coffee },
        { id: 'fertilizer', label: 'Fertilizer',       icon: Leaf },
        { id: 'fuelchem',   label: 'Fuel & Chemicals', icon: Fuel },
        { id: 'irrigation', label: 'Irrigation Parts', icon: Droplets },
      ],
    },
    { id: 'fish',      label: 'Fish Farming',     icon: Fish },
    { id: 'csvimport', label: 'CSV Import',       icon: FileUp },
    { id: 'cardex',   label: 'Farm CARDEX',      icon: ClipboardList },
    { id: 'reports',  label: 'Reports',           icon: TrendingUp },
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
        title="AGENTIC Farm Tracking - Stock"
      >
        {Object.entries(TAB_COMPONENTS).map(([tabId, Component]) => (
          <div key={tabId} className={activeTab === tabId ? '' : 'hidden'}>
            {mountedTabs.has(tabId) && <Component />}
          </div>
        ))}
        <div className={activeTab === 'fish' ? '' : 'hidden'}>
          {mountedTabs.has('fish') && <StockFishFarmingSection userRole={user.role} />}
        </div>
        <div className={activeTab === 'cardex' ? '' : 'hidden'}>
          {mountedTabs.has('cardex') && <SharedCardexSection userRole="stock" />}
        </div>
      </Layout>
    </ErrorBoundary>
  );
};
