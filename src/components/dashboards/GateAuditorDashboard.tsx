"use client";

import React, { useState, useCallback } from 'react';
import { ShieldCheck, PackageCheck, PackageOpen, RefreshCw, CheckCircle2, AlertCircle, ChevronRight, ClipboardList } from 'lucide-react';
import { SharedGatePassSection } from './sections/SharedGatePassSection';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Layout } from '../layout/Layout';
import { useApi } from '../../hooks';
import apiService from '../../services/api';
import { getApiError } from '../../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface Props { user: any; onLogout: () => void; }

const SIDEBAR = [
  { id: 'inbound',     label: 'Inbound (GRN)',  icon: PackageCheck  },
  { id: 'outbound',    label: 'Outbound (GIN)', icon: PackageOpen   },
  { id: 'gate_passes', label: 'Gate Passes',    icon: ClipboardList },
];

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  draft:               'bg-gray-100 text-gray-600',
  pending_fm_approval: 'bg-yellow-100 text-yellow-700',
  approved:            'bg-green-100 text-green-700',
  cardex_updated:      'bg-blue-100 text-blue-700',
  completed:           'bg-emerald-100 text-emerald-800',
  prepared:            'bg-yellow-100 text-yellow-700',
  signed:              'bg-orange-100 text-orange-700',
  dispatched:          'bg-blue-100 text-blue-700',
  issued:              'bg-emerald-100 text-emerald-800',
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLOR[status?.toLowerCase()] ?? 'bg-gray-100 text-gray-500';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

// ── Inbound panel (GRNs) ──────────────────────────────────────────────────────

