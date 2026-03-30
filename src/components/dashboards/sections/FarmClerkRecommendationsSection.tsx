"use client";

import React, { useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Lightbulb, AlertTriangle, Gauge, CheckCircle, Info } from 'lucide-react';

function priorityBadge(priority: string) {
  const map: Record<string, string> = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-700',
  };
  const cls = map[priority?.toLowerCase()] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {priority || 'info'}
    </span>
  );
}

export const FarmClerkRecommendationsSection: React.FC = () => {
  const fetchRecs = useCallback(() => apiService.getFarmClerkRecommendations(), []);
  const fetchThresholds = useCallback(() => apiService.getFarmClerkThresholds(), []);

  const { data: recsRaw, loading: recsLoading } = useApi<any>(fetchRecs);
  const { data: thresholdsRaw, loading: thresholdsLoading } = useApi<any>(fetchThresholds);

  const recommendations: any[] = Array.isArray(recsRaw) ? recsRaw : (recsRaw as any)?.items ?? (recsRaw as any)?.recommendations ?? [];
  const thresholds: any = thresholdsRaw ?? {};

  const thresholdEntries = Object.entries(thresholds).filter(([, v]) => v != null && typeof v !== 'object');
  const thresholdGroups: Record<string, Record<string, any>> = {};
  Object.entries(thresholds).forEach(([k, v]) => {
    if (v != null && typeof v === 'object' && !Array.isArray(v)) {
      thresholdGroups[k] = v as Record<string, any>;
    }
  });

  return (
    <div className="space-y-6">
      {/* SMART Recommendations */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <h3 className="text-base font-semibold text-gray-900">SMART Recommendations</h3>
        </div>

        {recsLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
            <p className="text-gray-500">No recommendations at this time</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recommendations.map((rec: any, i: number) => (
              <div key={rec.id ?? i} className="px-6 py-4 flex gap-4">
                <div className="mt-0.5 flex-shrink-0">
                  {rec.priority === 'high' ? (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  ) : (
                    <Info className="w-5 h-5 text-blue-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900">{rec.title || rec.recommendation_type || 'Recommendation'}</p>
                    {priorityBadge(rec.priority)}
                  </div>
                  <p className="text-sm text-gray-600">{rec.message || rec.description || '—'}</p>
                  {rec.action && (
                    <p className="text-xs text-blue-700 mt-1 font-medium">Action: {rec.action}</p>
                  )}
                  {rec.created_at && (
                    <p className="text-xs text-gray-400 mt-1">{new Date(rec.created_at).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Thresholds */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center gap-2">
          <Gauge className="w-5 h-5 text-gray-500" />
          <h3 className="text-base font-semibold text-gray-900">Alert Thresholds</h3>
        </div>

        {thresholdsLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div>
        ) : (thresholdEntries.length === 0 && Object.keys(thresholdGroups).length === 0) ? (
          <div className="text-center py-8">
            <Gauge className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No threshold data available</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Flat key-value thresholds */}
            {thresholdEntries.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {thresholdEntries.map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-0.5">{key.replace(/_/g, ' ')}</p>
                    <p className="text-sm font-semibold text-gray-900">{String(value)}</p>
                  </div>
                ))}
              </div>
            )}
            {/* Nested threshold groups */}
            {Object.entries(thresholdGroups).map(([groupKey, groupVal]) => (
              <div key={groupKey}>
                <h4 className="text-sm font-semibold text-gray-700 capitalize mb-2">{groupKey.replace(/_/g, ' ')}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(groupVal).map(([k, v]) => (
                    <div key={k} className="bg-blue-50 rounded-lg p-2.5">
                      <p className="text-xs font-medium text-blue-600 uppercase mb-0.5">{k.replace(/_/g, ' ')}</p>
                      <p className="text-sm font-semibold text-blue-900">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
