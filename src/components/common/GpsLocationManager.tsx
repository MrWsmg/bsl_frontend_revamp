"use client";

import { useState, useCallback } from 'react';
import { MapPin, Navigation, ExternalLink, Save, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LoadingSpinner } from './LoadingSpinner';

export interface LocationData {
  center_lat: number | null;
  center_lon: number | null;
  geofence_radius_m: number;
  has_location?: boolean;
}

interface GpsLocationManagerProps {
  label: string;
  sublabel?: string;
  current: LocationData | null;
  defaultRadius?: number;
  onSave: (data: { center_lat: number; center_lon: number; geofence_radius_m: number }) => Promise<void>;
  loading?: boolean;
}

export function GpsLocationManager({
  label,
  sublabel,
  current,
  defaultRadius = 500,
  onSave,
  loading = false,
}: GpsLocationManagerProps) {
  const [lat, setLat] = useState(current?.center_lat != null ? String(current.center_lat) : '');
  const [lon, setLon] = useState(current?.center_lon != null ? String(current.center_lon) : '');
  const [radius, setRadius] = useState(String(current?.geofence_radius_m ?? defaultRadius));
  const [acquiring, setAcquiring] = useState(false);
  const [saving, setSaving] = useState(false);

  const useCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('GPS not supported on this device');
      return;
    }
    setAcquiring(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(7));
        setLon(pos.coords.longitude.toFixed(7));
        setAcquiring(false);
        toast.success(`Location captured — accuracy ±${pos.coords.accuracy.toFixed(0)}m`);
      },
      (err) => {
        setAcquiring(false);
        toast.error(`GPS failed: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  const handleSave = async () => {
    const latN = parseFloat(lat);
    const lonN = parseFloat(lon);
    const radN = parseFloat(radius);
    if (isNaN(latN) || isNaN(lonN)) {
      toast.error('Enter valid latitude and longitude');
      return;
    }
    if (latN < -90 || latN > 90 || lonN < -180 || lonN > 180) {
      toast.error('Coordinates out of range');
      return;
    }
    setSaving(true);
    try {
      await onSave({ center_lat: latN, center_lon: lonN, geofence_radius_m: isNaN(radN) ? defaultRadius : radN });
      toast.success(`${label} location saved`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const hasLocation = current?.center_lat != null;
  const mapsUrl = hasLocation
    ? `https://www.google.com/maps?q=${current!.center_lat},${current!.center_lon}`
    : null;

  return (
    <div className="space-y-4">
      {/* Status header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          {sublabel && <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>}
        </div>
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : hasLocation ? (
          <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
            <CheckCircle2 className="w-3 h-3" /> Configured
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
            <AlertTriangle className="w-3 h-3" /> Not set
          </span>
        )}
      </div>

      {/* Current location summary */}
      {hasLocation && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 space-y-1">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0" />
            <span className="font-mono">{current!.center_lat?.toFixed(6)}, {current!.center_lon?.toFixed(6)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Radius: <span className="font-medium">{current!.geofence_radius_m}m</span></span>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
              >
                View on map <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Edit form */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Latitude</Label>
          <Input
            type="number"
            step="0.0000001"
            placeholder="-3.3869..."
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="h-8 text-sm font-mono"
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Longitude</Label>
          <Input
            type="number"
            step="0.0000001"
            placeholder="36.6830..."
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            className="h-8 text-sm font-mono"
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Radius (metres)</Label>
          <Input
            type="number"
            min="10"
            max="10000"
            placeholder={String(defaultRadius)}
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          onClick={useCurrentPosition}
          disabled={acquiring || saving}
          className="gap-1.5 text-xs"
        >
          {acquiring
            ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Acquiring…</>
            : <><Navigation className="w-3.5 h-3.5" /> Use my current location</>
          }
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || acquiring || !lat || !lon}
          className="gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white"
        >
          {saving
            ? <><LoadingSpinner size="sm" /> Saving…</>
            : <><Save className="w-3.5 h-3.5" /> Save location</>
          }
        </Button>
      </div>
    </div>
  );
}