function InboundPanel() {
  const fetchGrns = useCallback(() => apiService.getGrns(), []);
  const { data, loading, error, refetch } = useApi(fetchGrns);
  const list: any[] = Array.isArray(data) ? data : [];

  const [selected, setSelected]         = useState<any>(null);
  const [showDialog, setShowDialog]     = useState(false);
  const [notes, setNotes]               = useState('');
  const [confirming, setConfirming]     = useState(false);
  const [actionError, setActionError]   = useState('');

  const handleConfirm = async () => {
    if (!selected) return;
    setConfirming(true); setActionError('');
    try {
      await apiService.gateConfirmGrn(selected.id, notes.trim() || undefined);
      toast.success(`GRN ${selected.grn_number} — gate entry confirmed`);
      setShowDialog(false); setNotes(''); setSelected(null); refetch();
    } catch (err: any) {
      setActionError(getApiError(err, 'Failed to confirm'));
    } finally { setConfirming(false); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-green-600" />
              Inbound Deliveries (GRN)
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Verify goods arriving at the gate match the GRN quantities. Confirm when physically verified.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <Alert variant="destructive" className="mx-4 mb-3">
              <AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <PackageCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No GRNs found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs">GRN No.</TableHead>
                  <TableHead className="text-xs">Supplier</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Gate</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((grn: any) => (
                  <TableRow
                    key={grn.id}
                    className="cursor-pointer hover:bg-green-50/40"
                    onClick={() => setSelected(grn)}
                  >
                    <TableCell>
                      <span className="font-mono text-xs bg-green-50 border border-green-200 text-green-800 px-1.5 py-0.5 rounded">
                        {grn.grn_number ?? `GRN #${grn.id}`}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {grn.supplier_name ?? '—'}
                    </TableCell>
                    <TableCell><StatusBadge status={grn.status} /></TableCell>
                    <TableCell>
                      {grn.gate_confirmed_at ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Confirmed
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Pending</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">
                      {grn.created_at ? new Date(grn.created_at).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell><ChevronRight className="w-3.5 h-3.5 text-gray-300" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail sheet */}
      <Sheet open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
        <SheetContent className="sm:max-w-[480px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <PackageCheck className="w-4 h-4 text-green-600" />
                  {selected.grn_number ?? `GRN #${selected.id}`}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-1">
                  <StatusBadge status={selected.status} />
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 text-sm">
                {/* Gate confirmation banner */}
                {selected.gate_confirmed_at ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-xs text-emerald-800">
                    <p className="font-semibold flex items-center gap-1 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Gate Confirmed
                    </p>
                    <p>Confirmed on {new Date(selected.gate_confirmed_at).toLocaleString()}</p>
                    {selected.gate_notes && <p className="mt-1 text-emerald-700">"{selected.gate_notes}"</p>}
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800">
                    <p className="font-semibold mb-1">Not yet confirmed at gate</p>
                    <p>Verify the physical quantities against this GRN before confirming.</p>
                  </div>
                )}

                {/* Meta */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Supplier</p>
                    <p className="font-medium">{selected.supplier_name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Receipt Type</p>
                    <p className="font-medium capitalize">{selected.receipt_type?.replace(/_/g, ' ') ?? '—'}</p>
                  </div>
                  {selected.lpo_number && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Linked LPO</p>
                      <p className="font-mono text-sm text-amber-700">{selected.lpo_number}</p>
                    </div>
                  )}
                  {selected.supplier_dn_reference && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Supplier DN Ref</p>
                      <p className="font-mono text-sm">{selected.supplier_dn_reference}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Items */}
                {Array.isArray(selected.items) && selected.items.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Items Received</p>
                    <div className="space-y-1.5">
                      {selected.items.map((item: any, i: number) => (
                        <div key={i} className="bg-gray-50 rounded px-3 py-2 flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-800">{item.item_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Ordered: {item.quantity_ordered} — Accepted: {item.quantity_accepted ?? item.quantity_received ?? '—'} {item.unit}
                            </p>
                          </div>
                          {item.quantity_rejected > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {item.quantity_rejected} rejected
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirm action */}
                {!selected.gate_confirmed_at && (
                  <>
                    <Separator />
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white gap-1.5"
                      onClick={() => { setActionError(''); setShowDialog(true); }}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Confirm Gate Entry
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirm dialog */}
      <Dialog open={showDialog} onOpenChange={open => { if (!open) { setShowDialog(false); setNotes(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-4 h-4" /> Confirm Gate Entry
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-gray-600">
              Confirming that goods in <strong>{selected?.grn_number}</strong> have been physically verified at the gate. This is for compliance records only.
            </p>
            {actionError && <p className="text-xs text-red-600">{actionError}</p>}
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional observation notes…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setNotes(''); }}>Cancel</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={confirming}
              onClick={handleConfirm}
            >
              {confirming ? 'Confirming…' : 'Confirm Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Outbound panel (GINs) ─────────────────────────────────────────────────────

function OutboundPanel() {
  const fetchGins = useCallback(() => apiService.getGins(), []);
  const { data, loading, error, refetch } = useApi(fetchGins);
  const list: any[] = Array.isArray(data) ? data : [];

  const [selected, setSelected]         = useState<any>(null);
  const [showDialog, setShowDialog]     = useState(false);
  const [notes, setNotes]               = useState('');
  const [confirming, setConfirming]     = useState(false);
  const [actionError, setActionError]   = useState('');

  const handleConfirm = async () => {
    if (!selected) return;
    setConfirming(true); setActionError('');
    try {
      await apiService.gateConfirmGin(selected.id, notes.trim() || undefined);
      toast.success(`GIN ${selected.gin_number} — gate exit confirmed`);
      setShowDialog(false); setNotes(''); setSelected(null); refetch();
    } catch (err: any) {
      setActionError(getApiError(err, 'Failed to confirm'));
    } finally { setConfirming(false); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PackageOpen className="w-4 h-4 text-orange-600" />
              Outbound Issuances (GIN)
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Verify goods leaving the farm gate match the GIN. Confirm when physically verified at exit.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <Alert variant="destructive" className="mx-4 mb-3">
              <AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <PackageOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No GINs found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs">GIN No.</TableHead>
                  <TableHead className="text-xs">Purpose</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Gate</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((gin: any) => (
                  <TableRow
                    key={gin.id}
                    className="cursor-pointer hover:bg-orange-50/40"
                    onClick={() => setSelected(gin)}
                  >
                    <TableCell>
                      <span className="font-mono text-xs bg-orange-50 border border-orange-200 text-orange-800 px-1.5 py-0.5 rounded">
                        {gin.gin_number ?? `GIN #${gin.id}`}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700 max-w-[140px] truncate">
                      {gin.purpose ?? '—'}
                    </TableCell>
                    <TableCell><StatusBadge status={gin.status} /></TableCell>
                    <TableCell>
                      {gin.gate_confirmed_at ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Confirmed
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Pending</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">
                      {gin.created_at ? new Date(gin.created_at).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell><ChevronRight className="w-3.5 h-3.5 text-gray-300" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail sheet */}
      <Sheet open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
        <SheetContent className="sm:max-w-[480px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <PackageOpen className="w-4 h-4 text-orange-600" />
                  {selected.gin_number ?? `GIN #${selected.id}`}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-1">
                  <StatusBadge status={selected.status} />
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 text-sm">
                {/* Gate confirmation banner */}
                {selected.gate_confirmed_at ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-xs text-emerald-800">
                    <p className="font-semibold flex items-center gap-1 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Gate Exit Confirmed
                    </p>
                    <p>Confirmed on {new Date(selected.gate_confirmed_at).toLocaleString()}</p>
                    {selected.gate_notes && <p className="mt-1 text-emerald-700">"{selected.gate_notes}"</p>}
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800">
                    <p className="font-semibold mb-1">Exit not yet confirmed at gate</p>
                    <p>Verify the physical quantities match this GIN before confirming exit.</p>
                  </div>
                )}

                {/* Meta */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 mb-0.5">Purpose</p>
                    <p className="font-medium">{selected.purpose ?? '—'}</p>
                  </div>
                  {selected.issued_to_name && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Issued To</p>
                      <p className="font-medium">{selected.issued_to_name}</p>
                    </div>
                  )}
                  {selected.tv_number && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Transport Voucher</p>
                      <p className="font-mono text-sm text-blue-700">{selected.tv_number}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Items */}
                {Array.isArray(selected.items) && selected.items.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Items Issued</p>
                    <div className="space-y-1.5">
                      {selected.items.map((item: any, i: number) => (
                        <div key={i} className="bg-gray-50 rounded px-3 py-2 flex justify-between items-center">
                          <p className="font-medium text-gray-800">{item.item_name}</p>
                          <span className="text-sm text-gray-600 font-semibold">
                            {item.quantity_issued} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirm action */}
                {!selected.gate_confirmed_at && (
                  <>
                    <Separator />
                    <Button
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-1.5"
                      onClick={() => { setActionError(''); setShowDialog(true); }}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Confirm Gate Exit
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirm dialog */}
      <Dialog open={showDialog} onOpenChange={open => { if (!open) { setShowDialog(false); setNotes(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-700">
              <CheckCircle2 className="w-4 h-4" /> Confirm Gate Exit
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-gray-600">
              Confirming that goods in <strong>{selected?.gin_number}</strong> have physically left the farm gate as recorded. This is for compliance records only.
            </p>
            {actionError && <p className="text-xs text-red-600">{actionError}</p>}
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional observation notes…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setNotes(''); }}>Cancel</Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              disabled={confirming}
              onClick={handleConfirm}
            >
              {confirming ? 'Confirming…' : 'Confirm Exit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export function GateAuditorDashboard({ user, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState('inbound');

  return (
    <ErrorBoundary>
      <Layout
        user={user}
        onLogout={onLogout}
        sidebarItems={SIDEBAR}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        title="Gate Auditor"
      >
        <div className={activeTab !== 'inbound' ? 'hidden' : ''}>
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Inbound Deliveries</h2>
              <p className="text-xs text-gray-500">GRNs arriving at the farm gate — verify and confirm</p>
            </div>
          </div>
          <InboundPanel />
        </div>

        <div className={activeTab !== 'outbound' ? 'hidden' : ''}>
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Outbound Issuances</h2>
              <p className="text-xs text-gray-500">GINs leaving the farm gate — verify and confirm exit</p>
            </div>
          </div>
          <OutboundPanel />
        </div>

        <div className={activeTab !== 'gate_passes' ? 'hidden' : ''}>
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-violet-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Gate Passes</h2>
              <p className="text-xs text-gray-500">Monitor personnel and vehicle movement authorisations at the gate</p>
            </div>
          </div>
          <SharedGatePassSection userRole="gate_auditor" />
        </div>
      </Layout>
    </ErrorBoundary>
  );
}
