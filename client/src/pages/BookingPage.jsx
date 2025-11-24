import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createBooking, startBooking, checkBookingStatus } from '../api';
import './BookingPage.css';

const BookingPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { rate, hotel, searchParams, bookHash } = location.state || {};

    // Initialize guests state based on searchParams.guests structure
    const [rooms, setRooms] = useState(() => {
        if (searchParams && searchParams.guests) {
            return searchParams.guests.map(room => ({
                guests: Array(room.adults + room.children.length).fill({ first_name: '', last_name: '' })
            }));
        }
        return [{ guests: [{ first_name: '', last_name: '' }, { first_name: '', last_name: '' }] }];
    });

    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    if (!rate) return (
        <div className="invalid-session">
            <div className="invalid-icon">❌</div>
            <div className="invalid-message">Invalid booking session</div>
        </div>
    );

    const handleGuestChange = (roomIndex, guestIndex, field, value) => {
        const newRooms = [...rooms];
        const newGuests = [...newRooms[roomIndex].guests];
        newGuests[guestIndex] = { ...newGuests[guestIndex], [field]: value };
        newRooms[roomIndex].guests = newGuests;
        setRooms(newRooms);
    };

    const handleBooking = async () => {
        setLoading(true);
        setStatus('Creating booking...');
        try {
            // 1. Create Booking
            const createData = {
                partner_order_id: `ord_${Date.now()}`,
                book_hash: bookHash,
                language: 'en',
                user_ip: '127.0.0.1',
            };

            const createResponse = await createBooking(createData);

            if (!createResponse.data || !createResponse.data.partner_order_id) {
                throw new Error('Failed to create booking');
            }

            const partnerOrderId = createResponse.data.partner_order_id;

            // 2. Start Booking
            setStatus('Starting booking...');
            const startData = {
                partner: {
                    partner_order_id: partnerOrderId
                },
                payment_type: {
                    type: 'deposit', // Simplified for B2B
                    amount: rate.payment_options.payment_types[0].amount,
                    currency_code: rate.payment_options.payment_types[0].currency_code
                },
                rooms: rooms.map(room => ({
                    guests: room.guests
                })),
                user: {
                    email,
                    phone,
                    comment: 'Test booking'
                }
            };

            await startBooking(startData);

            // 3. Check Status
            setStatus('Processing booking...');
            let attempts = 0;
            const maxAttempts = 20;

            const pollStatus = async () => {
                if (attempts >= maxAttempts) {
                    setStatus('Booking timed out (check backoffice)');
                    setLoading(false);
                    return;
                }

                try {
                    const statusResponse = await checkBookingStatus(partnerOrderId);
                    console.log('Booking status response:', statusResponse.data);
                    const percent = statusResponse.data?.percent;

                    if (percent === 100) {
                        setStatus('Booking Confirmed!');
                        setLoading(false);
                    } else if (percent !== undefined && percent < 100) {
                        // Still processing
                        attempts++;
                        setTimeout(pollStatus, 2000);
                    } else {
                        // Unknown state, keep polling
                        attempts++;
                        setTimeout(pollStatus, 2000);
                    }
                } catch (err) {
                    console.error(err);
                    attempts++;
                    setTimeout(pollStatus, 2000);
                }
            };

            pollStatus();

        } catch (error) {
            console.error(error);
            setStatus(`Error: ${error.message}`);
            setLoading(false);
        }
    };

    return (
        <div className="booking-page">
            <div className="booking-header">
                <h1 className="booking-title">Complete Your Booking</h1>
                <p className="booking-subtitle">Just a few more details to confirm your stay</p>
            </div>

            <div className="hotel-summary">
                <h2 className="hotel-summary-name">{hotel.name}</h2>
                <p className="hotel-summary-room">{rate.room_name}</p>
                <div className="hotel-summary-price">
                    {rate.payment_options.payment_types[0].show_amount} {rate.payment_options.payment_types[0].show_currency_code}
                </div>
            </div>

            <div className="form-section">
                <h3 className="section-title">
                    <span className="section-icon">👥</span>
                    Guest Details
                </h3>
                {rooms.map((room, roomIndex) => (
                    <div key={roomIndex} className="room-card">
                        <h4 className="room-title">
                            🛏️ Room {roomIndex + 1}
                        </h4>
                        {room.guests.map((guest, guestIndex) => (
                            <div key={guestIndex} className="guest-inputs">
                                <input
                                    placeholder="First Name"
                                    value={guest.first_name}
                                    onChange={e => handleGuestChange(roomIndex, guestIndex, 'first_name', e.target.value)}
                                    className="input-field"
                                />
                                <input
                                    placeholder="Last Name"
                                    value={guest.last_name}
                                    onChange={e => handleGuestChange(roomIndex, guestIndex, 'last_name', e.target.value)}
                                    className="input-field"
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="form-section">
                <h3 className="section-title">
                    <span className="section-icon">📧</span>
                    Contact Information
                </h3>
                <div className="contact-inputs">
                    <input
                        placeholder="Email Address"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="input-field"
                    />
                    <input
                        placeholder="Phone Number"
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="input-field"
                    />
                </div>
            </div>

            <button
                onClick={handleBooking}
                disabled={loading}
                className="btn-submit"
            >
                {loading && <span className="spinner-inline"></span>}
                {loading ? 'Processing...' : 'Confirm Booking'}
            </button>

            {status && (
                <div className={`status-message ${
                    status.includes('Confirmed') ? 'success' :
                    status.includes('Error') ? 'error' : 'processing'
                }`}>
                    {status.includes('Confirmed') && '✅ '}
                    {status.includes('Error') && '❌ '}
                    {!status.includes('Confirmed') && !status.includes('Error') && '⏳ '}
                    {status}
                </div>
            )}
        </div>
    );
};

export default BookingPage;
