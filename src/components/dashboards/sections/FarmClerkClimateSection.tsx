"use client";

import React, { useCallback, useState } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { CloudRain, Plus, Pencil, Check, X, Thermometer } from 'lucide-react';
import { toast } from '../../ui/sonner';
import { useAuth } from '../../../contexts/AuthContext';

const WEATHER_TYPES = ['Sunny', 'Cloudy', 'Rainy', 'Overcast', 'Foggy', 'Windy'];

const EMPTY_FORM = {
  date: new Date().toISOString().split('T')[0],
  weather_type: '',
  temperature_min: '',
  temperature_max: '',
  rainfall_mm: '',
  humidity_pct: '',
  wind_speed_kmh: '',
  notes: '',
};

export const FarmClerkClimateSection: React.FC = () => {
  const { user } = useAuth();
  const farmId: number = (user as any)?.farm_id;

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const fetchReports = useCallback(
    () => apiService.getClimateReports(farmId ? { farm_id: farmId } : undefined),
    [farmId]
  );
  const { data: raw, loading, refetch } = useApi<any>(fetchReports);
  const reports: any[] = Array.isArray(raw) ? raw : (raw as any)?.items ?? (raw as any)?.results ?? [];

  const handleCreate = async () => {
    if (!form.date || !form.weather_type) {
      toast.error('Date and weather type are required');
      return;
    }
    setSaving(true);
    try {
      await apiService.createClimateReport({
        ...form,
        farm_id: farmId,
        temperature_min: form.temperature_min ? Number(form.temperature_min) : undefined,
        temperature_max: form.temperature_max ? Number(form.temperature_max) : undefined,
        rainfall_mm: form.rainfall_mm ? Number(form.rainfall_mm) : undefined,
        humidity_pct: form.humidity_pct ? Number(form.humidity_pct) : undefined,
        wind_speed_kmh: form.wind_speed_kmh ? Number(form.wind_speed_kmh) : undefined,
      });
      toast.success('Climate report saved');
      setShowModal(false);
      setForm({ ...EMPTY_FORM });
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save climate report');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (r: any) => {
    setEditingId(r.id);
    setEditNotes(r.notes || '');
  };

  const handleUpdate = async (reportId: number) => {
    setUpdatingId(reportId);
    try {
      await apiService.updateClimateReport(reportId, { notes: editNotes });
      toast.success('Notes updated');
      setEditingId(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setUpdatingId(null);
    }
  };

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString() : '—';
  const num = (v: any) => v != null ? v : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CloudRain className="w-5 h-5 text-blue-500" /> Climate Reports
        </h2>
        <button
          onClick={() => { setForm({ ...EMPTY_FORM }); setShowModal(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Log Climate Report
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16"><LoadingSpinner size="lg" /></div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16">
            <CloudRain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No climate reports logged yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Date', 'Weather', 'Temp Min/Max (°C)', 'Rainfall (mm)', 'Humidity (%)', 'Wind (km/h)', 'Notes', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{fmt(r.date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-700">
                        <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                        {r.weather_type || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {num(r.temperature_min)} / {num(r.temperature_max)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{num(r.rainfall_mm)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{num(r.humidity_pct)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{num(r.wind_speed_kmh)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                      {editingId === r.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editNotes}
                            onChange={e => setEditNotes(e.target.value)}
                            className="border border-blue-400 rounded px-2 py-0.5 text-xs w-40"
                            autoFocus
                          />
                          <button onClick={() => handleUpdate(r.id)} disabled={updatingId === r.id} className="text-green-600 hover:text-green-800">
                            {updatingId === r.id ? <LoadingSpinner size="sm" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="truncate">{r.notes || '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {editingId !== r.id && (
                        <button onClick={() => startEdit(r)} className="text-gray-400 hover:text-blue-600">
                          <Pencil className="w-4 h-4" />
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

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Log Climate Report</h3>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weather Type <span className="text-red-500">*</span></label>
                <select value={form.weather_type} onChange={e => setForm(f => ({ ...f, weather_type: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="">Select...</option>
                  {WEATHER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temp Min (°C)</label>
                <input type="number" step="0.1" value={form.temperature_min} onChange={e => setForm(f => ({ ...f, temperature_min: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temp Max (°C)</label>
                <input type="number" step="0.1" value={form.temperature_max} onChange={e => setForm(f => ({ ...f, temperature_max: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rainfall (mm)</label>
                <input type="number" step="0.1" min="0" value={form.rainfall_mm} onChange={e => setForm(f => ({ ...f, rainfall_mm: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Humidity (%)</label>
                <input type="number" min="0" max="100" value={form.humidity_pct} onChange={e => setForm(f => ({ ...f, humidity_pct: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wind Speed (km/h)</label>
                <input type="number" min="0" value={form.wind_speed_kmh} onChange={e => setForm(f => ({ ...f, wind_speed_kmh: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 border rounded hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
