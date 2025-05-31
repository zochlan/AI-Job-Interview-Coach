import axios from 'axios';

// Define types for axios if they're not available in the current version
interface AxiosRequestConfig {
  baseURL?: string;
  url?: string;
  method?: string;
  headers?: any;
  params?: any;
  data?: any;
  timeout?: number;
  withCredentials?: boolean;
  responseType?: string;
  _retry?: boolean;
  onUploadProgress?: (progressEvent: ProgressEvent) => void;
  [key: string]: any;
}

interface AxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: AxiosRequestConfig;
  request?: any;
}

interface AxiosError<T = any> extends Error {
  config: AxiosRequestConfig;
  code?: string;
  request?: any;
  response?: AxiosResponse<T>;
  isAxiosError: boolean;
}

// Create a custom axios instance with default settings
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 60000, // 60 second timeout (reduced from 180 seconds for better UX)
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Function to check if an endpoint is rate limited
const isEndpointRateLimited = (url: string): boolean => {
  const rateLimitedEndpoints = JSON.parse(localStorage.getItem('rateLimitedEndpoints') || '{}');

  // Check if this endpoint is rate limited and the rate limit hasn't expired
  if (rateLimitedEndpoints[url] && rateLimitedEndpoints[url] > Date.now()) {
    console.warn(`Endpoint is rate limited: ${url}`);
    return true;
  } else if (rateLimitedEndpoints[url] && rateLimitedEndpoints[url] <= Date.now()) {
    // Rate limit has expired, remove it from storage
    delete rateLimitedEndpoints[url];
    localStorage.setItem('rateLimitedEndpoints', JSON.stringify(rateLimitedEndpoints));
    console.log(`Rate limit for ${url} has expired, removing from storage`);
  }

  return false;
};

