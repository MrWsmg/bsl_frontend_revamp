"use client";

import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { getApiError } from '../../../utils';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Pagination, usePagination } from '../../common/Pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeftRight, RefreshCw, AlertCircle, Truck, PackageCheck, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface Props { userRole: string; }

const CAN_DISPATCH = ['farm_clerk', 'admin'];
const CAN_RECEIVE  = ['farm_clerk', 'admin'];

const TRANSFER_STATUS_COLORS: Record<string, string> = {
  pending:          'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending_approval: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending_inter_farm:'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved:         'bg-green-100 text-green-800 border-green-200',
  dispatched:       'bg-blue-100 text-blue-800 border-blue-200',
  received:         'bg-teal-100 text-teal-800 border-teal-200',
  rejected:         'bg-red-100 text-red-800 border-red-200',
};

function StatusBadge({ status }: { status: string }) {
  const cls = TRANSFER_STATUS_COLORS[status?.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export const SharedTransferSection: React.FC<Props> = ({ userRole }) => {
  const canDispatch = CAN_DISPATCH.includes(userRole);
  const canReceive  = CAN_RECEIVE.includes(userRole);

  const [selected, setSelected] = useState<any>(null);
  const [actionBusy, setActionBusy] = useState<number | null>(null);

  const fetchTransfers = useCallback(() => apiService.getInternalTransfers(), []);
  const { data: transfers, loading, error, refetch } = useApi(fetchTransfers);
  const list = Array.isArray(transfers) ? transfers : [];

  // Client-side pagination over the transfers list.
  const {
    paginatedItems: pagedDocs,
    currentPage, setCurrentPage,
    itemsPerPage, setItemsPerPage,
    totalPages, totalItems,
  } = usePagination<any>(list, 25);

  const act = async (id: number, action: () => Promise<any>, successMsg: string) => {
    setActionBusy(id);
    try { await action(); toast.success(successMsg); refetch(); setSelected(null); }
    catch (e: any) { toast.error(getApiError(e, 'Action failed')); }
    finally { setActionBusy(null); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
              Internal Transfers
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
              <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No transfers found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs">Transfer No.</TableHead>
                  <TableHead className="text-xs">From</TableHead>
                  <TableHead className="text-xs">To</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                  <TableHead className="text-xs w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedDocs.map((t: any) => {
                  const status = t.status?.toLowerCase();
                  const isApproved   = status === 'approved';
                  const isDispatched = status === 'dispatched';
                  return (
                    <TableRow key={t.id} className="hover:bg-indigo-50/40">
                      <TableCell className="cursor-pointer" onClick={() => setSelected(t)}>
                        <span className="font-mono text-xs bg-indigo-50 border border-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded">
                          {t.transfer_number ?? `TRF #${t.id}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700 cursor-pointer" onClick={() => setSelected(t)}>
                        {t.from_farm?.name ?? `Farm #${t.from_farm_id}`}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700 cursor-pointer" onClick={() => setSelected(t)}>
                        {t.to_farm?.name ?? `Farm #${t.to_farm_id}`}
                      </TableCell>
                      <TableCell className="cursor-pointer" onClick={() => setSelected(t)}>
                        <StatusBadge status={t.status} />
                      </TableCell>
                      <TableCell className="text-xs text-gray-400 cursor-pointer" onClick={() => setSelected(t)}>
                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {canDispatch && isApproved && (
                            <Button size="sm" variant="outline" className="text-xs h-7 text-blue-700 border-blue-200 hover:bg-blue-50 gap-1"
                              disabled={actionBusy === t.id}
                              onClick={() => act(t.id, () => apiService.dispatchInterFarmTransfer(t.id), 'Transfer dispatched')}>
                              <Truck className="w-3 h-3" />{actionBusy === t.id ? '…' : 'Dispatch'}
                            </Button>
                          )}
                          {canReceive && isDispatched && (
                            <Button size="sm" variant="outline" className="text-xs h-7 text-teal-700 border-teal-200 hover:bg-teal-50 gap-1"
                              disabled={actionBusy === t.id}
                              onClick={() => act(t.id, () => apiService.receiveInterFarmTransfer(t.id), 'Transfer received — GRN created')}>
                              <PackageCheck className="w-3 h-3" />{actionBusy === t.id ? '…' : 'Receive'}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="cursor-pointer" onClick={() => setSelected(t)}>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {totalItems > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          {selected && (() => {
            const status = selected.status?.toLowerCase();
            const isApproved   = status === 'approved';
            const isDispatched = status === 'dispatched';
            return (
              <>
                <SheetHeader className="mb-4">
                  <SheetTitle className="flex items-center gap-2 text-base">
                    <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                    {selected.transfer_number ?? `TRF #${selected.id}`}
                  </SheetTitle>
                  <SheetDescription><StatusBadge status={selected.status} /></SheetDescription>
                </SheetHeader>
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-xs text-gray-400 mb-0.5">From Farm</p><p className="font-medium">{selected.from_farm?.name ?? `Farm #${selected.from_farm_id}`}</p></div>
                    <div><p className="text-xs text-gray-400 mb-0.5">To Farm</p><p className="font-medium">{selected.to_farm?.name ?? `Farm #${selected.to_farm_id}`}</p></div>
                    <div><p className="text-xs text-gray-400 mb-0.5">Requested By</p><p className="text-gray-700">{selected.requested_by?.full_name ?? '—'}</p></div>
                    <div><p className="text-xs text-gray-400 mb-0.5">Date</p><p className="text-gray-700">{selected.created_at ? new Date(selected.created_at).toLocaleDateString() : '—'}</p></div>
                  </div>
                  {selected.notes && (
                    <div className="bg-gray-50 border rounded p-3">
                      <p className="text-xs text-gray-400 mb-1">Notes</p>
                      <p className="text-sm text-gray-700">{selected.notes}</p>
                    </div>
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
                              <TableHead className="text-xs">Qty</TableHead>
                              <TableHead className="text-xs">Unit</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selected.items.map((item: any, i: number) => (
                              <TableRow key={i}>
                                <TableCell className="text-xs">{item.item_name}</TableCell>
                                <TableCell className="text-xs">{item.quantity}</TableCell>
                                <TableCell className="text-xs">{item.unit}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                  {canDispatch && isApproved && (
                    <>
                      <Separator />
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={actionBusy === selected.id}
                        onClick={() => act(selected.id, () => apiService.dispatchInterFarmTransfer(selected.id), 'Transfer dispatched')}>
                        <Truck className="w-4 h-4 mr-1.5" />
                        {actionBusy === selected.id ? 'Dispatching…' : 'Dispatch Transfer'}
                      </Button>
                    </>
                  )}
                  {canReceive && isDispatched && (
                    <>
                      <Separator />
                      <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" disabled={actionBusy === selected.id}
                        onClick={() => act(selected.id, () => apiService.receiveInterFarmTransfer(selected.id), 'Transfer received — GRN created')}>
                        <PackageCheck className="w-4 h-4 mr-1.5" />
                        {actionBusy === selected.id ? 'Receiving…' : 'Receive → Create GRN'}
                      </Button>
                    </>
                  )}
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
};
