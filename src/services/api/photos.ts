import { BaseApiService } from './base';
import { PhotoInfo, PhotoUploadResponse, WorkerPhotoUploadResponse } from '../../types';

interface UploadUserPhotoParams {
  file: File;
  userId?: number;
}

interface UploadWorkerPhotoParams {
  file: File;
  workerId: number;
}

export class PhotosApiService extends BaseApiService {
  async uploadUserPhoto({ file, userId }: UploadUserPhotoParams): Promise<PhotoUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (typeof userId === 'number') {
      formData.append('user_id', String(userId));
    }
    return this.post<PhotoUploadResponse>('/photos/upload-user-photo', formData);
  }

  async uploadUserIdImage({ file, userId }: UploadUserPhotoParams): Promise<PhotoUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (typeof userId === 'number') {
      formData.append('user_id', String(userId));
    }
    return this.post<PhotoUploadResponse>('/photos/upload-user-id-image', formData);
  }

  async uploadWorkerPhoto({ file, workerId }: UploadWorkerPhotoParams): Promise<WorkerPhotoUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('worker_id', String(workerId));
    return this.post<WorkerPhotoUploadResponse>('/photos/upload-worker-photo', formData);
  }

  async uploadWorkerIdImage({ file, workerId }: UploadWorkerPhotoParams): Promise<PhotoUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('worker_id', String(workerId));
    return this.post<PhotoUploadResponse>('/photos/upload-worker-id-image', formData);
  }

  async getUserPhotos(userId: number): Promise<PhotoInfo> {
    return this.get<PhotoInfo>(`/photos/user-photos/${userId}`);
  }

  async getWorkerPhotos(workerId: number): Promise<PhotoInfo> {
    return this.get<PhotoInfo>(`/photos/worker-photos/${workerId}`);
  }

  async getPresignedUrl(url: string, expiry: number = 3600): Promise<{ presigned_url: string }> {
    return this.get<{ presigned_url: string }>('/photos/presigned-url', { url, expiry: String(expiry) });
  }

  async deleteUserPhoto(userId: number): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(`/photos/user-photo/${userId}`);
  }
}

