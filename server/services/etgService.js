const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'https://api.worldota.net/api/b2b/v3';

const getAuthHeader = () => {
    const keyId = process.env.ETG_KEY_ID;
    const apiKey = process.env.ETG_API_KEY;
    const auth = Buffer.from(`${keyId}:${apiKey}`).toString('base64');
    return `Basic ${auth}`;
};

const etgClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor to add auth header and log requests
etgClient.interceptors.request.use(config => {
    config.headers.Authorization = getAuthHeader();
    console.log(`[REQUEST] ${config.method.toUpperCase()} ${config.url}`, JSON.stringify(config.data, null, 2));
    return config;
});

etgClient.interceptors.response.use(
    response => {
        console.log(`[RESPONSE] ${response.config.url}`, JSON.stringify(response.data, null, 2));
        return response;
    },
    error => {
        console.error(`[ERROR] ${error.config?.url}`, error.response?.data || error.message);
        return Promise.reject(error);
    }
);

const searchRegions = async (query) => {
    // Implementation for region search (if needed, or just use direct API)
    return {};
};

const searchHotelsByRegion = async (regionId, checkin, checkout, guests, residency, currency = 'USD') => {
    try {
        const response = await etgClient.post('/search/serp/region', {
            region_id: regionId,
            checkin,
            checkout,
            guests,
            residency,
            currency,
            timeout: 30
        });
        return response.data;
    } catch (error) {
        console.error('Error in searchHotelsByRegion:', error.response?.data || error.message);
        throw error;
    }
};

const searchHotelsById = async (ids, checkin, checkout, guests, residency, currency = 'USD') => {
    try {
        const response = await etgClient.post('/search/serp/hotels', {
            ids,
            checkin,
            checkout,
            guests,
            residency,
            currency,
            timeout: 30
        });
        return response.data;
    } catch (error) {
        console.error('Error searching hotels by ID:', error.response?.data || error.message);
        throw error;
    }
};

const getHotelPage = async (searchId, hotelId, checkin, checkout, guests, residency) => {
    try {
        const response = await etgClient.post('/search/hp/', {
            checkin,
            checkout,
            guests,
            residency,
            id: hotelId,
            timeout: 30
        });
        return response.data;
    } catch (error) {
        console.error('Error getting hotel page:', error.response?.data || error.message);
        throw error;
    }
};

const prebook = async (hash, priceIncreasePercent = 0) => {
    try {
        const payload = { hash };
        if (priceIncreasePercent > 0) {
            payload.price_increase_percent = priceIncreasePercent;
        }
        const response = await etgClient.post('/hotel/prebook', payload);
        return response.data;
    } catch (error) {
        console.error('Error in prebook:', error.response?.data || error.message);
        throw error;
    }
};

const createBooking = async (data) => {
    try {
        const response = await etgClient.post('/hotel/order/booking/form/', data);
        return response.data;
    } catch (error) {
        console.error('Error creating booking:', error.response?.data || error.message);
        throw error;
    }
};

const startBooking = async (data) => {
    try {
        const response = await etgClient.post('/hotel/order/booking/finish/', data);
        return response.data;
    } catch (error) {
        console.error('Error starting booking:', error.response?.data || error.message);
        throw error;
    }
};

const checkBookingStatus = async (partnerOrderId) => {
    try {
        const response = await etgClient.post('/hotel/order/booking/finish/status/', {
            partner_order_id: partnerOrderId
        });
        return response.data;
    } catch (error) {
        console.error('Error checking booking status:', error.response?.data || error.message);
        throw error;
    }
};

module.exports = {
    searchHotelsByRegion,
    searchHotelsById,
    getHotelPage,
    prebook,
    createBooking,
    startBooking,
    checkBookingStatus
};
