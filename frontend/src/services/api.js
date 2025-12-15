/**
 * API Service Layer
 * Centralized API client with error handling, request/response interceptors, and type safety.
 */
import axios from 'axios';

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance with defaults
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
apiClient.interceptors.request.use(
    (config) => {
        // Add timestamp for debugging
        config.metadata = { startTime: new Date() };
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
apiClient.interceptors.response.use(
    (response) => {
        const duration = new Date() - response.config.metadata?.startTime;
        console.log(`[API] ${response.status} in ${duration}ms`);
        return response;
    },
    (error) => {
        const message = error.response?.data?.detail || error.message || 'Unknown error';
        console.error(`[API] Error: ${message}`);
        return Promise.reject(error);
    }
);

// ============ Data Explorer API ============

export const dataApi = {
    /**
     * Get available data structure (symbols and their intervals)
     */
    getStructure: async () => {
        const response = await apiClient.get('/structure');
        return response.data;
    },

    /**
     * Get OHLCV data for a symbol
     */
    getData: async (symbol, interval, startDate, endDate) => {
        const params = { symbol, interval };
        if (startDate) params.start = startDate;
        if (endDate) params.end = endDate;

        const response = await apiClient.get('/data', { params });
        return response.data;
    },
};

// ============ Factor Lab API ============

export const factorApi = {
    /**
     * Evaluate a factor expression and run backtest
     */
    evaluate: async (expression, symbol = 'BTC', interval = '1d', periods = 1, quantile = 5) => {
        const response = await apiClient.post('/evaluate', {
            expression,
            symbol,
            interval,
            periods,
            quantile,
        });
        return response.data;
    },

    /**
     * Combine multiple factors
     */
    combine: async (factors, symbol = 'BTC', periods = 1, quantile = 5) => {
        const response = await apiClient.post('/combine', {
            factors,
            symbol,
            periods,
            quantile,
        });
        return response.data;
    },
};

// ============ Reports API ============

export const reportsApi = {
    /**
     * Get all saved reports
     */
    list: async () => {
        const response = await apiClient.get('/reports');
        return response.data.reports || [];
    },

    /**
     * Get a specific report by ID
     */
    get: async (reportId) => {
        const response = await apiClient.get(`/reports/${reportId}`);
        return response.data;
    },

    /**
     * Save a new report
     */
    save: async (name, description, result) => {
        const response = await apiClient.post('/reports', {
            name,
            description,
            result,
        });
        return response.data;
    },

    /**
     * Delete a report
     */
    delete: async (reportId) => {
        const response = await apiClient.delete(`/reports/${reportId}`);
        return response.data;
    },
};

// Export default client for custom requests
export default apiClient;
