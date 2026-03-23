"use client";

import React, { useRef, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import apiService from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Download, Upload, LayoutGrid, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface SkippedRow {
  row?: number;
  code?: string;
  reason?: string;
  [key: string]: any;
}

interface UploadResult {
  created?: number;
  updated?: number;
  skipped?: SkippedRow[];
  [key: string]: any;
}

export const ManagerBlocksSection: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState('');

  const farmName = (user as any)?.farm?.name ?? (user?.farm_id ? `Farm #${user.farm_id}` : '—');

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      await apiService.downloadBlocksCsvTemplate();
      toast.success('Template downloaded');
    } catch {
      toast.error('Failed to download template');
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setResult(null);
    setUploadError('');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploadError('');
    setResult(null);
    setUploading(true);
    try {
      const res = await apiService.uploadBlocksCsv(selectedFile);
      setResult(res);
      toast.success('CSV uploaded successfully');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Upload failed';
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-green-600" />
            Blocks — CSV Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Farm badge */}
          <div className="inline-flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
            <LayoutGrid className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium">Farm:</span>
            <span>{farmName}</span>
          </div>

          {/* Step 1 — Download template */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700">Step 1 — Download template</p>
            <p className="text-xs text-gray-400">Fill in the CSV template and upload it to create or update blocks in bulk.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 gap-1.5"
              onClick={handleDownloadTemplate}
              disabled={downloading}
            >
              {downloading ? <LoadingSpinner size="sm" /> : <Download className="w-3.5 h-3.5" />}
              Download blocks_template.csv
            </Button>
          </div>

          <div className="border-t border-gray-100" />

          {/* Step 2 — Upload CSV */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Step 2 — Upload filled CSV</p>

            <div className="flex items-center gap-3 flex-wrap">
              <label
                className="flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-500 hover:border-green-400 hover:text-green-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                {selectedFile ? selectedFile.name : 'Choose CSV file…'}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {selectedFile && (
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                >
                  {uploading ? <LoadingSpinner size="sm" /> : <Upload className="w-3.5 h-3.5" />}
                  {uploading ? 'Uploading…' : 'Upload'}
                </Button>
              )}
            </div>

            {uploadError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {uploadError}
              </div>
            )}
          </div>

          {/* Result panel */}
          {result && (
            <div className="space-y-3 border border-gray-100 rounded-lg p-4 bg-gray-50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Upload Result</p>

              <div className="flex flex-wrap gap-3">
                {result.created != null && (
                  <div className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {result.created} block{result.created !== 1 ? 's' : ''} created
                  </div>
                )}
                {result.updated != null && (
                  <div className="flex items-center gap-1.5 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {result.updated} block{result.updated !== 1 ? 's' : ''} updated
                  </div>
                )}
                {result.skipped != null && result.skipped.length > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {result.skipped.length} row{result.skipped.length !== 1 ? 's' : ''} skipped
                  </div>
                )}
              </div>

              {result.skipped && result.skipped.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-amber-700">Skipped rows:</p>
                  <div className="rounded border border-amber-200 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-amber-50 border-b border-amber-200">
                          <th className="text-left px-3 py-2 text-amber-800 font-medium">Row</th>
                          <th className="text-left px-3 py-2 text-amber-800 font-medium">Code</th>
                          <th className="text-left px-3 py-2 text-amber-800 font-medium">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.skipped.map((row, i) => (
                          <tr key={i} className="border-b border-amber-100 last:border-0 bg-white">
                            <td className="px-3 py-2 text-gray-600">{row.row ?? '—'}</td>
                            <td className="px-3 py-2 font-mono text-gray-700">{row.code ?? '—'}</td>
                            <td className="px-3 py-2 text-red-600">{row.reason ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};
