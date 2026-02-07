"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import apiService from '../../services/api';
import { toast } from '../ui/sonner';
import { PhotoUploadResponse } from '../../types';
import { addUserSchema, type AddUserFormData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
} from '@/components/ui/form';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
  userToEdit?: any;
}

type UploadKind = 'photo' | 'id';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'payroll', label: 'Payroll (BSL Auditor)' },
  { value: 'account_manager', label: 'Account Manager' },
  { value: 'financial_controller', label: 'Financial Controller' },
  { value: 'payroll_master', label: 'Payroll Master' },
  { value: 'stock', label: 'Stock' },
  { value: 'farm_clerk', label: 'Farm Clerk' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'worker', label: 'Worker' },
];

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onUserAdded, userToEdit }) => {
  const [farms, setFarms] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [savingUser, setSavingUser] = useState(false);

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

  const fileInputRefs = useRef<{ photo: HTMLInputElement | null; id: HTMLInputElement | null }>({
    photo: null,
    id: null,
  });
  const photoPreviewRef = useRef<string | null>(null);
  const idPreviewRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Parse assigned farms for edit mode
  const getDefaultAssignedFarms = () => {
    if (!userToEdit?.assigned_farms) return [];
    try {
      if (typeof userToEdit.assigned_farms === 'string') {
        return JSON.parse(userToEdit.assigned_farms);
      }
      if (Array.isArray(userToEdit.assigned_farms)) {
        return userToEdit.assigned_farms;
      }
    } catch {
      return [];
    }
    return [];
  };

  const form = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      username: userToEdit?.username || '',
      password: '',
      full_name: userToEdit?.full_name || '',
      email: userToEdit?.email || '',
      phone: userToEdit?.phone || '',
      farm_id: userToEdit?.farm_id ? String(userToEdit.farm_id) : '',
      role: userToEdit?.role || 'payroll',
      assigned_farms: getDefaultAssignedFarms(),
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
  }, []);

  const handleMediaSelection = useCallback((type: UploadKind, file: File | null) => {
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

  const registerFileInput = useCallback(
    (type: UploadKind) => (node: HTMLInputElement | null) => {
      fileInputRefs.current[type] = node;
    },
    []
  );

  const triggerFilePicker = useCallback((type: UploadKind) => {
    const input = fileInputRefs.current[type];
    if (input) input.click();
  }, []);

  const startCameraCapture = useCallback(async (type: UploadKind) => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      toast.error('Camera access is not supported on this device.');
      return;
    }

    setCameraChecking(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraTarget(type);
      setCameraActive(true);
    } catch {
      toast.error('Unable to access camera. Please allow permission.');
    } finally {
      setCameraChecking(false);
    }
  }, []);

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
        const fileName = `user-${cameraTarget}-${Date.now()}.jpg`;
        const imageFile = new File([blob], fileName, { type: 'image/jpeg' });
        handleMediaSelection(cameraTarget, imageFile);
        stopCamera();
      },
      'image/jpeg',
      0.92
    );
  }, [cameraActive, cameraTarget, handleMediaSelection, stopCamera]);

  // Camera video setup
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
    if (!cameraActive && videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [cameraActive]);

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

  const fetchUserPhotos = useCallback(async (userId: number) => {
    setPhotosLoading(true);
    try {
      const photoData = await apiService.photos.getUserPhotos(userId);
      setExistingPhotoUrl(photoData?.photo_url || null);
      setExistingIdUrl(photoData?.id_image_url || null);
    } catch {
      console.error('Error loading user photos');
    } finally {
      setPhotosLoading(false);
    }
  }, []);

  // Load farms and reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFarms();
      clearSelectedMedia();

      // Reset form with user data or defaults
      form.reset({
        username: userToEdit?.username || '',
        password: '',
        full_name: userToEdit?.full_name || '',
        email: userToEdit?.email || '',
        phone: userToEdit?.phone || '',
        farm_id: userToEdit?.farm_id ? String(userToEdit.farm_id) : '',
        role: userToEdit?.role || 'payroll',
        assigned_farms: getDefaultAssignedFarms(),
      });

      setError('');
    } else {
      resetMediaState();
    }
  }, [isOpen, userToEdit]);

  useEffect(() => {
    if (isOpen && userToEdit) {
      fetchUserPhotos(userToEdit.id);
    }
    if (isOpen && !userToEdit) {
      setExistingPhotoUrl(null);
      setExistingIdUrl(null);
    }
  }, [isOpen, userToEdit, fetchUserPhotos]);

  const loadFarms = async () => {
    try {
      const farmsData = await apiService.getFarms('admin');
      setFarms(farmsData);
    } catch {
      console.error('Error loading farms');
    }
  };

  const uploadUserMedia = useCallback(
    async (userId: number) => {
      const uploads: Promise<{ kind: UploadKind; response: PhotoUploadResponse | null }>[] = [];

      if (photoFile) {
        uploads.push(
          apiService.photos
            .uploadUserPhoto({ file: photoFile, userId })
            .then((response) => ({ kind: 'photo' as UploadKind, response }))
        );
      }

      if (idFile) {
        uploads.push(
          apiService.photos
            .uploadUserIdImage({ file: idFile, userId })
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
        toast.success('User images uploaded successfully');
      } catch {
        toast.error('User saved, but image upload failed.');
      } finally {
        setUploadingMedia(false);
      }
    },
    [photoFile, idFile, handleMediaSelection]
  );

  const onSubmit = async (data: AddUserFormData) => {
    setSavingUser(true);
    setError('');

    try {
      const userData: any = {
        username: data.username,
        password: data.password,
        full_name: data.full_name,
        role: data.role,
        email: data.email || '',
        phone: data.phone || '',
        farm_id: data.farm_id ? parseInt(data.farm_id) : null,
        assigned_farms: JSON.stringify(data.assigned_farms),
      };

      let targetUserId: number | null = userToEdit ? userToEdit.id : null;

      if (userToEdit) {
        await apiService.updateUser(userToEdit.id, userData);
      } else {
        const createdUser = await apiService.createUser(userData);
        targetUserId = createdUser?.id ?? null;
      }

      setSavingUser(false);

      if ((photoFile || idFile) && targetUserId) {
        await uploadUserMedia(targetUserId);
      }

      onUserAdded();
      handleModalClose();
    } catch (err: any) {
      const backendDetail = err?.response?.data?.detail || err?.response?.data?.message;
      setError(backendDetail || `Failed to ${userToEdit ? 'update' : 'create'} user.`);
      toast.error(backendDetail || `Unable to ${userToEdit ? 'update' : 'create'} user.`);
    } finally {
      setSavingUser(false);
    }
  };

  const handleModalClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [onClose, stopCamera]);

  const handleFarmToggle = (farmId: number, checked: boolean) => {
    const currentFarms = form.getValues('assigned_farms');
    const newFarms = checked
      ? [...currentFarms, farmId]
      : currentFarms.filter(id => id !== farmId);
    form.setValue('assigned_farms', newFarms);
  };

  const handleSelectAllFarms = () => {
    const allFarmIds = farms.map((farm: any) => {
      const farmId = farm.farm_id || farm.id;
      return typeof farmId === 'string' ? parseInt(farmId) : farmId;
    });
    form.setValue('assigned_farms', allFarmIds);
  };

  const handleDeselectAllFarms = () => {
    form.setValue('assigned_farms', []);
  };

  const getSubmitLabel = () => {
    if (uploadingMedia) return 'Uploading images...';
    if (savingUser) return userToEdit ? 'Updating...' : 'Creating...';
    return userToEdit ? 'Update User' : 'Create User';
  };

  const renderMediaCard = (type: UploadKind) => {
    const isPhoto = type === 'photo';
    const title = isPhoto ? 'User Photo' : 'User ID / Document';
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
            Pending upload – this image will be sent when you click {userToEdit ? 'Update' : 'Create'} user.
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

  const watchedAssignedFarms = form.watch('assigned_farms');

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {userToEdit ? 'Edit User' : 'Add New User'}
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
                <legend className="sr-only">User Information</legend>

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!!userToEdit}
                          placeholder="Enter username"
                          className={userToEdit ? 'bg-gray-100 cursor-not-allowed' : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter full name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter email address"
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
                  name="farm_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Farm (Optional)</FormLabel>
                      <Select
                        value={field.value || undefined}
                        onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="-- No Primary Farm --" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">-- No Primary Farm --</SelectItem>
                          {farms.map((farm: any) => {
                            const farmId = farm.farm_id || farm.id;
                            return (
                              <SelectItem key={farmId} value={String(farmId)}>
                                {farm.name} - {farm.location}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ROLE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </fieldset>

              {/* Assigned Farms */}
              <fieldset>
                <legend className="flex justify-between items-center mb-2 w-full">
                  <span className="text-sm font-medium">
                    Assigned Farms (optional)
                    {watchedAssignedFarms.length > 0 && (
                      <span className="ml-2 text-xs font-normal text-blue-600">
                        ({watchedAssignedFarms.length} of {farms.length} selected)
                      </span>
                    )}
                  </span>
                  <menu className="flex gap-2 list-none p-0 m-0">
                    <li>
                      <button type="button" onClick={handleSelectAllFarms} className="text-xs text-blue-600 hover:underline">
                        Select All
                      </button>
                    </li>
                    <li aria-hidden="true"><span className="text-xs text-gray-400">|</span></li>
                    <li>
                      <button type="button" onClick={handleDeselectAllFarms} className="text-xs text-gray-600 hover:underline">
                        Clear All
                      </button>
                    </li>
                  </menu>
                </legend>
                <ul className="max-h-40 overflow-y-auto border-2 border-gray-300 rounded-md p-3 bg-white list-none m-0">
                  {farms.length === 0 ? (
                    <li className="text-sm text-gray-500">Loading farms...</li>
                  ) : (
                    farms.map((farm: any) => {
                      const farmId = farm.farm_id || farm.id;
                      const normalizedFarmId = typeof farmId === 'string' ? parseInt(farmId) : farmId;
                      const isChecked = watchedAssignedFarms.includes(normalizedFarmId);

                      return (
                        <li key={farmId}>
                          <label
                            className={`flex items-center space-x-3 mb-2 cursor-pointer p-2 rounded transition-colors ${
                              isChecked ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
                            }`}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => handleFarmToggle(normalizedFarmId, !!checked)}
                            />
                            <span className="flex-1">
                              <span className={`text-sm ${isChecked ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                                {farm.name}
                              </span>
                              <span className="text-xs text-gray-400 ml-2">{farm.location}</span>
                            </span>
                          </label>
                        </li>
                      );
                    })
                  )}
                </ul>
              </fieldset>

              {/* Media Upload Section */}
              <fieldset className="border border-purple-100 bg-purple-50/60 rounded-lg p-4 space-y-4">
                <legend className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between w-full px-2">
                  <span>
                    <strong className="text-sm font-semibold text-gray-800">User Photo & ID Verification</strong>
                    <small className="block text-xs text-gray-600">
                      Capture or upload the user's profile photo and ID.
                    </small>
                  </span>
                  {photosLoading && (
                    <span className="text-xs text-purple-600 font-medium">Refreshing existing images...</span>
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
                <Button type="submit" disabled={savingUser || uploadingMedia}>
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
              Capture {cameraTarget === 'photo' ? 'User Photo' : 'User ID'}
            </DialogTitle>
          </DialogHeader>
          <section className="space-y-4">
            <figure className="relative bg-black rounded-xl overflow-hidden aspect-video">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </figure>
            {cameraError && (
              <output className="block text-sm text-red-300 bg-red-900/30 border border-red-500/40 rounded-md px-3 py-2">
                {cameraError}
              </output>
            )}
            <menu className="flex flex-wrap gap-3 list-none p-0 m-0">
              <li className="flex-1 min-w-[140px]">
                <Button onClick={handleCameraSnapshot} className="w-full">
                  Capture Photo
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

export default AddUserModal;
