import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';

const ENV_BASE_URL = API_BASE_URL;


// Create axios instance
const axiosClient: AxiosInstance = axios.create({
  baseURL: ENV_BASE_URL,
  // Increase timeout to allow long-running AI generation requests.
  // Set to 300000 ms (5 minutes). If you prefer unlimited, set to 0.
  timeout: 300000,
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
    // add helpful context to logs
    const reqConfig: any = (error.config as any) || {};
    const method = reqConfig.method?.toUpperCase() || 'UNKNOWN_METHOD';
    const url = reqConfig.url || 'unknown_url';

    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      console.error(`[axios] API Error ${status} ${method} ${url}:`, data);

      // Handle specific status codes
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          AsyncStorage.removeItem('authToken');
          // You might want to navigate to login screen here
          break;
        case 403:
          console.error(`[axios] Forbidden access ${method} ${url}`);
          break;
        case 404:
          console.error(`[axios] Resource not found ${method} ${url}`);
          break;
        case 500:
          console.error(`[axios] Internal server error ${method} ${url}`);
          break;
        default:
          console.error(`[axios] API Error ${status} ${method} ${url}`);
      }
      // Don't attempt automatic retry for server errors with a response by default
    } else if (error.request) {
      // Network error (no response received)
      console.error(`[axios] Network error ${method} ${url}:`, error.message);
      // Retry logic for transient network errors / timeouts
      try {
        const cfg: any = error.config || {};
        cfg.__retryCount = cfg.__retryCount || 0;
        const MAX_RETRIES = 3;

        // Only retry idempotent-ish requests (GET/OPTIONS/HEAD) and POST when explicitly allowed.
        const safeToRetry = ['GET', 'HEAD', 'OPTIONS'].includes((cfg.method || '').toUpperCase()) || cfg.retryOnNetworkError === true;

        if (cfg.__retryCount < MAX_RETRIES && safeToRetry) {
          cfg.__retryCount += 1;
          const delay = Math.min(1000 * 2 ** (cfg.__retryCount - 1), 30000); // exponential backoff up to 30s
          console.warn(`[axios] network error, retry #${cfg.__retryCount} for ${method} ${url} after ${delay}ms`);
          return new Promise<void>((resolve) => setTimeout(() => resolve(), delay)).then(() => axiosClient(cfg));
        }
      } catch (retryErr) {
        console.error('[axios] retry failed', retryErr);
      }
    } else {
      // Other error (setup/config)
      console.error('[axios] Request error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
