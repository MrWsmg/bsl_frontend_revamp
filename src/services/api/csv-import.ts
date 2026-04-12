// CSV Import API service
import { BaseApiService } from './base';

export interface CsvImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; error: string }[];
}

const TEMPLATE_NAMES = [
  'crop_harvest',
  'crop_shelling',
  'crop_sales',
  'mbuni_harvest',
  'fertilizer_entries',
  'fuel_chemical_entries',
  'irrigation_entries',
  'fish_water',
  'fish_feeding',
  'fish_weight',
] as const;

export type CsvTemplateName = typeof TEMPLATE_NAMES[number];

export class CsvImportApiService extends BaseApiService {
  async downloadTemplate(templateName: CsvTemplateName): Promise<void> {
    return this.downloadFile(
      `/csv-import/templates/${templateName}`,
      `template_${templateName}.csv`
    );
  }

  private async uploadCsv(endpoint: string, file: File): Promise<CsvImportResult> {
    return this.uploadFile<CsvImportResult>(endpoint, file, 'file');
  }

  // ── Other Crops ──────────────────────────────────────────────────────────
  uploadCropHarvest(file: File) { return this.uploadCsv('/csv-import/other-crops/harvest', file); }
  uploadCropShelling(file: File) { return this.uploadCsv('/csv-import/other-crops/shelling', file); }
  uploadCropSales(file: File) { return this.uploadCsv('/csv-import/other-crops/sales', file); }

  // ── Mbuni ─────────────────────────────────────────────────────────────────
  uploadMbuniHarvest(file: File) { return this.uploadCsv('/csv-import/mbuni/harvest', file); }

  // ── Fertilizer ────────────────────────────────────────────────────────────
  uploadFertilizerEntries(file: File) { return this.uploadCsv('/csv-import/fertilizer/entries', file); }

  // ── Fuel & Chemicals ──────────────────────────────────────────────────────
  uploadFuelChemEntries(file: File) { return this.uploadCsv('/csv-import/fuel-chemicals/entries', file); }

  // ── Irrigation ────────────────────────────────────────────────────────────
  uploadIrrigationEntries(file: File) { return this.uploadCsv('/csv-import/irrigation/entries', file); }

  // ── Fish Farming ──────────────────────────────────────────────────────────
  uploadFishWater(file: File) { return this.uploadCsv('/csv-import/fish-farming/water-parameters', file); }
  uploadFishFeeding(file: File) { return this.uploadCsv('/csv-import/fish-farming/feeding', file); }
  uploadFishWeight(file: File) { return this.uploadCsv('/csv-import/fish-farming/weight', file); }
}
