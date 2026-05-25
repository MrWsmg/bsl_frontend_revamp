"use client";

import React, { useState, useCallback, useRef } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '../../ui/sonner';
import {
  ArrowLeft, Upload, Plus, CheckCircle2, Clock, AlertTriangle,
  FileSpreadsheet, BarChart3, Package, Play, ClipboardList, Download,
} from 'lucide-react';
import {
  FertilizerProgram,
  FertilizerProgramSchedule,
  FertilizerProgramReport,
  FertilizerProgramSummary,
  FertilizerProgramRound,
} from '../../../types';

const CAN_WRITE    = new Set(['admin', 'stock', 'farm_clerk']);
const CAN_ACTIVATE = new Set(['admin', 'manager', 'stock', 'farm_clerk']);

type MainView = 'list' | 'detail';
type SubView  = 'schedule' | 'report' | 'summary';

function fmt(n: number | null | undefined, dec = 0) {
  if (n == null) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: dec });
}

const STATUS_CLS: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-700',
  active:    'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
};

const SEASON_YEARS = [2024, 2025, 2026, 2027, 2028];

// ─── Round cell ────────────────────────────────────────────────────────────────

function RoundCell({
  round, canWrite, onApply,
}: {
  round: FertilizerProgramRound;
  canWrite: boolean;
  onApply: (r: FertilizerProgramRound) => void;
}) {
  const clickable = canWrite && (round.status === 'pending' || round.status === 'overdue');
  return (
    <div
      title={`${round.month_label}: ${round.status}`}
      onClick={() => clickable && onApply(round)}
      className={`flex items-center justify-center h-8 w-8 rounded mx-auto ${clickable ? 'cursor-pointer hover:bg-muted' : ''}`}
    >
      {round.status === 'applied'  && <CheckCircle2 className="w-5 h-5 text-green-500" />}
      {round.status === 'partial'  && <CheckCircle2 className="w-5 h-5 text-yellow-500" />}
      {round.status === 'overdue'  && <AlertTriangle className="w-5 h-5 text-red-500" />}
      {round.status === 'pending'  && <Clock className="w-5 h-5 text-muted-foreground" />}
    </div>
  );
}

// ─── Apply form ────────────────────────────────────────────────────────────────

interface ApplyFormProps {
  round: FertilizerProgramRound;
  blockName: string;
  onClose: () => void;
  onSaved: () => void;
}

