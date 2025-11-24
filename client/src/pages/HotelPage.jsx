import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getHotelPage, prebook } from '../api';

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
        <div className="p-4">
            <h1 className="text-2xl font-bold">{hotel.name}</h1>
            <p>{hotel.address}</p>
            <div className="my-4">
                <h2 className="text-xl font-semibold">Available Rates</h2>
                {loading ? <p>Loading rates...</p> : (
                    <div className="grid gap-4">
                        {rates.map((rate, index) => (
                            <div key={index} className="border p-4 rounded shadow">
                                <p className="font-bold">{rate.room_name}</p>
                                <p>Meal: {rate.meal}</p>
                                <p className="text-lg text-green-600">
                                    {rate.payment_options.payment_types[0].show_amount} {rate.payment_options.payment_types[0].show_currency_code}
                                </p>
                                <button
                                    onClick={() => handleBook(rate)}
                                    className="bg-green-500 text-white px-4 py-2 rounded mt-2"
                                >
                                    Book Now
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HotelPage;
