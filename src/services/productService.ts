import dayjs from 'dayjs';

import { FilterData } from '@/store';
import { encrypt } from '@/utils/enc-decy';

import ApiService from './ApiService';

// Define types for the product response and product structure
interface Metal {
  id: number;
  name: string;
  type: number;
  price: number;
}

interface JewelryMetadata {
  id: number;
  metal: Metal;
  shape_id: number;
  jewelry_id: number;
  diamond_shap: { id: number; name: string };
}

interface Product {
  id: number;
  slug: string;
  code: string;
  customisable: boolean;
  title: string;
  createdAt: string;
  updatedAt: string;
  estimated_delivery_days: number;
  fullTitle: string;
  best_seller: boolean;
  jewelry_sku: JewelryMetadata[];
}

interface ProductResponse {
  status: number;
  message: string;
  data: {
    rows: Product[];
  };
}

// API call to fetch products
export async function apiFetchProducts(type: string, data: FilterData, page: number, size: number, collectionType?: any) {
  return ApiService.fetchData<ProductResponse>({
    url: `/jewelry/list?type=${type}${collectionType ? `&collections=${collectionType}` : ''}&page=${page}&size=${size}`,
    method: 'post',
    data: encrypt(data),
  });
}
export async function apiFetchProductsDetails(slug: string) {
  return ApiService.fetchData<ProductResponse>({
    url: `/jewelry/${slug}`, // Replace with the correct backend endpoint
    method: 'get',
  });
}
export async function apiFetchPDPFilter() {
  const data = [
    'RING_SIZE',
    // "JEWELRY_TYPE",
    'SHAPE',
    'METAL_COLOR',
    'METAL_CARAT_TYPE',
    'DIAMOND_TYPE',
    // "RELATIONS",
    // "OCCASIONS",
    'CARAT_SIZE',
  ];
  return ApiService.fetchData<ProductResponse>({
    url: `/master/get-master`, // Replace with the correct backend endpoint
    method: 'post',
    data: encrypt(data),
  });
}

export async function apiFetchProductsFiltersList(data: any) {
  return ApiService.fetchData({
    // url: `/jewelry/list-filter${data?.length != 0 ? `?type=${data}` : ""}`, // Replace with the correct backend endpoint
    url: `/jewelry/list-filter?type=${data.type}${data.collection ? `&collections=${data.collection}` : ''}`, // Replace with the correct backend endpoint
    method: 'get',
  });
}
export async function apiFetchSuggestedProducts(data: any) {
  return ApiService.fetchData({
    url: `/jewelry/suggested-jewelry`, // Replace with the correct backend endpoint
    method: 'post',
    data: encrypt(data),
  });
}
export async function getBestSellers() {
  return ApiService.fetchData({
    url: `jewelry/best-selling-products`, // Replace with the correct backend endpoint
    method: 'get',
  });
}
export async function getJewelrySearch(name: string) {
  return ApiService.fetchData({
    url: `jewelry/search/?search=${name}`, // Replace with the correct backend endpoint
    method: 'get',
  });
}
// `collection` (a collection page slug) returns that collection's own images when it has any.
export async function apiFetchPromotionalImages(type: any) {
  const collection = type?.collection ? `?collection=${encodeURIComponent(type.collection)}` : '';
  return ApiService.fetchData({
    url: `promotional-images/type/${type?.type}${collection}`,
    method: 'get',
  });
}

// Additional API calls can be added here, such as fetching a single product, creating a product, etc.

export const addBusinessDays = (dates: any, daysToAdd: number) => {
  let date = dayjs(dates);
  let addedDays = 0;

  while (addedDays < daysToAdd) {
    date = date.add(1, 'day');
    if (date.day() !== 0 && date.day() !== 6) {
      // 0 = Sunday, 6 = Saturday
      addedDays++;
    }
  }

  return date.format('MMMM DD, YYYY');
};
