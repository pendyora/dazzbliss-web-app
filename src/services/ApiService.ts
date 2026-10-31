// // src/services/apiClient.ts
// import axios from 'axios';

// const apiClient = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com',
//   timeout: 5000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // You can add interceptors for request/response if needed
// apiClient.interceptors.request.use(
//   (config) => {
//     // Optionally add tokens, logging, etc.
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// apiClient.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     // Handle global errors (e.g., logging out on 401)
//     return Promise.reject(error);
//   }
// );

// export default apiClient;

// src/services/ApiService.ts
import BaseService from './BaseService';

import type { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const ApiService = {
  fetchData<Response = unknown, Request = Record<string, unknown>>(param: AxiosRequestConfig<Request>): Promise<AxiosResponse<Response>> {
    return new Promise((resolve, reject) => {
      BaseService(param)
        .then((response: AxiosResponse<Response>) => {
          resolve(response);
        })
        .catch((errors: AxiosError) => {
          reject(errors);
        });
    });
  },
};

export default ApiService;
