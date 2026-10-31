import ApiService from './ApiService';

// Define types for the master data response
interface Item {
  id: string;
  name: string;
  code: string;
  sorting_sequence: number;
  image: string[] | null;
  parent_id: string | null;
  parent_code: string | null;
}

interface MasterDataResponse {
  status: number;
  message: string;
  data: {
    EARRINGS: Item[];
    BRACELET: Item[];
    NECKLACE: Item[];
    WEDDING_BANDS: Item[];
    JEWELRY_TYPE: Item[];
    SHAPE: Item[];
    RING_SIZE: Item[];
    OCCASIONS: Item[];
    RELATIONS: Item[];
    DIAMOND_TYPE: Item[];
    METAL_COLOR: Item[];
    ENGAGEMENT_RINGS: Item[];
    METAL_CARAT_TYPE: Item[];
    CARAT_SIZE: Item[];
    METAL: Item[];
    null: Item[];
  };
  decrypted_data: any;
}

// Define types for the gemstone circle data
interface GemStoneCircleItem {
  id: number;
  master_id: string;
  desc: string;
  link: string;
  sorting_sequence: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// API call to fetch master data
export async function apiFetchMasterData() {
  return ApiService.fetchData<MasterDataResponse>({
    url: `/master/get-all-master`,
    method: 'get',
  });
}

export async function GetFastDeliveryDay(type: string) {
  return ApiService.fetchData({
    url: `/project-settings/${type}`,
    method: 'get',
  });
}
export async function GetFetchCurrencyCountry() {
  return ApiService.fetchData({
    url: `/currency`,
    method: 'get',
  });
}
export async function apiGetHeaderData() {
  return ApiService.fetchData<MasterDataResponse>({
    url: `/header`,
    method: 'get',
  });
}
export async function apiGetRingData() {
  return ApiService.fetchData<MasterDataResponse>({
    url: `/ring-size-pricing`,
    method: 'get',
  });
}

// API call to fetch CMS content by type (1 = About, 2 = FAQs, 3 = Jewelry Care).
// The BaseService response interceptor decrypts `data.data` automatically.
export async function apiGetCmsContent(type: number) {
  return ApiService.fetchData({
    url: `/cms/type/${type}`,
    method: 'get',
  });
}

// API call to fetch gemstone circle data
export async function apiGetDiamondCircleList() {
  return ApiService.fetchData<{ data: GemStoneCircleItem[] }>({
    url: '/master/home_page_show',
    method: 'get',
  });
}

// Additional API calls for master data can be added here if needed