// Request interceptor for adding auth tokens, etc.
apiClient.interceptors.request.use(
  (config) => {
    // Check if the endpoint is rate limited before making the request
    if (config.url && isEndpointRateLimited(config.url)) {
      // Instead of rejecting here, we'll let the request proceed
      // but mark it so we can handle it in the response interceptor
      config.headers = config.headers || {};
      config.headers['X-Rate-Limited'] = 'true';
    }

    // You could add authorization headers here if needed
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => {
    // Check if this request was marked as rate-limited in the request interceptor
    if (response.config.headers && response.config.headers['X-Rate-Limited'] === 'true') {
      console.log('Handling response for rate-limited endpoint:', response.config.url);

      // For Groq API endpoints, we can return a fallback response
      if (response.config.url?.includes('/groq/')) {
        // Extract request data
        const requestData = response.config.data ?
          (typeof response.config.data === 'string' ?
            JSON.parse(response.config.data) : response.config.data) : {};

        // Create a custom response based on the endpoint
        if (response.config.url?.includes('/groq/question')) {
          const jobRole = requestData.jobRole || 'software developer';
          const isNewSession = requestData.isNewSession || false;
          const previousQuestions = requestData.previousQuestions || [];

          // Create a contextual fallback response based on the interview stage
          let fallbackQuestion = '';

          if (isNewSession) {
            fallbackQuestion = `Welcome! I'm the interview coach. I'd like to start by understanding your background in ${jobRole}. Could you walk me through your professional journey, highlighting the experiences that have prepared you for this type of role?`;
          } else if (previousQuestions.length < 3) {
            fallbackQuestion = `What aspects of being a ${jobRole} do you find most engaging and why?`;
          } else if (previousQuestions.length < 7) {
            fallbackQuestion = `Tell me about a time when you had to adapt quickly to a significant change at work. How did you handle it?`;
          } else if (previousQuestions.length < 11) {
            fallbackQuestion = `How do you approach learning new skills or technologies required for your role as a ${jobRole}?`;
          } else {
            fallbackQuestion = `Where do you see the ${jobRole} field evolving in the next few years, and how are you preparing for these changes?`;
          }

          // Dispatch the rate limit event
          window.dispatchEvent(new CustomEvent('api:rate-limited', {
            detail: {
              endpoint: response.config.url,
              method: response.config.method,
              timestamp: Date.now(),
              resetTime: Date.now() + 3600000 // 1 hour from now
            }
          }));

          // Return a fallback response
          return {
            ...response,
            data: {
              success: true,
              question: fallbackQuestion,
              metadata: {
                model: 'fallback:rate-limited',
                timestamp: new Date().toISOString()
              }
            }
          };
        }

        // For analysis, return a default analysis
        if (response.config.url?.includes('/groq/analyze')) {
          // Dispatch the rate limit event
          window.dispatchEvent(new CustomEvent('api:rate-limited', {
            detail: {
              endpoint: response.config.url,
              method: response.config.method,
              timestamp: Date.now(),
              resetTime: Date.now() + 3600000 // 1 hour from now
            }
          }));

          return {
            ...response,
            data: {
              success: true,
              analysis: {
                completeness: "partial",
                confidence: "medium",
                strengths: ["Good communication skills", "Structured response"],
                weaknesses: ["Could provide more specific examples", "Consider quantifying achievements"],
                improvement_tips: ["Try using the STAR method more explicitly", "Include metrics when discussing results"],
                star_rating: 3
              },
              metadata: {
                model: 'fallback:rate-limited',
                timestamp: new Date().toISOString()
              }
            }
          };
        }
      }
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle session expiration (401 errors)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Dispatch an event that auth context can listen for
      window.dispatchEvent(new CustomEvent('auth:expired'));

      return Promise.reject(error);
    }

    // Handle server errors (5xx)
    if (error.response?.status && error.response.status >= 500) {
      console.error('Server error:', error.response.data);
      // You could log to a monitoring service here
    }

    // Handle rate limiting (429)
    if (error.response?.status === 429) {
      console.warn('Rate limited. Handling gracefully...');

      // Check if this is a retry already to avoid infinite loops
      if (originalRequest._retry) {
        console.warn('Already retried once, not retrying again');

        // Track rate limited endpoints to avoid unnecessary API calls
        const rateLimitedEndpoints = JSON.parse(localStorage.getItem('rateLimitedEndpoints') || '{}');
        if (originalRequest.url) {
          // Store the endpoint with an expiration time (1 hour from now)
          rateLimitedEndpoints[originalRequest.url] = Date.now() + 3600000; // 1 hour in milliseconds
          localStorage.setItem('rateLimitedEndpoints', JSON.stringify(rateLimitedEndpoints));
          console.log(`Marked ${originalRequest.url} as rate limited until ${new Date(rateLimitedEndpoints[originalRequest.url]).toLocaleTimeString()}`);
        }

        // Dispatch an event that components can listen for
        window.dispatchEvent(new CustomEvent('api:rate-limited', {
          detail: {
            endpoint: originalRequest.url,
            method: originalRequest.method,
            timestamp: Date.now(),
            resetTime: Date.now() + 3600000 // 1 hour from now
          }
        }));

        // If this is a Groq API request, we can try to continue with a fallback
        if (originalRequest.url?.includes('/groq/')) {
          console.log('Groq API rate limited, continuing with fallback');

          // For question generation, we can return a special response
          if (originalRequest.url?.includes('/groq/question')) {
            // Extract job role from request if available
            const requestData = originalRequest.data ?
              (typeof originalRequest.data === 'string' ?
                JSON.parse(originalRequest.data) : originalRequest.data) : {};

            const jobRole = requestData.jobRole || 'software developer';
            const isNewSession = requestData.isNewSession || false;
            const previousQuestions = requestData.previousQuestions || [];

            // Create a more contextual fallback response based on the interview stage
            let fallbackQuestion = '';

            if (isNewSession) {
              fallbackQuestion = `Welcome! I'm the interview coach. I'd like to start by understanding your background in ${jobRole}. Could you walk me through your professional journey, highlighting the experiences that have prepared you for this type of role?`;
            } else if (previousQuestions.length < 3) {
              fallbackQuestion = `What aspects of being a ${jobRole} do you find most engaging and why?`;
            } else if (previousQuestions.length < 7) {
              fallbackQuestion = `Tell me about a time when you had to adapt quickly to a significant change at work. How did you handle it?`;
            } else if (previousQuestions.length < 11) {
              fallbackQuestion = `How do you approach learning new skills or technologies required for your role as a ${jobRole}?`;
            } else {
              fallbackQuestion = `Where do you see the ${jobRole} field evolving in the next few years, and how are you preparing for these changes?`;
            }

            // Return a fallback response that the UI can handle
            return Promise.resolve({
              data: {
                success: true,
                question: fallbackQuestion,
                metadata: {
                  model: 'fallback:rate-limited',
                  timestamp: new Date().toISOString()
                }
              }
            });
          }

          // For analysis, return a default analysis
          if (originalRequest.url?.includes('/groq/analyze')) {
            return Promise.resolve({
              data: {
                success: true,
                analysis: {
                  completeness: "partial",
                  confidence: "medium",
                  strengths: ["Good communication skills", "Structured response"],
                  weaknesses: ["Could provide more specific examples", "Consider quantifying achievements"],
                  improvement_tips: ["Try using the STAR method more explicitly", "Include metrics when discussing results"],
                  star_rating: 3
                },
                metadata: {
                  model: 'fallback:rate-limited',
                  timestamp: new Date().toISOString()
                }
              }
            });
          }
        }

        return Promise.reject(error);
      }

      // Mark as retried
      originalRequest._retry = true;

      // Use exponential backoff for retry
      const retryDelay = Math.min(2000 * (Math.random() + 0.5), 5000); // Between 1-5 seconds
      console.log(`Waiting ${retryDelay}ms before retrying...`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));

      // Make sure url is defined before retrying
      if (originalRequest.url) {
        return apiClient(originalRequest as any);
      }

      return Promise.reject(error);
    }

    // Handle network errors
    if (error.message === 'Network Error') {
      // Check if we're offline
      if (!navigator.onLine) {
        // Dispatch offline event
        window.dispatchEvent(new CustomEvent('app:offline'));
      }
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout:', originalRequest.url);
    }

    return Promise.reject(error);
  }
);

