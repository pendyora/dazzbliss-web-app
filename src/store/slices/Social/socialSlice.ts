import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { SocialPost } from '@/@types/socialPost';
import { apiGetSocialPosts } from '@/services/ourCollabrationService';

export const fetchSocialPosts = createAsyncThunk<SocialPost[]>('socialPost/fetchSocialPosts', async () => {
  const response = await apiGetSocialPosts();
  return response.data;
});

export interface SocialPostState {
  data: SocialPost[];
  loading: boolean;
  error: string | null;
}

const initialState: SocialPostState = {
  data: [],
  loading: false,
  error: null,
};

const socialPostSlice = createSlice({
  name: 'socialPost',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSocialPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSocialPosts.fulfilled, (state, action) => {
        state.data = action.payload;
        state.loading = false;
      })
      .addCase(fetchSocialPosts.rejected, (state, action) => {
        state.error = action.error.message || 'Something went wrong';
        state.loading = false;
      });
  },
});

export default socialPostSlice.reducer;
