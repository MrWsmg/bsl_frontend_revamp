"use client";

import React, { useState, useCallback } from 'react';
import { useApi } from '@/hooks';
import apiService from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { CherryPickingList } from './CherryPickingList';
import { HopperStockList } from './HopperStockList';
import { ParchmentRecordList } from './ParchmentRecordList';
import { ParchmentGradeList } from './ParchmentGradeList';
import { SummaryByBlock } from './SummaryByBlock';
import { ReconciliationReport } from './ReconciliationReport';
import { Leaf, Droplets, FileText, Package, BarChart2, GitCompareArrows } from 'lucide-react';

function defaultDateFrom() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
}
function defaultDateTo() {
  return new Date().toISOString().slice(0, 10);
}

export const CherryParchmentPage: React.FC = () => {
  const [farmId, setFarmId] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState(defaultDateFrom);
  const [dateTo, setDateTo] = useState(defaultDateTo);

  const fetchFarms = useCallback(() => apiService.getStockFarms(), []);
  const { data: farms, loading: farmsLoading } = useApi<any[]>(fetchFarms);
  const farmList = farms ?? [];

  if (farmsLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-4">

      {/* ── Filter bar ── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Farm</Label>
              <Select
                value={farmId ? String(farmId) : 'all'}
                onValueChange={v => setFarmId(v === 'all' ? null : Number(v))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All farms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All farms</SelectItem>
                  {farmList.map((f: any) => (
                    <SelectItem key={f.farm_id ?? f.id} value={String(f.farm_id ?? f.id)}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input type="date" className="h-9 w-36" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input type="date" className="h-9 w-36" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Main tabs ── */}
      <Tabs defaultValue="cherry-picking">
        <TabsList className="mb-4">
          <TabsTrigger value="cherry-picking">
            <Leaf className="w-4 h-4 mr-1" /> Cherry Picking
          </TabsTrigger>
          <TabsTrigger value="c2p-records">
            <FileText className="w-4 h-4 mr-1" /> C2P Records
          </TabsTrigger>
          <TabsTrigger value="parch-stock">
            <Package className="w-4 h-4 mr-1" /> Parchment Stock
          </TabsTrigger>
          <TabsTrigger value="hopper">
            <Droplets className="w-4 h-4 mr-1" /> Hopper
          </TabsTrigger>
          <TabsTrigger value="summary">
            <BarChart2 className="w-4 h-4 mr-1" /> Summary
          </TabsTrigger>
          <TabsTrigger value="reconciliation">
            <GitCompareArrows className="w-4 h-4 mr-1" /> Reconciliation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cherry-picking">
          <CherryPickingList
            farms={farmList}
            farmId={farmId}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
        </TabsContent>

        <TabsContent value="c2p-records">
          <ParchmentRecordList
            farms={farmList}
            farmId={farmId}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
        </TabsContent>

        <TabsContent value="parch-stock">
          <ParchmentGradeList
            farms={farmList}
            farmId={farmId}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
        </TabsContent>

        <TabsContent value="hopper">
          <HopperStockList
            farms={farmList}
            farmId={farmId}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
        </TabsContent>

        <TabsContent value="summary">
          <SummaryByBlock farmId={farmId} dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>

        <TabsContent value="reconciliation">
          <ReconciliationReport farmId={farmId} dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
