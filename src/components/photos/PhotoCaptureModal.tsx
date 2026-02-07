"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, UploadCloud, Loader2, RefreshCw } from 'lucide-react';
import { toast } from '../ui/sonner';
import apiService from '../../services/api';
import { PhotoInfo, User } from '../../types';
import { USER_ROLES } from '../../constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type PanelKey = 'self' | 'user' | 'worker';
type UploadKind = 'photo' | 'id';

interface PhotoPanelState {
  photoInfo: PhotoInfo | null;
  loadingInfo: boolean;
  selectedPhotoFile: File | null;
  selectedPhotoPreview: string | null;
  selectedIdFile: File | null;
  selectedIdPreview: string | null;
  uploadingPhoto: boolean;
  uploadingId: boolean;
  inputId: string;
  activeEntityId?: number;
}

const createDefaultPanelState = (): PhotoPanelState => ({
  photoInfo: null,
  loadingInfo: false,
  selectedPhotoFile: null,
  selectedPhotoPreview: null,
  selectedIdFile: null,
  selectedIdPreview: null,
  uploadingPhoto: false,
  uploadingId: false,
  inputId: '',
  activeEntityId: undefined,
});

interface PhotoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

const getErrorMessage = (error: any, fallback: string) => {
  if (error?.response?.data?.detail) {
    return Array.isArray(error.response.data.detail)
      ? error.response.data.detail[0]?.msg || fallback
      : error.response.data.detail;
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  return error?.message || fallback;
};

const PhotoCaptureModal: React.FC<PhotoCaptureModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [activeTab, setActiveTab] = useState<PanelKey>('self');
  const [panelState, setPanelState] = useState<Record<PanelKey, PhotoPanelState>>({
    self: {
      ...createDefaultPanelState(),
      inputId: currentUser.id.toString(),
      activeEntityId: currentUser.id,
    },
    user: createDefaultPanelState(),
    worker: createDefaultPanelState(),
  });

  const previewUrlsRef = useRef<Set<string>>(new Set());
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const canManageUsers = currentUser.role === USER_ROLES.ADMIN;
  const canManageWorkers = [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.SUPERVISOR].includes(
    currentUser.role as "admin" | "supervisor" | "manager"
  );

  const cleanupPreviews = useCallback(() => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current.clear();
  }, []);

  const registerInputRef = useCallback(
    (key: string) => (node: HTMLInputElement | null) => {
      fileInputRefs.current[key] = node;
    },
    []
  );

  const triggerFileInput = useCallback((key: string) => {
    const node = fileInputRefs.current[key];
    if (node) {
      node.click();
    }
  }, []);

  const createPreviewUrl = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    previewUrlsRef.current.add(url);
    return url;
  }, []);

  const revokePreviewUrl = useCallback((url?: string | null) => {
    if (url) {
      URL.revokeObjectURL(url);
      previewUrlsRef.current.delete(url);
    }
  }, []);

  const updatePanelState = useCallback((panel: PanelKey, changes: Partial<PhotoPanelState>) => {
    setPanelState((prev) => ({
      ...prev,
      [panel]: {
        ...prev[panel],
        ...changes,
      },
    }));
  }, []);

  const resetPanelState = useCallback(() => {
    setPanelState({
      self: {
        ...createDefaultPanelState(),
        inputId: currentUser.id.toString(),
        activeEntityId: currentUser.id,
      },
      user: createDefaultPanelState(),
      worker: createDefaultPanelState(),
    });
    cleanupPreviews();
    setActiveTab('self');
  }, [cleanupPreviews, currentUser.id]);

  const fetchPhotos = useCallback(
    async (panel: PanelKey, entityId: number) => {
      updatePanelState(panel, { loadingInfo: true });
      try {
        const data =
          panel === 'worker'
            ? await apiService.photos.getWorkerPhotos(entityId)
            : await apiService.photos.getUserPhotos(entityId);
        updatePanelState(panel, {
          photoInfo: data,
          activeEntityId: entityId,
          inputId: entityId.toString(),
        });
        if (panel !== 'self') {
          toast.success('Latest images loaded');
        }
      } catch (error: any) {
        toast.error(getErrorMessage(error, 'Failed to load images'));
      } finally {
        updatePanelState(panel, { loadingInfo: false });
      }
    },
    [updatePanelState]
  );

  const handleIdInputChange = useCallback(
    (panel: PanelKey, value: string) => {
      updatePanelState(panel, { inputId: value });
    },
    [updatePanelState]
  );

  const handleLoadTarget = useCallback(
    (panel: PanelKey) => {
      const rawValue = panelState[panel].inputId.trim();
      const entityId = Number(rawValue);
      if (!rawValue || Number.isNaN(entityId) || entityId <= 0) {
        toast.error(`Enter a valid ${panel === 'worker' ? 'worker' : 'user'} ID`);
        return;
      }
      fetchPhotos(panel, entityId);
    },
    [fetchPhotos, panelState]
  );

  const handleFileChange = useCallback(
    (panel: PanelKey, kind: UploadKind, file: File | null) => {
      setPanelState((prev) => {
        const prevPanel = prev[panel];
        const nextPanel: PhotoPanelState = { ...prevPanel };

        if (kind === 'photo') {
          revokePreviewUrl(prevPanel.selectedPhotoPreview);
          nextPanel.selectedPhotoFile = file;
          nextPanel.selectedPhotoPreview = file ? createPreviewUrl(file) : null;
        } else {
          revokePreviewUrl(prevPanel.selectedIdPreview);
          nextPanel.selectedIdFile = file;
          nextPanel.selectedIdPreview = file ? createPreviewUrl(file) : null;
        }

        return {
          ...prev,
          [panel]: nextPanel,
        };
      });
    },
    [createPreviewUrl, revokePreviewUrl]
  );

  const resolveEntityId = useCallback(
    (panel: PanelKey): number | null => {
      if (panel === 'self') {
        return currentUser.id;
      }
      const state = panelState[panel];
      const candidate = state.activeEntityId ?? Number(state.inputId);
      if (!candidate || Number.isNaN(candidate) || candidate <= 0) {
        return null;
      }
      return candidate;
    },
    [currentUser.id, panelState]
  );

  const handleUpload = useCallback(
    async (panel: PanelKey, kind: UploadKind) => {
      const state = panelState[panel];
      const file = kind === 'photo' ? state.selectedPhotoFile : state.selectedIdFile;
      if (!file) {
        toast.error('Please capture or select an image first');
        return;
      }

      const entityId = resolveEntityId(panel);
      if (!entityId) {
        toast.error(`Enter a valid ${panel === 'worker' ? 'worker' : 'user'} ID`);
        return;
      }

      updatePanelState(panel, kind === 'photo' ? { uploadingPhoto: true } : { uploadingId: true });

      try {
        if (panel === 'worker') {
          if (kind === 'photo') {
            await apiService.photos.uploadWorkerPhoto({ file, workerId: entityId });
          } else {
            await apiService.photos.uploadWorkerIdImage({ file, workerId: entityId });
          }
        } else {
          if (kind === 'photo') {
            await apiService.photos.uploadUserPhoto({ file, userId: entityId });
          } else {
            await apiService.photos.uploadUserIdImage({ file, userId: entityId });
          }
        }
        toast.success(kind === 'photo' ? 'Photo uploaded successfully' : 'ID image uploaded successfully');
        handleFileChange(panel, kind, null);
        fetchPhotos(panel, entityId);
      } catch (error: any) {
        toast.error(getErrorMessage(error, 'Failed to upload image'));
      } finally {
        updatePanelState(panel, kind === 'photo' ? { uploadingPhoto: false } : { uploadingId: false });
      }
    },
    [fetchPhotos, handleFileChange, panelState, resolveEntityId, updatePanelState]
  );

  useEffect(() => {
    if (isOpen) {
      fetchPhotos('self', currentUser.id);
    } else {
      resetPanelState();
    }
  }, [currentUser.id, fetchPhotos, isOpen, resetPanelState]);

  useEffect(() => {
    return () => {
      cleanupPreviews();
    };
  }, [cleanupPreviews]);

  const renderUploadCard = (panel: PanelKey, kind: UploadKind, title: string) => {
    const state = panelState[panel];
    const selectedPreview = kind === 'photo' ? state.selectedPhotoPreview : state.selectedIdPreview;
    const currentUrl = kind === 'photo' ? state.photoInfo?.photo_url : state.photoInfo?.id_image_url;
    const uploading = kind === 'photo' ? state.uploadingPhoto : state.uploadingId;
    const hasEntityId = !!resolveEntityId(panel);
    const inputKey = `${panel}-${kind}`;

    return (
      <div className="border rounded-lg p-4 bg-gray-50 flex flex-col space-y-4" key={inputKey}>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
          {state.loadingInfo && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
        </div>
        <div className="rounded-md border border-dashed border-gray-300 bg-white flex items-center justify-center h-48 overflow-hidden">
          {selectedPreview ? (
            <img src={selectedPreview} alt={`${title} preview`} className="object-cover w-full h-full" />
          ) : currentUrl ? (
            <img src={currentUrl} alt={title} className="object-cover w-full h-full" />
          ) : (
            <div className="text-center text-gray-400 text-sm flex flex-col items-center">
              <Camera className="w-8 h-8 mb-2" />
              <span>No {title.toLowerCase()} yet</span>
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          ref={registerInputRef(inputKey)}
          onChange={(event) => {
            const file = event.target.files?.[0] || null;
            handleFileChange(panel, kind, file);
            event.target.value = '';
          }}
        />
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => triggerFileInput(inputKey)}
          >
            <Camera className="w-4 h-4 mr-2" />
            Capture / Upload
          </Button>
          {(kind === 'photo' ? state.selectedPhotoFile : state.selectedIdFile) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleFileChange(panel, kind, null)}
            >
              Clear selection
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={() => handleUpload(panel, kind)}
            disabled={
              uploading ||
              !(kind === 'photo' ? state.selectedPhotoFile : state.selectedIdFile) ||
              !hasEntityId
            }
            className="bg-green-500 hover:bg-green-600"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          When you tap "Capture / Upload", your device can open its native or Bluetooth camera, or let you pick an existing
          image from the gallery.
        </p>
      </div>
    );
  };

  const renderPanel = (panel: PanelKey) => {
    const state = panelState[panel];
    const needsIdInput = panel !== 'self';
    const idLabel = panel === 'worker' ? 'Worker ID' : 'User ID';

    return (
      <div className="space-y-6">
        {needsIdInput && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              {idLabel}
            </label>
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <Input
                type="number"
                value={state.inputId}
                onChange={(e) => handleIdInputChange(panel, e.target.value)}
                placeholder={`Enter ${idLabel.toLowerCase()}`}
                min={1}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={() => handleLoadTarget(panel)}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Load photos
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Provide the {idLabel.toLowerCase()} to load existing images or upload new ones.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {renderUploadCard(panel, 'photo', 'Profile Photo')}
          {renderUploadCard(panel, 'id', 'ID / Document Photo')}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Capture & Upload Photos</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Capture fresh images or upload existing files for your profile, users, and workers.
          </p>
        </DialogHeader>

        <div className="border-b border-gray-200 pb-4">
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant={activeTab === 'self' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('self')}
            >
              My Profile
            </Button>
            {canManageUsers && (
              <Button
                type="button"
                variant={activeTab === 'user' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('user')}
              >
                Manage Users
              </Button>
            )}
            {canManageWorkers && (
              <Button
                type="button"
                variant={activeTab === 'worker' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('worker')}
              >
                Manage Workers
              </Button>
            )}
          </div>
        </div>

        <div className="pt-4">
          {activeTab === 'self' && renderPanel('self')}
          {activeTab === 'user' && canManageUsers && renderPanel('user')}
          {activeTab === 'worker' && canManageWorkers && renderPanel('worker')}
          {activeTab !== 'self' && !canManageUsers && activeTab === 'user' && (
            <p className="text-sm text-red-500">You do not have permission to manage user photos.</p>
          )}
          {activeTab === 'worker' && !canManageWorkers && (
            <p className="text-sm text-red-500">You do not have permission to manage worker photos.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoCaptureModal;

