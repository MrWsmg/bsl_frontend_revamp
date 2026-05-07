// Cherry → Parchment module types

export interface C2PRecord {
  id: number;
  farm_id: number;
  block_id: number | null;
  block_code: string | null;
  batch_date: string;
  cherry_kg_in: number;
  p1_kg_out: number;
  p2_kg_out: number;
  p3_kg_out: number;
  total_parchment_kg: number;
  outturn_pct: number;
  dn_number: string | null;
  dn_signed: boolean;
  dn_signed_by: number | null;
  dn_signed_at: string | null;
  notes: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface C2PCreate {
  farm_id: number;
  batch_date: string;
  cherry_kg_in: number;
  p1_kg_out: number;
  p2_kg_out: number;
  p3_kg_out: number;
  block_id?: number | null;
  block_code?: string | null;
  dn_number?: string | null;
  notes?: string | null;
}

export interface C2PUpdate {
  cherry_kg_in?: number;
  p1_kg_out?: number;
  p2_kg_out?: number;
  p3_kg_out?: number;
  dn_number?: string;
  block_code?: string;
  batch_date?: string;
  notes?: string;
}

export interface HopperEntry {
  id: number;
  farm_id: number;
  entry_date: string;
  cherry_in_kg: number;
  cherry_out_kg: number;
  balance_kg: number;
  notes: string | null;
  created_by: number;
  created_at: string;
}

export interface HopperEntryCreate {
  farm_id: number;
  entry_date: string;
  cherry_in_kg: number;
  cherry_out_kg: number;
  notes?: string | null;
}

export interface BlockSummary {
  block_code: string;
  block_name: string | null;
  block_id: number | null;
  area_ha: number | null;
  variety: string | null;
  farm_id: number;
  records_count: number;
  cherry_kg_in: number;
  p1_kg_out: number;
  p2_kg_out: number;
  p3_kg_out: number;
  total_parchment_kg: number;
  avg_outturn_pct: number;
  dn_signed_count: number;
  dn_unsigned_count: number;
}

export interface C2PSummary {
  farm_id: number | null;
  by_block: BlockSummary[];
  totals: {
    cherry_kg_in: number;
    p1_kg_out: number;
    p2_kg_out: number;
    p3_kg_out: number;
    total_parchment_kg: number;
    avg_outturn_pct: number;
    dn_signed_count: number;
    dn_unsigned_count: number;
    records_count: number;
  };
}

export interface ReconciliationResult {
  farm_id: number;
  farm_cherry_kg: number;
  hopper_received_kg: number;
  hopper_current_balance_kg: number;
  difference_kg: number;
  difference_pct: number;
  picking_sessions_count: number;
  hopper_entries_count: number;
  per_block_cherry_kg: Record<string, number>;
}

export interface MillingComparison {
  farm_id: number;
  parchment_produced: {
    cherry_kg_in: number;
    p1_kg: number;
    p2_kg: number;
    p3_kg: number;
    total_kg: number;
    avg_outturn_pct: number;
  };
  parchment_milled: {
    parchment_in_kg: number;
    green_bean_out_kg: number;
    p1_green_kg: number;
    p2_green_kg: number;
    p3_green_kg: number;
    milling_outturn_pct: number;
  };
  p1_comparative: { produced_kg: number; milled_kg: number; difference_kg: number };
  p2_comparative: { produced_kg: number; milled_kg: number; difference_kg: number };
  p3_comparative: { produced_kg: number; milled_kg: number; difference_kg: number };
  total_parchment_difference_kg: number;
  batches_count: number;
}

export interface DailyBlockRecord {
  session_id: number;
  date: string;
  pickers: number;
  cherry_kg: number;
  ratio_kg_per_picker: number;
  price_per_kg: number;
  total_payment: number;
  status: string;
}

export interface BlockDailySummary {
  block_code: string;
  block_name: string;
  block_id: number | null;
  area_ha: number | null;
  variety: string | null;
  daily_records: DailyBlockRecord[];
  total_pickers: number;
  total_cherry_kg: number;
  running_total_kg: number;
}

export interface CherryStockSummary {
  farm_id: number;
  by_block: BlockDailySummary[];
  grand_total_cherry_kg: number;
  blocks_count: number;
  sessions_count: number;
}

export interface PickingEntry {
  id: number;
  farm_id: number;
  block_code: string | null;
  block_description: string | null;
  area_ha: number | null;
  variety: string | null;
  picking_date: string;
  pickers_count: number;
  cherry_kg: number;
  ratio_kg_per_picker: number;
  price_per_kg: number;
  total_payment: number;
  dn_number: string | null;
  comments: string | null;
  created_by: number;
  created_at: string;
}

export interface PickingEntryCreate {
  farm_id: number;
  picking_date: string;
  pickers_count: number;
  cherry_kg: number;
  price_per_kg: number;
  block_code?: string | null;
  block_description?: string | null;
  area_ha?: number | null;
  variety?: string | null;
  dn_number?: string | null;
  comments?: string | null;
}

export type ParchmentGrade = 'P1' | 'P2' | 'P3';

export interface ParchmentGradeEntry {
  id: number;
  farm_id: number;
  block_code: string | null;
  grade: ParchmentGrade;
  entry_date: string;
  in_kg: number;
  out_kg: number;
  balance_kg: number;
  dn_number: string | null;
  notes: string | null;
  created_by: number;
  created_at: string;
}

export interface ParchmentGradeEntryCreate {
  farm_id: number;
  grade: ParchmentGrade;
  entry_date: string;
  in_kg: number;
  out_kg: number;
  block_code?: string | null;
  dn_number?: string | null;
  notes?: string | null;
}
