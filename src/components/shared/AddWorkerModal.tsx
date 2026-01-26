"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import apiService from '../../services/api';
import { useApi } from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../ui/sonner';
import { PhotoUploadResponse } from '../../types';

interface AddWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkerAdded: () => void;
  workerToEdit?: any;
}

type UploadKind = 'photo' | 'id';

const AddWorkerModal: React.FC<AddWorkerModalProps> = ({ isOpen, onClose, onWorkerAdded, workerToEdit }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    full_name: '',
    phone: '',
    worker_type: 'contract' as 'permanent' | 'contract',
    skills: '',
    is_active: true
  });
  const [selectedFarmIds, setSelectedFarmIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingWorker, setSavingWorker] = useState(false);
  const [error, setError] = useState('');

  // Fetch farms
  const getFarms = () => apiService.getFarms();
  const { data: farms } = useApi(getFarms);
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
    if (input) {
      input.click();
    }
  }, []);

  const startCameraCapture = useCallback(
    async (type: UploadKind) => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        toast.error('Camera access is not supported on this device. Please upload an existing image instead.');
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
      } catch (permissionError) {
        console.error('Camera permission error:', permissionError);
        toast.error('Unable to access camera. Please allow permission or choose Upload from Device.');
      } finally {
        setCameraChecking(false);
      }
    },
    []
  );

  const handleManualSelect = useCallback(
    (type: 'photo' | 'id') => {
      triggerFilePicker(type);
    },
    [triggerFilePicker]
  );

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      const playPromise = videoRef.current.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    }

    if (!cameraActive && videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [cameraActive]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen, stopCamera]);

  const handleCameraSnapshot = useCallback(() => {
    if (!cameraActive || !cameraTarget || !videoRef.current) {
      setCameraError('Camera is not ready yet.');
      return;
    }

    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) {
      setCameraError('Camera feed is still initializing. Please wait a moment.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');

    if (!context) {
      setCameraError('Unable to capture image. Please try again.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError('Failed to capture image. Please try again.');
          return;
        }
        const fileName = `worker-${cameraTarget}-${Date.now()}.jpg`;
        const imageFile = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
        handleMediaSelection(cameraTarget, imageFile);
        stopCamera();
      },
      'image/jpeg',
      0.92
    );
  }, [cameraActive, cameraTarget, handleMediaSelection, stopCamera]);

  useEffect(() => {
    return () => {
      if (photoPreviewRef.current) {
        URL.revokeObjectURL(photoPreviewRef.current);
      }
      if (idPreviewRef.current) {
        URL.revokeObjectURL(idPreviewRef.current);
      }
      stopCamera();
    };
  }, [stopCamera]);

  const fetchWorkerPhotos = useCallback(async (workerId: number) => {
    setPhotosLoading(true);
    try {
      const photoData = await apiService.photos.getWorkerPhotos(workerId);
      setExistingPhotoUrl(photoData?.photo_url || null);
      setExistingIdUrl(photoData?.id_image_url || null);
    } catch (photoError) {
      console.error('Error loading worker photos:', photoError);
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

      if (uploads.length === 0) {
        return;
      }

      setUploadingMedia(true);
      try {
        const results = await Promise.all(uploads);
        results.forEach(({ kind, response }) => {
          if (kind === 'photo') {
            if (response?.url) {
              setExistingPhotoUrl(response.url);
            }
            handleMediaSelection('photo', null);
          } else {
            if (response?.url) {
              setExistingIdUrl(response.url);
            }
            handleMediaSelection('id', null);
          }
        });

        if (refreshExisting) {
          await fetchWorkerPhotos(workerId);
        }

        toast.success('Worker images uploaded successfully');
      } catch (mediaError) {
        console.error('Error uploading worker media:', mediaError);
        toast.error('Worker saved, but image upload failed. Please retry via the Capture Photo/ID button.');
      } finally {
        setUploadingMedia(false);
      }
    },
    [photoFile, idFile, handleMediaSelection, fetchWorkerPhotos]
  );

  const renderMediaCard = (type: 'photo' | 'id') => {
    const isPhoto = type === 'photo';
    const title = isPhoto ? 'Worker Photo' : 'Worker ID / Document';
    const selectedPreview = isPhoto ? photoPreviewUrl : idPreviewUrl;
    const existingPreview = isPhoto ? existingPhotoUrl : existingIdUrl;
    const selectedFile = isPhoto ? photoFile : idFile;

    return (
      <div className="border border-gray-200 rounded-lg bg-white p-4 space-y-3">
        <div className="h-48 border border-dashed border-gray-300 rounded-md flex items-center justify-center overflow-hidden bg-gray-50">
          {selectedPreview ? (
            <img src={selectedPreview} alt={`${title} preview`} className="w-full h-full object-cover" />
          ) : existingPreview ? (
            <img src={existingPreview} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-gray-400 text-sm">
              <p>No {title.toLowerCase()} yet</p>
            </div>
          )}
        </div>
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
          <div className="text-xs text-blue-800 bg-blue-100 border border-blue-200 rounded px-2 py-1">
            Pending upload – this image will be sent when you click {workerToEdit ? 'Update' : 'Create'} worker.
          </div>
        )}
        {!selectedFile && existingPreview && (
          <div className="text-xs text-green-800 bg-green-100 border border-green-200 rounded px-2 py-1">
            Latest uploaded image on file.
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => startCameraCapture(type)}
            disabled={cameraChecking}
            className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md border border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
          >
            {cameraChecking ? 'Requesting camera...' : 'Capture via Camera'}
          </button>
          <button
            type="button"
            onClick={() => handleManualSelect(type)}
            className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Upload from Device
          </button>
          {selectedFile && (
            <button
              type="button"
              onClick={() => handleMediaSelection(type, null)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500">
          {isPhoto
            ? 'Use your camera or a connected Bluetooth camera to capture the worker’s portrait. Your browser will prompt for permission.'
            : 'Capture their ID or supporting document. You can also pick an existing file if it’s already saved on your device.'}
        </p>
      </div>
    );
  };

  useEffect(() => {
    if (isOpen) {
      clearSelectedMedia();
      if (workerToEdit) {
        // Initialize form with worker data for editing
        setFormData({
          name: workerToEdit.name || '',
          full_name: workerToEdit.full_name || workerToEdit.name || '',
          phone: workerToEdit.phone || '',
          worker_type: workerToEdit.worker_type || 'contract',
          skills: workerToEdit.skills || '',
          is_active: workerToEdit.is_active !== undefined ? workerToEdit.is_active : true
        });

        // Initialize selected farms
        if (workerToEdit.farm_assignments) {
          try {
            const farmIds = JSON.parse(workerToEdit.farm_assignments);
            setSelectedFarmIds(Array.isArray(farmIds) ? farmIds : []);
          } catch (error) {
            console.error('Error parsing farm assignments:', error);
            setSelectedFarmIds([]);
          }
        } else {
          setSelectedFarmIds([]);
        }
      } else {
        // Reset form for new worker
        setFormData({
          name: '',
          full_name: '',
          phone: '',
          worker_type: 'contract',
          skills: '',
          is_active: true
        });
        setSelectedFarmIds([]);
      }
      setError('');
    } else {
      resetMediaState();
    }
  }, [isOpen, workerToEdit, clearSelectedMedia, resetMediaState]);

  useEffect(() => {
    if (isOpen && workerToEdit) {
      fetchWorkerPhotos(workerToEdit.id);
    }
    if (isOpen && !workerToEdit) {
      setExistingPhotoUrl(null);
      setExistingIdUrl(null);
    }
  }, [isOpen, workerToEdit, fetchWorkerPhotos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWorker(true);
    setError('');

    try {
      const workerData: any = {
        name: formData.name || formData.full_name,
        full_name: formData.full_name,
        phone: formData.phone,
        worker_type: formData.worker_type,
        skills: formData.skills,
        is_active: formData.is_active,
        farm_assignments: JSON.stringify(selectedFarmIds)
      };

      console.log('Worker data payload:', workerData);

      let targetWorkerId: number | null = workerToEdit ? workerToEdit.id : null;

      if (workerToEdit) {
        // Update existing worker
        await apiService.updateWorker(workerToEdit.id, workerData);
      } else {
        // Create new worker - use appropriate endpoint based on user role
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
      } else if ((photoFile || idFile) && !targetWorkerId) {
        toast.error('Worker saved, but image upload could not start because the worker ID was not returned.');
      }

      onWorkerAdded();
      handleModalClose();
      setFormData({
        name: '',
        full_name: '',
        phone: '',
        worker_type: 'contract',
        skills: '',
        is_active: true
      });
      resetMediaState();
    } catch (err: any) {
      console.error(`Error ${workerToEdit ? 'updating' : 'creating'} worker:`, err);
      const errorMessage = err.message || `Failed to ${workerToEdit ? 'update' : 'create'} worker. Please try again.`;
      setError(errorMessage);
      setSavingWorker(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const getSubmitLabel = () => {
    if (uploadingMedia) {
      return 'Uploading images...';
    }
    if (savingWorker) {
      return workerToEdit ? 'Updating...' : 'Creating...';
    }
    return workerToEdit ? 'Update Worker' : 'Create Worker';
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
          <div className="flex justify-between items-center p-4 sm:p-6 border-b">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              {workerToEdit ? 'Edit Worker' : 'Add New Worker'}
            </h2>
            <button
              onClick={handleModalClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter worker's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Worker Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="worker_type"
                  value={formData.worker_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="permanent">Permanent Worker</option>
                  <option value="contract">Contract Worker</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.worker_type === 'permanent' 
                    ? 'Long-term permanent employees' 
                    : 'Contract/temporary workers'}
                </p>
              </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Active Worker
                </label>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Farm Assignments
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Select the farms this worker will be assigned to. This determines which supervisors can assign tasks to this worker.
            </p>
            {farms && farms.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                {farms.map((farm: any) => (
                  <label key={farm.id || farm.farm_id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={selectedFarmIds.includes(farm.id || farm.farm_id)}
                      onChange={(e) => {
                        const farmId = farm.id || farm.farm_id;
                        if (e.target.checked) {
                          setSelectedFarmIds(prev => [...prev, farmId]);
                        } else {
                          setSelectedFarmIds(prev => prev.filter(id => id !== farmId));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{farm.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No farms available</p>
            )}
            {selectedFarmIds.length > 0 && (
              <p className="text-xs text-blue-600 mt-2">
                {selectedFarmIds.length} farm{selectedFarmIds.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skills (Optional)
              </label>
              <textarea
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Harvesting, Pruning, Weeding, Planting"
              />
              <p className="text-xs text-gray-500 mt-1">
                List worker's skills separated by commas
              </p>
            </div>

            <div className="mb-6 border border-blue-100 bg-blue-50/60 rounded-lg p-4 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">Worker Photo & ID Verification</h3>
                  <p className="text-xs text-gray-600">
                    Capture a live photo and ID before saving. We’ll request permission to open your camera (including connected
                    Bluetooth cameras) when needed, or you can upload existing files.
                  </p>
                </div>
                {photosLoading && (
                  <span className="text-xs text-blue-600 font-medium">Refreshing existing images…</span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {renderMediaCard('photo')}
                {renderMediaCard('id')}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
              <button
                type="button"
                onClick={handleModalClose}
                className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
            <button
              type="submit"
              disabled={savingWorker || uploadingMedia}
              className="w-full sm:w-auto px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50"
            >
              {getSubmitLabel()}
            </button>
            </div>
          </form>
        </div>
      </div>

      {cameraActive && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-3xl shadow-2xl border border-white/10 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div>
                <p className="text-sm uppercase tracking-widest text-gray-400">Camera Active</p>
                <h3 className="text-lg font-semibold text-white">
                  Capture {cameraTarget === 'photo' ? 'Worker Photo' : 'Worker ID'}
                </h3>
              </div>
              <button
                onClick={stopCamera}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                aria-label="Close camera"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!streamRef.current && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                    Initializing camera…
                  </div>
                )}
              </div>
              {cameraError && (
                <div className="text-sm text-red-300 bg-red-900/30 border border-red-500/40 rounded-md px-3 py-2">
                  {cameraError}
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleCameraSnapshot}
                  className="flex-1 min-w-[140px] inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md bg-green-500 hover:bg-green-600 text-white transition-colors"
                >
                  Capture Photo
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="flex-1 min-w-[140px] inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md border border-white/30 text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Tip: Choose a connected Bluetooth camera in the browser/device prompt if you’re using an external device.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddWorkerModal;

