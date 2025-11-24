const etgService = require('../services/etgService');
require('dotenv').config({ path: '../.env' });

const run = async () => {
    try {
        console.log('Searching for hotels in region 6195 (New York)...');
        // We need to implement searchHotelsByRegion or similar if not exists,
        // but etgService has searchHotelsById.
        // We can use the client directly to search by region.
        // Wait, etgService doesn't expose client.
        // I'll just use searchHotelsById with a known hotel ID if I can find one.
        // Or I can add a temporary function to etgService to search by region.

        // Actually, let's just try to use the client directly here.
        const axios = require('axios');
        const API_BASE_URL = 'https://api.worldota.net/api/b2b/v3';
        const keyId = process.env.ETG_KEY_ID;
        const apiKey = process.env.ETG_API_KEY;
        const auth = Buffer.from(`${keyId}:${apiKey}`).toString('base64');

        const client = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            }
        });

        const checkin = '2026-01-01';
        const checkout = '2026-01-05';
        const guests = [{ adults: 2, children: [] }];

        // Search by region 6195
        console.log('Searching...');
        const searchRes = await client.post('/search/serp/region/', {
            region_id: 6195,
            checkin,
            checkout,
            guests,
            residency: 'us',
            currency: 'USD',
            timeout: 30
        });

        if (!searchRes.data.data.hotels || searchRes.data.data.hotels.length === 0) {
            throw new Error('No hotels found in region');
        }

        const hotel = searchRes.data.data.hotels[0];
        console.log(`Found hotel: ${hotel.id}`);

        const rate = hotel.rates[0];
        console.log(`Trying rate: ${rate.match_hash}`);

        try {
            const prebookRes = await client.post('/hotel/prebook/', {
                hash: rate.match_hash
            });
            console.log('Prebook successful!', prebookRes.data);
        } catch (e) {
            console.log('Prebook failed:', e.response?.data || e.message);
        }

    } catch (e) {
        console.error('Error:', e.response?.data || e.message);
    }
};

run();
