import { encrypt } from '@/utils/enc-decy';

import ApiService from './ApiService';

export async function apiGetBlogFilter() {
  return ApiService.fetchData({
    url: `/blog/filter-options`,
    method: 'get',
  });
}
export async function apiGetBlogList(data?: any) {
  return ApiService.fetchData({
    url: `/blog/all?page=${data.page}&size=${data.size}`,
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

export async function apiGetBlogByTitle(slug: string) {
  return ApiService.fetchData({
    url: `/blog/all`,
    method: 'post',
    data: encrypt({ slug }),
  });
}

export async function apiGetBlogFeaturedViews() {
  return ApiService.fetchData({
    url: `/blog/featured-views`,
    method: 'get',
  });
}

export async function apiGetBlogMapping() {
  return ApiService.fetchData({
    url: '/blog/blog-mapping',
    method: 'get',
  });
}
