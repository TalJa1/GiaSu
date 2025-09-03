import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';
import { Platform } from 'react-native';

const ENV_BASE_URL = API_BASE_URL;
const BASE_URL: string = (() => {
  if (Platform.OS === 'android' && ENV_BASE_URL) {
    if (ENV_BASE_URL.includes('127.0.0.1') || ENV_BASE_URL.includes('localhost')) {
      return ENV_BASE_URL.replace('127.0.0.1', '10.0.2.2').replace('localhost', '10.0.2.2');
    }
  }
  return ENV_BASE_URL;
})();
if (__DEV__) {
  console.log('[axiosClient] using base URL:', BASE_URL);
}

// Create axios instance
const axiosClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for adding auth token
axiosClient.interceptors.request.use(
  async (config) => {
    try {
      // Get token from AsyncStorage (adjust key as needed)
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      console.error(`API Error ${status}:`, data);

      // Handle specific status codes
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          AsyncStorage.removeItem('authToken');
          // You might want to navigate to login screen here
          break;
        case 403:
          console.error('Forbidden access');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Internal server error');
          break;
        default:
          console.error('API Error:', status);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.message);
    } else {
      // Other error
      console.error('Request error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
