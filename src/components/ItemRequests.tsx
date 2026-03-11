"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, Clock, Filter, Package, User, Calendar, Wheat, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import apiService from '../services/api';
import { ItemRequest, Farm, SimrRequest, SimrItem } from '../types';
import { Pagination } from './common/Pagination';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SimrRequestForm from './SimrRequestForm';

interface ItemRequestsProps {
  farms: Farm[];
  useSimr?: boolean; // Toggle between legacy and SIMR format
}

export default function ItemRequests({ farms, useSimr = true }: ItemRequestsProps) {
  const [requests, setRequests] = useState<(ItemRequest | SimrRequest)[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedRequests, setExpandedRequests] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadRequests();
  }, [useSimr]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      // Both modes use the farm-clerk pending-requests endpoint
      const data = await apiService.getPendingItemRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading item requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: number) => {
    const confirmApprove = window.confirm('Are you sure you want to approve this request?');
    if (!confirmApprove) return;

    const loadingToast = toast.loading('Approving request...');
    try {
      await apiService.approveFarmClerkRequest(requestId);
      toast.success('Request approved successfully!', { id: loadingToast });
      loadRequests();
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast.error(error.response?.data?.detail || 'Failed to approve request. Please try again.', { id: loadingToast });
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (!reason) return;

    const loadingToast = toast.loading('Rejecting request...');
    try {
      await apiService.rejectFarmClerkRequest(requestId);
      toast.success('Request rejected successfully!', { id: loadingToast });
      loadRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast.error(error.response?.data?.detail || 'Failed to reject request. Please try again.', { id: loadingToast });
    }
  };

  const handleIssueRequest = async (requestId: number) => {
    const confirmIssue = window.confirm('Are you sure you want to issue these items? This will decrease inventory.');
    if (!confirmIssue) return;

    const loadingToast = toast.loading('Issuing items...');
    try {
      await apiService.issueItemRequest(requestId);
      toast.success('Items issued successfully!', { id: loadingToast });
      loadRequests();
    } catch (error: any) {
      console.error('Error issuing request:', error);
      toast.error(error.response?.data?.detail || 'Failed to issue items. Please try again.', { id: loadingToast });
    }
  };

  const toggleExpanded = (requestId: number) => {
    const newExpanded = new Set(expandedRequests);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRequests(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case 'prepared':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Prepared</Badge>;
      case 'issued':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Issued</Badge>;
      case 'received':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Received</Badge>;
      case 'not_received':
        return <Badge variant="destructive">Not Received</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'approved':
      case 'prepared':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
      case 'not_received':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'issued':
      case 'received':
        return <Package className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'approved':
      case 'prepared':
        return 'bg-green-500';
      case 'rejected':
      case 'not_received':
        return 'bg-red-500';
      case 'issued':
      case 'received':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Check if request is SIMR format
  const isSimrRequest = (req: ItemRequest | SimrRequest): req is SimrRequest => {
    return 'simr_number' in req && 'items' in req;
  };

  // Filter requests based on status
  const filteredRequests = useMemo(() => {
    if (statusFilter === 'all') return requests;
    return requests.filter(req => req.status === statusFilter);
  }, [requests, statusFilter]);

  // Paginate filtered requests
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredRequests.slice(startIndex, endIndex);
  }, [filteredRequests, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredRequests.length / itemsPerPage);
  }, [filteredRequests.length, itemsPerPage]);

  // Reset to page 1 when filter or data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, requests.length]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {useSimr ? 'SIMR Requests' : 'Item Requests'} Management
          </h2>
          <p className="text-muted-foreground">
            Review and approve {useSimr ? 'Supervisor Item Material Requests' : 'item requests'} from supervisors
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* SIMR Create Button */}
          {useSimr && (
            <SimrRequestForm farms={farms} onSuccess={loadRequests} />
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="prepared">Prepared</SelectItem>
                <SelectItem value="issued">Issued</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="not_received">Not Received</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Clock className="w-5 h-5 animate-spin" />
              Loading requests...
            </div>
          </CardContent>
        </Card>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">No Requests Found</h3>
            <p className="text-muted-foreground">
              {statusFilter === 'all' ? 'All requests have been processed.' : `No ${statusFilter} requests found.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedRequests.map((request) => {
              const isExpanded = expandedRequests.has(request.id);
              const simrReq = isSimrRequest(request) ? request : null;

              return (
                <Card key={request.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row">
                      {/* Status indicator bar */}
                      <div className={`lg:w-1.5 h-1.5 lg:h-auto ${getStatusColor(request.status)}`} />

                      <div className="flex-1 p-5">
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                          <div className="flex-1">
                            {/* Header */}
                            <div className="flex items-start gap-3 mb-4">
                              <div className="mt-1">
                                {getStatusIcon(request.status)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {simrReq && (
                                    <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                                      {simrReq.simr_number}
                                    </span>
                                  )}
                                  {simrReq ? (
                                    <h3 className="font-semibold text-lg">{simrReq.purpose}</h3>
                                  ) : (
                                    <h3 className="font-semibold text-lg">{(request as ItemRequest).item_name}</h3>
                                  )}
                                  {getStatusBadge(request.status)}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Wheat className="w-3 h-3" />
                                    {request.farm?.name || 'Unknown Farm'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {request.requester_name || 'Unknown'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(request.created_at).toLocaleDateString()}
                                  </span>
                                  {simrReq?.block_id && (
                                    <span className="flex items-center gap-1">
                                      Block: {simrReq.block_id}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Items Summary or Details */}
                            {simrReq ? (
                              <div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mb-2 gap-1"
                                  onClick={() => toggleExpanded(request.id)}
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="w-3 h-3" />
                                      Hide Items
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-3 h-3" />
                                      Show {simrReq.items.length} Items
                                    </>
                                  )}
                                </Button>

                                {isExpanded && (
                                  <div className="space-y-2">
                                    {simrReq.items.map((item, idx) => (
                                      <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <p className="font-medium">{item.item_name}</p>
                                            <p className="text-sm text-muted-foreground">
                                              {item.quantity_requested} {item.unit}
                                            </p>
                                            {item.specifications && (
                                              <p className="text-xs text-muted-foreground mt-1">
                                                Specs: {item.specifications}
                                              </p>
                                            )}
                                          </div>
                                          {item.accounting_code && (
                                            <span className="text-xs bg-muted px-2 py-1 rounded">
                                              {item.accounting_code}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {!isExpanded && (
                                  <div className="p-3 bg-muted/50 rounded-lg">
                                    <p className="text-sm">
                                      <span className="font-medium">{simrReq.items.length} items: </span>
                                      {simrReq.items.map((item) => item.item_name).join(', ')}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* Legacy format - single item */
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-muted/50 rounded-lg">
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quantity</span>
                                  <p className="text-lg font-bold mt-1">{(request as ItemRequest).quantity} {(request as ItemRequest).unit}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</span>
                                  <p className="text-lg font-bold mt-1 capitalize">{request.status.replace('_', ' ')}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Request ID</span>
                                  <p className="text-lg font-bold mt-1">#{request.id}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Farm ID</span>
                                  <p className="text-lg font-bold mt-1">#{request.farm_id}</p>
                                </div>
                              </div>
                            )}

                            {/* FM Approval/Rejection Info */}
                            {simrReq && (simrReq.fm_approved_at || simrReq.fm_rejected_reason) && (
                              <div className="mt-3 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                                {simrReq.fm_rejected_reason ? (
                                  <span>
                                    <span className="font-medium text-red-600">Rejected</span>
                                    {' '}by {simrReq.fm_approved_by || 'FM'} on{' '}
                                    {new Date(simrReq.fm_approved_at || '').toLocaleString()}
                                    <br />
                                    Reason: {simrReq.fm_rejected_reason}
                                  </span>
                                ) : (
                                  <span>
                                    <span className="font-medium text-green-600">Approved</span>
                                    {' '}by {simrReq.fm_approved_by || 'FM'} on{' '}
                                    {new Date(simrReq.fm_approved_at || '').toLocaleString()}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons — farm clerk approval flow */}
                          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:min-w-[140px]">
                            {request.status === 'pending' && (
                              <>
                                <Button
                                  onClick={() => handleApproveRequest(request.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleRejectRequest(request.id)}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                              </>
                            )}

                            {request.status === 'approved' && (
                              <Button
                                onClick={() => handleIssueRequest(request.id)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Package className="w-4 h-4 mr-2" />
                                Issue Items
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredRequests.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              showItemsPerPage={true}
              itemsPerPageOptions={[5, 10, 25, 50]}
            />
          )}
        </>
      )}
    </div>
  );
}
