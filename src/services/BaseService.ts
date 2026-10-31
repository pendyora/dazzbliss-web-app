// src/services/BaseService.ts
'use client';
import axios from 'axios';

import store from '@/store';
import { clearAuthState } from '@/store/slices/auth/authSlice';
import deepParseJson from '@/utils/deepParseJson';
import { decrypt } from '@/utils/enc-decy';

// Codes that will trigger automatic sign out
const unauthorizedCode = [401];
// Create an Axios instance with a timeout and baseURL
const BaseService = axios.create({
  timeout: 60000, // Set timeout to 60 seconds
  baseURL: process.env.NEXT_PUBLIC_API_URL, // Use the base URL
});

// Request interceptor to add tokens and modify request headers
BaseService.interceptors.request.use(
  (config) => {
    // Retrieve persisted data from local storage
    const rawPersistData = localStorage.getItem('authToken');
    const persistData = deepParseJson(rawPersistData);
    // console.log(localStorage.getItem("authToken"), persistData, "persistData");

    // Fetch the token from persisted data or Redux state
    let accessToken = persistData;
    if (!accessToken) {
      const { auth } = store.getState(); // Get token from Redux state if not in local storage
      accessToken = auth.auth.token;
    }
    const { token } = store.getState()?.cart?.guestDetails || {};
    const currency = localStorage?.getItem('currency');
    config.headers['ngrok-skip-browser-warning'] = true;
    config.headers['currency'] = currency;
    config.headers['guest-token'] = `${'Bearer '}${token}`;

    // Add authorization token to headers if available
    if (accessToken) {
      const token = decrypt(accessToken)?.token;
      config.headers['Authorization'] = `${'Bearer '}${token}`;
    }

    // Set CORS headers (optional)
    config.headers['Access-Control-Allow-Origin'] = '*';

    return config;
  },
  (error) => {
    // Handle request error
    return Promise.reject(error);
  },
);

// Response interceptor to handle decryption and errors
BaseService.interceptors.response.use(
  (response) => {
    // Decrypt response data if available
    if (response?.data?.data) {
      response.data.data = decrypt(response.data.data);
    }
    return response;
  },
  (error) => {
    const { response } = error;
    // Check for unauthorized status and handle sign out
    if (response && unauthorizedCode.includes(response.status)) {
      // console.log(response);
      store.dispatch(clearAuthState());
      localStorage.removeItem('authToken');
      // Dispatch a sign-out action
    }

    return Promise.reject(error); // Propagate error to be handled elsewhere
  },
);

export default BaseService;
