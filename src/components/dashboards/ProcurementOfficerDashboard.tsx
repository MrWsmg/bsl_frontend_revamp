"use client";

import { useTabParam } from '@/hooks';
import React, { useState, useCallback } from 'react';
import { useApi } from '../../hooks';
import apiService from '../../services/api';
import { Layout } from '../layout/Layout';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileText,
  ClipboardList,
  PackageCheck,
  Warehouse,
  Truck,
  LayoutDashboard,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProcurementSmrSection } from './sections/ProcurementSmrSection';
import { SharedLpoSection } from './sections/SharedLpoSection';
import { ProcurementGrnSection } from './sections/ProcurementGrnSection';
import { ProcurementStoreSection } from './sections/ProcurementStoreSection';
import { ProcurementSuppliersSection } from './sections/ProcurementSuppliersSection';
import { SharedTransferSection } from './sections';
import { User } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

type Tab = 'overview' | 'smr' | 'lpo' | 'grn' | 'store' | 'transfers' | 'suppliers';

interface Props {
  user: User;
  onLogout: () => void;
}

const SIDEBAR_ITEMS = [
  { id: 'overview',   label: 'Overview',  icon: LayoutDashboard },
  { id: 'suppliers',  label: 'Suppliers', icon: Building2 },
  {
    id: 'external',
    label: 'External',
    icon: FileText,
    children: [
      { id: 'smr',  label: 'SMR', icon: FileText },
      { id: 'lpo',  label: 'LPO', icon: ClipboardList },
      { id: 'grn',  label: 'GRN', icon: PackageCheck },
    ],
  },
  { id: 'store',     label: 'Store',     icon: Warehouse },
  { id: 'transfers', label: 'Transfers', icon: Truck },
];

const WORKFLOW_STEPS = [
  { key: 'smr',   label: 'SMR',    sub: 'SMART request',    icon: FileText,      color: 'text-slate-600',  bg: 'bg-slate-100' },
  { key: 'lpo',   label: 'LPO',    sub: 'Purchase order',   icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-100' },
  { key: 'grn',   label: 'GRN',    sub: 'Receive goods',    icon: PackageCheck,  color: 'text-green-600',  bg: 'bg-green-100' },
  { key: 'store', label: 'CARDEX', sub: 'Stock updated',    icon: Warehouse,     color: 'text-teal-600',   bg: 'bg-teal-100' },
] as const;

export const ProcurementOfficerDashboard: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useTabParam<Tab>('overview');

  return (
    <ErrorBoundary>
      <Layout
        user={user}
        onLogout={onLogout}
        sidebarItems={SIDEBAR_ITEMS}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as Tab)}
        title="Procurement Officer"
      >
        <div className="p-6 space-y-6">
          {activeTab === 'overview'   && <OverviewSection onNavigate={setActiveTab} />}
          {activeTab === 'suppliers'  && <ProcurementSuppliersSection />}
          {activeTab === 'smr'        && <ProcurementSmrSection />}
          {activeTab === 'lpo'        && <SharedLpoSection userRole="procurement_officer" />}
          {activeTab === 'grn'        && <ProcurementGrnSection />}
          {activeTab === 'store'      && <ProcurementStoreSection />}
          {activeTab === 'transfers'  && <SharedTransferSection userRole="procurement_officer" />}
        </div>
      </Layout>
    </ErrorBoundary>
  );
};

// ── Overview ──────────────────────────────────────────────────────────────────

