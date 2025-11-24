import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchHotels, seedTestHotel } from '../api';

const SearchPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [checkin, setCheckin] = useState('2025-12-01');
    const [checkout, setCheckout] = useState('2025-12-05');

    // Default to 1 room with 2 adults
    const [guests, setGuests] = useState([{ adults: 2, children: [] }]);
    const [residency, setResidency] = useState('us');

    const [searchType, setSearchType] = useState('test'); // 'test' or 'region'
    const [regionId, setRegionId] = useState('');

    const addRoom = () => {
        setGuests([...guests, { adults: 2, children: [] }]);
    };

    const removeRoom = (index) => {
        const newGuests = guests.filter((_, i) => i !== index);
        setGuests(newGuests);
    };

    const updateAdults = (index, value) => {
        const newGuests = [...guests];
        newGuests[index].adults = parseInt(value);
        setGuests(newGuests);
    };

    const addChild = (index) => {
        const newGuests = [...guests];
        newGuests[index].children.push(10); // Default age 10
        setGuests(newGuests);
    };

    const removeChild = (roomIndex, childIndex) => {
        const newGuests = [...guests];
        newGuests[roomIndex].children = newGuests[roomIndex].children.filter((_, i) => i !== childIndex);
        setGuests(newGuests);
    };

    const updateChildAge = (roomIndex, childIndex, value) => {
        const newGuests = [...guests];
        newGuests[roomIndex].children[childIndex] = parseInt(value);
        setGuests(newGuests);
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            let params = {
                checkin,
                checkout,
                guests,
                residency
            };

            if (searchType === 'test') {
                await seedTestHotel();
                params.ids = ['test_hotel_do_not_book'];
            } else {
                if (!regionId) {
                    alert('Please enter a Region ID');
                    setLoading(false);
                    return;
                }
                params.regionId = parseInt(regionId);
            }

            const response = await searchHotels(params);

            if (response.data && response.data.hotels && response.data.hotels.length > 0) {
                const hotel = response.data.hotels[0];
                navigate(`/hotel/${hotel.id}`, { state: { searchParams: params, hotelData: hotel } });
            } else {
                alert('No hotels found');
            }
        } catch (error) {
            console.error(error);
            alert('Error searching hotels: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Hotel Search</h1>

            <div className="mb-4 flex gap-4">
                <button
                    className={`px-4 py-2 rounded ${searchType === 'test' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    onClick={() => setSearchType('test')}
                >
                    Test Hotel
                </button>
                <button
                    className={`px-4 py-2 rounded ${searchType === 'region' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    onClick={() => setSearchType('region')}
                >
                    Region Search
                </button>
            </div>

            <div className="space-y-4 bg-white p-6 rounded shadow">
                {searchType === 'region' && (
                    <div>
                        <label className="block font-semibold mb-1">Region ID:</label>
                        <input
                            type="number"
                            value={regionId}
                            onChange={e => setRegionId(e.target.value)}
                            className="border p-2 w-full rounded"
                            placeholder="e.g. 965849721"
                        />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block font-semibold mb-1">Check-in:</label>
                        <input type="date" value={checkin} onChange={e => setCheckin(e.target.value)} className="border p-2 w-full rounded" />
                    </div>
                    <div>
                        <label className="block font-semibold mb-1">Check-out:</label>
                        <input type="date" value={checkout} onChange={e => setCheckout(e.target.value)} className="border p-2 w-full rounded" />
                    </div>
                </div>

                <div>
                    <label className="block font-semibold mb-1">Residency (Country Code):</label>
                    <input type="text" value={residency} onChange={e => setResidency(e.target.value)} className="border p-2 w-full rounded" placeholder="e.g. us, gb, de" />
                </div>

                <div className="border-t pt-4">
                    <h3 className="font-bold mb-2">Rooms & Guests</h3>
                    {guests.map((room, index) => (
                        <div key={index} className="mb-4 p-4 border rounded bg-gray-50 relative">
                            <h4 className="font-semibold mb-2">Room {index + 1}</h4>
                            {guests.length > 1 && (
                                <button onClick={() => removeRoom(index)} className="absolute top-2 right-2 text-red-500 text-sm">Remove Room</button>
                            )}
                            <div className="flex gap-4 items-center mb-2">
                                <div>
                                    <label className="block text-sm">Adults</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="6"
                                        value={room.adults}
                                        onChange={e => updateAdults(index, e.target.value)}
                                        className="border p-1 w-16 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm">Children</label>
                                    <button onClick={() => addChild(index)} className="text-blue-600 text-sm">+ Add Child</button>
                                </div>
                            </div>
                            {room.children.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {room.children.map((age, childIndex) => (
                                        <div key={childIndex} className="flex items-center gap-1 bg-white border p-1 rounded">
                                            <span className="text-xs">Age:</span>
                                            <input
                                                type="number"
                                                min="0"
                                                max="17"
                                                value={age}
                                                onChange={e => updateChildAge(index, childIndex, e.target.value)}
                                                className="border p-1 w-12 text-sm rounded"
                                            />
                                            <button onClick={() => removeChild(index, childIndex)} className="text-red-500 ml-1">×</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    <button onClick={addRoom} className="text-blue-600 font-semibold">+ Add Another Room</button>
                </div>

                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded font-bold hover:bg-green-700 transition"
                >
                    {loading ? 'Searching...' : 'Search Hotels'}
                </button>
            </div>
        </div>
    );
};

export default SearchPage;
