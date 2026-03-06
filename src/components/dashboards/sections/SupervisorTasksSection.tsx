"use client";

// Supervisor Tasks Section - Assign and manage worker tasks
import React, { useState, useCallback, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Plus, CheckCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import { taskAssignmentSchema, taskCompletionSchema, type TaskAssignmentFormData, type TaskCompletionFormData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';

export const SupervisorTasksSection: React.FC = () => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);

  // Task Assignment Form
  const assignForm = useForm<TaskAssignmentFormData>({
    resolver: zodResolver(taskAssignmentSchema),
    defaultValues: {
      worker_id: 0,
      farm_id: 0,
      task_code: '',
      block_id: undefined,
      crop_type: '',
      quantity: undefined,
      rate: undefined,
      date_worked: new Date().toISOString().split('T')[0],
      payment_method: 'per_task',
    },
  });

  // Task Completion Form
  const completeForm = useForm<TaskCompletionFormData>({
    resolver: zodResolver(taskCompletionSchema),
    defaultValues: {
      task_assignment_id: 0,
      actual_quantity: 0,
      completion_notes: '',
    },
  });

  const watchedFarmId = assignForm.watch('farm_id');
  const watchedPaymentMethod = assignForm.watch('payment_method');

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
      if (watchedFarmId && watchedFarmId > 0) {
        try {
          const blocksData = await apiService.getBlocksForFarm(watchedFarmId);
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
  }, [watchedFarmId]);

  const handleAssignTask = async (data: TaskAssignmentFormData) => {
    try {
      const taskData: any = {
        farm_id: data.farm_id,
        task_code: data.task_code.trim(),
        quantity: data.quantity || 0,
        rate: data.rate,
        date_worked: data.date_worked,
        payment_method: data.payment_method,
      };

      if (data.block_id) {
        taskData.block_id = data.block_id;
      }
      if (data.crop_type?.trim()) {
        taskData.crop_type = data.crop_type.trim();
      }

      await apiService.assignTaskToWorker(data.worker_id, taskData);

      toast.success('Task assigned successfully');
      setShowAssignModal(false);
      assignForm.reset({ worker_id: 0, farm_id: 0, task_code: '', block_id: undefined, crop_type: '', quantity: undefined, rate: undefined, date_worked: new Date().toISOString().split('T')[0], payment_method: 'per_task' });
      setBlocks([]);
      refetchTasks();
    } catch (error: any) {
      console.error('Failed to assign task:', error);

      if (error.response?.data) {
        const errorData = error.response.data;

        if (errorData.detail && Array.isArray(errorData.detail)) {
          const firstError = errorData.detail[0];
          const field = firstError.loc?.join('.') || 'field';
          toast.error(`Validation error on ${field}: ${firstError.msg || 'Please check your input'}`);
        } else if (errorData.detail) {
          toast.error(typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail));
        } else if (errorData.message) {
          toast.error(errorData.message);
        } else {
          toast.error(error.message || 'Failed to assign task');
        }
      } else {
        toast.error(error.message || 'Failed to assign task');
      }
    }
  };

  const handleCompleteTask = async (data: TaskCompletionFormData) => {
    if (!selectedWorker) {
      toast.error('Please select a worker');
      return;
    }

    try {
      await apiService.completeWorkerTask(selectedWorker.id, data.task_assignment_id, {
        actual_quantity: data.actual_quantity || 0,
        notes: data.completion_notes || '',
      });

      toast.success('Task marked as complete');
      setShowCompleteModal(false);
      completeForm.reset();
      setSelectedWorker(null);
      refetchWorkers();
      refetchTasks();
    } catch (error: any) {
      console.error('Failed to complete task:', error);
      toast.error(error.message || 'Failed to complete task');
    }
  };

  const handleStartTask = async (task: any) => {
    let workerId = task.worker?.id || task.worker_id;

    if (!workerId) {
      const worker = workers?.find((w: any) =>
        w.full_name === task.worker_name ||
        w.name === task.worker_name ||
        w.id === task.worker_id
      );
      if (worker) workerId = worker.id;
    }

    if (!workerId) {
      toast.error('Worker information not available');
      return;
    }

    try {
      await apiService.startWorkerTask(workerId, task.id);
      toast.success('Task started successfully');
      refetchTasks();
    } catch (error: any) {
      console.error('Failed to start task:', error);
      toast.error(error.message || 'Failed to start task');
    }
  };

  const handleQuickComplete = async (task: any) => {
    let workerId = task.worker?.id || task.worker_id;

    if (!workerId) {
      const worker = workers?.find((w: any) =>
        w.full_name === task.worker_name ||
        w.name === task.worker_name ||
        w.id === task.worker_id
      );
      if (worker) workerId = worker.id;
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
      refetchTasks();
    } catch (error: any) {
      console.error('Failed to complete task:', error);
      toast.error(error.message || 'Failed to complete task');
    }
  };

  const openAssignModal = (workerId?: number) => {
    if (workerId) {
      assignForm.setValue('worker_id', workerId);
    }
    setShowAssignModal(true);
  };

  const openCompleteModal = (worker?: any) => {
    if (worker) {
      setSelectedWorker(worker);
    }
    setShowCompleteModal(true);
  };

  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    assignForm.reset({ worker_id: 0, farm_id: 0, task_code: '', block_id: undefined, crop_type: '', quantity: undefined, rate: undefined, date_worked: new Date().toISOString().split('T')[0], payment_method: 'per_task' });
    setBlocks([]);
  };

  const handleCloseCompleteModal = () => {
    setShowCompleteModal(false);
    completeForm.reset();
    setSelectedWorker(null);
  };

  // Get incomplete tasks for selected worker
  const workerIncompleteTasks = taskAssignments?.filter((task: any) =>
    task.worker_id === selectedWorker?.id &&
    task.status !== 'completed' &&
    task.status !== 'Completed'
  ) || [];

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
            <Button onClick={() => openAssignModal()} className="gap-2">
              <Plus className="w-4 h-4" />
              Assign Task
            </Button>
            <Button onClick={() => openCompleteModal()} variant="secondary" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Complete Task
            </Button>
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
              .filter((w: any) => w.is_active !== false)
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openAssignModal(worker.id)}
                    >
                      Assign Task
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openCompleteModal(worker)}
                    >
                      Complete Task
                    </Button>
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
            {taskAssignments.map((task: any) => (
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
                        <Button size="sm" onClick={() => handleStartTask(task)}>
                          Start Task
                        </Button>
                      )}
                      {task.started_at && task.status !== 'completed' && task.status !== 'Completed' && (
                        <Button size="sm" variant="secondary" onClick={() => handleQuickComplete(task)}>
                          Complete Task
                        </Button>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Task Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Task to Worker</DialogTitle>
          </DialogHeader>

          <form onSubmit={assignForm.handleSubmit(handleAssignTask)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Worker Selection */}
              <Controller
                name="worker_id"
                control={assignForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Select Worker *</FieldLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select a Worker" />
                      </SelectTrigger>
                      <SelectContent>
                        {workers?.filter((w: any) => w.is_active !== false).map((worker: any) => (
                          <SelectItem key={worker.id} value={String(worker.id)}>
                            {worker.full_name || worker.name} - {worker.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {/* Farm Selection */}
              <Controller
                name="farm_id"
                control={assignForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Farm *</FieldLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select a Farm" />
                      </SelectTrigger>
                      <SelectContent>
                        {farms?.map((farm: any) => (
                          <SelectItem key={farm.id || farm.farm_id} value={String(farm.id || farm.farm_id)}>
                            {farm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {/* Task Code */}
              <Controller
                name="task_code"
                control={assignForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Task Code *</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select Task Code" />
                      </SelectTrigger>
                      <SelectContent>
                        {taskCodes?.map((task: any) => (
                          <SelectItem key={task.code || task.task_code} value={task.code || task.task_code}>
                            {task.code || task.task_code} - {task.description || task.name || ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {/* Payment Method */}
              <Controller
                name="payment_method"
                control={assignForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Payment Method *</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_task">Per Task</SelectItem>
                        <SelectItem value="per_day">Per Day</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {/* Quantity - only for per_task */}
              {watchedPaymentMethod === 'per_task' && (
                <Controller
                  name="quantity"
                  control={assignForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Quantity *</FieldLabel>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              )}

              {/* Rate */}
              <Controller
                name="rate"
                control={assignForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Rate *</FieldLabel>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {/* Date Worked */}
              <Controller
                name="date_worked"
                control={assignForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Date Worked *</FieldLabel>
                    <Input
                      {...field}
                      type="date"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {/* Block */}
              <Controller
                name="block_id"
                control={assignForm.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Block</FieldLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={watchedFarmId ? 'Select Block' : 'Select farm first'} />
                      </SelectTrigger>
                      <SelectContent>
                        {blocks.map((block: any) => (
                          <SelectItem key={block.id} value={String(block.id)}>
                            {block.name || block.block_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />

              {/* Crop Type */}
              <Controller
                name="crop_type"
                control={assignForm.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Crop Type (Optional)</FieldLabel>
                    <Input {...field} placeholder="e.g., Avocado, Maize" />
                  </Field>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseAssignModal}>
                Cancel
              </Button>
              <Button type="submit">
                Assign Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Complete Task Modal */}
      <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
          </DialogHeader>

          <form onSubmit={completeForm.handleSubmit(handleCompleteTask)} className="space-y-4">
            {/* Worker Display */}
            {selectedWorker && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Worker:</p>
                <p className="font-semibold text-gray-900">{selectedWorker.full_name || selectedWorker.name}</p>
              </div>
            )}

            {/* Worker Selection (if not pre-selected) */}
            {!selectedWorker && (
              <Field>
                <FieldLabel>Select Worker *</FieldLabel>
                <Select
                  onValueChange={(val) => {
                    const worker = workers?.find((w: any) => w.id === Number(val));
                    setSelectedWorker(worker);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Worker" />
                  </SelectTrigger>
                  <SelectContent>
                    {workers?.filter((w: any) => w.is_active !== false).map((worker: any) => (
                      <SelectItem key={worker.id} value={String(worker.id)}>
                        {worker.full_name || worker.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            {/* Task Selection */}
            <Controller
              name="task_assignment_id"
              control={completeForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Select Task to Complete *</FieldLabel>
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(val) => {
                      const taskId = Number(val);
                      field.onChange(taskId);
                      const task = taskAssignments?.find((t: any) => t.id === taskId);
                      if (task) {
                        completeForm.setValue('actual_quantity', task.quantity || 0);
                      }
                    }}
                  >
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select a Task" />
                    </SelectTrigger>
                    <SelectContent>
                      {workerIncompleteTasks.map((task: any) => (
                        <SelectItem key={task.id} value={String(task.id)}>
                          {task.task_code} - {new Date(task.date_worked).toLocaleDateString()} - {task.quantity} units
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Actual Quantity */}
            <Controller
              name="actual_quantity"
              control={completeForm.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Actual Quantity Completed (Optional)</FieldLabel>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Leave empty to use assigned quantity"
                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If left empty, will use the quantity assigned to the task
                  </p>
                </Field>
              )}
            />

            {/* Completion Notes */}
            <Controller
              name="completion_notes"
              control={completeForm.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Completion Notes (Optional)</FieldLabel>
                  <Textarea
                    {...field}
                    rows={4}
                    placeholder="Any notes about the completed task..."
                  />
                </Field>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseCompleteModal}>
                Cancel
              </Button>
              <Button type="submit">
                Mark Complete
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
