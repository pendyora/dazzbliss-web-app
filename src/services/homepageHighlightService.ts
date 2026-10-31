import ApiService from './ApiService';

export async function getHomepageHighlights() {
  return ApiService.fetchData({
    url: `homepage-highlights/section`,
    method: 'get',
  });
}
