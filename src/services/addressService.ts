import { resolveCloudflareTurnstileToken } from '@/utils/cloudflareTurnstile';
import { encrypt } from '@/utils/enc-decy';

import ApiService from './ApiService';

export async function apiAddAddress(data: any) {
  // console.log("data--->", data);

  return ApiService.fetchData<any>({
    url: `user/address/add`,
    method: 'post',
    data: encrypt({ ...data, cloudflareTurnstileToken: await resolveCloudflareTurnstileToken((data as any)?.cloudflareTurnstileToken) }),
  });
}
export async function apiEditAddress(id: string, data: any) {
  // console.log("data--->", data);

  return ApiService.fetchData<any>({
    url: `user/address/update/${id}`,
    method: 'post',
    data: encrypt({ ...data, cloudflareTurnstileToken: await resolveCloudflareTurnstileToken((data as any)?.cloudflareTurnstileToken) }),
  });
}
export async function apiGetCountries() {
  return ApiService.fetchData<any>({
    url: `/getCountry`,
    method: 'get',
  });
}

export async function apiGetStates(id: any) {
  return ApiService.fetchData<any>({
    url: `/getState/${id}`,
    method: 'get',
  });
}

export async function apiGetCities(id: any) {
  return ApiService.fetchData<any>({
    url: `/getCity/${id}`,
    method: 'get',
  });
}
