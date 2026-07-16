"use client";

import React, { useCallback, useState } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronRight } from 'lucide-react';

const CATEGORIES = [
  { value: 'FUEL AND LUBRICANTS', label: 'Fuel & Lubricants' },
  { value: 'AGROCHEMICALS', label: 'Agrochemicals' },
  { value: 'HERBICIDES', label: 'Herbicides' },
] as const;

function money(n: number | null | undefined) {
  if (n == null) return '—';
  return 'TZS ' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
function num(n: number | null | undefined, d = 1) {
  if (n == null) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: d });
}

export const FuelChemBlockConsumptionSection: React.FC = () => {
  const [farmId, setFarmId] = useState('all');
  const [category, setCategory] = useState('all');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const getFarms = useCallback(() => apiService.getFarms(), []);
  const { data: farms } = useApi(getFarms);

  const getReport = useCallback(
    () => apiService.getFuelChemBlockConsumption({
      farm_id: farmId !== 'all' ? Number(farmId) : undefined,
      category: category !== 'all' ? category : undefined,
      start_date: start || undefined,
      end_date: end || undefined,
    }),
    [farmId, category, start, end]
  );
  const { data: report, loading } = useApi(getReport, { dependencies: [farmId, category, start, end] });

  const toggle = (id: number) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const blocks = report?.blocks || [];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <Label className="text-xs">Farm</Label>
              <Select value={farmId} onValueChange={setFarmId}>
                <SelectTrigger className="w-44 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All farms</SelectItem>
                  {(farms || []).map((f: any) => (
                    <SelectItem key={f.farm_id ?? f.id} value={String(f.farm_id ?? f.id)}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-48 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" className="h-8 text-sm w-36" value={start} onChange={e => setStart(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" className="h-8 text-sm w-36" value={end} onChange={e => setEnd(e.target.value)} />
            </div>
            {(category !== 'all' || start || end) && (
              <Button size="sm" variant="ghost" className="h-8" onClick={() => { setCategory('all'); setStart(''); setEnd(''); }}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card><CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Blocks with consumption</p>
            <p className="text-2xl font-bold">{report.block_count}</p>
          </CardContent></Card>
          <Card><CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Total consumption cost</p>
            <p className="text-2xl font-bold text-green-600">{money(report.grand_total_cost)}</p>
          </CardContent></Card>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Block</TableHead>
                <TableHead>Farm</TableHead>
                <TableHead className="text-right">Area (ha)</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">Cost / ha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No block consumption in this period
                  </TableCell>
                </TableRow>
              ) : blocks.map(b => (
                <React.Fragment key={b.block_id}>
                  <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggle(b.block_id)}>
                    <TableCell>
                      {expanded.has(b.block_id)
                        ? <ChevronDown className="h-4 w-4" />
                        : <ChevronRight className="h-4 w-4" />}
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {b.block_code} {b.block_name ? <span className="text-muted-foreground">— {b.block_name}</span> : null}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{b.farm_name || '—'}</TableCell>
                    <TableCell className="text-right">{num(b.area_ha)}</TableCell>
                    <TableCell className="text-right font-medium">{money(b.total_cost)}</TableCell>
                    <TableCell className="text-right">{b.cost_per_ha != null ? money(b.cost_per_ha) : '—'}</TableCell>
                  </TableRow>
                  {expanded.has(b.block_id) && b.products.map((p, i) => (
                    <TableRow key={`${b.block_id}-${i}`} className="bg-muted/30">
                      <TableCell />
                      <TableCell colSpan={2} className="text-sm pl-6">
                        {p.product_name} <Badge variant="outline" className="ml-1 text-xs">{p.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">{num(p.quantity)} {p.unit}</TableCell>
                      <TableCell className="text-right text-sm">{money(p.cost)}</TableCell>
                      <TableCell />
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
