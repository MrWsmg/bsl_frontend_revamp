"use client";

import React, { useState, useCallback, useRef } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { CsvTemplateName } from '../../../services/api/csv-import';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '../../ui/sonner';
import {
  Download,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Leaf,
  Coffee,
  Fuel,
  Droplets,
  Fish,
  Info,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────

interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; error: string }[];
}

type ImportStatus = 'idle' | 'uploading' | 'done';

// ─── Single Importer Card ──────────────────────────────────────────────────

interface ImporterCardProps {
  title: string;
  description: string;
  templateName: CsvTemplateName;
  columns: string[];
  onUpload: (file: File) => Promise<ImportResult>;
  referenceData?: React.ReactNode;
}

const ImporterCard: React.FC<ImporterCardProps> = ({
  title,
  description,
  templateName,
  columns,
  onUpload,
  referenceData,
}) => {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [errorsOpen, setErrorsOpen] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await apiService.downloadCsvTemplate(templateName);
    } catch {
      toast.error('Failed to download template');
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a .csv file');
      return;
    }
    setFile(f);
    setResult(null);
    setStatus('idle');
  };

  const handleUpload = async () => {
    if (!file) { toast.error('Select a CSV file first'); return; }
    setStatus('uploading');
    setResult(null);
    try {
      const res = await onUpload(file);
      setResult(res);
      setStatus('done');
      setErrorsOpen(true);
      if (res.imported > 0) {
        toast.success(`${res.imported} rows imported successfully`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
      setStatus('idle');
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setStatus('idle');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-0.5">{description}</CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            disabled={downloading}
            className="shrink-0"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            {downloading ? 'Downloading…' : 'Template'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Reference data (optional hint) */}
        {referenceData && (
          <div className="rounded-md bg-muted/50 p-3 text-sm flex gap-2">
            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-1">{referenceData}</div>
          </div>
        )}

        {/* Column reference */}
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ChevronDown className="w-3 h-3" /> Template columns
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 flex flex-wrap gap-1">
              {columns.map(c => (
                <code key={c} className="text-xs bg-muted px-1.5 py-0.5 rounded">{c}</code>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* File pick + upload */}
        <div className="flex items-center gap-3">
          <label className="flex-1">
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/40 transition-colors"
            >
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground truncate">
                {file ? file.name : 'Click to select a .csv file'}
              </span>
            </div>
          </label>

          <Button
            size="sm"
            onClick={handleUpload}
            disabled={!file || status === 'uploading'}
          >
            <Upload className="w-3.5 h-3.5 mr-1" />
            {status === 'uploading' ? 'Uploading…' : 'Upload'}
          </Button>

          {(file || result) && (
            <Button size="sm" variant="ghost" onClick={reset}>Reset</Button>
          )}
        </div>

        {/* Result */}
        {result && status === 'done' && (
          <div className="space-y-3">
            {/* Success banner */}
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="flex items-center gap-3">
                <span><strong>{result.imported}</strong> rows imported successfully</span>
                {result.skipped > 0 && (
                  <Badge variant="destructive" className="ml-1">{result.skipped} skipped</Badge>
                )}
              </AlertDescription>
            </Alert>

            {/* Error table */}
            {result.errors.length > 0 && (
              <Collapsible open={errorsOpen} onOpenChange={setErrorsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 text-destructive border-destructive/40">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {result.errors.length} row{result.errors.length !== 1 ? 's' : ''} failed
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${errorsOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 rounded-md border border-destructive/20 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-destructive/5">
                          <TableHead className="w-16">Row</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.errors.map((e, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-sm">{e.row}</TableCell>
                            <TableCell className="text-sm text-destructive">{e.error}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Fix these rows in your spreadsheet and re-upload only the failed rows.
                  </p>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Reference data helpers ────────────────────────────────────────────────

const FertilizerReference: React.FC<{ subStore?: string }> = ({ subStore }) => {
  const getProducts = useCallback(
    () => apiService.getFertilizerProducts({ active_only: true }),
    []
  );
  const { data: products } = useApi(getProducts);
  const filtered = products?.filter((p: any) => !subStore || p.sub_store === subStore) || [];
  return (
    <>
      <p className="font-medium text-foreground">Available product names (use exact spelling in CSV):</p>
      <div className="flex flex-wrap gap-1 mt-1">
        {filtered.length === 0
          ? <span className="text-muted-foreground">No products found — add products via the Fertilizer module first</span>
          : filtered.map((p: any) => <code key={p.id} className="bg-background border px-1.5 py-0.5 rounded text-xs">{p.name}</code>)}
      </div>
    </>
  );
};

const FuelChemReference: React.FC = () => {
  const getProducts = useCallback(() => apiService.getFuelChemProducts({ active_only: true }), []);
  const { data: products } = useApi(getProducts);
  return (
    <>
      <p className="font-medium text-foreground">Available product names (use exact spelling in CSV):</p>
      <div className="flex flex-wrap gap-1 mt-1">
        {!products || products.length === 0
          ? <span className="text-muted-foreground">No products found — add products via the Fuel & Chemicals module first</span>
          : products.map((p: any) => (
            <code key={p.id} className="bg-background border px-1.5 py-0.5 rounded text-xs">
              {p.name} <span className="text-muted-foreground">({p.category})</span>
            </code>
          ))}
      </div>
    </>
  );
};

const IrrigationReference: React.FC = () => {
  const getParts = useCallback(() => apiService.getIrrigationParts({ active_only: true }), []);
  const { data: parts } = useApi(getParts);
  return (
    <>
      <p className="font-medium text-foreground">Available part descriptions (use exact spelling in CSV):</p>
      <div className="flex flex-wrap gap-1 mt-1">
        {!parts || parts.length === 0
          ? <span className="text-muted-foreground">No parts found — add parts via the Irrigation module first</span>
          : parts.map((p: any) => (
            <code key={p.id} className="bg-background border px-1.5 py-0.5 rounded text-xs">{p.description}</code>
          ))}
      </div>
    </>
  );
};

const FishReference: React.FC = () => {
  const getReservoirs = useCallback(() => apiService.getFishReservoirs({}), []);
  const { data: reservoirs } = useApi(getReservoirs);
  return (
    <>
      <p className="font-medium text-foreground">Available reservoir names (use exact spelling in CSV):</p>
      <div className="flex flex-wrap gap-1 mt-1">
        {!reservoirs || reservoirs.length === 0
          ? <span className="text-muted-foreground">No reservoirs found</span>
          : reservoirs.map((r: any) => (
            <code key={r.id} className="bg-background border px-1.5 py-0.5 rounded text-xs">{r.name}</code>
          ))}
      </div>
    </>
  );
};

// ─── Main Section ──────────────────────────────────────────────────────────

export const StockCsvImportSection: React.FC = () => {
  return (
    <div className="space-y-2">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Bulk CSV Import</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Download a template, fill in your data in Excel or Google Sheets (save as "CSV UTF-8"), then upload.
          Valid rows are imported immediately — failed rows are shown so you can fix and re-upload just those.
        </p>
      </div>

      <Tabs defaultValue="othercrops">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="othercrops" className="gap-1"><Leaf className="w-3.5 h-3.5" />Other Crops</TabsTrigger>
          <TabsTrigger value="mbuni" className="gap-1"><Coffee className="w-3.5 h-3.5" />Mbuni</TabsTrigger>
          <TabsTrigger value="fertilizer" className="gap-1"><Leaf className="w-3.5 h-3.5" />Fertilizer</TabsTrigger>
          <TabsTrigger value="fuelchem" className="gap-1"><Fuel className="w-3.5 h-3.5" />Fuel & Chemicals</TabsTrigger>
          <TabsTrigger value="irrigation" className="gap-1"><Droplets className="w-3.5 h-3.5" />Irrigation</TabsTrigger>
          <TabsTrigger value="fish" className="gap-1"><Fish className="w-3.5 h-3.5" />Fish Farming</TabsTrigger>
        </TabsList>

        {/* ── Other Crops ── */}
        <TabsContent value="othercrops" className="space-y-4 mt-4">
          <ImporterCard
            title="Harvest Records"
            description="Import maize, beans, soya and other crop harvest records."
            templateName="crop_harvest"
            columns={['farm_name','crop_type','harvest_date','block_name','block_side','block_code','area_ha','variety','bags','kgs','num_workers','acres_harvested','delivery_note_ref','paid_per_bag','paid_per_kg','total_payment','comments']}
            onUpload={f => apiService.uploadCropHarvestCsv(f)}
          />
          <ImporterCard
            title="Shelling Records"
            description="Import maize shelling / threshing records."
            templateName="crop_shelling"
            columns={['farm_name','shell_date','block_name','block_code','kgs_in','num_shellers','bags_out','avg_kg_per_person','paid_per_kg','total_payment','comments']}
            onUpload={f => apiService.uploadCropShellingCsv(f)}
          />
          <ImporterCard
            title="Sales Records"
            description="Import crop sale invoices (Seed Co, etc.)."
            templateName="crop_sales"
            columns={['farm_name','crop_type','sale_date','invoice_number','buyer_name','kgs_sold','unit_price','paid_amount','on_account_amount','driver_name','driver_phone','vehicle_registration','trailer_registration','delivery_note','serial_number','security_name','security_signed','quickbooks_ref','comments']}
            onUpload={f => apiService.uploadCropSalesCsv(f)}
          />
        </TabsContent>

        {/* ── Mbuni ── */}
        <TabsContent value="mbuni" className="space-y-4 mt-4">
          <ImporterCard
            title="Mbuni Harvest Records"
            description="Import dried cherry (mbuni) harvest records."
            templateName="mbuni_harvest"
            columns={['farm_name','harvest_date','block_name','block_code','area_ha','variety','num_pickers','mbuni_kg','mbuni_to_green_ratio','green_equivalent_kg','paid_per_kg','total_payment','comments']}
            onUpload={f => apiService.uploadMbuniHarvestCsv(f)}
          />
        </TabsContent>

        {/* ── Fertilizer ── */}
        <TabsContent value="fertilizer" className="space-y-4 mt-4">
          <ImporterCard
            title="Fertilizer Stock Entries"
            description="Import fertilizer IN / OUT movements. product_name must match an existing product exactly."
            templateName="fertilizer_entries"
            columns={['farm_name','product_name','entry_date','transaction_type','bags','pkts','kgs','from_location','delivery_note_ref','comments']}
            onUpload={f => apiService.uploadFertilizerEntriesCsv(f)}
            referenceData={<FertilizerReference />}
          />
        </TabsContent>

        {/* ── Fuel & Chemicals ── */}
        <TabsContent value="fuelchem" className="space-y-4 mt-4">
          <ImporterCard
            title="Fuel & Chemical Stock Entries"
            description="Import fuel, herbicide, fungicide, pesticide or chemical IN / OUT movements."
            templateName="fuel_chemical_entries"
            columns={['farm_name','product_name','entry_date','transaction_type','quantity','from_to_location','delivery_note_ref','serial_number','comments']}
            onUpload={f => apiService.uploadFuelChemEntriesCsv(f)}
            referenceData={<FuelChemReference />}
          />
        </TabsContent>

        {/* ── Irrigation ── */}
        <TabsContent value="irrigation" className="space-y-4 mt-4">
          <ImporterCard
            title="Irrigation Parts Entries"
            description="Import spare parts IN / OUT movements. part_description must match an existing part exactly."
            templateName="irrigation_entries"
            columns={['farm_name','part_description','entry_date','transaction_type','quantity','from_location','notes']}
            onUpload={f => apiService.uploadIrrigationEntriesCsv(f)}
            referenceData={<IrrigationReference />}
          />
        </TabsContent>

        {/* ── Fish Farming ── */}
        <TabsContent value="fish" className="space-y-4 mt-4">
          <ImporterCard
            title="Water Parameters"
            description="Import twice-daily water quality readings. reservoir_name must match exactly."
            templateName="fish_water"
            columns={['reservoir_name','recorded_at','dissolved_oxygen_mg_l','temperature_c','ph','nitrogen_dioxide_mg_l','ammonium_nitrate_mg_l','un_ionized_ammonia_mg_l','comments']}
            onUpload={f => apiService.uploadFishWaterCsv(f)}
            referenceData={<FishReference />}
          />
          <ImporterCard
            title="Feeding Records"
            description="Import feeding sessions (morning / midday / afternoon)."
            templateName="fish_feeding"
            columns={['reservoir_name','feeding_date','session','feeding_time','kg_fed','observations']}
            onUpload={f => apiService.uploadFishFeedingCsv(f)}
            referenceData={<FishReference />}
          />
          <ImporterCard
            title="Weight Samples"
            description="Import fish weight sampling records."
            templateName="fish_weight"
            columns={['reservoir_name','sample_date','avg_weight_g','sample_count','min_weight_g','max_weight_g','notes']}
            onUpload={f => apiService.uploadFishWeightCsv(f)}
            referenceData={<FishReference />}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
