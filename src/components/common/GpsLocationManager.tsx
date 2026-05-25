// GpsLocationManager — TEMPORARILY DISABLED
// GPS location management is disabled. This file exports a stub so imports don't break.

export interface LocationData {
  center_lat: number | null;
  center_lon: number | null;
  geofence_radius_m: number;
  has_location?: boolean;
  has_polygon?: boolean;
  boundary_polygon?: number[][] | null;
}

interface GpsLocationManagerProps {
  label: string;
  sublabel?: string;
  current: LocationData | null;
  defaultRadius?: number;
  supportsPolygon?: boolean;
  onSave: (data: {
    center_lat: number;
    center_lon: number;
    geofence_radius_m: number;
    boundary_polygon?: number[][] | null;
  }) => Promise<void>;
  loading?: boolean;
}

/** GPS Location Manager — temporarily disabled. Renders nothing. */
export function GpsLocationManager(_props: GpsLocationManagerProps) {
  return null;
}
