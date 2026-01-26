"use client";

// Analytics section component
import React, { useState } from 'react';
import { Users, TrendingUp, BarChart3, Warehouse } from 'lucide-react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';

export const AnalyticsSection: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [analyticsFilters, setAnalyticsFilters] = useState({
    period: '30',
    farm_id: ''
  });

  const { data: farms } = useApi(() => apiService.farms.getFarms());

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { period: analyticsFilters.period };
      if (analyticsFilters.farm_id) params.farm_id = analyticsFilters.farm_id;

      const analyticsData = await apiService.activities.getAnalyticsData(params);
      setAnalyticsData(analyticsData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      alert('Failed to load analytics data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Analytics Filters */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Analytics Dashboard</h3>
          <p className="text-sm text-gray-600 mt-1">Performance metrics and trends analysis</p>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
              <select
                value={analyticsFilters.period}
                onChange={(e) => setAnalyticsFilters({...analyticsFilters, period: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm (Optional)</label>
              <select
                value={analyticsFilters.farm_id}
                onChange={(e) => setAnalyticsFilters({...analyticsFilters, farm_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              >
                <option key="all-farms" value="">All Farms</option>
                {farms?.map((farm: any, index: number) => (
                  <option key={farm.id ?? `farm-${index}`} value={farm.id}>{farm.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <button
                onClick={loadAnalyticsData}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-md flex items-center justify-center text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    <span className="hidden sm:inline">Loading...</span>
                    <span className="sm:hidden">Loading</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Load Analytics</span>
                    <span className="sm:hidden">Load</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Content */}
      {analyticsData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-full bg-blue-100 text-blue-600">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-sm sm:text-lg font-semibold text-gray-700">Active Workers</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">{analyticsData.summary.activeWorkers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-full bg-green-100 text-green-600">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-sm sm:text-lg font-semibold text-gray-700">Growth Rate</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">{analyticsData.summary.growthRate}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-full bg-purple-100 text-purple-600">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-sm sm:text-lg font-semibold text-gray-700">Total Revenue</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-600">{analyticsData.summary.totalPayroll.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <Warehouse className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-sm sm:text-lg font-semibold text-gray-700">Top Farm</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{analyticsData.summary.topFarm}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Revenue Trends</h3>
                <p className="text-xs sm:text-sm text-gray-600">Daily revenue breakdown</p>
              </div>
              <div className="p-4 sm:p-6">
                <div className="h-48 sm:h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center px-2">
                    <BarChart3 className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm sm:text-base text-gray-500">Chart will be displayed here</p>
                    <p className="text-xs text-gray-400">Install recharts to enable charts</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Farm Performance</h3>
                <p className="text-xs sm:text-sm text-gray-600">Revenue by farm</p>
              </div>
              <div className="p-4 sm:p-6">
                <div className="h-48 sm:h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center px-2">
                    <BarChart3 className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm sm:text-base text-gray-500">Chart will be displayed here</p>
                    <p className="text-xs text-gray-400">Install recharts to enable charts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Load Analytics Button */}
      {!analyticsData && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 sm:p-6">
            <div className="flex justify-center items-center py-8 sm:py-12">
              <button
                onClick={loadAnalyticsData}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md flex items-center text-sm sm:text-base"
              >
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="hidden sm:inline">
                  {loading ? 'Loading Analytics...' : 'Load Analytics Dashboard'}
                </span>
                <span className="sm:hidden">
                  {loading ? 'Loading...' : 'Load Analytics'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
