import { apiPostForm } from '@/api/chat/apiClient';

export interface ImageUploadResponse {
  imageUrl: string;
}

export const imageApi = {
  uploadImage: (imageBlob: Blob): Promise<ImageUploadResponse> => {
    const formData = new FormData();
    formData.append('image', imageBlob, 'capture.png');
    return apiPostForm<ImageUploadResponse>('/api/images/upload', formData);
  },
};
