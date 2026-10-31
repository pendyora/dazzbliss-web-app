// File: src/services/profileService.ts
import { encrypt } from '@/utils/enc-decy';

import ApiService from './ApiService';

// Define types for profile update requests
interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  doa?: string;
  profile?: string;
}

interface UpdatePasswordData {
  password: string;
  old_password: string;
}

interface UpdateAddressData {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

// API call to update profile
export async function apiUpdateProfile(data: UpdateProfileData) {
  return ApiService.fetchData({
    url: '/user',
    method: 'put',
    data: encrypt(data),
  });
}

// API call to update password
export async function apiUpdatePassword(data: UpdatePasswordData) {
  return ApiService.fetchData({
    url: '/user/password',
    method: 'put',
    data: encrypt(data),
  });
}

// API call to update billing address
export async function apiUpdateBillingAddress(data: UpdateAddressData) {
  return ApiService.fetchData({
    url: '/user/update-billing-address',
    method: 'put',
    data: encrypt(data),
  });
}

// API call to update delivery address
export async function apiUpdateDeliveryAddress(data: UpdateAddressData) {
  return ApiService.fetchData({
    url: '/user/update-delivery-address',
    method: 'put',
    data: encrypt(data),
  });
}
