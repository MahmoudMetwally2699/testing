import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import HotelPage from './pages/HotelPage';
import BookingPage from './pages/BookingPage';

function App() {
  return (
    <div className="container mx-auto min-h-screen bg-gray-50">
      <nav className="bg-blue-600 p-4 text-white mb-4">
        <h1 className="text-xl font-bold">Gaithtours</h1>
      </nav>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/hotel/:id" element={<HotelPage />} />
        <Route path="/booking" element={<BookingPage />} />
      </Routes>
    </div>
  );
}

export default App;
