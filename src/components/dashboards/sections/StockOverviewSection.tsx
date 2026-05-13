"use client";

import React, { useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2, Leaf, Droplets, Zap, Wrench, Fish,
  ShoppingBasket, Coffee, TrendingUp, AlertCircle,
} from 'lucide-react';

function fmt(n: number | null | undefined, decimals = 0) {
  if (n == null) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  badge?: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' };
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon: Icon, iconBg, iconColor, badge }) => (
  <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          {badge && <Badge variant={badge.variant} className="mt-2 text-xs">{badge.label}</Badge>}
        </div>
        <div className={`${iconBg} p-2.5 rounded-lg shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

// ── Module Card ────────────────────────────────────────────────────────────────

interface ModuleCardProps {
  name: string;
  detail: string;
  icon: React.ElementType;
  accentColor: string;
  iconBg: string;
  status: 'active' | 'empty' | 'loading';
}

const ModuleCard: React.FC<ModuleCardProps> = ({ name, detail, icon: Icon, accentColor, iconBg, status }) => (
  <div className={`flex items-center gap-3 p-4 rounded-lg border border-border/50 bg-card hover:bg-accent/40 transition-colors duration-150`}>
    <div className={`${iconBg} p-2 rounded-md shrink-0`}>
      <Icon className={`w-4 h-4 ${accentColor}`} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-foreground">{name}</p>
      <p className="text-xs text-muted-foreground truncate">{detail}</p>
    </div>
    <div className={`w-2 h-2 rounded-full shrink-0 ${
      status === 'active' ? 'bg-emerald-500' :
      status === 'empty' ? 'bg-muted-foreground/40' : 'bg-amber-400 animate-pulse'
    }`} />
  </div>
);

// ── Farm Card ─────────────────────────────────────────────────────────────────

const FarmCard: React.FC<{ farm: any }> = ({ farm }) => (
  <div className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card hover:bg-accent/40 transition-colors duration-150">
    <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded-md shrink-0">
      <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
    </div>
    <div className="min-w-0">
      <p className="text-sm font-semibold text-foreground">{farm.name}</p>
      <p className="text-xs text-muted-foreground">{farm.location || 'No location set'}</p>
      {farm.area && (
        <p className="text-xs text-muted-foreground mt-0.5">{farm.area} acres</p>
      )}
    </div>
  </div>
);

// ── Section Header ─────────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string; sub?: string }> = ({ title, sub }) => (
  <div className="mb-3">
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────

export const StockOverviewSection: React.FC = () => {
  const getFarms         = useCallback(() => apiService.getStockFarms(), []);
  const getMbuni         = useCallback(() => apiService.getMbuniRecords({}), []);
  const getFertilizer    = useCallback(() => apiService.getFertilizerBalances({}), []);
  const getFuelChem      = useCallback(() => apiService.getFuelChemBalances({}), []);
  const getIrrigation    = useCallback(() => apiService.getIrrigationParts({}), []);
  const getCrops         = useCallback(() => apiService.getCropBalances({}), []);
  const getFish          = useCallback(() => apiService.getFishReservoirs({}), []);
  const getWeeklySummary = useCallback(() => apiService.getStockWeeklySummary(), []);

  const { data: farms,         loading: l1 } = useApi(getFarms);
  const { data: mbuniRecords,  loading: l2 } = useApi(getMbuni);
  const { data: fertBalances,  loading: l3 } = useApi(getFertilizer);
  const { data: fuelBalances,  loading: l4 } = useApi(getFuelChem);
  const { data: irrigParts,    loading: l5 } = useApi(getIrrigation);
  const { data: cropBalances,  loading: l6 } = useApi(getCrops);
  const { data: fishReservoirs,loading: l7 } = useApi(getFish);
  const { data: weekly,        loading: l8 } = useApi(getWeeklySummary);

  const anyLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8;

  if (l1) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Derived values
  const totalFarms       = (farms ?? []).length;
  const totalMbuniKg     = (mbuniRecords ?? []).reduce((s: number, r: any) => s + (r.mbuni_kg || 0), 0);
  const fertItemCount    = (fertBalances ?? []).length;
  const fuelItemCount    = (fuelBalances ?? []).length;
  const activeParts      = (irrigParts ?? []).filter((p: any) => p.active !== false).length;
  const activeCrops      = (cropBalances ?? []).filter((b: any) => (b.current_kgs || 0) > 0).length;
  const activeReservoirs = (fishReservoirs ?? []).filter((r: any) => r.status === 'active').length;
  const weeklyRecords    = weekly?.total_records ?? 0;
  const weeklyQty        = weekly?.total_quantity_kg ?? 0;

  const topStats: StatCardProps[] = [
    {
      label: 'Farms',
      value: totalFarms,
      sub: totalFarms === 1 ? '1 farm active' : `${totalFarms} farms active`,
      icon: Building2,
      iconBg: 'bg-blue-50 dark:bg-blue-950',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Mbuni This Period',
      value: `${fmt(totalMbuniKg)} kg`,
      sub: `${(mbuniRecords ?? []).length} harvest records`,
      icon: Coffee,
      iconBg: 'bg-amber-50 dark:bg-amber-950',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'This Week (Legacy)',
      value: weeklyRecords,
      sub: weeklyQty ? `${fmt(weeklyQty, 1)} kg recorded` : 'No quantity recorded',
      icon: TrendingUp,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Active Modules',
      value: [fertItemCount, fuelItemCount, activeParts, activeCrops, activeReservoirs].filter(v => v > 0).length + 2,
      sub: 'Stock tracking modules in use',
      icon: anyLoading ? AlertCircle : Leaf,
      iconBg: 'bg-purple-50 dark:bg-purple-950',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  ];

  const modules: ModuleCardProps[] = [
    {
      name: 'Cherry Picking',
      detail: 'Daily per-block cherry harvest records',
      icon: Coffee,
      accentColor: 'text-amber-600',
      iconBg: 'bg-amber-50 dark:bg-amber-950',
      status: 'active',
    },
    {
      name: 'Mbuni (Dried Cherry)',
      detail: `${fmt(totalMbuniKg)} kg · ${(mbuniRecords ?? []).length} records`,
      icon: Coffee,
      accentColor: 'text-orange-600',
      iconBg: 'bg-orange-50 dark:bg-orange-950',
      status: (mbuniRecords ?? []).length > 0 ? 'active' : 'empty',
    },
    {
      name: 'Fertilizer Stock',
      detail: fertItemCount > 0 ? `${fertItemCount} product balance${fertItemCount !== 1 ? 's' : ''} tracked` : 'No balances yet',
      icon: Leaf,
      accentColor: 'text-green-600',
      iconBg: 'bg-green-50 dark:bg-green-950',
      status: l3 ? 'loading' : fertItemCount > 0 ? 'active' : 'empty',
    },
    {
      name: 'Fuel & Chemicals',
      detail: fuelItemCount > 0 ? `${fuelItemCount} product balance${fuelItemCount !== 1 ? 's' : ''} tracked` : 'No balances yet',
      icon: Droplets,
      accentColor: 'text-sky-600',
      iconBg: 'bg-sky-50 dark:bg-sky-950',
      status: l4 ? 'loading' : fuelItemCount > 0 ? 'active' : 'empty',
    },
    {
      name: 'Irrigation Parts',
      detail: activeParts > 0 ? `${activeParts} active part${activeParts !== 1 ? 's' : ''} in catalog` : 'No parts catalogued',
      icon: Wrench,
      accentColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50 dark:bg-indigo-950',
      status: l5 ? 'loading' : activeParts > 0 ? 'active' : 'empty',
    },
    {
      name: 'Other Crops',
      detail: activeCrops > 0 ? `${activeCrops} crop type${activeCrops !== 1 ? 's' : ''} with balance` : 'No crop balances',
      icon: ShoppingBasket,
      accentColor: 'text-teal-600',
      iconBg: 'bg-teal-50 dark:bg-teal-950',
      status: l6 ? 'loading' : activeCrops > 0 ? 'active' : 'empty',
    },
    {
      name: 'Fish Farming',
      detail: activeReservoirs > 0 ? `${activeReservoirs} active reservoir${activeReservoirs !== 1 ? 's' : ''}` : 'No active reservoirs',
      icon: Fish,
      accentColor: 'text-cyan-600',
      iconBg: 'bg-cyan-50 dark:bg-cyan-950',
      status: l7 ? 'loading' : activeReservoirs > 0 ? 'active' : 'empty',
    },
    {
      name: 'Electrical / Power',
      detail: 'Fuel & chemical entries include generators',
      icon: Zap,
      accentColor: 'text-yellow-600',
      iconBg: 'bg-yellow-50 dark:bg-yellow-950',
      status: 'active',
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── KPI Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {topStats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* ── Module Status ─────────────────────────────────────────────────── */}
      <div>
        <SectionHeader
          title="Stock Modules"
          sub="Live status of all tracked stock categories"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
          {modules.map((m, i) => <ModuleCard key={i} {...m} />)}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Active</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Loading</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted-foreground/40 inline-block" /> No data yet</span>
        </div>
      </div>

      {/* ── Farms ─────────────────────────────────────────────────────────── */}
      <div>
        <SectionHeader
          title="Farms"
          sub={totalFarms > 0 ? `${totalFarms} farm${totalFarms !== 1 ? 's' : ''} assigned to your account` : undefined}
        />
        {!farms || farms.length === 0 ? (
          <div className="flex items-center gap-3 p-6 rounded-lg border border-dashed border-border text-muted-foreground text-sm">
            <Building2 className="w-5 h-5 shrink-0" />
            <span>No farms assigned to your account.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {farms.map((farm: any) => (
              <FarmCard key={farm.farm_id ?? farm.id} farm={farm} />
            ))}
          </div>
        )}
      </div>

      {/* ── Weekly breakdown (only if data available) ─────────────────────── */}
      {weekly && weekly.crop_summary && Object.keys(weekly.crop_summary).length > 0 && (
        <div>
          <SectionHeader title="This Week by Crop" sub={`${weekly.week_start} — ${weekly.week_end}`} />
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Crop</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Records</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Qty (kg)</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment (TZS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {Object.entries(weekly.crop_summary).map(([crop, data]: [string, any]) => (
                  <tr key={crop} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-foreground capitalize">{crop}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{data.count}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-foreground">{fmt(data.quantity, 1)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-foreground">{fmt(data.payment)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
