import { encrypt } from './../utils/enc-decy';
import ApiService from './ApiService';

export async function apiGetEducationFilter() {
  return ApiService.fetchData({
    url: `/education/filter-options`,
    method: 'get',
  });
}
export async function apiGetEducationList(data?: any) {
  return ApiService.fetchData({
    url: `/education/all?page=${data.page}&size=${data.size}`,
    method: 'post',
    data: encrypt(data),
  });
}

export async function getBanner(type: number) {
  return ApiService.fetchData({
    url: `/banner/${type}`,
    method: 'get',
  });
}

export async function apiGetEducationByTitle(slug: string) {
  return ApiService.fetchData({
    url: `/education/all/${slug}`,
    method: 'get',
  });
}
