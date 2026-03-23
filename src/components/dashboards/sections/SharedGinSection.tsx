"use client";

import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { getApiError } from '../../../utils';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PackageOpen, RefreshCw, AlertCircle, CheckCircle2, XCircle, SendHorizontal, ChevronRight, AlertTriangle, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { DocLink } from '@/components/procurement/DocLink';

interface Props { userRole: string; }

const CAN_APPROVE    = ['manager', 'admin'];
const CAN_ISSUE      = ['farm_clerk', 'admin'];
const CAN_ATTACH_TV  = ['farm_clerk', 'admin'];

const GIN_STATUS_COLORS: Record<string, string> = {
  pending:          'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending_approval: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved:         'bg-green-100 text-green-800 border-green-200',
  issued:           'bg-teal-100 text-teal-800 border-teal-200',
  rejected:         'bg-red-100 text-red-800 border-red-200',
};

function StatusBadge({ status }: { status: string }) {
  const cls = GIN_STATUS_COLORS[status?.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export const SharedGinSection: React.FC<Props> = ({ userRole }) => {
  const canApprove   = CAN_APPROVE.includes(userRole);
  const canIssue     = CAN_ISSUE.includes(userRole);
  const canAttachTV  = CAN_ATTACH_TV.includes(userRole);

  const [selected, setSelected]           = useState<any>(null);
  const [rejectTarget, setRejectTarget]   = useState<number | null>(null);
  const [rejectReason, setRejectReason]   = useState('');
  const [actionBusy, setActionBusy]       = useState<number | null>(null);
  const [showAttachTV, setShowAttachTV]   = useState(false);
  const [attachTVId, setAttachTVId]       = useState('');
  const [attachingTV, setAttachingTV]     = useState(false);

  const fetchGins = useCallback(() => apiService.getGins(), []);
  const { data: gins, loading, error, refetch } = useApi(fetchGins);
  const list = Array.isArray(gins) ? gins : [];

  const handleApprove = async (id: number) => {
    setActionBusy(id);
    try { await apiService.approveGin(id); toast.success('GIN approved'); refetch(); }
    catch (e: any) { toast.error(getApiError(e, 'Failed to approve')); }
    finally { setActionBusy(null); }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setActionBusy(rejectTarget);
    try { await apiService.rejectGin(rejectTarget, rejectReason); toast.success('GIN rejected'); setRejectTarget(null); setRejectReason(''); refetch(); }
    catch (e: any) { toast.error(getApiError(e, 'Failed to reject')); }
    finally { setActionBusy(null); }
  };

  const handleIssue = async (id: number) => {
    setActionBusy(id);
    try { await apiService.issueGin(id); toast.success('GIN issued — CARDEX reduced'); refetch(); }
    catch (e: any) { toast.error(getApiError(e, 'Failed to issue')); }
    finally { setActionBusy(null); }
  };

  const handleAttachTV = async () => {
    if (!selected || !attachTVId.trim()) return;
    setAttachingTV(true);
    try {
      await apiService.attachTVtoGIN(selected.id, parseInt(attachTVId));
      toast.success('TV attached to GIN');
      setShowAttachTV(false); setAttachTVId('');
      refetch();
      setSelected((prev: any) => prev ? { ...prev, tv_id: parseInt(attachTVId) } : prev);
    } catch (e: any) {
      toast.error(getApiError(e, 'Failed to attach TV'));
    } finally { setAttachingTV(false); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <PackageOpen className="w-4 h-4 text-amber-600" />
              Goods Issue Notes (GIN)
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => refetch()}><RefreshCw className="w-3.5 h-3.5" /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && <Alert variant="destructive" className="mx-4 mb-3"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <PackageOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No issue notes found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs">GIN No.</TableHead>
                  <TableHead className="text-xs">Farm</TableHead>
                  <TableHead className="text-xs">SIMR</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                  <TableHead className="text-xs w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((gin: any) => {
                  const isPendingApproval = ['pending', 'pending_approval'].includes(gin.status?.toLowerCase());
                  const isApproved = gin.status?.toLowerCase() === 'approved';
                  return (
                    <TableRow key={gin.id} className="hover:bg-amber-50/40">
                      <TableCell className="cursor-pointer" onClick={() => setSelected(gin)}>
                        <span className="font-mono text-xs bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                          {gin.gin_number ?? `GIN #${gin.id}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700 cursor-pointer" onClick={() => setSelected(gin)}>{gin.farm?.name ?? `Farm #${gin.farm_id}`}</TableCell>
                      <TableCell className="text-xs font-mono text-gray-500 cursor-pointer" onClick={() => setSelected(gin)}>
                        {gin.simr_id ? `SIMR #${gin.simr_id}` : '—'}
                      </TableCell>
                      <TableCell className="cursor-pointer" onClick={() => setSelected(gin)}><StatusBadge status={gin.status} /></TableCell>
                      <TableCell className="text-xs text-gray-400 cursor-pointer" onClick={() => setSelected(gin)}>
                        {gin.created_at ? new Date(gin.created_at).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {canApprove && isPendingApproval && (
                            <>
                              <Button size="sm" variant="outline" className="text-xs h-7 text-green-700 border-green-200 hover:bg-green-50" disabled={actionBusy === gin.id} onClick={() => handleApprove(gin.id)}>
                                {actionBusy === gin.id ? '…' : '✓ Approve'}
                              </Button>
                              <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50" disabled={actionBusy === gin.id} onClick={() => setRejectTarget(gin.id)}>
                                ✕
                              </Button>
                            </>
                          )}
                          {canIssue && isApproved && (
                            <Button size="sm" variant="outline" className="text-xs h-7 text-teal-700 border-teal-200 hover:bg-teal-50 gap-1" disabled={actionBusy === gin.id} onClick={() => handleIssue(gin.id)}>
                              <SendHorizontal className="w-3 h-3" />{actionBusy === gin.id ? '…' : 'Issue'}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="cursor-pointer" onClick={() => setSelected(gin)}><ChevronRight className="w-3.5 h-3.5 text-gray-300" /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <PackageOpen className="w-4 h-4 text-amber-600" />
                  {selected.gin_number ?? `GIN #${selected.id}`}
                </SheetTitle>
                <SheetDescription><StatusBadge status={selected.status} /></SheetDescription>
              </SheetHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-gray-400 mb-0.5">Farm</p><p className="font-medium">{selected.farm?.name ?? `Farm #${selected.farm_id}`}</p></div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Linked SIMR</p>
                    {selected.simr_id ? (
                      <DocLink label={selected.simr_number ?? `SIMR #${selected.simr_id}`} />
                    ) : <span className="text-muted-foreground text-sm">—</span>}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Issued to</p>
                    <p className="text-gray-700">{selected.issued_to?.full_name ?? selected.issued_to_name ?? '—'}</p>
                  </div>
                  <div><p className="text-xs text-gray-400 mb-0.5">Issued at</p><p className="text-gray-700">{selected.issued_at ? new Date(selected.issued_at).toLocaleDateString() : '—'}</p></div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Transport Voucher</p>
                    {selected.tv_id ? (
                      <DocLink label={selected.tv_number ?? `TV #${selected.tv_id}`} />
                    ) : <span className="text-muted-foreground text-sm">—</span>}
                  </div>
                </div>

                {selected.tv_required && !selected.tv_id && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded p-3 text-amber-800 text-xs">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                    <span>A Transport Voucher is required for this GIN but has not been attached.</span>
                  </div>
                )}

                {canAttachTV && !selected.tv_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => setShowAttachTV(true)}
                  >
                    <Link2 className="w-3.5 h-3.5" /> Attach TV
                  </Button>
                )}
                {selected.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-xs text-red-500 mb-1">Rejection Reason</p>
                    <p className="text-sm text-red-700">{selected.rejection_reason}</p>
                  </div>
                )}
                {Array.isArray(selected.items) && selected.items.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Items</p>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="text-xs">Item</TableHead>
                            <TableHead className="text-xs">Requested</TableHead>
                            <TableHead className="text-xs">Issued</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selected.items.map((item: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs">{item.item_name}</TableCell>
                              <TableCell className="text-xs">{item.quantity_requested} {item.unit}</TableCell>
                              <TableCell className="text-xs font-semibold text-teal-700">{item.quantity_issued ?? item.quantity_requested} {item.unit}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
                {canApprove && ['pending', 'pending_approval'].includes(selected.status?.toLowerCase()) && (
                  <>
                    <Separator />
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={actionBusy === selected.id}
                        onClick={() => { handleApprove(selected.id); setSelected(null); }}>
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve GIN
                      </Button>
                      <Button variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => { setRejectTarget(selected.id); setSelected(null); }}>
                        <XCircle className="w-4 h-4 mr-1.5" /> Reject
                      </Button>
                    </div>
                  </>
                )}
                {canIssue && selected.status?.toLowerCase() === 'approved' && (
                  <>
                    <Separator />
                    <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" disabled={actionBusy === selected.id}
                      onClick={() => { handleIssue(selected.id); setSelected(null); }}>
                      <SendHorizontal className="w-4 h-4 mr-1.5" />
                      {actionBusy === selected.id ? 'Issuing…' : 'Issue GIN → Reduce CARDEX'}
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Reject Dialog */}
      <Dialog open={rejectTarget !== null} onOpenChange={open => { if (!open) { setRejectTarget(null); setRejectReason(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-red-700">Reject GIN</DialogTitle></DialogHeader>
          <div className="py-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
            <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Explain why this GIN is being rejected…" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(''); }}>Cancel</Button>
            <Button variant="destructive" disabled={!rejectReason.trim() || !!actionBusy} onClick={handleReject}>
              {actionBusy ? 'Rejecting…' : 'Confirm Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attach TV Dialog */}
      <Dialog open={showAttachTV} onOpenChange={open => { if (!open) { setShowAttachTV(false); setAttachTVId(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-4 h-4" /> Attach Transport Voucher
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-gray-600">Enter the ID of the Transport Voucher to link to this GIN.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TV ID *</label>
              <Input
                type="number"
                min="1"
                value={attachTVId}
                onChange={e => setAttachTVId(e.target.value)}
                placeholder="Transport Voucher ID"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAttachTV(false); setAttachTVId(''); }} disabled={attachingTV}>Cancel</Button>
            <Button onClick={handleAttachTV} disabled={!attachTVId.trim() || attachingTV} className="bg-amber-600 hover:bg-amber-700 text-white">
              {attachingTV ? 'Attaching…' : 'Attach TV'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
