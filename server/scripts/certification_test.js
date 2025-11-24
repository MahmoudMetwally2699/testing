const fs = require('fs');
const path = require('path');
const etgService = require('../services/etgService');
require('dotenv').config({ path: '../.env' });

const logFile = path.join(__dirname, '..', 'certification_logs.txt');
// Clear log file
fs.writeFileSync(logFile, '');

const log = (message, data = null) => {
    const timestamp = new Date().toISOString();
    let logMsg = `[${timestamp}] ${message}\n`;
    if (data) {
        logMsg += JSON.stringify(data, null, 2) + '\n';
    }
    process.stdout.write(message + '\n');
    fs.appendFileSync(logFile, logMsg + '\n');
};

// Monkey patch console.log/error to capture service logs
const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ');
    fs.appendFileSync(logFile, msg + '\n');
};

console.error = (...args) => {
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ');
    fs.appendFileSync(logFile, '[ERROR] ' + msg + '\n');
    process.stderr.write('[ERROR] ' + msg + '\n');
};

const runTests = async () => {
    log('Starting Certification Tests...');

    // Use future dates
    const checkin = '2026-01-01';
    const checkout = '2026-01-05';

    // Test Case 0: Simple 1 Adult
    log('\n--- Test Case 0: Simple 1 Adult ---');
    try {
        const residency = 'us';
        const guests = [{ adults: 1, children: [] }];
        log('Searching...');
        const searchRes = await etgService.searchHotelsById(['test_hotel_do_not_book'], checkin, checkout, guests, residency, 'USD');
        const hotel = searchRes.data.hotels[0];
        log(`Found hotel: ${hotel.id}`);

        log('Getting Hotel Page...');
        const hpRes = await etgService.getHotelPage(null, hotel.id, checkin, checkout, guests, residency);
        const hpHotel = hpRes.data.hotels[0];
        log(`HP Hotel: ${hpHotel.id} with ${hpHotel.rates.length} rates`);

        const rate = hpHotel.rates[0];
        const hashToUse = rate.book_hash || rate.match_hash;
        log(`Trying rate 0: ${hashToUse}`);
        const prebookRes = await etgService.prebook(hashToUse);
        const bookHash = prebookRes.data?.hotels?.[0]?.rates?.[0]?.book_hash;
        log(`Prebook successful! Book Hash: ${bookHash}`);
    } catch (e) {
        log(`Test Case 0 Failed: ${e.message}`);
        if (e.response) log('Error Response', e.response.data);
    }

    // Test Case 1: CZ, 2 Adults, 2 Rooms
    log('\n--- Test Case 1: CZ, 2 Adults, 2 Rooms ---');
    try {
        const residency = 'cz';
        const guests = [
            { adults: 2, children: [] },
            { adults: 2, children: [] }
        ];

        log('Searching...');
        const searchRes = await etgService.searchHotelsById(['test_hotel_do_not_book'], checkin, checkout, guests, residency, 'USD');

        if (!searchRes.data || !searchRes.data.hotels || searchRes.data.hotels.length === 0) {
            throw new Error('No hotels found');
        }

        const hotel = searchRes.data.hotels[0];
        log(`Found hotel: ${hotel.id}`);

        log('Getting Hotel Page...');
        const hpRes = await etgService.getHotelPage(null, hotel.id, checkin, checkout, guests, residency);
        const hpHotel = hpRes.data.hotels[0];
        log(`HP Hotel: ${hpHotel.id} with ${hpHotel.rates.length} rates`);

        let bookHash = null;
        let selectedRate = null;

        // Try to prebook with first few rates
        for (let i = 0; i < Math.min(hpHotel.rates.length, 5); i++) {
            const rate = hpHotel.rates[i];
            const hashToUse = rate.book_hash || rate.match_hash;
            log(`Trying rate ${i}: ${hashToUse}`);
            try {
                const prebookRes = await etgService.prebook(hashToUse);
                bookHash = prebookRes.data?.hotels?.[0]?.rates?.[0]?.book_hash;

                if (bookHash) {
                    selectedRate = prebookRes.data.hotels[0].rates[0];
                    log(`Prebook successful! Book Hash: ${bookHash}`);
                    break;
                }
            } catch (e) {
                log(`Prebook failed for rate ${i}: ${e.message}`);
            }
        }

        if (!bookHash) {
            throw new Error('All prebook attempts failed');
        }

        log('Creating Booking...');
        const orderId = `ord_cert_1_${Date.now()}`;
        const createRes = await etgService.createBooking({
            partner_order_id: orderId,
            book_hash: bookHash,
            language: 'en',
            user_ip: '127.0.0.1'
        });
        const partnerOrderId = createRes.partner_order_id;

        log('Starting Booking...');
        const startRes = await etgService.startBooking({
            partner_order_id: partnerOrderId,
            payment_type: {
                type: 'deposit',
                amount: selectedRate.payment_options.payment_types[0].amount,
                currency_code: selectedRate.payment_options.payment_types[0].currency_code
            },
            rooms: [
                { guests: [{ first_name: 'Test', last_name: 'AdultOne' }, { first_name: 'Test', last_name: 'AdultTwo' }] },
                { guests: [{ first_name: 'Test', last_name: 'AdultThree' }, { first_name: 'Test', last_name: 'AdultFour' }] }
            ],
            user: {
                email: 'test@example.com',
                phone: '1234567890',
                comment: 'Certification Test 1'
            }
        });

        log('Polling Status...');
        await pollStatus(partnerOrderId);

    } catch (error) {
        log('Test Case 1 Failed: ' + error.message);
        if (error.response) log('Error Response', error.response.data);
    }

    // Test Case 2: DE, 2 Adults, 1 Child (17)
    log('\n--- Test Case 2: DE, 2 Adults, 1 Child (17) ---');
    try {
        const residency = 'de';
        const guests = [
            { adults: 2, children: [17] }
        ];

        log('Searching...');
        const searchRes = await etgService.searchHotelsById(['test_hotel_do_not_book'], checkin, checkout, guests, residency, 'USD');

        if (!searchRes.data || !searchRes.data.hotels || searchRes.data.hotels.length === 0) {
            throw new Error('No hotels found');
        }

        const hotel = searchRes.data.hotels[0];
        log(`Found hotel: ${hotel.id}`);

        log('Getting Hotel Page...');
        const hpRes = await etgService.getHotelPage(null, hotel.id, checkin, checkout, guests, residency);
        const hpHotel = hpRes.data.hotels[0];
        log(`HP Hotel: ${hpHotel.id} with ${hpHotel.rates.length} rates`);

        let bookHash = null;
        let selectedRate = null;

        for (let i = 0; i < Math.min(hpHotel.rates.length, 5); i++) {
            const rate = hpHotel.rates[i];
            const hashToUse = rate.book_hash || rate.match_hash;
            log(`Trying rate ${i}: ${hashToUse}`);
            try {
                const prebookRes = await etgService.prebook(hashToUse);
                bookHash = prebookRes.data?.hotels?.[0]?.rates?.[0]?.book_hash;

                if (bookHash) {
                    selectedRate = prebookRes.data.hotels[0].rates[0];
                    log(`Prebook successful! Book Hash: ${bookHash}`);
                    break;
                }
            } catch (e) {
                log(`Prebook failed for rate ${i}: ${e.message}`);
            }
        }

        if (!bookHash) {
            throw new Error('All prebook attempts failed');
        }

        log('Creating Booking...');
        const orderId = `ord_cert_2_${Date.now()}`;
        const createRes = await etgService.createBooking({
            partner_order_id: orderId,
            book_hash: bookHash,
            language: 'en',
            user_ip: '127.0.0.1'
        });
        const partnerOrderId = createRes.data?.partner_order_id || orderId;

        log('Starting Booking...');
        const startRes = await etgService.startBooking({
            partner_order_id: partnerOrderId,
            payment_type: {
                type: 'deposit',
                amount: selectedRate.payment_options.payment_types[0].amount,
                currency_code: selectedRate.payment_options.payment_types[0].currency_code
            },
            rooms: [
                { guests: [
                    { first_name: 'Test', last_name: 'AdultOne' },
                    { first_name: 'Test', last_name: 'AdultTwo' },
                    { first_name: 'Test', last_name: 'Child', age: 17 }
                ] }
            ],
            user: {
                email: 'test@example.com',
                phone: '1234567890',
                comment: 'Certification Test 2'
            }
        });

        log('Polling Status...');
        await pollStatus(partnerOrderId);

    } catch (error) {
        log('Test Case 2 Failed: ' + error.message);
        if (error.response) log('Error Response', error.response.data);
    }

    // Test Case 3: Real Hotel (New York)
    log('\n--- Test Case 3: Real Hotel (New York) ---');
    try {
        const residency = 'us';
        const guests = [{ adults: 2, children: [] }];
        log('Searching Region 6195...');
        const searchRes = await etgService.searchHotelsByRegion(6195, checkin, checkout, guests, residency, 'USD');

        if (!searchRes.data || !searchRes.data.hotels || searchRes.data.hotels.length === 0) {
            throw new Error('No hotels found in region');
        }

        const hotel = searchRes.data.hotels[0];
        log(`Found hotel: ${hotel.id}`);

        log('Getting Hotel Page...');
        const hpRes = await etgService.getHotelPage(null, hotel.id, checkin, checkout, guests, residency);
        const hpHotel = hpRes.data.hotels[0];
        const rate = hpHotel.rates[0];
        const hashToUse = rate.book_hash || rate.match_hash;

        log(`Trying rate 0: ${hashToUse}`);
        const prebookRes = await etgService.prebook(hashToUse);
        const bookHash = prebookRes.data?.hotels?.[0]?.rates?.[0]?.book_hash;
        log(`Prebook successful! Book Hash: ${bookHash}`);

    } catch (e) {
        log(`Test Case 3 Failed: ${e.message}`);
        if (e.response) log('Error Response', e.response.data);
    }
};

const pollStatus = async (partnerOrderId) => {
    let attempts = 0;
    while (attempts < 10) {
        const statusRes = await etgService.checkBookingStatus(partnerOrderId);
        log(`Status: ${statusRes.status}`);
        if (statusRes.status === 'ok') {
            log('Booking Confirmed!');
            return;
        } else if (statusRes.status === 'failed') {
            log('Booking Failed');
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
    }
    log('Polling timed out');
};

runTests();
