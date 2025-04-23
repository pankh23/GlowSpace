import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import EmotionDetectionPage from './pages/EmotionDetectionPage';
import ChatRoom from './pages/ChatRoom';
import Consultation from './pages/Consultation';
import BookAppointment from './pages/BookAppointment';
import AppointmentConfirmed from './pages/AppointmentConfirmed';
import VideoCall from './pages/VideoCall';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        {/* Navigation */}
        <nav className="bg-gray-800 p-4 mb-8">
          <div className="container mx-auto flex gap-4">
            <Link to="/" className="text-white hover:text-gray-300">
              Home
            </Link>
            <Link to="/emotion-detection" className="text-white hover:text-gray-300">
              Emotion Detection
            </Link>
            <Link to="/chat/global" className="text-white hover:text-gray-300">
              Chat Room
            </Link>
            <Link to="/consultation" className="text-white hover:text-gray-300">
              Consultation
            </Link>
          </div>
        </nav>

        <div className="container mx-auto px-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/emotion-detection" element={<EmotionDetectionPage />} />
            <Route path="/chat/:roomId" element={<ChatRoom />} />
            <Route path="/consultation" element={<Consultation />} />
            <Route path="/book-appointment" element={<BookAppointment />} />
            <Route path="/appointment-confirmed" element={<AppointmentConfirmed />} />
            <Route path="/video-call/:roomId" element={<VideoCall />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;


