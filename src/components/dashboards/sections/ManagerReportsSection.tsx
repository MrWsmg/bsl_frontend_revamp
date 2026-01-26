"use client";

// Manager Reports section component
import React, { useCallback, useState } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { FileText, AlertTriangle, AlertOctagon, TrendingUp, DollarSign } from 'lucide-react';

export const ManagerReportsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inspections' | 'emergencies' | 'incidents' | 'forecasts' | 'expenses'>('expenses');

  const getInspections = useCallback(() => apiService.getManagerInspections(), []);
  const getEmergencies = useCallback(() => apiService.getManagerEmergencies(), []);
  const getIncidents = useCallback(() => apiService.getManagerIncidents(), []);
  const getForecasts = useCallback(() => apiService.getManagerForecasts(), []);
  const getExpenses = useCallback(() => apiService.getManagerExpenses(), []);

  const { data: inspections, loading: inspectionsLoading } = useApi(getInspections, { immediate: activeTab === 'inspections' });
  const { data: emergencies, loading: emergenciesLoading } = useApi(getEmergencies, { immediate: activeTab === 'emergencies' });
  const { data: incidents, loading: incidentsLoading } = useApi(getIncidents, { immediate: activeTab === 'incidents' });
  const { data: forecasts, loading: forecastsLoading } = useApi(getForecasts, { immediate: activeTab === 'forecasts' });
  const { data: expenses, loading: expensesLoading } = useApi(getExpenses, { immediate: activeTab === 'expenses' });

  const loading = 
    (activeTab === 'inspections' && inspectionsLoading) ||
    (activeTab === 'emergencies' && emergenciesLoading) ||
    (activeTab === 'incidents' && incidentsLoading) ||
    (activeTab === 'forecasts' && forecastsLoading) ||
    (activeTab === 'expenses' && expensesLoading);

  const getCurrentData = () => {
    switch (activeTab) {
      case 'inspections': return inspections;
      case 'emergencies': return emergencies;
      case 'incidents': return incidents;
      case 'forecasts': return forecasts;
      case 'expenses': return expenses;
      default: return [];
    }
  };

  const currentData = getCurrentData();

  // Calculate summary stats
  const stats = {
    totalInspections: inspections?.length || 0,
    totalEmergencies: emergencies?.length || 0,
    totalIncidents: incidents?.length || 0,
    totalForecasts: forecasts?.length || 0,
    totalExpenses: expenses?.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inspections</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalInspections}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Emergencies</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEmergencies}</p>
            </div>
            <div className="bg-red-500 p-3 rounded-lg">
              <AlertOctagon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Incidents</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalIncidents}</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Forecasts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalForecasts}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expenses</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">${stats.totalExpenses.toLocaleString()}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'expenses'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setActiveTab('inspections')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'inspections'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Inspections
            </button>
            <button
              onClick={() => setActiveTab('emergencies')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'emergencies'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Emergencies
            </button>
            <button
              onClick={() => setActiveTab('incidents')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'incidents'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Incidents
            </button>
            <button
              onClick={() => setActiveTab('forecasts')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'forecasts'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Forecasts
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : !currentData || currentData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No {activeTab} found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Expenses Table */}
              {activeTab === 'expenses' && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Crop Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Farm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expenses?.map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ${item.amount?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.crop_type || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.farm?.name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Inspections Table */}
              {activeTab === 'inspections' && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Farm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Issues Found
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions Taken
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inspections?.map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.farm?.name || `Farm #${item.farm_id}`}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.inspection_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{item.notes}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{item.issues_found || 'None'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{item.actions_taken || 'None'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Emergencies Table */}
              {activeTab === 'emergencies' && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Farm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions Taken
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reported At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {emergencies?.map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.farm?.name || `Farm #${item.farm_id}`}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {item.emergency_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{item.description}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{item.actions_taken || 'Pending'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.reported_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Incidents Table */}
              {activeTab === 'incidents' && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Farm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions Taken
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reported At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {incidents?.map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.farm?.name || `Farm #${item.farm_id}`}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {item.incident_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{item.description}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{item.actions_taken || 'Pending'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.reported_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Forecasts Table */}
              {activeTab === 'forecasts' && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Farm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Crop Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expected Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Forecast Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Harvest Start
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {forecasts?.map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.farm?.name || `Farm #${item.farm_id}`}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.crop_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{item.expected_quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.forecast_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.harvest_start_date ? new Date(item.harvest_start_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{item.notes || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Alert for emergencies */}
      {emergencies && emergencies.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertOctagon className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Active Emergencies</h3>
              <p className="text-sm text-red-700 mt-1">
                There are {emergencies.length} active emergency report(s) that require attention.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
