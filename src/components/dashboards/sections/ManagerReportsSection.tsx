"use client";

// Manager Reports section component
import React, { useCallback, useState } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { FileText, AlertTriangle, AlertOctagon, TrendingUp, DollarSign, Plus } from 'lucide-react';
import { toast } from '../../ui/sonner';

export const ManagerReportsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inspections' | 'emergencies' | 'incidents' | 'forecasts' | 'expenses'>('expenses');

  // ── Create modal state ──
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({ farm_id: '', inspection_date: '', notes: '', issues_found: '', actions_taken: '' });
  const [emergencyForm, setEmergencyForm] = useState({ farm_id: '', emergency_type: '', description: '', actions_taken: '' });
  const [incidentForm, setIncidentForm] = useState({ farm_id: '', incident_type: '', description: '', actions_taken: '' });
  const [forecastForm, setForecastForm] = useState({ farm_id: '', crop_type: '', expected_quantity: '', unit: '', forecast_date: '', harvest_start_date: '', notes: '' });

  const getFarms = useCallback(() => apiService.getManagerFarms(), []);
  const { data: farmsData } = useApi(getFarms);
  const farms: any[] = Array.isArray(farmsData) ? farmsData : [];

  const getInspections = useCallback(() => apiService.getManagerInspections(), []);
  const getEmergencies = useCallback(() => apiService.getManagerEmergencies(), []);
  const getIncidents = useCallback(() => apiService.getManagerIncidents(), []);
  const getForecasts = useCallback(() => apiService.getManagerForecasts(), []);
  const getExpenses = useCallback(() => apiService.getManagerExpenses(), []);

  const { data: inspections, loading: inspectionsLoading, refetch: refetchInspections } = useApi(getInspections, { immediate: activeTab === 'inspections' });
  const { data: emergencies, loading: emergenciesLoading, refetch: refetchEmergencies } = useApi(getEmergencies, { immediate: activeTab === 'emergencies' });
  const { data: incidents, loading: incidentsLoading, refetch: refetchIncidents } = useApi(getIncidents, { immediate: activeTab === 'incidents' });
  const { data: forecasts, loading: forecastsLoading, refetch: refetchForecasts } = useApi(getForecasts, { immediate: activeTab === 'forecasts' });
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

  const stats = {
    totalInspections: inspections?.length || 0,
    totalEmergencies: emergencies?.length || 0,
    totalIncidents: incidents?.length || 0,
    totalForecasts: forecasts?.length || 0,
    totalExpenses: expenses?.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0
  };

  const openModal = () => {
    setInspectionForm({ farm_id: '', inspection_date: '', notes: '', issues_found: '', actions_taken: '' });
    setEmergencyForm({ farm_id: '', emergency_type: '', description: '', actions_taken: '' });
    setIncidentForm({ farm_id: '', incident_type: '', description: '', actions_taken: '' });
    setForecastForm({ farm_id: '', crop_type: '', expected_quantity: '', unit: '', forecast_date: '', harvest_start_date: '', notes: '' });
    setShowModal(true);
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      if (activeTab === 'inspections') {
        if (!inspectionForm.farm_id || !inspectionForm.inspection_date || !inspectionForm.notes.trim()) {
          toast.error('Farm, date, and notes are required'); return;
        }
        await apiService.createManagerInspection({ ...inspectionForm, farm_id: Number(inspectionForm.farm_id) });
        refetchInspections();
      } else if (activeTab === 'emergencies') {
        if (!emergencyForm.farm_id || !emergencyForm.emergency_type.trim() || !emergencyForm.description.trim()) {
          toast.error('Farm, type, and description are required'); return;
        }
        await apiService.createManagerEmergency({ ...emergencyForm, farm_id: Number(emergencyForm.farm_id) });
        refetchEmergencies();
      } else if (activeTab === 'incidents') {
        if (!incidentForm.farm_id || !incidentForm.incident_type.trim() || !incidentForm.description.trim()) {
          toast.error('Farm, type, and description are required'); return;
        }
        await apiService.createManagerIncident({ ...incidentForm, farm_id: Number(incidentForm.farm_id) });
        refetchIncidents();
      } else if (activeTab === 'forecasts') {
        if (!forecastForm.farm_id || !forecastForm.crop_type.trim() || !forecastForm.expected_quantity || !forecastForm.forecast_date) {
          toast.error('Farm, crop type, quantity, and forecast date are required'); return;
        }
        await apiService.createManagerForecast({
          farm_id: Number(forecastForm.farm_id),
          crop_type: forecastForm.crop_type,
          expected_quantity: Number(forecastForm.expected_quantity),
          unit: forecastForm.unit,
          forecast_date: forecastForm.forecast_date,
          harvest_start_date: forecastForm.harvest_start_date || undefined,
          notes: forecastForm.notes || undefined,
        });
        refetchForecasts();
      }
      toast.success(`${activeTab.slice(0, -1).replace(/^\w/, c => c.toUpperCase())} logged`);
      setShowModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const canCreate = activeTab !== 'expenses';

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
              <p className="text-lg font-bold text-gray-900 mt-2">TZS {stats.totalExpenses.toLocaleString()}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200 flex items-center justify-between pr-4">
          <div className="overflow-x-auto flex">
            {(['expenses', 'inspections', 'emergencies', 'incidents', 'forecasts'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium transition-colors whitespace-nowrap capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {canCreate && (
            <button
              onClick={openModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> Log {activeTab.slice(0, -1)}
            </button>
          )}
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crop Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farm</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expenses?.map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          TZS {item.amount?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.crop_type || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.farm?.name || `Farm #${item.farm_id}`}</td>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farm</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issues Found</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions Taken</th>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farm</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions Taken</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported At</th>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farm</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions Taken</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported At</th>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farm</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crop Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forecast Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harvest Start</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
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
                        <td className="px-6 py-4 text-sm text-gray-500">{item.notes || '—'}</td>
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

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
              Log {activeTab.slice(0, -1)}
            </h3>

            {/* Farm select — shared by all */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm <span className="text-red-500">*</span></label>
              <select
                value={
                  activeTab === 'inspections' ? inspectionForm.farm_id :
                  activeTab === 'emergencies' ? emergencyForm.farm_id :
                  activeTab === 'incidents'   ? incidentForm.farm_id :
                  forecastForm.farm_id
                }
                onChange={e => {
                  const v = e.target.value;
                  if (activeTab === 'inspections') setInspectionForm(f => ({ ...f, farm_id: v }));
                  else if (activeTab === 'emergencies') setEmergencyForm(f => ({ ...f, farm_id: v }));
                  else if (activeTab === 'incidents')   setIncidentForm(f => ({ ...f, farm_id: v }));
                  else setForecastForm(f => ({ ...f, farm_id: v }));
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Select farm...</option>
                {farms.map((farm: any) => (
                  <option key={farm.id} value={farm.id}>{farm.name}</option>
                ))}
              </select>
            </div>

            {/* Inspection fields */}
            {activeTab === 'inspections' && (
              <>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Date <span className="text-red-500">*</span></label>
                  <input type="date" value={inspectionForm.inspection_date} onChange={e => setInspectionForm(f => ({ ...f, inspection_date: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-red-500">*</span></label>
                  <textarea rows={2} value={inspectionForm.notes} onChange={e => setInspectionForm(f => ({ ...f, notes: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issues Found</label>
                  <textarea rows={2} value={inspectionForm.issues_found} onChange={e => setInspectionForm(f => ({ ...f, issues_found: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Actions Taken</label>
                  <textarea rows={2} value={inspectionForm.actions_taken} onChange={e => setInspectionForm(f => ({ ...f, actions_taken: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
              </>
            )}

            {/* Emergency fields */}
            {activeTab === 'emergencies' && (
              <>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Type <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="e.g. Fire, Flood, Equipment failure" value={emergencyForm.emergency_type} onChange={e => setEmergencyForm(f => ({ ...f, emergency_type: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                  <textarea rows={3} value={emergencyForm.description} onChange={e => setEmergencyForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Actions Taken</label>
                  <textarea rows={2} value={emergencyForm.actions_taken} onChange={e => setEmergencyForm(f => ({ ...f, actions_taken: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
              </>
            )}

            {/* Incident fields */}
            {activeTab === 'incidents' && (
              <>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Incident Type <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="e.g. Theft, Injury, Pest outbreak" value={incidentForm.incident_type} onChange={e => setIncidentForm(f => ({ ...f, incident_type: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                  <textarea rows={3} value={incidentForm.description} onChange={e => setIncidentForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Actions Taken</label>
                  <textarea rows={2} value={incidentForm.actions_taken} onChange={e => setIncidentForm(f => ({ ...f, actions_taken: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
              </>
            )}

            {/* Forecast fields */}
            {activeTab === 'forecasts' && (
              <>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type <span className="text-red-500">*</span></label>
                  <input type="text" value={forecastForm.crop_type} onChange={e => setForecastForm(f => ({ ...f, crop_type: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Qty <span className="text-red-500">*</span></label>
                    <input type="number" min="0" value={forecastForm.expected_quantity} onChange={e => setForecastForm(f => ({ ...f, expected_quantity: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <input type="text" placeholder="kg, tonnes..." value={forecastForm.unit} onChange={e => setForecastForm(f => ({ ...f, unit: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Forecast Date <span className="text-red-500">*</span></label>
                    <input type="date" value={forecastForm.forecast_date} onChange={e => setForecastForm(f => ({ ...f, forecast_date: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Harvest Start Date</label>
                    <input type="date" value={forecastForm.harvest_start_date} onChange={e => setForecastForm(f => ({ ...f, harvest_start_date: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea rows={2} value={forecastForm.notes} onChange={e => setForecastForm(f => ({ ...f, notes: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 border rounded hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
