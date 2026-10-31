import { encrypt } from '@/utils/enc-decy';

import ApiService from './ApiService';

export const fetchCustomProductData = async () => {
  return ApiService.fetchData<any>({
    url: '/custom-product',
    method: 'get',
  });
};

export const updateCustomProductData = async (data: any) => {
  return ApiService.fetchData<any>({
    url: '/custom-product',
    method: 'post',
    data,
  });
};

export const fetchDiamondList = async (data: any, pageData: any) => {
  return ApiService.fetchData<any>({
    url: `/diamond/all?page=${pageData?.page}&size=${pageData?.size}`,
    method: 'post',
    data: encrypt(data),
  });
};

export const fetchSettingList = async (data: any, page: number, size: number) => {
  // ${data?.jewelryType}
  return ApiService.fetchData<any>({
    url: `/jewelry/list?type=custom-engagement-rings&page=${page}&size=${size}`,
    method: 'post',
    data: encrypt(data),
  });
};

export const fetchDiamondFilters = async (data: any) => {
  return ApiService.fetchData<any>({
    url: '/diamond/filter-options',
    method: 'post',
    data: encrypt(data),
  });
};

export const fetchSettingFilters = async (data: any) => {
  // ${data ?? 'all'}
  return ApiService.fetchData<any>({
    url: `/jewelry/list-filter?type=custom-engagement-rings`,
    method: 'get',
  });
};
export const fetchDiamondById = async (id: string) => {
  return ApiService.fetchData<any>({
    url: `/diamond/${id}`,
    method: 'get',
  });
};

export const fetchSettingById = async (id: string) => {
  return ApiService.fetchData<any>({
    url: `/jewelry/${id}`,
    method: 'get',
  });
};
