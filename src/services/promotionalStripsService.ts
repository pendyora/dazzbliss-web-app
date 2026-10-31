import ApiService from './ApiService';

export async function getPromotionalStripData() {
  return ApiService.fetchData({
    url: '/promotional-strips',
    method: 'get',
  });
}
