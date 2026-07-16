"use client";

// Manager Workers section component - shadcn patterns
import React, { useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Users, UserCheck, UserX, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pagination, usePagination } from '../../common/Pagination';

function parseFarmAssignments(raw: any): number[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed.map(Number) : [];
  } catch {
    return [];
  }
}

export const ManagerWorkersSection: React.FC = () => {
  const getWorkers = useCallback(() => apiService.getManagerWorkers(), []);
  const getFarms  = useCallback(() => apiService.getFarms(), []);
  const { data: workers, loading } = useApi(getWorkers);
  const { data: farmsRaw } = useApi(getFarms);
  const farmMap = new Map<number, string>(
    (Array.isArray(farmsRaw) ? farmsRaw : []).map((f: any) => [f.farm_id ?? f.id, f.name])
  );

  const activeWorkers = workers?.filter((w: any) => w.is_active) || [];
  const permanentWorkers = workers?.filter((w: any) => w.worker_type === 'permanent') || [];
  const contractWorkers = workers?.filter((w: any) => w.worker_type === 'contract') || [];

  // Client-side pagination over the full workers list.
  const {
    paginatedItems: pagedRows,
    currentPage, setCurrentPage,
    itemsPerPage, setItemsPerPage,
    totalPages, totalItems,
  } = usePagination<any>((workers as any[]) || [], 25);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const stats = [
    { title: 'Total Workers', value: workers?.length || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-500' },
    { title: 'Active', value: activeWorkers.length, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-500' },
    { title: 'Permanent', value: permanentWorkers.length, icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-500' },
    { title: 'Contract', value: contractWorkers.length, icon: UserX, color: 'text-orange-600', bg: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`${stat.bg} p-3 rounded-xl`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workers List */}
      <Card>
        <CardHeader>
          <CardTitle>All Workers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!workers || workers.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No workers found</p>
          ) : (
            <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead>Farm Assignments</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedRows.map((worker: any) => (
                    <TableRow key={worker.id}>
                      <TableCell className="font-medium">
                        {worker.full_name || worker.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={worker.worker_type === 'permanent' ? 'default' : 'secondary'}>
                          {worker.worker_type === 'permanent' ? 'Permanent' : 'Contract'}
                        </Badge>
                      </TableCell>
                      <TableCell>{worker.phone || 'N/A'}</TableCell>
                      <TableCell>{worker.skills || 'N/A'}</TableCell>
                      <TableCell>
                        {(() => {
                          const ids = parseFarmAssignments(worker.farm_assignments);
                          if (ids.length === 0) return <span className="text-muted-foreground text-xs">N/A</span>;
                          return (
                            <div className="flex flex-wrap gap-1">
                              {ids.map(id => (
                                <span key={id} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 font-medium">
                                  {farmMap.get(id) ?? `Farm ${id}`}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={worker.is_active ? 'default' : 'destructive'}>
                          {worker.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
