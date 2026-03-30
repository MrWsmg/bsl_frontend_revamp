"use client";

import React, { useCallback, useState } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Leaf, Plus, CheckCircle, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '../../ui/sonner';
import { useAuth } from '../../../contexts/AuthContext';

const CURRENT_YEAR = new Date().getFullYear();

function emptyForm() {
  return {
    season_year: String(CURRENT_YEAR),
    crop_type: 'coffee',
    fly_picking_start: '',
    main_harvest_start: '',
    estimated_end: '',
    pickers_needed: '',
    pickers_type: 'contracted' as 'contracted' | 'permanent',
  };
}

function statusBadge(status: string) {
  if (status === 'approved') return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
  if (status === 'draft') return <Badge className="bg-gray-100 text-gray-700">Draft</Badge>;
  if (status === 'pending') return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

export const ManagerHarvestSection: React.FC = () => {
  const { user } = useAuth();
  const farmId: number = (user as any)?.farm_id;

  const [seasonYear, setSeasonYear] = useState(CURRENT_YEAR);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);

  const fetchPlans = useCallback(
    () => apiService.getHarvestPlans(farmId, seasonYear),
    [farmId, seasonYear]
  );
  const { data: plansRaw, loading, refetch } = useApi(fetchPlans);
  const plans: any[] = Array.isArray(plansRaw) ? plansRaw : plansRaw ? [plansRaw] : [];

  const handleCreate = async () => {
    if (!form.season_year || !form.crop_type || !form.fly_picking_start || !form.main_harvest_start || !form.estimated_end || !form.pickers_needed) {
      toast.error('All date fields and pickers count are required');
      return;
    }
    setSaving(true);
    try {
      await apiService.createHarvestPlan({
        farm_id: farmId,
        season_year: Number(form.season_year),
        crop_type: form.crop_type,
        fly_picking_start: form.fly_picking_start,
        main_harvest_start: form.main_harvest_start,
        estimated_end: form.estimated_end,
        pickers_needed: Number(form.pickers_needed),
        pickers_type: form.pickers_type,
      });
      toast.success('Harvest plan created');
      setShowModal(false);
      setForm(emptyForm());
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create plan');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (planId: number) => {
    setApprovingId(planId);
    try {
      await apiService.approveHarvestPlan(planId);
      toast.success('Harvest plan approved');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve plan');
    } finally {
      setApprovingId(null);
    }
  };

  const fmt = (dt?: string) => dt ? new Date(dt).toLocaleDateString() : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={seasonYear}
            onChange={e => setSeasonYear(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          >
            {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => { setForm(emptyForm()); setShowModal(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4" /> New Harvest Plan
        </button>
      </div>

      {/* Plans table */}
      <div className="bg-white rounded-lg shadow-md">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16">
            <Leaf className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No harvest plans for {seasonYear}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Season', 'Crop', 'Fly Picking Start', 'Main Harvest Start', 'Estimated End', 'Pickers', 'Type', 'Status', ''].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {plans.map((plan: any) => (
                  <tr
                    key={plan.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{plan.season_year}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{plan.crop_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{fmt(plan.fly_picking_start)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{fmt(plan.main_harvest_start)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{fmt(plan.estimated_end)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plan.pickers_needed}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{plan.pickers_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{statusBadge(plan.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right" onClick={e => e.stopPropagation()}>
                      {plan.status !== 'approved' && (
                        <button
                          onClick={() => handleApprove(plan.id)}
                          disabled={approvingId === plan.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {approvingId === plan.id ? <LoadingSpinner size="sm" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Harvest Plan — {selectedPlan.season_year}</h3>
              {statusBadge(selectedPlan.status)}
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-gray-500">Crop</p><p className="font-medium capitalize">{selectedPlan.crop_type}</p></div>
                <div><p className="text-gray-500">Pickers needed</p><p className="font-medium">{selectedPlan.pickers_needed} ({selectedPlan.pickers_type})</p></div>
              </div>
              <div className="border-t pt-3 space-y-2">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-yellow-500" /><span className="text-gray-500 w-36">Fly picking start</span><span className="font-medium">{fmt(selectedPlan.fly_picking_start)}</span></div>
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-green-500" /><span className="text-gray-500 w-36">Main harvest start</span><span className="font-medium">{fmt(selectedPlan.main_harvest_start)}</span></div>
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-red-400" /><span className="text-gray-500 w-36">Estimated end</span><span className="font-medium">{fmt(selectedPlan.estimated_end)}</span></div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setSelectedPlan(null)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Close</button>
              {selectedPlan.status !== 'approved' && (
                <button
                  onClick={() => { handleApprove(selectedPlan.id); setSelectedPlan(null); }}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Approve Plan
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">New Harvest Plan</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Season Year <span className="text-red-500">*</span></label>
                <input type="number" value={form.season_year} onChange={e => setForm(f => ({ ...f, season_year: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type <span className="text-red-500">*</span></label>
                <input type="text" value={form.crop_type} onChange={e => setForm(f => ({ ...f, crop_type: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fly Picking Start <span className="text-red-500">*</span></label>
              <input type="datetime-local" value={form.fly_picking_start} onChange={e => setForm(f => ({ ...f, fly_picking_start: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Main Harvest Start <span className="text-red-500">*</span></label>
              <input type="datetime-local" value={form.main_harvest_start} onChange={e => setForm(f => ({ ...f, main_harvest_start: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated End <span className="text-red-500">*</span></label>
              <input type="datetime-local" value={form.estimated_end} onChange={e => setForm(f => ({ ...f, estimated_end: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickers Needed <span className="text-red-500">*</span></label>
                <input type="number" min="1" value={form.pickers_needed} onChange={e => setForm(f => ({ ...f, pickers_needed: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickers Type</label>
                <select value={form.pickers_type} onChange={e => setForm(f => ({ ...f, pickers_type: e.target.value as any }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="contracted">Contracted</option>
                  <option value="permanent">Permanent</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 border rounded hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
