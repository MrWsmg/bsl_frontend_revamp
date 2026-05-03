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

  // Normalise both supervisor and worker response shapes into one display shape
  const normalise = (m: any) => {
    const isSupervisor = m.supervisor_id != null;
    return {
      id:          isSupervisor ? `s-${m.supervisor_id}` : `w-${m.worker_id}`,
      name:        isSupervisor ? m.supervisor_name : m.worker_name,
      type:        isSupervisor ? 'Supervisor' : 'Worker',
      primaryRate: isSupervisor ? m.attendance_recording_rate : m.attendance_rate,
      primaryLabel: isSupervisor ? 'Recording Rate' : 'Attendance Rate',
      secondaryRate: isSupervisor ? m.worker_attendance_rate : m.punctuality_score,
      secondaryLabel: isSupervisor ? 'Worker Attendance' : 'Punctuality',
      score:       isSupervisor ? m.supervision_effectiveness : m.performance_score,
      scoreLabel:  isSupervisor ? 'Effectiveness' : 'Performance Score',
      grade:       isSupervisor ? null : m.performance_grade,
      extra:       isSupervisor ? null : `${(m.average_hours_worked ?? 0).toFixed(1)}h avg`,
    };
  };

  const rows = (Array.isArray(performance) ? performance : []).map(normalise);
  const avgScore = rows.length ? rows.reduce((s, r) => s + (r.score || 0), 0) / rows.length : 0;
  const avgPrimary = rows.length ? rows.reduce((s, r) => s + (r.primaryRate || 0), 0) / rows.length : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {rows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Records Loaded</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{rows.length}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg {rows[0]?.primaryLabel ?? 'Rate'}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{avgPrimary.toFixed(1)}%</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Score</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{avgScore.toFixed(1)}%</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Top Score</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {Math.max(...rows.map(r => r.score || 0)).toFixed(1)}%
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
          ) : rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{rows[0]?.primaryLabel ?? 'Rate'}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{rows[0]?.secondaryLabel ?? 'Secondary'}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{rows[0]?.scoreLabel ?? 'Score'}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Extra</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${r.type === 'Supervisor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                          {r.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div className={`h-2 rounded-full ${(r.primaryRate||0)>=80?'bg-green-500':(r.primaryRate||0)>=60?'bg-yellow-500':'bg-red-500'}`}
                              style={{ width: `${Math.min(r.primaryRate||0, 100)}%` }} />
                          </div>
                          <span className="text-sm text-gray-900">{(r.primaryRate||0).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(r.secondaryRate||0).toFixed(1)}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(r.score||0)>=80?'bg-green-100 text-green-800':(r.score||0)>=60?'bg-yellow-100 text-yellow-800':'bg-red-100 text-red-800'}`}>
                          {(r.score||0).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {r.grade ? <span className="capitalize">{r.grade.replace('_', ' ')}</span> : r.extra ?? '—'}
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
      {rows.length > 0 && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Performance Insights</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Top Performers</h4>
                <div className="space-y-2">
                  {[...rows].sort((a, b) => (b.score||0) - (a.score||0)).slice(0, 5)
                    .map((r, i) => (
                      <div key={r.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-lg font-bold text-gray-400 mr-3">{i + 1}</span>
                          <span className="text-sm font-medium text-gray-900">{r.name}</span>
                        </div>
                        <span className="text-sm font-bold text-green-600">{(r.score||0).toFixed(1)}%</span>
                      </div>
                    ))}
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Needs Attention</h4>
                <div className="space-y-2">
                  {rows.filter(r => (r.score||0) < 60).length === 0
                    ? <p className="text-sm text-gray-500">No underperforming team members</p>
                    : [...rows].filter(r => (r.score||0) < 60).sort((a,b) => (a.score||0)-(b.score||0)).slice(0,5)
                        .map((r, i) => (
                          <div key={r.id} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="text-lg font-bold text-gray-400 mr-3">{i + 1}</span>
                              <span className="text-sm font-medium text-gray-900">{r.name}</span>
                            </div>
                            <span className="text-sm font-bold text-red-600">{(r.score||0).toFixed(1)}%</span>
                          </div>
                        ))
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

