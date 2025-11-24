import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getHotelPage, prebook } from '../api';
import './HotelPage.css';

const HotelPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { searchParams, hotelData } = location.state || {};
    const [hotel, setHotel] = useState(hotelData || null);
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchHotelData = async () => {
            if (!searchParams) return;
            setLoading(true);
            try {
                // Call Retrieve Hotel Page
                const response = await getHotelPage({
                    hotelId: id,
                    ...searchParams
                });
                console.log('Hotel page response:', response.data);
                if (response.data && response.data.hotels && response.data.hotels.length > 0) {
                    const hotelDetails = response.data.hotels[0];
                    setHotel(hotelDetails);
                    setRates(hotelDetails.rates || []);
                }
            } catch (error) {
                console.error(error);
                alert('Error fetching hotel details');
            } finally {
                setLoading(false);
            }
        };

        fetchHotelData();
    }, [id, searchParams]);

    const handleBook = async (rate) => {
        try {
            // Use book_hash (starts with h-) instead of match_hash (starts with m-)
            const hashToUse = rate.book_hash || rate.match_hash;
            console.log('Prebooking with hash:', hashToUse);

            // Prebook check
            const prebookResponse = await prebook(hashToUse);
            console.log('Prebook response:', prebookResponse.data);
            console.log('Has hotels?', prebookResponse.data && prebookResponse.data.hotels);

            if (prebookResponse.data && prebookResponse.data.hotels) {
                 // The prebook response contains the updated rate with confirmed book_hash
                 const prebookedRate = prebookResponse.data.hotels[0].rates[0];
                 console.log('Prebooked rate:', prebookedRate);
                 if (prebookedRate) {
                     console.log('Navigating to booking page with book_hash:', prebookedRate.book_hash);
                     navigate('/booking', {
                         state: {
                             rate: prebookedRate,
                             hotel,
                             searchParams,
                             bookHash: prebookedRate.book_hash
                         }
                     });
                     console.log('Navigation called');
                 } else {
                     alert('Rate not available anymore');
                 }
            } else {
                console.error('No hotels in prebook response');
                alert('Prebook response invalid');
            }
        } catch (error) {
            console.error(error);
            alert('Error during prebook: ' + (error.response?.data?.debug?.validation_error || error.message));
        }
    };

    if (loading && !hotel) return <div>Loading...</div>;
    if (!hotel) return <div>Hotel not found</div>;

    return (
        <div className="hotel-page">
            <div className="hotel-header">
                <h1 className="hotel-title">{hotel.name}</h1>
                <p className="hotel-address">
                    <span style={{fontSize: '1.25rem'}}>📍</span>
                    {hotel.address}
                </p>
            </div>

            <section className="rates-section">
                <div className="section-header">
                    <h2 className="section-title">Available Rates</h2>
                    <span className="rates-count">{rates.length} rates found</span>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p className="loading-text">Loading rates...</p>
                    </div>
                ) : (
                    <div className="rates-grid">
                        {rates.map((rate, index) => (
                            <div key={index} className="rate-card glass-card">
                                <div className="room-name">{rate.room_name}</div>
                                <div className="rate-details">
                                    <div className="detail-row">
                                        <span className="detail-icon">🍽️</span>
                                        <span className="meal-badge">{rate.meal}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-icon">💳</span>
                                        <span>{rate.payment_options.payment_types[0].show_amount} {rate.payment_options.payment_types[0].show_currency_code}</span>
                                    </div>
                                </div>
                                <div className="price-section">
                                    <div className="price-label">Price</div>
                                    <div className="price-amount">
                                        <span className="currency">{rate.payment_options.payment_types[0].show_currency_code}</span>
                                        <span>{rate.payment_options.payment_types[0].show_amount}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleBook(rate)}
                                    className="btn-book"
                                >
                                    Book Now
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default HotelPage;
