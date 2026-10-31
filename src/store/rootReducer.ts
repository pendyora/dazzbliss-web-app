import { combineReducers, AnyAction, Reducer } from 'redux';

import RtkQueryService from '@/services/RtkQueryService';

import address from './slices/Address/addressSlice';
import auth, { AuthState } from './slices/auth';
import blog from './slices/blog/blogSlice';
import cart from './slices/Cart/cartSlice';
import freeGift from './slices/Cart/freeGiftSlice';
import customProduct, { CustomProductState } from './slices/customProducts/customProductSlice';
import education from './slices/education/educationSlice';
import introPopUpSlice from './slices/IntroPopup/IntroPopupSlice';
import master, { MasterState } from './slices/Master/masterSlice';
import order from './slices/Order/orderSlice';
import products, { ProductState } from './slices/Products/productSlice';
import searchProduct from './slices/SearchProduct/searchProductSlice';
import Social, { SocialPostState } from './slices/Social/socialSlice';
export type RootState = {
  auth: AuthState;
  master: MasterState;
  products: ProductState;
  cart: any;
  freeGift: any;
  blog: any;
  education: any;
  address: any;
  introPopUpSlice: any;
  order: any;
  searchProduct: any;
  customProduct: CustomProductState;
  Social: SocialPostState;
  [RtkQueryService.reducerPath]: any;
};

export interface AsyncReducers {
  [key: string]: Reducer<any, AnyAction>;
}

const staticReducers = {
  auth,
  master,
  products,
  cart,
  freeGift,
  blog,
  education,
  address,
  introPopUpSlice,
  order,
  searchProduct,
  customProduct,
  Social,
  [RtkQueryService.reducerPath]: RtkQueryService.reducer,
};

const rootReducer = (asyncReducers?: AsyncReducers) => (state: any, action: any) => {
  const combinedReducer = combineReducers({
    ...staticReducers,
    ...asyncReducers,
  });
  return combinedReducer(state, action);
};

export default rootReducer;