const ApplyForm: React.FC<ApplyFormProps> = ({ round, blockName, onClose, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    applied_date:    new Date().toISOString().slice(0, 10),
    actual_npk_kg:   round.planned_npk_kg    != null ? String(round.planned_npk_kg)    : '',
    actual_blend1_kg: round.planned_blend1_kg != null ? String(round.planned_blend1_kg) : '',
    actual_blend2_kg: round.planned_blend2_kg != null ? String(round.planned_blend2_kg) : '',
    actual_blend3_kg: round.planned_blend3_kg != null ? String(round.planned_blend3_kg) : '',
    notes: '',
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.applyFertilizerRound(round.id, {
        applied_date:    form.applied_date,
        actual_npk_kg:    form.actual_npk_kg    ? Number(form.actual_npk_kg)    : undefined,
        actual_blend1_kg: form.actual_blend1_kg ? Number(form.actual_blend1_kg) : undefined,
        actual_blend2_kg: form.actual_blend2_kg ? Number(form.actual_blend2_kg) : undefined,
        actual_blend3_kg: form.actual_blend3_kg ? Number(form.actual_blend3_kg) : undefined,
        notes:            form.notes || undefined,
      });
      toast.success('Application recorded');
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Failed to record application');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-muted/50 rounded-md p-3 text-sm">
        <p><span className="text-muted-foreground">Block:</span> <strong>{blockName}</strong></p>
        <p><span className="text-muted-foreground">Round {round.round_number}:</span> <strong>{round.month_label}</strong></p>
        {(round.planned_npk_kg != null || round.planned_blend1_kg != null) && (
          <p className="mt-1 text-xs text-muted-foreground">
            Planned:{' '}
            {round.planned_npk_kg    != null && `NPK ${fmt(round.planned_npk_kg)}kg `}
            {round.planned_blend1_kg != null && `B1 ${fmt(round.planned_blend1_kg)}kg `}
            {round.planned_blend2_kg != null && `B2 ${fmt(round.planned_blend2_kg)}kg `}
            {round.planned_blend3_kg != null && `B3 ${fmt(round.planned_blend3_kg)}kg`}
          </p>
        )}
      </div>
      <div>
        <Label>Application Date *</Label>
        <Input type="date" value={form.applied_date} onChange={e => set('applied_date', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label>NPK (kg)</Label><Input type="number" min="0" step="0.1" value={form.actual_npk_kg}    onChange={e => set('actual_npk_kg', e.target.value)}    placeholder="0" /></div>
        <div><Label>Blend 1 (kg)</Label><Input type="number" min="0" step="0.1" value={form.actual_blend1_kg} onChange={e => set('actual_blend1_kg', e.target.value)} placeholder="0" /></div>
        <div><Label>Blend 2 (kg)</Label><Input type="number" min="0" step="0.1" value={form.actual_blend2_kg} onChange={e => set('actual_blend2_kg', e.target.value)} placeholder="0" /></div>
        <div><Label>Blend 3 (kg)</Label><Input type="number" min="0" step="0.1" value={form.actual_blend3_kg} onChange={e => set('actual_blend3_kg', e.target.value)} placeholder="0" /></div>
      </div>
      <div>
        <Label>Notes</Label>
        <Input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="e.g. Applied morning, soil moist" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Record Application'}</Button>
      </div>
    </div>
  );
};

// ─── Create program form ───────────────────────────────────────────────────────

interface CreateFormProps {
  farms: any[];
  onClose: () => void;
  onSaved: () => void;
}

const CreateForm: React.FC<CreateFormProps> = ({ farms, onClose, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ farm_id: '', season_year: '2026', tree_type: 'mature' as 'mature' | 'young' });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.farm_id) { toast.error('Farm is required'); return; }
    setSaving(true);
    try {
      await apiService.createFertilizerProgram({
        farm_id: Number(form.farm_id),
        season_year: Number(form.season_year),
        tree_type: form.tree_type,
      });
      toast.success('Program created');
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Failed to create program');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Farm *</Label>
        <Select value={form.farm_id} onValueChange={v => set('farm_id', v)}>
          <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
          <SelectContent>
            {(farms as any[]).map((f: any) => (
              <SelectItem key={f.farm_id ?? f.id} value={String(f.farm_id ?? f.id)}>{f.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Season Year *</Label>
        <Select value={form.season_year} onValueChange={v => set('season_year', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{SEASON_YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Tree Type *</Label>
        <div className="flex gap-2 mt-1">
          {(['mature', 'young'] as const).map(t => (
            <button key={t} type="button" onClick={() => set('tree_type', t)}
              className={`flex-1 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                form.tree_type === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:bg-muted'
              }`}>
              {t === 'mature' ? 'Mature Trees' : 'Young Trees'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Creating…' : 'Create Program'}</Button>
      </div>
    </div>
  );
};

// ─── Upload Excel form ─────────────────────────────────────────────────────────

interface UploadFormProps {
  onClose: () => void;
  onSaved: () => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ onClose, onSaved }) => {
  const [uploading, setUploading] = useState(false);
  const [seasonYear, setSeasonYear] = useState('2026');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) { toast.error('Select an Excel file first'); return; }
    setUploading(true);
    try {
      const res = await apiService.importFertilizerProgramsExcel(file, Number(seasonYear));
      setResult(res);
      onSaved();
    } catch (e: any) {
      toast.error(e.message || 'Import failed');
    } finally {
      setUploading(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-3">
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="font-medium text-green-800">Import Complete</p>
          <ul className="mt-2 text-sm text-green-700 space-y-1">
            <li>Programs created: <strong>{result.programs_created}</strong></li>
            <li>Blocks created: <strong>{result.blocks_created}</strong></li>
            <li>Blocks skipped: <strong>{result.blocks_skipped}</strong></li>
          </ul>
          {result.errors?.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-red-700">Errors:</p>
              <ul className="text-xs text-red-600 list-disc pl-4">
                {result.errors.map((err: string, i: number) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
        </div>
        <div className="flex justify-end"><Button onClick={onClose}>Close</Button></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Upload an Excel file with fertilizer programs and block schedules for the selected season.
      </p>
      <div>
        <Label>Season Year</Label>
        <Select value={seasonYear} onValueChange={setSeasonYear}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{SEASON_YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Excel File (.xlsx) *</Label>
        <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
        <div
          onClick={() => fileRef.current?.click()}
          className="mt-1 border-2 border-dashed border-border rounded-md p-6 text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
        >
          {file ? (
            <p className="text-sm font-medium">{file.name}</p>
          ) : (
            <>
              <FileSpreadsheet className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click to select .xlsx file</p>
            </>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleUpload} disabled={uploading || !file}>{uploading ? 'Importing…' : 'Import'}</Button>
      </div>
    </div>
  );
};

// ─── Add block form ────────────────────────────────────────────────────────────

interface AddBlockFormProps {
  programId: number;
  onClose: () => void;
  onSaved: () => void;
}

const AddBlockForm: React.FC<AddBlockFormProps> = ({ programId, onClose, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    block_name: '', area_ha: '', cherry_kg: '',
    npk_kg_per_ha: '', blend1_kg_per_ha: '', blend2_kg_per_ha: '', blend3_kg_per_ha: '',
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.block_name || !form.area_ha) { toast.error('Block name and area are required'); return; }
    setSaving(true);
    try {
      await apiService.addFertilizerProgramBlock(programId, {
        block_name:      form.block_name,
        area_ha:         Number(form.area_ha),
        cherry_kg:       form.cherry_kg       ? Number(form.cherry_kg)       : undefined,
        npk_kg_per_ha:   form.npk_kg_per_ha   ? Number(form.npk_kg_per_ha)   : undefined,
        blend1_kg_per_ha: form.blend1_kg_per_ha ? Number(form.blend1_kg_per_ha) : undefined,
        blend2_kg_per_ha: form.blend2_kg_per_ha ? Number(form.blend2_kg_per_ha) : undefined,
        blend3_kg_per_ha: form.blend3_kg_per_ha ? Number(form.blend3_kg_per_ha) : undefined,
      });
      toast.success('Block added — 4 rounds auto-computed');
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Failed to add block');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <Label>Block Name *</Label>
          <Input value={form.block_name} onChange={e => set('block_name', e.target.value)} placeholder="e.g. Block A1" />
        </div>
        <div>
          <Label>Area (ha) *</Label>
          <Input type="number" min="0" step="0.01" value={form.area_ha} onChange={e => set('area_ha', e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <Label>Cherry Yield (kg)</Label>
          <Input type="number" min="0" value={form.cherry_kg} onChange={e => set('cherry_kg', e.target.value)} placeholder="optional" />
        </div>
        <div>
          <Label>NPK kg/ha</Label>
          <Input type="number" min="0" step="0.1" value={form.npk_kg_per_ha} onChange={e => set('npk_kg_per_ha', e.target.value)} placeholder="0" />
        </div>
        <div>
          <Label>Blend 1 kg/ha</Label>
          <Input type="number" min="0" step="0.1" value={form.blend1_kg_per_ha} onChange={e => set('blend1_kg_per_ha', e.target.value)} placeholder="0" />
        </div>
        <div>
          <Label>Blend 2 kg/ha</Label>
          <Input type="number" min="0" step="0.1" value={form.blend2_kg_per_ha} onChange={e => set('blend2_kg_per_ha', e.target.value)} placeholder="0" />
        </div>
        <div>
          <Label>Blend 3 kg/ha</Label>
          <Input type="number" min="0" step="0.1" value={form.blend3_kg_per_ha} onChange={e => set('blend3_kg_per_ha', e.target.value)} placeholder="0" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Adding…' : 'Add Block'}</Button>
      </div>
    </div>
  );
};

// ─── Main section ──────────────────────────────────────────────────────────────

export const FertilizerProgramsSection: React.FC = () => {
  const { user } = useAuth();
  const role      = (user as any)?.role || '';
  const canWrite  = CAN_WRITE.has(role);
  const canActivate = CAN_ACTIVATE.has(role);

  const [seasonYear, setSeasonYear] = useState(2026);
  const [mainView, setMainView]     = useState<MainView>('list');
  const [subView, setSubView]       = useState<SubView>('schedule');
  const [selectedProgram, setSelectedProgram] = useState<FertilizerProgram | null>(null);

  const [scheduleData, setScheduleData]   = useState<FertilizerProgramSchedule | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [reportData, setReportData]       = useState<FertilizerProgramReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [summaryData, setSummaryData]     = useState<FertilizerProgramSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [applyTarget, setApplyTarget] = useState<{ round: FertilizerProgramRound; blockName: string } | null>(null);
  const [showCreate, setShowCreate]   = useState(false);
  const [showUpload, setShowUpload]   = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [templateDownloading, setTemplateDownloading] = useState(false);

  const getPrograms = useCallback(
    () => apiService.getFertilizerPrograms({ season_year: seasonYear }),
    [seasonYear]
  );
  const { data: programs, loading: programsLoading, refetch: refetchPrograms } = useApi(
    getPrograms, { dependencies: [seasonYear] }
  );

  const getFarms = useCallback(() => apiService.getFarms(), []);
  const { data: farms } = useApi(getFarms);

  // ── Navigation ──────────────────────────────────────────────────────────────

  const loadSchedule = async (prog: FertilizerProgram) => {
    setScheduleLoading(true);
    setScheduleData(null);
    try {
      setScheduleData(await apiService.getFertilizerProgramSchedule(prog.id));
    } catch (e: any) {
      toast.error(e.message || 'Failed to load schedule');
    } finally {
      setScheduleLoading(false);
    }
  };

  const loadReport = async (prog: FertilizerProgram) => {
    if (reportData) return;
    setReportLoading(true);
    try {
      setReportData(await apiService.getFertilizerProgramReport(prog.id));
    } catch (e: any) {
      toast.error(e.message || 'Failed to load report');
    } finally {
      setReportLoading(false);
    }
  };

  const loadSummary = async (prog: FertilizerProgram) => {
    if (summaryData) return;
    setSummaryLoading(true);
    try {
      setSummaryData(await apiService.getFertilizerProgramSummary(prog.id));
    } catch (e: any) {
      toast.error(e.message || 'Failed to load summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleViewProgram = (prog: FertilizerProgram) => {
    setSelectedProgram(prog);
    setSubView('schedule');
    setMainView('detail');
    setScheduleData(null);
    setReportData(null);
    setSummaryData(null);
    loadSchedule(prog);
  };

  const handleSubViewChange = (sv: SubView) => {
    setSubView(sv);
    if (!selectedProgram) return;
    if (sv === 'report')  loadReport(selectedProgram);
    if (sv === 'summary') loadSummary(selectedProgram);
  };

  const handleActivate = async (prog: FertilizerProgram) => {
    try {
      await apiService.activateFertilizerProgram(prog.id);
      toast.success('Program activated');
      refetchPrograms();
      if (selectedProgram?.id === prog.id) setSelectedProgram({ ...prog, status: 'active' });
    } catch (e: any) {
      toast.error(e.message || 'Failed to activate');
    }
  };

  const handleApplySaved = () => {
    setApplyTarget(null);
    if (selectedProgram) {
      setScheduleData(null);
      setReportData(null);
      setSummaryData(null);
      loadSchedule(selectedProgram);
    }
  };

  const handleBlockAdded = () => {
    if (selectedProgram) {
      setScheduleData(null);
      setReportData(null);
      setSummaryData(null);
      loadSchedule(selectedProgram);
    }
    refetchPrograms();
  };

  const handleTemplateDownload = async () => {
    setTemplateDownloading(true);
    try {
      await apiService.downloadFertilizerProgramTemplate();
    } catch (e: any) {
      toast.error(e.message || 'Failed to download template');
    } finally {
      setTemplateDownloading(false);
    }
  };

  // ── Detail view ─────────────────────────────────────────────────────────────

  if (mainView === 'detail' && selectedProgram) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setMainView('list')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div>
              <p className="font-semibold">{selectedProgram.farm_name || `Farm #${selectedProgram.farm_id}`}</p>
              <p className="text-sm text-muted-foreground">
                Season {selectedProgram.season_year} · {selectedProgram.tree_type} · {selectedProgram.total_blocks} blocks
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={STATUS_CLS[selectedProgram.status] || ''}>{selectedProgram.status}</Badge>
            {selectedProgram.status === 'draft' && canWrite && (
              <Button size="sm" variant="outline" onClick={() => setShowAddBlock(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Block
              </Button>
            )}
            {selectedProgram.status === 'draft' && canActivate && (
              <Button size="sm" variant="outline" onClick={() => handleActivate(selectedProgram)}>
                <Play className="w-3.5 h-3.5 mr-1" /> Activate
              </Button>
            )}
          </div>
        </div>

        {/* Sub-navigation */}
        <div className="flex gap-0 border-b">
          {([
            { id: 'schedule', label: 'Schedule',            icon: BarChart3    },
            { id: 'report',   label: 'Compliance Report',   icon: ClipboardList },
            { id: 'summary',  label: 'Procurement Summary', icon: Package      },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => handleSubViewChange(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                subView === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Schedule tab ── */}
        {subView === 'schedule' && (
          scheduleLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : !scheduleData ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No schedule data available</div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Applied</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-yellow-500" /> Partial</span>
                <span className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Overdue</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-muted-foreground" /> Pending</span>
                {canWrite && <span className="italic ml-2">Click pending/overdue cell to record application</span>}
              </div>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Block</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Area (ha)</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Cherry (kg)</TableHead>
                      {scheduleData.round_labels.map((label, i) => (
                        <TableHead key={i} className="text-center whitespace-nowrap text-xs">{label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduleData.blocks.map((block, bi) => (
                      <TableRow key={bi}>
                        <TableCell className="font-medium whitespace-nowrap">{block.block_name}</TableCell>
                        <TableCell className="text-right">{fmt(block.area_ha, 1)}</TableCell>
                        <TableCell className="text-right">{fmt(block.cherry_kg)}</TableCell>
                        {block.rounds.map((round, ri) => (
                          <TableCell key={ri} className="text-center p-1">
                            <RoundCell
                              round={round}
                              canWrite={canWrite}
                              onApply={r => setApplyTarget({ round: r, blockName: block.block_name })}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )
        )}

        {/* ── Report tab ── */}
        {subView === 'report' && (
          reportLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : !reportData ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No report data available</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Overall compliance:</span>
                <Badge className={
                  reportData.overall_compliance_pct >= 80 ? 'bg-green-600 text-white' :
                  reportData.overall_compliance_pct >= 50 ? 'bg-yellow-500 text-white' :
                  'bg-red-500 text-white'
                }>
                  {fmt(reportData.overall_compliance_pct, 1)}%
                </Badge>
              </div>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Block</TableHead>
                      <TableHead className="text-right">Planned (kg)</TableHead>
                      <TableHead className="text-right">Applied (kg)</TableHead>
                      <TableHead className="text-right">Compliance</TableHead>
                      <TableHead>Rounds</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.blocks.map((block, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{block.block_name}</TableCell>
                        <TableCell className="text-right">{fmt(block.planned_kg)}</TableCell>
                        <TableCell className="text-right">{fmt(block.applied_kg)}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={
                            block.compliance_pct >= 80 ? 'bg-green-600 text-white' :
                            block.compliance_pct >= 50 ? 'bg-yellow-500 text-white' :
                            'bg-red-500 text-white'
                          }>
                            {fmt(block.compliance_pct, 1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {block.rounds.map((r, ri) => (
                              <span key={ri} title={`R${r.round_number}: ${r.status}`} className="text-sm">
                                {r.status === 'applied' ? '✅' : r.status === 'partial' ? '🔶' : r.status === 'overdue' ? '⚠️' : '⏳'}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )
        )}

        {/* ── Summary tab ── */}
        {subView === 'summary' && (
          summaryLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : !summaryData ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No summary data available</div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Use these quantities to raise an SMR for this season's fertilizer requirement.
              </p>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Total Bags</TableHead>
                      <TableHead className="text-right">Total (kg)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(summaryData.products).map(([name, prod]) => (
                      <TableRow key={name}>
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell className="text-right">{fmt((prod as any).total_bags, 1)}</TableCell>
                        <TableCell className="text-right">{fmt((prod as any).total_kg)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {canWrite && (
                <div className="flex justify-end">
                  <Button size="sm" variant="outline"
                    onClick={() => toast.info('Navigate to GIN to raise a stock issue request for these quantities')}>
                    <Package className="w-4 h-4 mr-1" /> Raise SMR
                  </Button>
                </div>
              )}
            </div>
          )
        )}

        {/* Apply dialog */}
        <Dialog open={!!applyTarget} onOpenChange={o => { if (!o) setApplyTarget(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Record Fertilizer Application</DialogTitle></DialogHeader>
            {applyTarget && (
              <ApplyForm
                round={applyTarget.round}
                blockName={applyTarget.blockName}
                onClose={() => setApplyTarget(null)}
                onSaved={handleApplySaved}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Add block dialog */}
        <Dialog open={showAddBlock} onOpenChange={setShowAddBlock}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add Block to Program</DialogTitle></DialogHeader>
            <AddBlockForm
              programId={selectedProgram.id}
              onClose={() => setShowAddBlock(false)}
              onSaved={handleBlockAdded}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm">Season:</Label>
          <Select value={String(seasonYear)} onValueChange={v => setSeasonYear(Number(v))}>
            <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{SEASON_YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={handleTemplateDownload} disabled={templateDownloading}>
            <Download className="w-4 h-4 mr-1" /> {templateDownloading ? 'Downloading…' : 'Template'}
          </Button>
          {canWrite && (
            <>
              <Button size="sm" variant="outline" onClick={() => setShowUpload(true)}>
                <Upload className="w-4 h-4 mr-1" /> Upload Excel
              </Button>
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-1" /> New Program
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Programs table */}
      {programsLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Season</TableHead>
                <TableHead>Farm</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Blocks</TableHead>
                <TableHead className="text-right">Compliance</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!programs || (programs as any[]).length === 0) ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No fertilizer programs found for {seasonYear}
                  </TableCell>
                </TableRow>
              ) : (programs as FertilizerProgram[]).map(prog => (
                <TableRow key={prog.id}>
                  <TableCell>{prog.season_year}</TableCell>
                  <TableCell className="font-medium">{prog.farm_name || `Farm #${prog.farm_id}`}</TableCell>
                  <TableCell className="capitalize">{prog.tree_type}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_CLS[prog.status] || ''}>{prog.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{prog.total_blocks}</TableCell>
                  <TableCell className="text-right">
                    {prog.overall_compliance_pct != null ? `${fmt(prog.overall_compliance_pct, 1)}%` : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      {prog.status === 'draft' && canActivate && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleActivate(prog)}>
                          <Play className="w-3 h-3 mr-1" /> Activate
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleViewProgram(prog)}>
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Fertilizer Program</DialogTitle></DialogHeader>
          <CreateForm farms={farms || []} onClose={() => setShowCreate(false)} onSaved={refetchPrograms} />
        </DialogContent>
      </Dialog>

      {/* Upload dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Upload Fertilizer Program (Excel)</DialogTitle></DialogHeader>
          <UploadForm onClose={() => setShowUpload(false)} onSaved={refetchPrograms} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
