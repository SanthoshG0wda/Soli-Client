import { apiClient } from './client';
import { OnboardingProfile, OnboardingUpdatePayload, User } from '../types';

export const onboardingApi = {
  getOnboarding: async (): Promise<OnboardingProfile> => {
    return apiClient<OnboardingProfile>('onboarding', {
      method: 'GET',
    });
  },

  updateOnboarding: async (data: OnboardingUpdatePayload): Promise<OnboardingProfile> => {
    return apiClient<OnboardingProfile>('onboarding', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getUserWithProfile: async (): Promise<User> => {
    return apiClient<User>('users/me', {
      method: 'GET',
    });
  },
};
