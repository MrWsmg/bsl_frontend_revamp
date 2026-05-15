"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import apiService from '../../services/api';
import { useApi } from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { PhotoUploadResponse } from '../../types';
import { resolvePhotoUrl } from '@/hooks/usePresignedUrl';
import { addWorkerSchema, type AddWorkerFormData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, SwitchCamera } from 'lucide-react';
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
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';

interface AddWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkerAdded: () => void;
  workerToEdit?: any;
}

type UploadKind = 'photo' | 'id';

const AddWorkerModal: React.FC<AddWorkerModalProps> = ({ isOpen, onClose, onWorkerAdded, workerToEdit }) => {
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [savingWorker, setSavingWorker] = useState(false);

  // Fetch farms
  const getFarms = () => apiService.getFarms();
  const { data: farms } = useApi(getFarms);

  // Media state (kept separate from RHF)
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreviewUrl, setIdPreviewUrl] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [existingIdUrl, setExistingIdUrl] = useState<string | null>(null);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [cameraChecking, setCameraChecking] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<UploadKind | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [flipping, setFlipping] = useState(false);

  const fileInputRefs = useRef<{ photo: HTMLInputElement | null; id: HTMLInputElement | null }>({
    photo: null,
    id: null,
  });
  const photoPreviewRef = useRef<string | null>(null);
  const idPreviewRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Parse farm assignments for edit mode
  const getDefaultFarmAssignments = () => {
    if (!workerToEdit?.farm_assignments) return [];
    try {
      const parsed = JSON.parse(workerToEdit.farm_assignments);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const getUsers = useCallback(() => apiService.getUsers(), []);
  const { data: users } = useApi(getUsers);

  const form = useForm<AddWorkerFormData>({
    resolver: zodResolver(addWorkerSchema),
    defaultValues: {
      name: workerToEdit?.name || '',
      full_name: workerToEdit?.full_name || workerToEdit?.name || '',
      phone: workerToEdit?.phone || '',
      birth_date: workerToEdit?.birth_date
        ? new Date(workerToEdit.birth_date).toISOString().split('T')[0]
        : '',
      worker_type: workerToEdit?.worker_type || 'contract',
      skills: workerToEdit?.skills || '',
      is_active: workerToEdit?.is_active !== undefined ? workerToEdit.is_active : true,
      farm_assignments: getDefaultFarmAssignments(),
      bank_name: workerToEdit?.bank_name || '',
      bank_account_number: workerToEdit?.bank_account_number || '',
      payment_method: workerToEdit?.payment_method || undefined,
      mobile_money_provider: workerToEdit?.mobile_money_provider || '',
      mobile_money_number: workerToEdit?.mobile_money_number || '',
      user_id: workerToEdit?.user_id || undefined,
    },
  });

  // Camera functions
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraTarget(null);
    setCameraError(null);
    setVideoReady(false);
  }, []);

  const handleMediaSelection = useCallback((type: 'photo' | 'id', file: File | null) => {
    if (type === 'photo') {
      if (photoPreviewRef.current) {
        URL.revokeObjectURL(photoPreviewRef.current);
      }
      const nextUrl = file ? URL.createObjectURL(file) : null;
      photoPreviewRef.current = nextUrl;
      setPhotoPreviewUrl(nextUrl);
      setPhotoFile(file);
    } else {
      if (idPreviewRef.current) {
        URL.revokeObjectURL(idPreviewRef.current);
      }
      const nextUrl = file ? URL.createObjectURL(file) : null;
      idPreviewRef.current = nextUrl;
      setIdPreviewUrl(nextUrl);
      setIdFile(file);
    }
  }, []);

  const clearSelectedMedia = useCallback(() => {
    handleMediaSelection('photo', null);
    handleMediaSelection('id', null);
  }, [handleMediaSelection]);

  const resetMediaState = useCallback(() => {
    clearSelectedMedia();
    setExistingPhotoUrl(null);
    setExistingIdUrl(null);
    setPhotosLoading(false);
    stopCamera();
  }, [clearSelectedMedia, stopCamera]);

  const handleModalClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [onClose, stopCamera]);

  const registerFileInput = useCallback(
    (type: 'photo' | 'id') => (node: HTMLInputElement | null) => {
      fileInputRefs.current[type] = node;
    },
    []
  );

  const triggerFilePicker = useCallback((type: 'photo' | 'id') => {
    const input = fileInputRefs.current[type];
    if (input) input.click();
  }, []);

  const startStream = useCallback(async (mode: 'environment' | 'user') => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: mode } },
      audio: false,
    });
    streamRef.current = stream;
    if (videoRef.current) {
      setVideoReady(false);
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const startCameraCapture = useCallback(async (type: UploadKind) => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      toast.error('Camera access is not supported on this device.');
      return;
    }

    setCameraChecking(true);
    setCameraError(null);
    try {
      // Detect number of video inputs to decide whether to show flip button
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      setHasMultipleCameras(videoInputs.length > 1);

      const mode: 'environment' | 'user' = 'environment';
      setFacingMode(mode);
      await startStream(mode);
      setCameraTarget(type);
      setCameraActive(true);
    } catch {
      toast.error('Unable to access camera. Please allow permission.');
    } finally {
      setCameraChecking(false);
    }
  }, [startStream]);

  const handleFlipCamera = useCallback(async () => {
    if (flipping) return;
    setFlipping(true);
    setVideoReady(false);
    setCameraError(null);
    const nextMode: 'environment' | 'user' = facingMode === 'environment' ? 'user' : 'environment';
    try {
      await startStream(nextMode);
      setFacingMode(nextMode);
    } catch {
      setCameraError('Failed to switch camera.');
    } finally {
      setFlipping(false);
    }
  }, [facingMode, flipping, startStream]);

  const handleCameraSnapshot = useCallback(() => {
    if (!cameraActive || !cameraTarget || !videoRef.current) {
      setCameraError('Camera is not ready yet.');
      return;
    }

    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) {
      setCameraError('Camera feed is still initializing.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');

    if (!context) {
      setCameraError('Unable to capture image.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError('Failed to capture image.');
          return;
        }
        const fileName = `worker-${cameraTarget}-${Date.now()}.jpg`;
        const imageFile = new File([blob], fileName, { type: 'image/jpeg' });
        handleMediaSelection(cameraTarget, imageFile);
        stopCamera();
      },
      'image/jpeg',
      0.92
    );
  }, [cameraActive, cameraTarget, handleMediaSelection, stopCamera]);

  // Callback ref: fires as soon as the <video> element mounts inside the Dialog,
  // guaranteeing srcObject is assigned even if the Dialog portal renders after
  // the cameraActive state change.
  const videoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      setVideoReady(false);
      node.srcObject = streamRef.current;
      node.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!isOpen) stopCamera();
  }, [isOpen, stopCamera]);

  useEffect(() => {
    return () => {
      if (photoPreviewRef.current) URL.revokeObjectURL(photoPreviewRef.current);
      if (idPreviewRef.current) URL.revokeObjectURL(idPreviewRef.current);
      stopCamera();
    };
  }, [stopCamera]);

  const fetchWorkerPhotos = useCallback(async (workerId: number) => {
    setPhotosLoading(true);
    try {
      const photoData = await apiService.photos.getWorkerPhotos(workerId);
      const [resolvedPhoto, resolvedId] = await Promise.all([
        resolvePhotoUrl(photoData?.photo_url),
        resolvePhotoUrl(photoData?.id_image_url),
      ]);
      setExistingPhotoUrl(resolvedPhoto);
      setExistingIdUrl(resolvedId);
    } catch {
      console.error('Error loading worker photos');
    } finally {
      setPhotosLoading(false);
    }
  }, []);

  const uploadWorkerMedia = useCallback(
    async (workerId: number, refreshExisting: boolean) => {
      const uploads: Promise<{ kind: UploadKind; response: PhotoUploadResponse | null }>[] = [];

      if (photoFile) {
        uploads.push(
          apiService.photos
            .uploadWorkerPhoto({ file: photoFile, workerId })
            .then((response) => ({ kind: 'photo' as UploadKind, response }))
        );
      }

      if (idFile) {
        uploads.push(
          apiService.photos
            .uploadWorkerIdImage({ file: idFile, workerId })
            .then((response) => ({ kind: 'id' as UploadKind, response }))
        );
      }

      if (uploads.length === 0) return;

      setUploadingMedia(true);
      try {
        const results = await Promise.all(uploads);
        results.forEach(({ kind, response }) => {
          if (kind === 'photo') {
            if (response?.url) setExistingPhotoUrl(response.url);
            handleMediaSelection('photo', null);
          } else {
            if (response?.url) setExistingIdUrl(response.url);
            handleMediaSelection('id', null);
          }
        });

        if (refreshExisting) {
          await fetchWorkerPhotos(workerId);
        }

        toast.success('Worker images uploaded successfully');
      } catch {
        toast.error('Worker saved, but image upload failed.');
      } finally {
        setUploadingMedia(false);
      }
    },
    [photoFile, idFile, handleMediaSelection, fetchWorkerPhotos]
  );

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      clearSelectedMedia();
      form.reset({
        name: workerToEdit?.name || '',
        full_name: workerToEdit?.full_name || workerToEdit?.name || '',
        phone: workerToEdit?.phone || '',
        birth_date: workerToEdit?.birth_date
          ? new Date(workerToEdit.birth_date).toISOString().split('T')[0]
          : '',
        worker_type: workerToEdit?.worker_type || 'contract',
        skills: workerToEdit?.skills || '',
        is_active: workerToEdit?.is_active !== undefined ? workerToEdit.is_active : true,
        farm_assignments: getDefaultFarmAssignments(),
        bank_name: workerToEdit?.bank_name || '',
        bank_account_number: workerToEdit?.bank_account_number || '',
        payment_method: workerToEdit?.payment_method || undefined,
        mobile_money_provider: workerToEdit?.mobile_money_provider || '',
        mobile_money_number: workerToEdit?.mobile_money_number || '',
        user_id: workerToEdit?.user_id || undefined,
      });
      setError('');
    } else {
      resetMediaState();
    }
  }, [isOpen, workerToEdit]);

  useEffect(() => {
    if (isOpen && workerToEdit) {
      fetchWorkerPhotos(workerToEdit.id);
    }
    if (isOpen && !workerToEdit) {
      setExistingPhotoUrl(null);
      setExistingIdUrl(null);
    }
  }, [isOpen, workerToEdit, fetchWorkerPhotos]);

  const onSubmit = async (data: AddWorkerFormData) => {
    setSavingWorker(true);
    setError('');

    try {
      const workerData: any = {
        name: data.name || data.full_name,
        full_name: data.full_name,
        phone: data.phone || null,
        birth_date: data.birth_date || null,
        worker_type: data.worker_type,
        skills: data.skills || null,
        is_active: data.is_active,
        farm_assignments: JSON.stringify(data.farm_assignments),
        bank_name: data.bank_name || null,
        bank_account_number: data.bank_account_number || null,
        payment_method: data.payment_method || null,
        mobile_money_provider: data.mobile_money_provider || null,
        mobile_money_number: data.mobile_money_number || null,
        user_id: data.user_id || null,
      };

      let targetWorkerId: number | null = workerToEdit ? workerToEdit.id : null;

      if (workerToEdit) {
        await apiService.updateWorker(workerToEdit.id, workerData);
      } else {
        let createdWorkerResponse: any;
        if (user?.role === 'supervisor') {
          createdWorkerResponse = await apiService.createSupervisorWorker(workerData);
        } else {
          createdWorkerResponse = await apiService.createWorker(workerData);
        }
        targetWorkerId =
          createdWorkerResponse?.id ??
          createdWorkerResponse?.worker?.id ??
          createdWorkerResponse?.data?.id ??
          null;
      }

      setSavingWorker(false);

      if ((photoFile || idFile) && targetWorkerId) {
        await uploadWorkerMedia(targetWorkerId, Boolean(workerToEdit));
      }

      onWorkerAdded();
      handleModalClose();
    } catch (err: any) {
      const errorMessage = err.message || `Failed to ${workerToEdit ? 'update' : 'create'} worker.`;
      setError(errorMessage);
      setSavingWorker(false);
    }
  };

  const handleFarmToggle = (farmId: number, checked: boolean) => {
    const currentFarms = form.getValues('farm_assignments');
    const newFarms = checked
      ? [...currentFarms, farmId]
      : currentFarms.filter(id => id !== farmId);
    form.setValue('farm_assignments', newFarms);
  };

  const getSubmitLabel = () => {
    if (uploadingMedia) return 'Uploading images...';
    if (savingWorker) return workerToEdit ? 'Updating...' : 'Creating...';
    return workerToEdit ? 'Update Worker' : 'Create Worker';
  };

  const renderMediaCard = (type: 'photo' | 'id') => {
    const isPhoto = type === 'photo';
    const title = isPhoto ? 'Worker Photo' : 'Worker ID / Document';
    const selectedPreview = isPhoto ? photoPreviewUrl : idPreviewUrl;
    const existingPreview = isPhoto ? existingPhotoUrl : existingIdUrl;
    const selectedFile = isPhoto ? photoFile : idFile;

    return (
      <fieldset className="border border-gray-200 rounded-lg bg-white p-4 space-y-3" key={type}>
        <legend className="sr-only">{title}</legend>
        <figure className="h-48 border border-dashed border-gray-300 rounded-md flex items-center justify-center overflow-hidden bg-gray-50">
          {selectedPreview ? (
            <img src={selectedPreview} alt={`${title} preview`} className="w-full h-full object-cover" />
          ) : existingPreview ? (
            <img src={existingPreview} alt={title} className="w-full h-full object-cover" />
          ) : (
            <figcaption className="text-center text-gray-400 text-sm">
              <p>No {title.toLowerCase()} yet</p>
            </figcaption>
          )}
        </figure>
        <input
          type="file"
          accept="image/*"
          ref={registerFileInput(type)}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0] || null;
            handleMediaSelection(type, file);
            event.target.value = '';
          }}
        />
        {selectedFile && (
          <p className="text-xs text-blue-800 bg-blue-100 border border-blue-200 rounded px-2 py-1">
            Pending upload - this image will be sent when you click {workerToEdit ? 'Update' : 'Create'} worker.
          </p>
        )}
        {!selectedFile && existingPreview && (
          <p className="text-xs text-green-800 bg-green-100 border border-green-200 rounded px-2 py-1">
            Latest uploaded image on file.
          </p>
        )}
        <menu className="flex flex-wrap gap-2 list-none p-0 m-0">
          <li>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => startCameraCapture(type)}
              disabled={cameraChecking}
            >
              {cameraChecking ? 'Requesting camera...' : 'Capture via Camera'}
            </Button>
          </li>
          <li>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => triggerFilePicker(type)}
            >
              Upload from Device
            </Button>
          </li>
          {selectedFile && (
            <li>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleMediaSelection(type, null)}
              >
                Clear
              </Button>
            </li>
          )}
        </menu>
      </fieldset>
    );
  };

  const watchedFarmAssignments = form.watch('farm_assignments');
  const watchedIsActive = form.watch('is_active');

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {workerToEdit ? 'Edit Worker' : 'Add New Worker'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <output className="block bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </output>
              )}

              <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <legend className="sr-only">Worker Information</legend>

                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Full Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter worker's full name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" placeholder="Enter phone number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birth_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="worker_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Worker Type <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="permanent">Permanent Worker</SelectItem>
                          <SelectItem value="contract">Contract Worker</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {field.value === 'permanent'
                          ? 'Long-term permanent employees'
                          : 'Contract/temporary workers'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <label className="flex items-center mt-2 cursor-pointer">
                    <Checkbox
                      checked={watchedIsActive}
                      onCheckedChange={(checked) => form.setValue('is_active', !!checked)}
                    />
                    <span className="ml-2 text-sm text-gray-700">Active Worker</span>
                  </label>
                </FormItem>
              </fieldset>

              {/* Farm Assignments */}
              <fieldset>
                <legend className="text-sm font-medium mb-2">Farm Assignments</legend>
                <p className="text-xs text-muted-foreground mb-3">
                  Select the farms this worker will be assigned to.
                </p>
                {farms && farms.length > 0 ? (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3 list-none m-0">
                    {farms.map((farm: any) => {
                      const farmId = farm.id || farm.farm_id;
                      const isChecked = watchedFarmAssignments.includes(farmId);

                      return (
                        <li key={farmId}>
                          <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => handleFarmToggle(farmId, !!checked)}
                            />
                            <span className="text-sm text-gray-700">{farm.name}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">No farms available</p>
                )}
                {watchedFarmAssignments.length > 0 && (
                  <p className="text-xs text-blue-600 mt-2">
                    {watchedFarmAssignments.length} farm{watchedFarmAssignments.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </fieldset>

              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="e.g., Harvesting, Pruning, Weeding, Planting"
                      />
                    </FormControl>
                    <FormDescription>
                      List worker's skills separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Method */}
              <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <legend className="text-sm font-medium mb-2 col-span-full">Payment Details (for payroll)</legend>

                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('payment_method') === 'bank' && (
                  <>
                    <FormField
                      control={form.control}
                      name="bank_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. NMB, CRDB, NBC" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bank_account_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter bank account number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {form.watch('payment_method') === 'mobile_money' && (
                  <>
                    <FormField
                      control={form.control}
                      name="mobile_money_provider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Money Provider</FormLabel>
                          <Select value={field.value || ''} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select provider" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                              <SelectItem value="Airtel Money">Airtel Money</SelectItem>
                              <SelectItem value="Tigo Pesa">Tigo Pesa</SelectItem>
                              <SelectItem value="Halotel">Halotel</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mobile_money_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Number</FormLabel>
                          <FormControl>
                            <Input {...field} type="tel" placeholder="e.g. 0712345678" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </fieldset>

              {/* Link User Account */}
              <FormField
                control={form.control}
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Linked User Account (Optional)</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : '__none__'}
                      onValueChange={(val) => field.onChange(val === '__none__' ? undefined : Number(val))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Link to a system user account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {(users as any[] || [])
                          .filter((u: any) => u.role === 'worker')
                          .map((u: any) => (
                            <SelectItem key={u.id} value={String(u.id)}>
                              {u.full_name} (@{u.username})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Links a worker-role user account so they can self-check-in.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Media Upload Section */}
              <fieldset className="border border-blue-100 bg-blue-50/60 rounded-lg p-4 space-y-4">
                <legend className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between w-full px-2">
                  <span>
                    <strong className="text-sm font-semibold text-gray-800">Worker Photo & ID Verification</strong>
                    <small className="block text-xs text-gray-600">
                      Capture or upload the worker's profile photo and ID.
                    </small>
                  </span>
                  {photosLoading && (
                    <span className="text-xs text-blue-600 font-medium">Refreshing existing images...</span>
                  )}
                </legend>
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {renderMediaCard('photo')}
                  {renderMediaCard('id')}
                </section>
              </fieldset>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleModalClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={savingWorker || uploadingMedia}>
                  {getSubmitLabel()}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Camera Modal */}
      <Dialog open={cameraActive} onOpenChange={(open) => !open && stopCamera()}>
        <DialogContent className="max-w-3xl bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              Capture {cameraTarget === 'photo' ? 'Worker Photo' : 'Worker ID'}
            </DialogTitle>
          </DialogHeader>
          <section className="space-y-4">
            <figure className="relative bg-black rounded-xl overflow-hidden aspect-video">
              <video
                ref={videoCallbackRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                onLoadedMetadata={() => {
                  if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
                    setVideoReady(true);
                  }
                }}
              />
              {!videoReady && cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-white text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm">{flipping ? 'Switching camera...' : 'Initializing camera...'}</p>
                  </div>
                </div>
              )}
              {hasMultipleCameras && videoReady && (
                <button
                  type="button"
                  onClick={handleFlipCamera}
                  disabled={flipping}
                  className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors disabled:opacity-50"
                  title={facingMode === 'environment' ? 'Switch to front camera' : 'Switch to back camera'}
                >
                  <SwitchCamera className="w-5 h-5" />
                </button>
              )}
            </figure>
            {cameraError && (
              <output className="block text-sm text-red-300 bg-red-900/30 border border-red-500/40 rounded-md px-3 py-2">
                {cameraError}
              </output>
            )}
            <menu className="flex flex-wrap gap-3 list-none p-0 m-0">
              <li className="flex-1 min-w-[140px]">
                <Button onClick={handleCameraSnapshot} disabled={!videoReady} className="w-full">
                  {videoReady ? 'Capture Photo' : 'Waiting for camera...'}
                </Button>
              </li>
              <li className="flex-1 min-w-[140px]">
                <Button variant="outline" onClick={stopCamera} className="w-full text-white border-white/30 hover:bg-white/10">
                  Cancel
                </Button>
              </li>
            </menu>
          </section>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddWorkerModal;
