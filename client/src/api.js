import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const searchHotels = (params) => api.post('/search', params);
export const getHotelPage = (params) => api.post('/hotel', params);
export const prebook = (hash) => api.post('/prebook', { hash });
export const createBooking = (data) => api.post('/booking/create', data);
export const startBooking = (data) => api.post('/booking/start', data);
export const checkBookingStatus = (partnerOrderId) => api.post('/booking/status', { partner_order_id: partnerOrderId });
export const seedTestHotel = () => api.post('/seed-test-hotel');

export default api;
