const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // ETG Hotel ID
    name: { type: String, required: true },
    region_id: { type: Number },
    address: { type: String },
    star_rating: { type: Number },
    images: [String],
    description: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    amenities: [String],
    // Add other fields as necessary from the dump
    last_updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Hotel', HotelSchema);
