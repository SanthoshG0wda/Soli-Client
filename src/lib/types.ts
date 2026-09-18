export type OnboardingRole =
  | 'Advocate / Lawyer'
  | 'Law Student'
  | 'Legal Researcher'
  | 'Legal Professional'
  | 'Other';

export type OnboardingUseCase =
  | 'Legal research'
  | 'Case preparation'
  | 'Judgment research'
  | 'Criminal law research'
  | 'Cybercrime research'
  | 'Drafting assistance'
  | 'Understanding statutes'
  | 'Other';

export interface OnboardingProfile {
  id: string;
  user_id: string;
  role: string | null;
  use_cases: string[];
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  organization_id?: string | null;
  created_at: string;
  updated_at: string;
  onboarding?: OnboardingProfile | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface OnboardingUpdatePayload {
  role: string;
  use_cases: string[];
}

export interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}
