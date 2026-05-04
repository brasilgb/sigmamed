import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { apiRequest } from '@/services/api-client';

type ApiDataResponse<T> = {
  data: T;
  meta?: Record<string, unknown>;
  message?: string;
};

export type FeedbackInput = {
  rating: number | null;
  comment: string | null;
  source: 'home';
};

export type FeedbackResponse = {
  id: number;
  rating: number | null;
  comment: string | null;
  source: string;
  created_at: string;
};

export async function sendFeedback(input: FeedbackInput) {
  const response = await apiRequest<ApiDataResponse<FeedbackResponse>>('/feedback', {
    method: 'POST',
    authenticated: true,
    body: {
      rating: input.rating,
      comment: input.comment,
      source: input.source,
      app_version: Constants.expoConfig?.version ?? null,
      platform: Platform.OS,
    },
  });

  return response.data;
}