const OverviewSection: React.FC<{ onNavigate: (tab: Tab) => void }> = ({ onNavigate }) => {
  const getSmrs      = useCallback(() => apiService.getProcurementSmrs({ status: 'approved' }), []);
  const getLpos      = useCallback(() => apiService.getLpos(), []);
  const getGrns      = useCallback(() => apiService.getGrns(), []);
  const getStores    = useCallback(() => apiService.getStores(), []);
  const getTransfers = useCallback(() => apiService.getInternalTransfers(), []);

  const { data: smrs }      = useApi(getSmrs);
  const { data: lpos }      = useApi(getLpos);
  const { data: grns }      = useApi(getGrns);
  const { data: stores }    = useApi(getStores);
  const { data: transfers } = useApi(getTransfers);

  const counts = {
    smr:       Array.isArray(smrs)      ? smrs.length      : '—',
    lpo:       Array.isArray(lpos)      ? lpos.length      : '—',
    grn:       Array.isArray(grns)      ? grns.length      : '—',
    store:     Array.isArray(stores)    ? stores.length    : '—',
    transfers: Array.isArray(transfers) ? transfers.length : '—',
  };

  const pendingLpo = Array.isArray(lpos)
    ? lpos.filter((l: any) => ['draft', 'pending_approval'].includes(l.status ?? '')).length
    : 0;
  const recentGrns = Array.isArray(grns) ? grns.slice(0, 3) : [];

  return (
    <div className="space-y-6">
      {/* Workflow pipeline */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Procurement Chain — SMR → LPO → GRN → CARDEX
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {WORKFLOW_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.key}>
                  <button
                    onClick={() => onNavigate(step.key as Tab)}
                    className={`flex flex-col items-center gap-1.5 px-5 py-3 rounded-xl ${step.bg} hover:opacity-80 transition-opacity flex-shrink-0`}
                  >
                    <Icon className={`w-5 h-5 ${step.color}`} />
                    <span className={`text-sm font-bold ${step.color}`}>{step.label}</span>
                    <span className="text-xs text-gray-500">{step.sub}</span>
                  </button>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Approved SMRs', value: counts.smr,       color: 'text-slate-700',  tab: 'smr'       as Tab },
          { label: 'LPOs',          value: counts.lpo,       color: 'text-orange-700', tab: 'lpo'       as Tab },
          { label: 'GRNs',          value: counts.grn,       color: 'text-green-700',  tab: 'grn'       as Tab },
          { label: 'Farm Stores',   value: counts.store,     color: 'text-teal-700',   tab: 'store'     as Tab },
          { label: 'Transfers',     value: counts.transfers, color: 'text-blue-700',   tab: 'transfers' as Tab },
        ].map(stat => (
          <Card
            key={stat.label}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onNavigate(stat.tab)}
          >
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attention + Recent */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Needs Attention
            </p>
            <div className="space-y-2">
              {pendingLpo > 0 && (
                <button
                  onClick={() => onNavigate('lpo')}
                  className="w-full flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5 text-sm hover:bg-orange-100 transition-colors"
                >
                  <span className="flex items-center gap-2 text-orange-800">
                    <ClipboardList className="w-3.5 h-3.5" />
                    {pendingLpo} LPO{pendingLpo > 1 ? 's' : ''} pending approval
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-orange-600" />
                </button>
              )}
              {pendingLpo === 0 && (
                <p className="text-sm text-gray-400 py-2">No items need immediate attention</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Recent GRNs
            </p>
            {recentGrns.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No recent receipts</p>
            ) : (
              <div className="space-y-2">
                {recentGrns.map((grn: any) => (
                  <div key={grn.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-mono text-xs text-amber-700">
                        {grn.grn_number ?? `GRN #${grn.id}`}
                      </span>
                      {grn.farm?.name && (
                        <span className="text-gray-400 ml-2 text-xs">· {grn.farm.name}</span>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      grn.status === 'cardex_updated'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {grn.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ── Transfers (lightweight inline) ────────────────────────────────────────────

const TransfersSection: React.FC = () => {
  const getTransfers = useCallback(() => apiService.getInternalTransfers(), []);
  const { data: transfers, loading, error, refetch } = useApi(getTransfers);

  const list = Array.isArray(transfers) ? transfers : [];

  const statusColor: Record<string, string> = {
    pending:    'bg-yellow-100 text-yellow-800',
    dispatched: 'bg-blue-100 text-blue-800',
    received:   'bg-green-100 text-green-800',
    cancelled:  'bg-red-100 text-red-800',
  };

  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-600" />
            Internal Transfers
          </p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
        ) : list.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Truck className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No transfers on record</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((t: any) => (
              <div key={t.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {t.transfer_number && (
                        <span className="font-mono text-xs bg-blue-50 border border-blue-200 text-blue-800 px-2 py-0.5 rounded">
                          {t.transfer_number}
                        </span>
                      )}
                      {t.status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[t.status] ?? 'bg-gray-100 text-gray-700'}`}>
                          {t.status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">
                      {t.source_farm_name ?? `Farm #${t.source_farm_id}`}
                      {' → '}
                      {t.destination_farm_name ?? `Farm #${t.destination_farm_id}`}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0">
                    {t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}
                  </p>
                </div>

                {Array.isArray(t.items) && t.items.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-50 space-y-1">
                    {t.items.map((item: any, i: number) => (
                      <div key={i} className="text-xs flex justify-between bg-gray-50 rounded px-2 py-1">
                        <span className="text-gray-700">{item.item_name}</span>
                        <span className="text-gray-500">{item.quantity} {item.unit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
