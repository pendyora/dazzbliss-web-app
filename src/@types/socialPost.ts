export interface SuggestedJewelry {
  id: number;
  title: string;
  is_customizable: boolean;
  jewelrySubType: JewelrySubType;
  jewelryDetails: JewelryDetail[];
}
interface JewelryDetail {
  selling_price: number;
  carat_images: string[];
  sku_slug: string;
}
interface JewelrySubType {
  id: string;
  name: string;
  code: string;
  parent_id: string;
  parent_code: string;
  parentDetails: JewelryParentDetails;
}
interface JewelryParentDetails {
  id: string;
  name: string;
  code: string;
  parent_id: string;
  parent_code: string;
}
export interface SocialPost {
  id: string;
  title: string;
  video_url: string;
  source: number;
  account_link: string;
  product_link: string;
  createdAt: string;
  updatedAt: string;
  suggestedJewelry: SuggestedJewelry[];
}

export interface SocialPostResponse {
  status?: number;
  message?: string;
  data: SocialPost[];
}
