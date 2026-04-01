"use client";

import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, CalendarDays, RefreshCw, AlertCircle, Send, Plus } from 'lucide-react';
import { toast } from 'sonner';

type SubTab = 'reports' | 'meetings';

export const MdReportsMeetingsSection: React.FC = () => {
  const [subTab, setSubTab] = useState<SubTab>('reports');

  const tabs: { id: SubTab; label: string }[] = [
    { id: 'reports',  label: 'Reports' },
    { id: 'meetings', label: 'Meetings' },
  ];

  return (
    <div className="space-y-4 p-6">
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              subTab === t.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'reports'  && <ReportsPanel />}
      {subTab === 'meetings' && <MeetingsPanel />}
    </div>
  );
};

// ── Reports Panel ─────────────────────────────────────────────────────────────

const ReportsPanel: React.FC = () => {
  const fetchReports = useCallback(() => apiService.getMdReports(), []);
  const { data: raw, loading, error, refetch } = useApi<any>(fetchReports);
  const reports: any[] = Array.isArray(raw) ? raw : (raw as any)?.reports ?? (raw as any)?.data ?? [];

  // Initiate report form
  const [farmId, setFarmId]         = useState('');
  const [reportType, setReportType] = useState('');
  const [period, setPeriod]         = useState('');
  const [notes, setNotes]           = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchFarms = useCallback(() => apiService.getFarms('admin'), []);
  const { data: farms } = useApi(fetchFarms);
  const farmList = Array.isArray(farms) ? farms : [];

  const inputCls = 'border border-gray-200 rounded-md px-3 py-2 text-sm bg-white w-full';

  const handleInitiate = async () => {
    if (!reportType) { toast.error('Select a report type'); return; }
    setSubmitting(true);
    try {
      const payload: Record<string, any> = { report_type: reportType };
      if (farmId) payload.farm_id = parseInt(farmId);
      if (period) payload.period  = period;
      if (notes)  payload.notes   = notes;
      await apiService.postMdInitiateReport(payload);
      toast.success('Report initiated');
      setFarmId(''); setReportType(''); setPeriod(''); setNotes('');
      refetch();
    } catch {
      toast.error('Failed to initiate report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Initiate form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-600" /> Initiate Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Report Type *</label>
              <select value={reportType} onChange={e => setReportType(e.target.value)} className={inputCls}>
                <option value="">Select type…</option>
                <option value="financial">Financial</option>
                <option value="operational">Operational</option>
                <option value="payroll">Payroll</option>
                <option value="harvest">Harvest</option>
                <option value="stock">Stock</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Farm</label>
              <select value={farmId} onChange={e => setFarmId(e.target.value)} className={inputCls}>
                <option value="">All farms</option>
                {farmList.map((f: any) => (
                  <option key={f.id ?? f.farm_id} value={f.id ?? f.farm_id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Period (e.g. 2025-Q1)</label>
              <Input
                placeholder="e.g. 2025-Q1"
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <Input
                placeholder="Optional notes…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
          <Button
            size="sm"
            className="mt-4"
            onClick={handleInitiate}
            disabled={submitting}
          >
            {submitting ? <LoadingSpinner size="sm" /> : <><Send className="w-3.5 h-3.5 mr-1" /> Initiate Report</>}
          </Button>
        </CardContent>
      </Card>

      {/* Reports list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-600" /> MD Reports
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 mb-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          {loading ? (
            <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No reports found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-3 py-2">Type</th>
                    <th className="text-left px-3 py-2">Farm</th>
                    <th className="text-left px-3 py-2">Period</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">Date</th>
                    <th className="text-left px-3 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reports.map((r: any, i: number) => {
                    const statusCls =
                      r.status === 'completed' ? 'bg-green-100 text-green-700' :
                      r.status === 'pending'   ? 'bg-amber-100 text-amber-700' :
                                                 'bg-gray-100 text-gray-600';
                    return (
                      <tr key={r.id ?? i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-800 capitalize">
                          {(r.report_type ?? r.type ?? '—').replace(/_/g, ' ')}
                        </td>
                        <td className="px-3 py-2 text-gray-600">{r.farm_name ?? r.farm ?? 'All'}</td>
                        <td className="px-3 py-2 text-gray-600">{r.period ?? '—'}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusCls}`}>
                            {r.status ?? 'unknown'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-500 text-xs">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-3 py-2 text-gray-500 text-xs max-w-xs truncate">
                          {r.notes ?? '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ── Meetings Panel ────────────────────────────────────────────────────────────

const MeetingsPanel: React.FC = () => {
  const [farmId, setFarmId]     = useState('');
  const [date, setDate]         = useState('');
  const [agenda, setAgenda]     = useState('');
  const [attendees, setAttendees] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchFarms = useCallback(() => apiService.getFarms('admin'), []);
  const { data: farms } = useApi(fetchFarms);
  const farmList = Array.isArray(farms) ? farms : [];

  const inputCls = 'border border-gray-200 rounded-md px-3 py-2 text-sm bg-white w-full';

  const handleSchedule = async () => {
    if (!date)   { toast.error('Select a meeting date'); return; }
    if (!agenda) { toast.error('Enter agenda'); return; }
    setSubmitting(true);
    try {
      const payload: Record<string, any> = { date, agenda };
      if (farmId)   payload.farm_id  = parseInt(farmId);
      if (attendees) payload.attendees = attendees;
      if (location)  payload.location  = location;
      await apiService.postMdMeeting(payload);
      toast.success('Meeting scheduled');
      setFarmId(''); setDate(''); setAgenda(''); setAttendees(''); setLocation('');
    } catch {
      toast.error('Failed to schedule meeting');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-indigo-600" /> Schedule Meeting
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date & Time *</label>
            <Input
              type="datetime-local"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Farm</label>
            <select value={farmId} onChange={e => setFarmId(e.target.value)} className={inputCls}>
              <option value="">All / General</option>
              {farmList.map((f: any) => (
                <option key={f.id ?? f.farm_id} value={f.id ?? f.farm_id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
            <Input
              placeholder="e.g. Head Office, Farm A"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Attendees</label>
            <Input
              placeholder="e.g. All managers, Farm A supervisors"
              value={attendees}
              onChange={e => setAttendees(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Agenda *</label>
            <textarea
              rows={4}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white w-full resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Meeting agenda…"
              value={agenda}
              onChange={e => setAgenda(e.target.value)}
            />
          </div>
        </div>
        <Button
          size="sm"
          className="mt-4"
          onClick={handleSchedule}
          disabled={submitting}
        >
          {submitting ? <LoadingSpinner size="sm" /> : <><Plus className="w-3.5 h-3.5 mr-1" /> Schedule Meeting</>}
        </Button>
      </CardContent>
    </Card>
  );
};
