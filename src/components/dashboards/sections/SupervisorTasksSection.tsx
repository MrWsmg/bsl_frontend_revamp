"use client";

// Supervisor Tasks Section - Assign and manage worker tasks
import React, { useState, useCallback, useEffect } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Plus, CheckCircle, Clock, User } from 'lucide-react';
import { toast } from '../../ui/sonner';

interface TaskFormData {
  worker_id: number;
  farm_id: number;
  task_code: string;
  block?: string;
  crop_type?: string;
  quantity: number;
  rate: number;
  date_worked: string;
  payment_method: string;
}

interface CompletionFormData {
  task_assignment_id?: number;
  selected_task?: any;
  actual_quantity?: number;
  completion_notes: string;
}

export const SupervisorTasksSection: React.FC = () => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  
  const [taskFormData, setTaskFormData] = useState<TaskFormData>({
    worker_id: 0,
    farm_id: 0,
    task_code: '',
    block: '',
    crop_type: '',
    quantity: 0,
    rate: 0,
    date_worked: new Date().toISOString().split('T')[0],
    payment_method: 'per_task',
  });

  const [completionFormData, setCompletionFormData] = useState<CompletionFormData>({
    task_assignment_id: 0,
    selected_task: null,
    actual_quantity: 0,
    completion_notes: '',
  });

  const [blocks, setBlocks] = useState<any[]>([]);

  // Fetch data
  const getWorkers = useCallback(() => apiService.getWorkers(), []);
  const getFarms = useCallback(() => apiService.getFarms('supervisor'), []);
  const getTaskCodes = useCallback(() => apiService.getTaskCodes(), []);
  const getTaskAssignments = useCallback(() => apiService.getManagerTaskAssignments(), []);
  const { data: workers, loading: loadingWorkers, refetch: refetchWorkers } = useApi(getWorkers);
  const { data: farms } = useApi(getFarms);
  const { data: taskCodes } = useApi(getTaskCodes);
  const { data: taskAssignments, loading: loadingTasks, refetch: refetchTasks } = useApi(getTaskAssignments);

  // Fetch blocks when farm changes
  useEffect(() => {
    const fetchBlocks = async () => {
      if (taskFormData.farm_id && taskFormData.farm_id > 0) {
        try {
          const blocksData = await apiService.getBlocksForFarm(taskFormData.farm_id);
          setBlocks(blocksData || []);
        } catch (error) {
          console.error('Failed to fetch blocks:', error);
          setBlocks([]);
        }
      } else {
        setBlocks([]);
      }
    };

    fetchBlocks();
  }, [taskFormData.farm_id]);

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskFormData.worker_id || taskFormData.worker_id === 0) {
      toast.error('Please select a worker');
      return;
    }

    if (!taskFormData.farm_id || taskFormData.farm_id === 0) {
      toast.error('Please select a farm');
      return;
    }

    if (!taskFormData.task_code.trim()) {
      toast.error('Please enter a task code');
      return;
    }

    if (taskFormData.payment_method === 'per_task' && (!taskFormData.quantity || taskFormData.quantity <= 0)) {
      toast.error('Please enter a valid quantity (must be greater than 0)');
      return;
    }

    if (!taskFormData.rate || taskFormData.rate <= 0) {
      toast.error('Please enter a valid rate (must be greater than 0)');
      return;
    }

    try {
      const taskData: any = {
        farm_id: taskFormData.farm_id,
        task_code: taskFormData.task_code.trim(),
        quantity: taskFormData.quantity,
        rate: taskFormData.rate,
        date_worked: taskFormData.date_worked,
        payment_method: taskFormData.payment_method,
      };

      // Add optional fields only if provided
      if (taskFormData.block?.trim()) {
        taskData.block = taskFormData.block.trim();
      }
      if (taskFormData.crop_type?.trim()) {
        taskData.crop_type = taskFormData.crop_type.trim();
      }

      await apiService.assignTaskToWorker(taskFormData.worker_id, taskData);

      toast.success('Task assigned successfully');
      setShowAssignModal(false);
      resetTaskForm();
    } catch (error: any) {
      console.error('Failed to assign task:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      // Handle different error formats
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Check if detail is an array (validation errors)
        if (errorData.detail && Array.isArray(errorData.detail)) {
          const firstError = errorData.detail[0];
          const field = firstError.loc?.join('.') || 'field';
          toast.error(`Validation error on ${field}: ${firstError.msg || 'Please check your input'}`);
        } 
        // Check if detail is a string or object
        else if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            toast.error(errorData.detail);
          } else {
            toast.error(JSON.stringify(errorData.detail));
          }
        }
        // Check for message field
        else if (errorData.message) {
          toast.error(errorData.message);
        }
        // Fallback to error message
        else {
          toast.error(error.message || 'Failed to assign task');
        }
      } else {
        toast.error(error.message || 'Failed to assign task');
      }
    }
  };

  const handleCompleteTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedWorker) {
      toast.error('Please select a worker');
      return;
    }

    if (!completionFormData.selected_task && (!completionFormData.task_assignment_id || completionFormData.task_assignment_id === 0)) {
      toast.error('Please select a task or enter a task assignment ID');
      return;
    }

    try {
      const taskId = completionFormData.selected_task?.id || completionFormData.task_assignment_id;
      await apiService.completeWorkerTask(selectedWorker.id, taskId!, {
        actual_quantity: completionFormData.actual_quantity || 0,
        notes: completionFormData.completion_notes,
      });

      toast.success('Task marked as complete');
      setShowCompleteModal(false);
      resetCompletionForm();
      setSelectedWorker(null);
      refetchWorkers(); // Refresh workers list
    } catch (error: any) {
      console.error('Failed to complete task:', error);
      toast.error(error.message || 'Failed to complete task');
    }
  };

  const handleStartTask = async (task: any) => {
    // Find worker by ID if worker object is not available
    let workerId = task.worker?.id;
    if (!workerId && task.worker_id) {
      workerId = task.worker_id;
    }

    if (!workerId) {
      // Try to find worker by name if available
      const worker = workers?.find((w: any) =>
        w.full_name === task.worker_name ||
        w.name === task.worker_name ||
        w.id === task.worker_id
      );
      if (worker) {
        workerId = worker.id;
      }
    }

    if (!workerId) {
      toast.error('Worker information not available');
      return;
    }

    try {
      await apiService.startWorkerTask(workerId, task.id);

      toast.success('Task started successfully');
      refetchTasks(); // Refresh tasks list
    } catch (error: any) {
      console.error('Failed to start task:', error);
      toast.error(error.message || 'Failed to start task');
    }
  };

  const handleQuickComplete = async (task: any) => {
    // Find worker by ID if worker object is not available
    let workerId = task.worker?.id;
    if (!workerId && task.worker_id) {
      workerId = task.worker_id;
    }

    if (!workerId) {
      // Try to find worker by name if available
      const worker = workers?.find((w: any) =>
        w.full_name === task.worker_name ||
        w.name === task.worker_name ||
        w.id === task.worker_id
      );
      if (worker) {
        workerId = worker.id;
      }
    }

    if (!workerId) {
      toast.error('Worker information not available');
      return;
    }

    try {
      await apiService.completeWorkerTask(workerId, task.id, {
        actual_quantity: task.quantity || task.actual_quantity || 0,
        notes: 'Task completed successfully',
      });

      toast.success('Task marked as complete');
      refetchTasks(); // Refresh tasks list
    } catch (error: any) {
      console.error('Failed to complete task:', error);
      toast.error(error.message || 'Failed to complete task');
    }
  };

  const resetTaskForm = () => {
    setTaskFormData({
      worker_id: 0,
      farm_id: 0,
      task_code: '',
      block: '',
      crop_type: '',
      quantity: 0,
      rate: 0,
      date_worked: new Date().toISOString().split('T')[0],
      payment_method: 'per_task',
    });
    setBlocks([]);
  };

  const resetCompletionForm = () => {
    setCompletionFormData({
      task_assignment_id: 0,
      selected_task: null,
      actual_quantity: 0,
      completion_notes: '',
    });
  };

  if (loadingWorkers) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Task Management</h2>
            <p className="text-sm text-gray-600 mt-1">Assign and complete worker tasks</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAssignModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Assign Task
            </button>
            <button
              onClick={() => setShowCompleteModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Complete Task
            </button>
          </div>
        </div>
      </div>

      {/* Workers List with Task Assignment */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Workers</h3>
        {!workers || workers.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No workers found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers
              .filter((w: any) => w.is_active)
              .map((worker: any) => (
                <div key={worker.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-3">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{worker.full_name || worker.name}</h4>
                      <p className="text-sm text-gray-600">{worker.phone || 'No phone'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setTaskFormData(prev => ({ ...prev, worker_id: worker.id }));
                        setShowAssignModal(true);
                      }}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm px-3 py-2 rounded-md"
                    >
                      Assign Task
                    </button>
                    <button
                      onClick={() => {
                        setSelectedWorker(worker);
                        setShowCompleteModal(true);
                      }}
                      className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 text-sm px-3 py-2 rounded-md"
                    >
                      Complete Task
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Assigned Tasks */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Tasks</h3>
        {loadingTasks ? (
          <div className="flex justify-center items-center py-4">
            <LoadingSpinner size="sm" />
          </div>
        ) : !taskAssignments || taskAssignments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No assigned tasks found</p>
        ) : (
          <div className="space-y-4">
            {taskAssignments.map((task: any) => {
              console.log('Task data:', task); // Debug log
              return (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{task.task_code}</h4>
                      <p className="text-sm text-gray-600">
                        Worker: {task.worker?.full_name || task.worker?.name || task.worker_name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Date: {new Date(task.date_worked).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.status === 'completed' || task.status === 'Completed'
                          ? 'bg-green-100 text-green-800'
                          : task.status === 'in_progress' || task.status === 'In Progress' || task.status === 'assigned' || task.status === 'Assigned'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status === 'in_progress' || task.status === 'In Progress' ? 'In Progress' :
                         task.status === 'assigned' || task.status === 'Assigned' ? 'Assigned' :
                         task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </span>
                      <div className="flex gap-1">
                        {!task.started_at && task.status !== 'completed' && task.status !== 'Completed' && (
                          <button
                            onClick={() => handleStartTask(task)}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded-md"
                          >
                            Start Task
                          </button>
                        )}
                        {task.started_at && task.status !== 'completed' && task.status !== 'Completed' && (
                          <button
                            onClick={() => handleQuickComplete(task)}
                            className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded-md"
                          >
                            Complete Task
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Worker ID:</span>
                      <span className="ml-1 font-medium">{task.worker_id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Farm ID:</span>
                      <span className="ml-1 font-medium">{task.farm_id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Amount:</span>
                      <span className="ml-1 font-medium">{task.total_amount || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Payment Method:</span>
                      <span className="ml-1 font-medium">{task.payment_method || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Crop Type:</span>
                      <span className="ml-1 font-medium">{task.crop_type || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Block:</span>
                      <span className="ml-1 font-medium">{task.block || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Assigned At:</span>
                      <span className="ml-1 font-medium">{task.assigned_at ? new Date(task.assigned_at).toLocaleString() : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Started At (Assigned):</span>
                      <span className="ml-1 font-medium">{task.started_at ? new Date(task.started_at).toLocaleString() : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Completed At:</span>
                      <span className="ml-1 font-medium">{task.completed_at ? new Date(task.completed_at).toLocaleString() : 'N/A'}</span>
                    </div>
                    <div className="md:col-span-4">
                      <span className="text-gray-500">Notes:</span>
                      <span className="ml-1 font-medium">{task.notes || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assign Task Modal */}
      {showAssignModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 pt-8 z-50 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAssignModal(false);
              resetTaskForm();
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Assign Task to Worker</h2>
              
              <form onSubmit={handleAssignTask} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Worker Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Worker
                    </label>
                    <select
                      required
                      value={taskFormData.worker_id}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, worker_id: Number(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={0}> Select a Worker </option>
                      {workers?.filter((w: any) => w.is_active).map((worker: any) => (
                        <option key={worker.id} value={worker.id}>
                          {worker.full_name || worker.name} - {worker.phone}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Farm Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Farm </label>
                    <select
                      required
                      value={taskFormData.farm_id}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, farm_id: Number(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={0}> Select a Farm </option>
                      {farms?.map((farm: any) => (
                        <option key={farm.id || farm.farm_id} value={farm.id || farm.farm_id}>
                          {farm.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Task Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Task Code </label>
                    <select
                      required
                      value={taskFormData.task_code}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, task_code: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Task Code </option>
                      {taskCodes?.map((task: any) => (
                        <option key={task.code || task.task_code} value={task.code || task.task_code}>
                          {task.code || task.task_code} - {task.description || task.name || ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method </label>
                    <select
                      required
                      value={taskFormData.payment_method}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="per_task">Per Task </option>
                      <option value="per_day">Per Day</option>
                    </select>
                  </div>

                  {/* Quantity */}
                  {taskFormData.payment_method === 'per_task' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0.01"
                        value={taskFormData.quantity || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          setTaskFormData(prev => ({ ...prev, quantity: isNaN(value) ? 0 : value }));
                        }}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  {/* Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rate </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0.01"
                      value={taskFormData.rate || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setTaskFormData(prev => ({ ...prev, rate: isNaN(value) ? 0 : value }));
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Date Worked */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Worked </label>
                    <input
                      type="date"
                      required
                      value={taskFormData.date_worked}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, date_worked: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Block (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Block </label>
                    <select
                      value={taskFormData.block || ''}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, block: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value=""> Select Block </option>
                      {blocks.map((block: any) => (
                        <option key={block.id || block.name} value={block.name || block.block_name}>
                          {block.name || block.block_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Crop Type (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type (Optional)</label>
                    <input
                      type="text"
                      value={taskFormData.crop_type || ''}
                      onChange={(e) => setTaskFormData(prev => ({ ...prev, crop_type: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Avocado, Maize"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignModal(false);
                      resetTaskForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                  >
                    Assign Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Complete Task Modal */}
      {showCompleteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 pt-8 z-50 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCompleteModal(false);
              resetCompletionForm();
              setSelectedWorker(null);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Task</h2>
              
              <form onSubmit={handleCompleteTask} className="space-y-4">
                {/* Worker Display */}
                {selectedWorker && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-600">Worker:</p>
                    <p className="font-semibold text-gray-900">{selectedWorker.full_name || selectedWorker.name}</p>
                  </div>
                )}

                {/* Worker Selection (if not pre-selected) */}
                {!selectedWorker && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Worker *
                    </label>
                    <select
                      required
                      onChange={(e) => {
                        const worker = workers?.find((w: any) => w.id === Number(e.target.value));
                        setSelectedWorker(worker);
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">-- Select a Worker --</option>
                      {workers?.filter((w: any) => w.is_active).map((worker: any) => (
                        <option key={worker.id} value={worker.id}>
                          {worker.full_name || worker.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Task Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Task to Complete</label>
                  <select
                    required
                    value={completionFormData.selected_task?.id || completionFormData.task_assignment_id || ''}
                    onChange={(e) => {
                      const selectedTaskId = Number(e.target.value);
                      const task = taskAssignments?.find((t: any) => t.id === selectedTaskId);
                      setCompletionFormData(prev => ({
                        ...prev,
                        selected_task: task || null,
                        task_assignment_id: selectedTaskId || 0,
                        actual_quantity: task?.quantity || 0, // Pre-fill with assigned quantity
                      }));
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">-- Select a Task --</option>
                    {taskAssignments
                      ?.filter((task: any) =>
                        task.worker_id === selectedWorker?.id &&
                        task.status !== 'completed' &&
                        task.status !== 'Completed'
                      )
                      .map((task: any) => (
                        <option key={task.id} value={task.id}>
                          {task.task_code} - {new Date(task.date_worked).toLocaleDateString()} - {task.quantity} units
                        </option>
                      ))}
                  </select>
                  {completionFormData.selected_task && (
                    <p className="text-xs text-gray-500 mt-1">
                      Assigned: {completionFormData.selected_task.quantity} units • Rate: {completionFormData.selected_task.rate}
                    </p>
                  )}
                </div>

                {/* Actual Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actual Quantity Completed (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={completionFormData.actual_quantity || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setCompletionFormData(prev => ({ ...prev, actual_quantity: isNaN(value) ? 0 : value }));
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Leave empty to use assigned quantity"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If left empty, will use the quantity assigned to the task
                  </p>
                </div>

                {/* Completion Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completion Notes (Optional)</label>
                  <textarea
                    value={completionFormData.completion_notes}
                    onChange={(e) => setCompletionFormData(prev => ({ ...prev, completion_notes: e.target.value }))}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Any notes about the completed task..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCompleteModal(false);
                      resetCompletionForm();
                      setSelectedWorker(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md"
                  >
                    Mark Complete
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

