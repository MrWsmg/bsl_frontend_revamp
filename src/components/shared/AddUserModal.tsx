"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import apiService from '../../services/api';
import { toast } from '../ui/sonner';
import { PhotoUploadResponse } from '../../types';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
  userToEdit?: any;
}

type UploadKind = 'photo' | 'id';

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onUserAdded, userToEdit }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    phone: '',
    farm_id: '',
    role: 'payroll',
    assigned_farms: [] as number[]
  });
  const [farms, setFarms] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [savingUser, setSavingUser] = useState(false);
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
    (type: UploadKind) => {
      triggerFilePicker(type);
    },
    [triggerFilePicker]
  );

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
        const fileName = `user-${cameraTarget}-${Date.now()}.jpg`;
        const imageFile = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
        handleMediaSelection(cameraTarget, imageFile);
        stopCamera();
      },
      'image/jpeg',
      0.92
    );
  }, [cameraActive, cameraTarget, handleMediaSelection, stopCamera]);

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

  const fetchUserPhotos = useCallback(async (userId: number) => {
    setPhotosLoading(true);
    try {
      const photoData = await apiService.photos.getUserPhotos(userId);
      setExistingPhotoUrl(photoData?.photo_url || null);
      setExistingIdUrl(photoData?.id_image_url || null);
    } catch (photoError) {
      console.error('Error loading user photos:', photoError);
    } finally {
      setPhotosLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadFarms();
      clearSelectedMedia();
      if (userToEdit) {
        // Initialize form with user data for editing
        let assignedFarms: number[] = [];
        
        // Handle assigned_farms - it could be a string, array, or null
        if (userToEdit.assigned_farms) {
          try {
            if (typeof userToEdit.assigned_farms === 'string') {
              assignedFarms = JSON.parse(userToEdit.assigned_farms);
            } else if (Array.isArray(userToEdit.assigned_farms)) {
              assignedFarms = userToEdit.assigned_farms;
            }
          } catch (error) {
            console.error('Error parsing assigned_farms:', error);
            assignedFarms = [];
          }
        }
        
        console.log('Editing user:', userToEdit);
        console.log('Parsed assigned farms:', assignedFarms);
        
        setFormData({
          username: userToEdit.username,
          password: '', // Don't pre-fill password for security
          full_name: userToEdit.full_name,
          email: userToEdit.email || '',
          phone: userToEdit.phone || '',
          farm_id: userToEdit.farm_id ? String(userToEdit.farm_id) : '',
          role: userToEdit.role,
          assigned_farms: assignedFarms
        });
      } else {
        // Reset form for new user
        setFormData({
          username: '',
          password: '',
          full_name: '',
          email: '',
          phone: '',
          farm_id: '',
          role: 'payroll',
          assigned_farms: []
        });
      }
      setError('');
    } else {
      resetMediaState();
    }
  }, [isOpen, userToEdit, clearSelectedMedia, resetMediaState]);

  const loadFarms = async () => {
    try {
      const farmsData = await apiService.getFarms('admin');
      setFarms(farmsData);
    } catch (error) {
      console.error('Error loading farms:', error);
    }
  };

  useEffect(() => {
    if (isOpen && userToEdit) {
      fetchUserPhotos(userToEdit.id);
    }
    if (isOpen && !userToEdit) {
      setExistingPhotoUrl(null);
      setExistingIdUrl(null);
    }
  }, [isOpen, userToEdit, fetchUserPhotos]);

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

        toast.success('User images uploaded successfully');
      } catch (mediaError) {
        console.error('Error uploading user media:', mediaError);
        toast.error('User saved, but image upload failed. Please retry via the Capture Photo/ID button.');
      } finally {
        setUploadingMedia(false);
      }
    },
    [photoFile, idFile, handleMediaSelection]
  );

  const getSubmittedUserId = (response: any): number | null => {
    if (!response) return null;
    if (typeof response.id === 'number') return response.id;
    if (response.user?.id) return response.user.id;
    if (response.data?.id) return response.data.id;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUser(true);
    setError('');

    try {
      // Prepare user data for backend
      const userData: any = {
        username: formData.username,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role
      };

      // Backend expects all fields in UserCreate model, even if empty
      userData.email = formData.email || '';
      userData.phone = formData.phone || '';
      
      // Handle farm_id - convert to number or null
      if (formData.farm_id && formData.farm_id !== '') {
        const parsedFarmId = parseInt(formData.farm_id);
        userData.farm_id = isNaN(parsedFarmId) ? null : parsedFarmId;
      } else {
        userData.farm_id = null;
      }
      
      // Always send assigned_farms as JSON string, even if empty array
      userData.assigned_farms = JSON.stringify(formData.assigned_farms);

      // Debug logging: Log the payload being sent
      console.log('=== User Data Payload ===');
      console.log('Username:', userData.username);
      console.log('Full Name:', userData.full_name);
      console.log('Role:', userData.role);
      console.log('Email:', userData.email);
      console.log('Phone:', userData.phone);
      console.log('Primary Farm ID:', userData.farm_id, '(type:', typeof userData.farm_id + ')');
      console.log('Assigned Farms:', userData.assigned_farms);
      console.log('Full payload:', userData);
      console.log('========================');

      let targetUserId: number | null = userToEdit ? userToEdit.id : null;

      if (userToEdit) {
        // Update existing user
        await apiService.updateUser(userToEdit.id, userData);
      } else {
        // Create new user
        const createdUserResponse = await apiService.createUser(userData);
        targetUserId = getSubmittedUserId(createdUserResponse);
      }

      setSavingUser(false);

      if ((photoFile || idFile) && targetUserId) {
        await uploadUserMedia(targetUserId);
      } else if ((photoFile || idFile) && !targetUserId) {
        toast.error('User saved, but image upload could not start because the user ID was not returned.');
      }

      onUserAdded();
      handleModalClose();
      setFormData({
        username: '',
        password: '',
        full_name: '',
        email: '',
        phone: '',
        farm_id: '',
        role: 'payroll',
        assigned_farms: []
      });
      resetMediaState();
    } catch (err: any) {
      // Enhanced error logging
      console.error(`Error ${userToEdit ? 'updating' : 'creating'} user:`, err);
      if (err instanceof Error) {
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
      }
      console.error('Full error object:', err);
      const backendDetail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        (Array.isArray(err?.response?.data) ? err.response.data[0]?.msg : null);
      setError(
        backendDetail
          ? `Failed to ${userToEdit ? 'update' : 'create'} user: ${backendDetail}`
          : `Failed to ${userToEdit ? 'update' : 'create'} user. Please try again.`
      );
      toast.error(
        backendDetail
          ? `Unable to ${userToEdit ? 'update' : 'create'} user: ${backendDetail}`
          : `Unable to ${userToEdit ? 'update' : 'create'} user.`
      );
    } finally {
      setSavingUser(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`Field changed: ${name} = ${value}`);
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFarmToggle = (farmId: number, checked: boolean) => {
    console.log(`Farm toggle: farmId=${farmId}, checked=${checked}`);
    setFormData(prevFormData => {
      const newAssignedFarms = checked
        ? [...prevFormData.assigned_farms, farmId]
        : prevFormData.assigned_farms.filter(id => id !== farmId);
      
      console.log('Previous assigned farms:', prevFormData.assigned_farms);
      console.log('New assigned farms:', newAssignedFarms);
      
      return {
        ...prevFormData,
        assigned_farms: newAssignedFarms
      };
    });
  };

  const handleSelectAllFarms = () => {
    const allFarmIds = farms.map((farm: any) => {
      const farmId = farm.farm_id || farm.id;
      return typeof farmId === 'string' ? parseInt(farmId) : farmId;
    });
    console.log('Selecting all farms:', allFarmIds);
    setFormData(prevFormData => ({
      ...prevFormData,
      assigned_farms: allFarmIds
    }));
  };

  const handleDeselectAllFarms = () => {
    console.log('Deselecting all farms');
    setFormData(prevFormData => ({
      ...prevFormData,
      assigned_farms: []
    }));
  };

  const handleModalClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [onClose, stopCamera]);

  const getSubmitLabel = () => {
    if (uploadingMedia) {
      return 'Uploading images...';
    }
    if (savingUser) {
      return userToEdit ? 'Updating...' : 'Creating...';
    }
    return userToEdit ? 'Update User' : 'Create User';
  };

  const renderMediaCard = (type: UploadKind) => {
    const isPhoto = type === 'photo';
    const title = isPhoto ? 'User Photo' : 'User ID / Document';
    const selectedPreview = isPhoto ? photoPreviewUrl : idPreviewUrl;
    const existingPreview = isPhoto ? existingPhotoUrl : existingIdUrl;
    const selectedFile = isPhoto ? photoFile : idFile;

    return (
      <div className="border border-gray-200 rounded-lg bg-white p-4 space-y-3" key={type}>
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
            Pending upload – this image will be sent when you click {userToEdit ? 'Update' : 'Create'} user.
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
            ? 'Capture a clear profile photo. You can use your device camera or any connected Bluetooth camera.'
            : 'Capture the ID or supporting document. You can also pick an existing file if it’s already saved.'}
        </p>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">{userToEdit ? 'Edit User' : 'Add New User'}</h2>
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
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={!!userToEdit}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${userToEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
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
                Primary Farm (Optional)
                {formData.farm_id && (
                  <span className="ml-2 text-xs font-normal text-green-600">
                    ✓ Selected
                  </span>
                )}
              </label>
              <select
                name="farm_id"
                value={formData.farm_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option key="no-farm" value="">-- No Primary Farm --</option>
                {farms.map((farm: any) => {
                  const farmId = farm.farm_id || farm.id;
                  return (
                    <option key={farmId} value={farmId}>
                      {farm.name} - {farm.location}
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.farm_id 
                  ? farms.find((f: any) => (f.farm_id || f.id) == formData.farm_id)?.name || 'Selected' 
                  : 'No primary farm selected'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="payroll">Payroll (BSL Auditor)</option>
                <option value="account_manager">Account Manager</option>
                <option value="financial_controller">Financial Controller</option>
                <option value="payroll_master">Payroll Master</option>
                <option value="stock">Stock</option>
                <option value="farm_clerk">Farm Clerk</option>
                <option value="supervisor">Supervisor</option>
                <option value="worker">Worker</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Assigned Farms (optional)
                {formData.assigned_farms.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-blue-600">
                    ({formData.assigned_farms.length} of {farms.length} selected)
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllFarms}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Select All
                </button>
                <span className="text-xs text-gray-400">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAllFarms}
                  className="text-xs text-gray-600 hover:text-gray-800 hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="max-h-40 overflow-y-auto border-2 border-gray-300 rounded-md p-3 bg-white">
              {farms.length === 0 ? (
                <p className="text-sm text-gray-500">Loading farms...</p>
              ) : (
                <>
                  <div className="mb-2 text-xs text-gray-500">
                    Select farms this user can access:
                  </div>
                  {farms.map((farm: any) => {
                    // Handle both farm_id and id fields
                    const farmId = farm.farm_id || farm.id;
                    const normalizedFarmId = typeof farmId === 'string' ? parseInt(farmId) : farmId;
                    const isChecked = formData.assigned_farms.includes(normalizedFarmId);
                    
                    return (
                      <label 
                        key={farmId} 
                        className={`flex items-center space-x-3 mb-2 cursor-pointer p-2 rounded transition-colors ${
                          isChecked ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleFarmToggle(normalizedFarmId, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="flex-1">
                          <span className={`text-sm ${isChecked ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                            {farm.name}
                          </span>
                          <span className="text-xs text-gray-400 ml-2">
                            {farm.location}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </>
              )}
            </div>
            {formData.assigned_farms.length > 0 ? (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800 font-medium">
                  ✓ {formData.assigned_farms.length} farm(s) selected
                  {formData.assigned_farms.length === farms.length && (
                    <span className="ml-2 text-xs">(All farms)</span>
                  )}
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-2">
                No farms selected - user will have access to all farms
              </p>
            )}
          </div>

          <div className="mb-6 border border-purple-100 bg-purple-50/60 rounded-lg p-4 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">User Photo & ID Verification</h3>
                <p className="text-xs text-gray-600">
                  Capture or upload the user’s profile photo and ID. These will be stored immediately after the user is created.
                </p>
              </div>
              {photosLoading && (
                <span className="text-xs text-purple-600 font-medium">Refreshing existing images…</span>
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
              disabled={savingUser || uploadingMedia}
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
                Capture {cameraTarget === 'photo' ? 'User Photo' : 'User ID'}
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

export default AddUserModal;