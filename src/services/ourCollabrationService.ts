import { SocialPostResponse } from '@/@types/socialPost';

import ApiService from './ApiService';

export async function apiGetSocialPosts(): Promise<SocialPostResponse> {
  const response = await ApiService.fetchData<SocialPostResponse>({
    url: '/social-post/social-post-web',
    method: 'get',
  });
  return response.data;
}
