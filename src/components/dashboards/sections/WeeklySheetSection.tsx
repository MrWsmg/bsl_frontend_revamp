"use client";

// Weekly Payroll Sheet — Saturday-only week picker, view JSON table, PDF + CSV download
import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Download, FileText, Table2 } from 'lucide-react';
import { toast } from '../../ui/sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Returns the most recent Saturday on or before today as a default
function lastSaturday(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun, 6=Sat
  const diff = day === 6 ? 0 : day + 1;
  d.setDate(d.getDate() - diff);
  return d.toISOString().split('T')[0];
}

function isSaturday(dateStr: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr + 'T00:00:00').getDay() === 6;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export const WeeklySheetSection: React.FC = () => {
  const [selectedFarm, setSelectedFarm] = useState<string>('');
  const [weekStart, setWeekStart] = useState<string>(lastSaturday());
  const [weekError, setWeekError] = useState<string>('');
  const [sheetData, setSheetData] = useState<any>(null);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  const getFarms = useCallback(() => apiService.getPayrollFarms(), []);
  const { data: farms, loading: farmsLoading } = useApi(getFarms);

  const handleWeekChange = (val: string) => {
    setWeekStart(val);
    if (val && !isSaturday(val)) {
      setWeekError('Week start must be a Saturday.');
    } else {
      setWeekError('');
    }
  };

  const getParams = () => ({
    farm_id: parseInt(selectedFarm),
    week_start: weekStart,
  });

  const validate = (): boolean => {
    if (!selectedFarm) { toast.error('Please select a farm'); return false; }
    if (!weekStart) { toast.error('Please select a week start date'); return false; }
    if (!isSaturday(weekStart)) { toast.error('Week start must be a Saturday'); return false; }
    return true;
  };

  const handleViewSheet = async () => {
    if (!validate()) return;
    setLoadingSheet(true);
    setSheetData(null);
    try {
      const data = await apiService.getWeeklySheet(getParams());
      setSheetData(data);
    } catch (err: any) {
      const msg = err.message || 'Failed to load weekly sheet';
      if (err.response?.status === 400 || msg.toLowerCase().includes('saturday')) {
        toast.error('Week start date must be a Saturday');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoadingSheet(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!validate()) return;
    setDownloadingPdf(true);
    try {
      const blob = await apiService.downloadWeeklySheetPdf(getParams());
      triggerBlobDownload(blob, `weekly-sheet-${weekStart}.pdf`);
      toast.success('PDF downloaded');
    } catch (err: any) {
      toast.error(err.message || 'Failed to download PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadCsv = async () => {
    if (!validate()) return;
    setDownloadingCsv(true);
    try {
      const blob = await apiService.downloadWeeklySheetCsv(getParams());
      triggerBlobDownload(blob, `weekly-sheet-${weekStart}.csv`);
      toast.success('CSV downloaded');
    } catch (err: any) {
      toast.error(err.message || 'Failed to download CSV');
    } finally {
      setDownloadingCsv(false);
    }
  };

  // Render the sheet data as a table — handle various API response shapes
  const renderSheet = () => {
    if (!sheetData) return null;

    // If API returns { workers: [...], days: [...] } grid format
    if (sheetData.workers && Array.isArray(sheetData.workers)) {
      const days: string[] = sheetData.days || [];
      return (
        <div className="overflow-x-auto mt-6">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Worker</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Type</th>
                {days.map((d) => (
                  <th key={d} className="px-4 py-2 text-center font-medium text-gray-600">
                    {new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                  </th>
                ))}
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sheetData.workers.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{row.worker_name}</td>
                  <td className="px-4 py-2 text-gray-500 capitalize">{row.worker_type}</td>
                  {days.map((d) => (
                    <td key={d} className="px-4 py-2 text-center text-gray-700">
                      {row.days?.[d] ?? '—'}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right font-semibold">TZS {(row.total || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            {sheetData.grand_total != null && (
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={2 + days.length} className="px-4 py-2 text-right">Grand Total</td>
                  <td className="px-4 py-2 text-right">TZS {sheetData.grand_total.toLocaleString()}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      );
    }

    // Fallback: render as raw JSON in a preformatted block
    return (
      <pre className="mt-6 p-4 bg-gray-50 rounded border text-xs overflow-auto max-h-96">
        {JSON.stringify(sheetData, null, 2)}
      </pre>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Payroll Sheet</CardTitle>
          <CardDescription>Select a farm and a Saturday to generate the weekly sheet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Farm selector */}
            <div className="space-y-2">
              <Label>Farm *</Label>
              <Select value={selectedFarm} onValueChange={setSelectedFarm}>
                <SelectTrigger>
                  <SelectValue placeholder={farmsLoading ? 'Loading…' : 'Select farm'} />
                </SelectTrigger>
                <SelectContent>
                  {farms?.filter((f: any) => f.id != null).map((f: any) => (
                    <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Saturday-only week picker */}
            <div className="space-y-2">
              <Label>Week Start (Saturday) *</Label>
              <Input
                type="date"
                value={weekStart}
                onChange={(e) => handleWeekChange(e.target.value)}
                className={weekError ? 'border-red-500' : ''}
              />
              {weekError && <p className="text-xs text-red-500">{weekError}</p>}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button onClick={handleViewSheet} disabled={loadingSheet || !!weekError}>
              {loadingSheet ? <LoadingSpinner size="sm" /> : <Table2 className="w-4 h-4 mr-2" />}
              View Sheet
            </Button>
            <Button variant="outline" onClick={handleDownloadPdf} disabled={downloadingPdf || !!weekError}>
              {downloadingPdf ? <LoadingSpinner size="sm" /> : <FileText className="w-4 h-4 mr-2" />}
              Download PDF
            </Button>
            <Button variant="outline" onClick={handleDownloadCsv} disabled={downloadingCsv || !!weekError}>
              {downloadingCsv ? <LoadingSpinner size="sm" /> : <Download className="w-4 h-4 mr-2" />}
              Download CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sheet data */}
      {sheetData && (
        <Card>
          <CardHeader>
            <CardTitle>
              Week of {new Date(weekStart + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderSheet()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
