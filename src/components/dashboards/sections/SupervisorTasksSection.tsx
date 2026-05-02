"use client";

// Supervisor Tasks Section - Assign and manage worker tasks
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Plus, CheckCircle, User, Search, RefreshCw, XCircle } from 'lucide-react';
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
  const [workerSearch, setWorkerSearch] = useState('');
  const [showOffsite, setShowOffsite] = useState(false);

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
  const watchedDateWorked = assignForm.watch('date_worked');

  // Fetch data
  const getWorkers = useCallback(() => apiService.getWorkers(), []);
  const getFarms = useCallback(() => apiService.getFarms('supervisor'), []);
  const getTaskCodes = useCallback(() => apiService.getTaskCodes(), []);
  const getTaskAssignments = useCallback(() => apiService.getManagerTaskAssignments(), []);
  const { data: workers, loading: loadingWorkers, refetch: refetchWorkers } = useApi(getWorkers);
  const { data: farms } = useApi(getFarms);
  const { data: taskCodes } = useApi(getTaskCodes);
  const { data: taskAssignments, loading: loadingTasks, refetch: refetchTasks } = useApi(getTaskAssignments);

  // Fetch today's attendance to know who is currently checked in
  const today = new Date().toISOString().split('T')[0];
  const getTodayAttendance = useCallback(
    () => apiService.getAttendanceRecords({ start_date: today, end_date: today }),
    [today]
  );
  const { data: todayAttendance } = useApi(getTodayAttendance);

  // Set of worker_ids that are currently checked in (have check_in_time, no check_out_time)
  const checkedInWorkerIds = useMemo<Set<number>>(() => {
    const records: any[] = Array.isArray(todayAttendance) ? todayAttendance : [];
    const ids = records
      .filter((r: any) => r.check_in_time && !r.check_out_time && r.worker_id)
      .map((r: any) => r.worker_id as number);
    return new Set(ids);
  }, [todayAttendance]);

  // For backdated tasks, skip the check-in filter — only enforce it for today
  const isBackdating = watchedDateWorked && watchedDateWorked < today;

  // Checked-in workers filtered by selected farm (for the assign modal dropdown)
  const checkedInWorkersForFarm = useMemo(() => {
    const allActive: any[] = (workers ?? []).filter((w: any) => w.is_active !== false);
    // Backdated task: all active workers are eligible (backend relaxed check-in requirement)
    if (isBackdating) return allActive;
    if (!watchedFarmId || !todayAttendance) return allActive.filter((w: any) => checkedInWorkerIds.has(w.id));
    const records: any[] = Array.isArray(todayAttendance) ? todayAttendance : [];
    const farmCheckedInIds = new Set(
      records
        .filter((r: any) => r.check_in_time && !r.check_out_time && r.farm_id === watchedFarmId && r.worker_id)
        .map((r: any) => r.worker_id as number)
    );
    return allActive.filter((w: any) => farmCheckedInIds.has(w.id));
  }, [workers, todayAttendance, watchedFarmId, checkedInWorkerIds, isBackdating]);

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

  const handleCancelTask = async (task: any) => {
    if (!confirm(`Cancel task "${task.task_code}" for ${task.worker_name || 'this worker'}?`)) return;
    try {
      await apiService.workers.cancelTaskAssignment(task.id);
      toast.success('Task cancelled');
      refetchTasks();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel task');
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
    setWorkerSearch('');
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

      {/* Workers List */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900">
            Workers
            <span className="ml-2 text-xs font-normal text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              {checkedInWorkerIds.size} on-site
            </span>
          </h3>
        </div>

        {!workers || workers.length === 0 ? (
          <p className="text-gray-500 text-center py-4 text-sm">No workers found</p>
        ) : (() => {
          const allActive = (workers as any[]).filter((w: any) => w.is_active !== false);
          const onSite = allActive.filter((w: any) => checkedInWorkerIds.has(w.id));
          const offSite = allActive.filter((w: any) => !checkedInWorkerIds.has(w.id));
          const initials = (w: any) => {
            const n = (w.full_name || w.name || '?').trim().split(' ');
            return (n[0]?.[0] || '') + (n[1]?.[0] || '');
          };
          return (
            <div>
              {/* On-site rows */}
              {onSite.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No workers checked in today.</p>
              ) : (
                <ul className="divide-y divide-gray-100 list-none m-0 p-0">
                  {onSite.map((worker: any) => (
                    <li key={worker.id} className="flex items-center gap-3 py-2.5 px-1 hover:bg-gray-50 rounded-md transition-colors">
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                      <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 uppercase">
                        {initials(worker)}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate block">{worker.full_name || worker.name}</span>
                        <span className="text-xs text-gray-400">{worker.worker_type || 'Worker'}</span>
                      </span>
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => openAssignModal(worker.id)}>
                          <Plus className="w-3 h-3 mr-1" />Assign
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => openCompleteModal(worker)}>
                          <CheckCircle className="w-3 h-3 mr-1" />Complete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Off-site collapsible */}
              {offSite.length > 0 && (
                <div className="mt-2 border-t border-gray-100 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOffsite((v) => !v)}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 cursor-pointer select-none py-1"
                  >
                    <span className={`transition-transform duration-150 ${showOffsite ? 'rotate-90' : ''}`}>▶</span>
                    Not on-site ({offSite.length})
                  </button>
                  {showOffsite && (
                    <ul className="divide-y divide-gray-50 list-none m-0 p-0 mt-1 opacity-60">
                      {offSite.map((worker: any) => (
                        <li key={worker.id} className="flex items-center gap-3 py-2 px-1">
                          <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                          <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 text-xs font-bold flex items-center justify-center shrink-0 uppercase">
                            {initials(worker)}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="text-sm text-gray-500 truncate block">{worker.full_name || worker.name}</span>
                            <span className="text-xs text-gray-400">{worker.worker_type || 'Worker'}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Assigned Tasks */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900">Assigned Tasks</h3>
          <Button size="sm" variant="ghost" onClick={() => refetchTasks()} disabled={loadingTasks} className="h-7 px-2 text-xs text-gray-500">
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loadingTasks ? 'animate-spin' : ''}`} />Refresh
          </Button>
        </div>

        {loadingTasks ? (
          <div className="flex justify-center py-6"><LoadingSpinner size="sm" /></div>
        ) : !taskAssignments || taskAssignments.length === 0 ? (
          <p className="text-gray-500 text-center py-6 text-sm">No assigned tasks found</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 list-none m-0 p-0">
            {taskAssignments.map((task: any) => {
              const isCompleted = task.status === 'completed' || task.status === 'Completed';
              const isInProgress = task.status === 'in_progress' || task.status === 'In Progress';
              const isCancelled = task.status === 'cancelled';
              const statusLabel = isCompleted ? 'Completed' : isInProgress ? 'In Progress' : isCancelled ? 'Cancelled' : 'Assigned';
              const statusClass = isCompleted ? 'bg-green-100 text-green-700' : isInProgress ? 'bg-amber-100 text-amber-700' : isCancelled ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700';
              const workerName = task.worker?.full_name || task.worker?.name || task.worker_name || 'Unknown';
              const farmName = (farms as any[])?.find((f: any) => (f.id ?? f.farm_id) === task.farm_id)?.name || `Farm ${task.farm_id}`;
              return (
                <li key={task.id} className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{task.task_code}</span>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${statusClass}`}>{statusLabel}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {workerName} &middot; {farmName} {task.block ? `· ${task.block}` : ''} &middot; {new Date(task.date_worked).toLocaleDateString()}
                      {task.total_amount ? ` · TZS ${Number(task.total_amount).toLocaleString()}` : ''}
                    </p>
                  </div>
                  {/* Actions */}
                  <div className="shrink-0 flex flex-col gap-1 items-end">
                    {!isCompleted && task.status !== 'cancelled' && !task.started_at && (
                      <Button size="sm" className="h-7 px-3 text-xs w-28" onClick={() => handleStartTask(task)}>
                        Start Task
                      </Button>
                    )}
                    {!isCompleted && task.status !== 'cancelled' && task.started_at && (
                      <Button size="sm" variant="secondary" className="h-7 px-3 text-xs w-28" onClick={() => handleQuickComplete(task)}>
                        Complete
                      </Button>
                    )}
                    {!isCompleted && task.status !== 'cancelled' && (
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 w-28" onClick={() => handleCancelTask(task)}>
                        <XCircle className="w-3 h-3 mr-1" />Cancel
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
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
                    <FieldLabel>
                      Select Worker * {isBackdating ? `(${checkedInWorkersForFarm.length} active)` : `(${checkedInWorkersForFarm.length} checked in)`}
                    </FieldLabel>
                    <div className="relative mb-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder="Search by name…"
                        value={workerSearch}
                        onChange={(e) => setWorkerSearch(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select a Worker" />
                      </SelectTrigger>
                      <SelectContent>
                        {checkedInWorkersForFarm
                          .filter((w: any) =>
                            !workerSearch ||
                            (w.full_name || w.name || '').toLowerCase().includes(workerSearch.toLowerCase())
                          )
                          .map((worker: any) => (
                            <SelectItem key={worker.id} value={String(worker.id)}>
                              {worker.full_name || worker.name} - {worker.phone}
                            </SelectItem>
                          ))}
                        {checkedInWorkersForFarm.filter((w: any) =>
                          !workerSearch ||
                          (w.full_name || w.name || '').toLowerCase().includes(workerSearch.toLowerCase())
                        ).length === 0 && (
                          <div className="py-3 text-center text-sm text-muted-foreground">No workers match.</div>
                        )}
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
                        value={field.value ?? ''}
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
                      value={field.value ?? ''}
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
                            {block.code || block.name}
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
                    const worker = checkedInWorkersForFarm.find((w: any) => w.id === Number(val));
                    setSelectedWorker(worker);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Worker" />
                  </SelectTrigger>
                  <SelectContent>
                    {checkedInWorkersForFarm.map((worker: any) => (
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
