import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createBooking, startBooking, checkBookingStatus } from '../api';

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

    if (!rate) return <div>Invalid booking session</div>;

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
        <div className="p-4 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Complete Booking</h1>
            <div className="mb-4 bg-gray-50 p-4 rounded border">
                <h2 className="text-xl font-bold">{hotel.name}</h2>
                <p className="text-gray-600">{rate.room_name}</p>
                <p className="font-bold text-green-600 text-lg mt-2">
                    {rate.payment_options.payment_types[0].show_amount} {rate.payment_options.payment_types[0].show_currency_code}
                </p>
            </div>

            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold mb-2">Guest Details</h3>
                    {rooms.map((room, roomIndex) => (
                        <div key={roomIndex} className="mb-4 border p-4 rounded">
                            <h4 className="font-medium mb-2 text-gray-700">Room {roomIndex + 1}</h4>
                            {room.guests.map((guest, guestIndex) => (
                                <div key={guestIndex} className="flex gap-2 mb-2">
                                    <input
                                        placeholder="First Name"
                                        value={guest.first_name}
                                        onChange={e => handleGuestChange(roomIndex, guestIndex, 'first_name', e.target.value)}
                                        className="border p-2 w-full rounded"
                                    />
                                    <input
                                        placeholder="Last Name"
                                        value={guest.last_name}
                                        onChange={e => handleGuestChange(roomIndex, guestIndex, 'last_name', e.target.value)}
                                        className="border p-2 w-full rounded"
                                    />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-2">Contact Info</h3>
                    <div className="space-y-2">
                        <input
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="border p-2 block w-full rounded"
                        />
                        <input
                            placeholder="Phone"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="border p-2 block w-full rounded"
                        />
                    </div>
                </div>

                <button
                    onClick={handleBooking}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded font-bold hover:bg-blue-700 transition mt-4"
                >
                    {loading ? 'Processing...' : 'Confirm Booking'}
                </button>

                {status && (
                    <div className={`mt-4 p-4 rounded ${status.includes('Confirmed') ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {status}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingPage;
