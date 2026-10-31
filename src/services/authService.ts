// src/services/authService.ts
import { resolveCloudflareTurnstileToken } from '@/utils/cloudflareTurnstile';
import { encrypt } from '@/utils/enc-decy';

import ApiService from './ApiService';

// Define types for login request and response
interface LoginCredentials {
  email: string;
  password: string;
  cloudflareTurnstileToken?: string | null;
}

interface LoginResponse {
  status: number;
  message: string;
  data: string; // This can be further defined if you know the structure of the encrypted data
  decrypted_data: DecryptedData;
}
interface DecryptedData {
  id: string;
  is_active: boolean;
  first_name: string;
  last_name: string;
  email: string;
  updated_at: string; // Consider using Date if you parse it
  created_at: string; // Consider using Date if you parse it
  gender: string | null;
  profile: string | null;
  phone: string | null;
  apple_id: string | null;
  google_id: string | null;
  facebook_id: string | null;
  address: string | null;
  customer_id: string | null;
  dob: string | null;
  doa: string | null;
  country: string | null;
  zip_code: string | null;
  deleted_at: string | null;
  token: string;
  key: string;
}

interface SignUpCredentials {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  cloudflareTurnstileToken?: string | null;
}

// API call to register a new user
export async function apiSignUp(credentials: SignUpCredentials) {
  // console.log(encrypt(credentials), credentials, "credd......");

  return ApiService.fetchData({
    url: '/user/signup', // Replace with the correct backend endpoint
    method: 'post',
    data: encrypt({
      ...credentials,
      cloudflareTurnstileToken: await resolveCloudflareTurnstileToken((credentials as any)?.cloudflareTurnstileToken),
    }),
  });
}

// API call to login a user
export async function apiLogin(credentials: LoginCredentials) {
  return ApiService.fetchData<LoginResponse, unknown>({
    url: '/user/login',
    method: 'post',
    data: encrypt({
      ...credentials,
      cloudflareTurnstileToken: await resolveCloudflareTurnstileToken((credentials as any)?.cloudflareTurnstileToken),
    }),
  });
}
export async function apiGetUser() {
  return ApiService.fetchData<LoginResponse, unknown>({
    url: '/user',
    method: 'get',
  });
}
export async function apiForgotPassword(credentials: { email: string; cloudflareTurnstileToken?: string | null }) {
  return ApiService.fetchData<LoginResponse, unknown>({
    url: '/user/validation',
    method: 'post',
    data: encrypt({
      ...credentials,
      cloudflareTurnstileToken: await resolveCloudflareTurnstileToken((credentials as any)?.cloudflareTurnstileToken),
    }),
  });
}
export async function apiResetPassword(credentials: { password: string; authHeader: string; cloudflareTurnstileToken?: string | null }) {
  return ApiService.fetchData<LoginResponse, unknown>({
    url: '/user/forgot-password',
    method: 'post',
    data: encrypt({
      ...credentials,
      cloudflareTurnstileToken: await resolveCloudflareTurnstileToken((credentials as any)?.cloudflareTurnstileToken),
    }),
  });
}

// API call to logout (optional, depends on backend implementation)
export async function apiLogout() {
  return ApiService.fetchData({
    url: '/logout',
    method: 'post',
  });
}
export async function apiAppointment(payload: any) {
  return ApiService.fetchData({
    url: '/appointment',
    method: 'post',
    data: encrypt({ ...payload, cloudflareTurnstileToken: await resolveCloudflareTurnstileToken((payload as any)?.cloudflareTurnstileToken) }),
  });
}
export async function apiGetIntroPopUp() {
  return ApiService.fetchData({
    url: '/popup/all',
    method: 'get',
  });
}
export async function submitContactPageData(data: any) {
  return ApiService.fetchData({
    url: '/contact-us',
    method: 'post',
    data: encrypt({ ...data, cloudflareTurnstileToken: await resolveCloudflareTurnstileToken((data as any)?.cloudflareTurnstileToken) }),
  });
}