// Helper function to make API calls with retry logic
export async function callApi<T>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
  retries = 2
): Promise<T> {
  try {
    let response: AxiosResponse;

    switch (method) {
      case 'get':
        response = await apiClient.get(url, config);
        break;
      case 'post':
        response = await apiClient.post(url, data, config);
        break;
      case 'put':
        response = await apiClient.put(url, data, config);
        break;
      case 'delete':
        response = await apiClient.delete(url, config);
        break;
    }

    return response.data;
  } catch (error: any) {
    // Don't retry on client errors (4xx) except for 429 (rate limiting)
    if (
      error.response &&
      error.response.status >= 400 &&
      error.response.status < 500 &&
      error.response.status !== 429
    ) {
      throw error;
    }

    // Retry logic for server errors or network issues
    if (retries > 0) {
      // Linear backoff: simpler and more predictable than exponential
      const delay = 1000; // Fixed 1 second delay between retries
      console.warn(`API call failed. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callApi(method, url, data, config, retries - 1);
    }

    throw error;
  }
}

// Typed API methods
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    callApi<T>('get', url, undefined, config),

  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    callApi<T>('post', url, data, config),

  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    callApi<T>('put', url, data, config),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    callApi<T>('delete', url, undefined, config),

  // Special method for file uploads
  uploadFile: <T>(url: string, file: File, fieldName: string = 'file', onProgress?: (percentage: number) => void) => {
    const formData = new FormData();
    formData.append(fieldName, file);

    return callApi<T>('post', url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: { loaded: number; total?: number }) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 100)
          );
          onProgress(percentCompleted);
        }
      },
    });
  }
};

/**
 * Utility functions for managing rate limits
 */
export const rateLimitUtils = {
  /**
   * Clear all rate limits or a specific endpoint's rate limit
   * @param endpoint Optional specific endpoint to clear
   */
  clearRateLimits: (endpoint?: string) => {
    if (endpoint) {
      const rateLimitedEndpoints = JSON.parse(localStorage.getItem('rateLimitedEndpoints') || '{}');
      if (rateLimitedEndpoints[endpoint]) {
        delete rateLimitedEndpoints[endpoint];
        localStorage.setItem('rateLimitedEndpoints', JSON.stringify(rateLimitedEndpoints));
        console.log(`Cleared rate limit for ${endpoint}`);
      }
    } else {
      localStorage.removeItem('rateLimitedEndpoints');
      console.log('Cleared all rate limits');
    }
  },

  /**
   * Get all currently rate limited endpoints
   * @returns Object with endpoints and their expiration times
   */
  getRateLimitedEndpoints: () => {
    const rateLimitedEndpoints = JSON.parse(localStorage.getItem('rateLimitedEndpoints') || '{}');

    // Clean up expired rate limits
    const now = Date.now();
    let changed = false;

    Object.keys(rateLimitedEndpoints).forEach(endpoint => {
      if (rateLimitedEndpoints[endpoint] <= now) {
        delete rateLimitedEndpoints[endpoint];
        changed = true;
      }
    });

    if (changed) {
      localStorage.setItem('rateLimitedEndpoints', JSON.stringify(rateLimitedEndpoints));
    }

    return rateLimitedEndpoints;
  },

  /**
   * Check if a specific endpoint is rate limited
   * @param endpoint The endpoint to check
   * @returns Boolean indicating if the endpoint is rate limited
   */
  isRateLimited: (endpoint: string) => {
    const rateLimitedEndpoints = JSON.parse(localStorage.getItem('rateLimitedEndpoints') || '{}');
    return rateLimitedEndpoints[endpoint] && rateLimitedEndpoints[endpoint] > Date.now();
  }
};

export default apiClient;
