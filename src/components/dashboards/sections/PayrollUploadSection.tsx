"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, Info, UserPlus } from 'lucide-react';
import { toast } from '../../ui/sonner';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import apiService from '../../../services/api';

interface UploadError {
  row: number;
  worker_name: string;
  day?: string;
  reason: string;
}

interface WorkerSummary {
  worker_name: string;
  days_worked: number;
  total_calculated: number;
  total_from_file: number;
}

interface UploadResult {
  created: number;
  skipped: number;
  deleted?: number;
  workers_registered: number;
  grand_total_calculated: number;
  workers: WorkerSummary[];
  errors: UploadError[];
  _warning?: string;
}

function nearestSaturday(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const offset = day === 6 ? 0 : -(day + 1);
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

export const PayrollUploadSection: React.FC = () => {
  const [farms, setFarms] = useState<{ id: number; name: string }[]>([]);
  const [farmsLoading, setFarmsLoading] = useState(true);
  const [farmId, setFarmId] = useState<number | ''>('');
  const [weekStart, setWeekStart] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiService.getPayrollFarms()
      .then((data) => {
        setFarms(
          (data as any[])
            .map((f) => ({ id: f.id ?? f.farm_id, name: f.name }))
            .filter((f) => f.id != null)
        );
      })
      .catch(() => toast.error('Failed to load farms'))
      .finally(() => setFarmsLoading(false));
  }, []);

  const handleWeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) { setWeekStart(''); return; }
    setWeekStart(nearestSaturday(e.target.value));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      await apiService.downloadWeeklySheetTemplate();
      toast.success('Template downloaded');
    } catch {
      toast.error('Failed to download template');
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmId) { toast.error('Please select a farm'); return; }
    if (!weekStart) { toast.error('Please select a week start'); return; }
    if (!file) { toast.error('Please select a file'); return; }

    setUploading(true);
    setResult(null);
    try {
      const res = await apiService.uploadWeeklySheet({ farm_id: Number(farmId), week_start: weekStart, file, overwrite });
      setResult(res);
      if (res._warning) {
        toast.warning(res.created > 0 ? `${res.created} records saved — verify below` : 'Data saved with warnings');
      } else if (res.created > 0) {
        toast.success(`${res.created} records uploaded`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const weekEnd = weekStart ? (() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d.toISOString().split('T')[0];
  })() : null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Upload Weekly Payroll Sheet</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Download the template, fill it in Excel, then upload the completed file.
          </p>
        </div>
        <button
          onClick={handleDownloadTemplate}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 disabled:opacity-50 transition-colors"
        >
          {downloading ? <LoadingSpinner size="sm" /> : <Download className="w-4 h-4" />}
          Download Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="w-4 h-4" />
                Upload Form
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Farm</label>
                  {farmsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <LoadingSpinner size="sm" /> Loading farms…
                    </div>
                  ) : (
                    <Select
                      value={farmId ? String(farmId) : ''}
                      onValueChange={(val) => setFarmId(val ? Number(val) : '')}
                    >
                      <SelectTrigger className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                        <SelectValue placeholder="— Select farm —" />
                      </SelectTrigger>
                      <SelectContent>
                        {farms.map((f) => (
                          <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Week Start (Saturday)</label>
                  <input
                    type="date"
                    value={weekStart}
                    onChange={handleWeekChange}
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {weekStart && weekEnd && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Week: {weekStart} → {weekEnd} (Sat – Fri)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">File</label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileChange}
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Accepted: .csv, .xlsx</p>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={overwrite}
                      onChange={(e) => setOverwrite(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary"
                    />
                    <span className="text-sm font-medium">Overwrite existing records for this week</span>
                  </label>
                  {overwrite && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                      All existing payroll records for the selected farm and week will be deleted and replaced.
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {uploading ? <LoadingSpinner size="sm" /> : <Upload className="w-4 h-4" />}
                    {uploading ? 'Uploading…' : 'Upload Sheet'}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Result Display */}
          {result && (
            <Card>
              {result._warning && (
                <div className="flex items-start gap-3 mx-6 mt-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                  <span>{result._warning}</span>
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">Upload Result</CardTitle>
                  <span className="text-sm font-semibold text-muted-foreground">
                    Grand Total: <span className="text-foreground">TZS {result.grand_total_calculated.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary badges */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-md text-green-800">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">{result.created} records created</span>
                  </div>
                  {(result.deleted ?? 0) > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-md text-orange-800">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium">{result.deleted} previous records replaced</span>
                    </div>
                  )}
                  {result.workers_registered > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
                      <UserPlus className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">{result.workers_registered} new workers auto-registered</span>
                    </div>
                  )}
                  {result.skipped > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-md text-orange-800">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium">{result.skipped} rows had issues — see details below</span>
                    </div>
                  )}
                </div>

                {/* Per-worker payment summary */}
                {result.workers.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-2 pr-4 font-medium">#</th>
                          <th className="py-2 pr-4 font-medium">Worker</th>
                          <th className="py-2 pr-4 font-medium text-right">Days</th>
                          <th className="py-2 pr-4 font-medium text-right">Calculated (TZS)</th>
                          <th className="py-2 font-medium text-right">File Total (TZS)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.workers.map((w, i) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="py-2 pr-4 text-muted-foreground">{i + 1}</td>
                            <td className="py-2 pr-4 font-medium">{w.worker_name}</td>
                            <td className="py-2 pr-4 text-right tabular-nums">{w.days_worked}</td>
                            <td className="py-2 pr-4 text-right tabular-nums">{w.total_calculated.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className={`py-2 text-right tabular-nums ${w.total_from_file !== w.total_calculated ? 'text-orange-600 font-medium' : 'text-muted-foreground'}`}>
                              {w.total_from_file.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t font-semibold">
                          <td colSpan={3} className="py-2 pr-4">Total</td>
                          <td className="py-2 pr-4 text-right tabular-nums">
                            {result.grand_total_calculated.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* Error table */}
                {result.errors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-destructive mb-2">Row Errors</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="py-2 pr-4 font-medium">Row</th>
                            <th className="py-2 pr-4 font-medium">Worker</th>
                            <th className="py-2 pr-4 font-medium">Day</th>
                            <th className="py-2 font-medium">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.errors.map((err, i) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="py-2 pr-4 text-muted-foreground">{err.row}</td>
                              <td className="py-2 pr-4 font-medium">{err.worker_name}</td>
                              <td className="py-2 pr-4 text-muted-foreground">{err.day ?? '—'}</td>
                              <td className="py-2 text-destructive">{err.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Column Reference */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="w-4 h-4" />
                Template Column Reference
              </CardTitle>
              <CardDescription>What to enter in each column of the template</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {[
                  { col: 'worker_name', desc: 'Full name exactly as registered' },
                  { col: 'worker_type', desc: 'Cont D' },
                  { col: 'block_mon … block_sat', desc: 'Block code e.g. 99T, 5T' },
                  { col: 'task_mon … task_sat', desc: 'Task code e.g. 301, 171' },
                  { col: 'units_mon … units_sat', desc: 'Man-days e.g. 1.0 or 2.0 — leave blank if not worked' },
                ].map(({ col, desc }) => (
                  <div key={col} className="border-b pb-2 last:border-0 last:pb-0">
                    <p className="font-medium font-mono text-xs text-primary">{col}</p>
                    <p className="text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-1 border-t">
                  Rate and total are calculated automatically — do not add them to the file.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
