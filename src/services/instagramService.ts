import type { InstagramFeed } from '@/@types/instagram';

import ApiService from './ApiService';

interface InstagramFeedResponse {
  status: number;
  message: string;
  // The BaseService response interceptor decrypts `data.data` before it gets here.
  data: InstagramFeed;
}

// The same feed the homepage renders on the server. Client pages (the PDP) have
// no server pass of their own, so they read it through the normal API layer.
export async function apiGetInstagramFeed() {
  return ApiService.fetchData<InstagramFeedResponse>({
    url: `/instagram/feed`,
    method: 'get',
  });
}
