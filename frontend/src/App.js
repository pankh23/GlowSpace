import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Consultation from './pages/Consultation';
import BookAppointment from './pages/BookAppointment';
import AppointmentConfirmed from './pages/AppointmentConfirmed';
import VideoCall from './pages/VideoCall';
import ChatRoom from './pages/ChatRoom';
import EmotionDetector from './components/EmotionDetector';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/consultation" element={<Consultation />} />
          <Route path="/book-appointment" element={<BookAppointment />} />
          <Route path="/appointment-confirmed" element={<AppointmentConfirmed />} />
          <Route path="/video-call/:roomId" element={<VideoCall />} />
          <Route path="/chat/:roomId" element={<ChatRoom />} />
          <Route path="/emotion-detection" element={<EmotionDetector />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 