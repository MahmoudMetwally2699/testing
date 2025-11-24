import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchHotels } from '../api';
import './SearchPage.css';

const SearchPage = () => {
    const navigate = useNavigate();
    const [searchType, setSearchType] = useState('test');
    const [regionId, setRegionId] = useState('');
    const [checkin, setCheckin] = useState('');
    const [checkout, setCheckout] = useState('');
    const [residency, setResidency] = useState('us');
    const [rooms, setRooms] = useState([{ adults: 2, children: [] }]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const guests = rooms.map(room => ({
                adults: room.adults,
                children: room.children
            }));

            let searchParams;
            if (searchType === 'test') {
                searchParams = {
                    ids: ['test_hotel_do_not_book'],
                    checkin,
                    checkout,
                    guests,
                    residency
                };
            } else {
                searchParams = {
                    regionId: parseInt(regionId),
                    checkin,
                    checkout,
                    guests,
                    residency
                };
            }

            const response = await searchHotels(searchParams);

            if (response.data && response.data.hotels && response.data.hotels.length > 0) {
                const hotel = response.data.hotels[0];
                navigate(`/hotel/${hotel.id}`, {
                    state: {
                        searchParams,
                        hotelData: hotel
                    }
                });
            } else {
                alert('No hotels found');
            }
        } catch (error) {
            console.error(error);
            alert('Error searching hotels');
        } finally {
            setLoading(false);
        }
    };

    const addRoom = () => {
        setRooms([...rooms, { adults: 2, children: [] }]);
    };

    const removeRoom = (index) => {
        if (rooms.length > 1) {
            setRooms(rooms.filter((_, i) => i !== index));
        }
    };

    const updateRoom = (index, field, value) => {
        const newRooms = [...rooms];
        newRooms[index][field] = parseInt(value);
        setRooms(newRooms);
    };

    return (
        <div className="search-page">
            <div className="search-hero">
                <div className="hero-content fade-in">
                    <h1 className="hero-title">
                        <span className="gradient-text">Discover</span> Your Perfect Stay
                    </h1>
                    <p className="hero-subtitle">
                        Book luxury hotels worldwide with our ETG API v3 integration
                    </p>
                </div>
            </div>

            <div className="container">
                <div className="search-card glass-card">
                    <div className="search-tabs">
                        <button
                            className={`tab-btn ${searchType === 'test' ? 'active' : ''}`}
                            onClick={() => setSearchType('test')}
                        >
                            <span className="tab-icon">🏨</span>
                            Test Hotel
                        </button>
                        <button
                            className={`tab-btn ${searchType === 'region' ? 'active' : ''}`}
                            onClick={() => setSearchType('region')}
                        >
                            <span className="tab-icon">🌍</span>
                            Region Search
                        </button>
                    </div>

                    <form onSubmit={handleSearch} className="search-form">
                        {searchType === 'region' && (
                            <div className="input-group slide-in">
                                <label className="input-label">Region ID</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={regionId}
                                    onChange={(e) => setRegionId(e.target.value)}
                                    placeholder="Enter region ID (e.g., 6176)"
                                    required
                                />
                            </div>
                        )}

                        <div className="form-row">
                            <div className="input-group">
                                <label className="input-label">Check-in</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={checkin}
                                    onChange={(e) => setCheckin(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Check-out</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={checkout}
                                    onChange={(e) => setCheckout(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Residency</label>
                                <select
                                    className="input-field"
                                    value={residency}
                                    onChange={(e) => setResidency(e.target.value)}
                                >
                                    <option value="us">United States</option>
                                    <option value="gb">United Kingdom</option>
                                    <option value="de">Germany</option>
                                    <option value="fr">France</option>
                                    <option value="cz">Czech Republic</option>
                                </select>
                            </div>
                        </div>

                        <div className="rooms-section">
                            <div className="rooms-header">
                                <h3 className="section-title">Rooms & Guests</h3>
                                <button
                                    type="button"
                                    className="btn-add-room"
                                    onClick={addRoom}
                                >
                                    <span>+</span> Add Room
                                </button>
                            </div>

                            <div className="rooms-grid">
                                {rooms.map((room, index) => (
                                    <div key={index} className="room-card glass-card">
                                        <div className="room-header">
                                            <span className="room-number">Room {index + 1}</span>
                                            {rooms.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="btn-remove"
                                                    onClick={() => removeRoom(index)}
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                        <div className="room-inputs">
                                            <div className="input-group">
                                                <label className="input-label">Adults</label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    min="1"
                                                    max="10"
                                                    value={room.adults}
                                                    onChange={(e) => updateRoom(index, 'adults', e.target.value)}
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">Children</label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    min="0"
                                                    max="10"
                                                    value={room.children.length}
                                                    onChange={(e) => updateRoom(index, 'children', Array(parseInt(e.target.value)).fill(10))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-search"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-small"></span>
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <span className="search-icon">🔍</span>
                                    Search Hotels
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SearchPage;
