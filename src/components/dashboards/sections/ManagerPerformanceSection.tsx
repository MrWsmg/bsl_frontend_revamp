"use client";

// Manager Performance section component
import React, { useCallback, useState } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { TrendingUp, Target, Award, BarChart3 } from 'lucide-react';
import { PerformanceFilters } from '../../../types';

export const ManagerPerformanceSection: React.FC = () => {
  const [filters, setFilters] = useState<PerformanceFilters>({
    user_id: undefined,
    worker_id: undefined,
    start_date: '',
    end_date: ''
  });

  const getUsers = useCallback(() => apiService.getManagerUsers(), []);
  const getWorkers = useCallback(() => apiService.getManagerWorkers(), []);
  const getPerformance = useCallback(() => 
    apiService.getManagerPerformance(filters), 
    [filters]
  );

  const { data: users, loading: usersLoading } = useApi(getUsers);
  const { data: workers, loading: workersLoading } = useApi(getWorkers);
  const { data: performance, loading: performanceLoading, refetch: refetchPerformance } = useApi(getPerformance, { immediate: false });

  const handleLoadPerformance = () => {
    refetchPerformance();
  };

  const calculateAverages = () => {
    if (!performance || performance.length === 0) {
      return {
        avgCompletionRate: 0,
        avgProductivity: 0,
        avgQuality: 0,
        avgAttendance: 0
      };
    }

    return {
      avgCompletionRate: performance.reduce((sum: number, p: any) => sum + (p.completion_rate || 0), 0) / performance.length,
      avgProductivity: performance.reduce((sum: number, p: any) => sum + (p.productivity_score || 0), 0) / performance.length,
      avgQuality: performance.reduce((sum: number, p: any) => sum + (p.average_quality_score || 0), 0) / performance.length,
      avgAttendance: performance.reduce((sum: number, p: any) => sum + (p.attendance_rate || 0), 0) / performance.length
    };
  };

  const averages = calculateAverages();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {performance && performance.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {averages.avgCompletionRate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Productivity</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {averages.avgProductivity.toFixed(1)}
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Quality Score</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {averages.avgQuality.toFixed(1)}
                </p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {averages.avgAttendance.toFixed(1)}%
                </p>
              </div>
              <div className="bg-orange-500 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Filters */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Performance Metrics</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User (Supervisor)</label>
              <select
                value={filters.user_id || ''}
                onChange={(e) => setFilters({ ...filters, user_id: e.target.value ? Number(e.target.value) : undefined, worker_id: undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              >
                <option value="">Select User</option>
                {users?.map((user: any) => (
                  <option key={user.id} value={user.id}>{user.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Worker</label>
              <select
                value={filters.worker_id || ''}
                onChange={(e) => setFilters({ ...filters, worker_id: e.target.value ? Number(e.target.value) : undefined, user_id: undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Worker</option>
                {workers?.map((worker: any) => (
                  <option key={worker.id} value={worker.id}>{worker.full_name || worker.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleLoadPerformance}
                disabled={performanceLoading}
                className="w-full bg-blue-500 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-md"
              >
                {performanceLoading ? 'Loading...' : 'Load Metrics'}
              </button>
            </div>
          </div>

          {/* Performance List */}
          {performanceLoading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : performance && performance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tasks Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completion Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Productivity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quality Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {performance.map((metric: any) => (
                    <tr key={metric.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{metric.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {metric.role || 'Worker'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(metric.period_start).toLocaleDateString()} - {new Date(metric.period_end).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {metric.tasks_completed} / {metric.tasks_assigned}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900 mr-2">
                            {metric.completion_rate.toFixed(1)}%
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                metric.completion_rate >= 80 ? 'bg-green-500' :
                                metric.completion_rate >= 60 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(metric.completion_rate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {metric.productivity_score?.toFixed(1) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {metric.average_quality_score?.toFixed(1) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          (metric.attendance_rate || 0) >= 90 ? 'bg-green-100 text-green-800' :
                          (metric.attendance_rate || 0) >= 75 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {metric.attendance_rate?.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-12">No performance metrics found. Use filters above to load metrics.</p>
          )}
        </div>
      </div>

      {/* Performance Insights */}
      {performance && performance.length > 0 && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Performance Insights</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Top Performers</h4>
                <div className="space-y-2">
                  {performance
                    .sort((a: any, b: any) => b.completion_rate - a.completion_rate)
                    .slice(0, 5)
                    .map((metric: any, index: number) => (
                      <div key={metric.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-lg font-bold text-gray-400 mr-3">{index + 1}</span>
                          <span className="text-sm font-medium text-gray-900">{metric.name}</span>
                        </div>
                        <span className="text-sm font-bold text-green-600">
                          {metric.completion_rate.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Needs Attention</h4>
                <div className="space-y-2">
                  {performance
                    .filter((m: any) => m.completion_rate < 60)
                    .sort((a: any, b: any) => a.completion_rate - b.completion_rate)
                    .slice(0, 5)
                    .map((metric: any, index: number) => (
                      <div key={metric.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-lg font-bold text-gray-400 mr-3">{index + 1}</span>
                          <span className="text-sm font-medium text-gray-900">{metric.name}</span>
                        </div>
                        <span className="text-sm font-bold text-red-600">
                          {metric.completion_rate.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  {performance.filter((m: any) => m.completion_rate < 60).length === 0 && (
                    <p className="text-sm text-gray-500">No underperforming team members</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

