import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BookAppointment = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    reason: '',
    preferredDate: '',
    counselorId: ''
  });
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCounselors = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/counselors');
        if (response.data.success) {
          setCounselors(response.data.counselors);
        }
      } catch (err) {
        console.error('Error fetching counselors:', err);
        setError('Failed to load available counselors. Please try again later.');
      }
    };

    fetchCounselors();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5001/api/appointments/book', formData);
      if (response.data.success) {
        navigate('/appointment-confirmed', { state: { appointment: response.data.appointment } });
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError(
        err.response?.data?.message || 
        'Error booking appointment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Book Your Consultation</h1>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="counselorId" className="block text-sm font-medium text-gray-700 mb-1">
                Select Counselor
              </label>
              <select
                id="counselorId"
                name="counselorId"
                value={formData.counselorId}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a counselor</option>
                {counselors.map(counselor => (
                  <option key={counselor._id} value={counselor._id}>
                    {counselor.name} - {counselor.specialization}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Consultation
              </label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Please describe your reason for seeking consultation..."
              />
            </div>

            <div>
              <label htmlFor="preferredDate" className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Date and Time
              </label>
              <input
                type="datetime-local"
                id="preferredDate"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="consent"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="consent" className="ml-2 block text-sm text-gray-700">
                I understand that this is a professional consultation service and agree to the terms of service.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg text-white font-semibold ${
                loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } transition duration-300`}
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment; 