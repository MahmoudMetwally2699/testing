const express = require('express');
const router = express.Router();
const etgService = require('../services/etgService');
const Hotel = require('../models/Hotel');

// Search Hotels
router.post('/search', async (req, res) => {
    try {
        const { regionId, ids, checkin, checkout, guests, residency } = req.body;
        let results;
        if (ids) {
            results = await etgService.searchHotelsById(ids, checkin, checkout, guests, residency);
        } else if (regionId) {
            results = await etgService.searchHotelsByRegion(regionId, checkin, checkout, guests, residency);
        } else {
            return res.status(400).json({ error: 'Region ID or Hotel IDs required' });
        }
        // Send only the data portion, not the entire ETG response
        res.json(results.data || results);
    } catch (error) {
        console.error('Search error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Hotel Page
router.post('/hotel', async (req, res) => {
    try {
        const { searchId, hotelId, checkin, checkout, guests, residency } = req.body;
        const result = await etgService.getHotelPage(searchId, hotelId, checkin, checkout, guests, residency);
        // Send only the data portion
        res.json(result.data || result);
    } catch (error) {
        console.error('Hotel page error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Prebook
router.post('/prebook', async (req, res) => {
    try {
        const { hash } = req.body;
        const result = await etgService.prebook(hash);
        // Send only the data portion
        res.json(result.data || result);
    } catch (error) {
        console.error('Prebook error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Booking Flow
router.post('/booking/create', async (req, res) => {
    try {
        const result = await etgService.createBooking(req.body);
        // Send only the data portion
        res.json(result.data || result);
    } catch (error) {
        console.error('Create booking error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.post('/booking/start', async (req, res) => {
    try {
        const result = await etgService.startBooking(req.body);
        // Send only the data portion
        res.json(result.data || result);
    } catch (error) {
        console.error('Start booking error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.post('/booking/status', async (req, res) => {
    try {
        const { partner_order_id } = req.body;
        const result = await etgService.checkBookingStatus(partner_order_id);
        // Send only the data portion
        res.json(result.data || result);
    } catch (error) {
        console.error('Check booking status error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Static Data (Seed Test Hotel)
router.post('/seed-test-hotel', async (req, res) => {
    try {
        const testHotel = {
            id: 'test_hotel_do_not_book',
            name: 'Test Hotel (Do Not Book)',
            region_id: 0,
            address: 'Test Address',
            star_rating: 5,
            description: 'This is a test hotel for API certification.',
            images: ['https://via.placeholder.com/300'],
            amenities: ['Free Wifi', 'Parking']
        };

        await Hotel.findOneAndUpdate({ id: testHotel.id }, testHotel, { upsert: true });
        res.json({ message: 'Test hotel seeded' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Webhook Handler
router.post('/webhook/booking', (req, res) => {
    console.log('Received Webhook:', req.body);
    // In a real app, you would update the order status in your DB here
    // const { partner_order_id, status } = req.body;
    // updateOrder(partner_order_id, status);
    res.status(200).send('OK');
});

module.exports = router;
