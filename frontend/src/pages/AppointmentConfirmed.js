import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AppointmentConfirmed = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { appointment } = location.state || {};
  const [videoRoom, setVideoRoom] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (appointment?.status === 'confirmed' && !appointment.roomId) {
      generateVideoRoom();
    } else if (appointment?.roomId) {
      setVideoRoom({
        roomId: appointment.roomId,
        passcode: appointment.passcode
      });
    }
  }, [appointment]);

  const generateVideoRoom = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`/api/video/generate/${appointment._id}`);
      if (response.data.success) {
        setVideoRoom({
          roomId: response.data.roomId,
          passcode: response.data.passcode
        });
      }
    } catch (error) {
      console.error('Error generating video room:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">No Appointment Found</h1>
          <p className="text-gray-600 mb-6">Please book an appointment first.</p>
          <button
            onClick={() => navigate('/book-appointment')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg"
          >
            Book Appointment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {appointment.status === 'confirmed' ? 'Appointment Confirmed!' : 'Appointment Booked Successfully!'}
          </h1>

          <div className="bg-blue-50 p-6 rounded-lg mb-8 text-left">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Appointment Details</h2>
            <div className="space-y-3">
              <p>
                <span className="font-medium">Name:</span> {appointment.name}
              </p>
              <p>
                <span className="font-medium">Date & Time:</span>{' '}
                {new Date(appointment.preferredDate).toLocaleString()}
              </p>
              <p>
                <span className="font-medium">Reason:</span> {appointment.reason}
              </p>
              {appointment.status === 'confirmed' && videoRoom && (
                <>
                  <p>
                    <span className="font-medium">Video Call Room:</span>{' '}
                    <a
                      href={`/video-call/${videoRoom.roomId}`}
                      className="text-blue-600 hover:text-blue-800 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Join Video Call
                    </a>
                  </p>
                  {videoRoom.passcode && (
                    <p>
                      <span className="font-medium">Passcode:</span> {videoRoom.passcode}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <p className="text-gray-600 mb-8">
            {appointment.status === 'confirmed'
              ? 'Your appointment has been confirmed. You can join the video call by clicking the link below when it\'s time for your appointment (within 10 minutes of the scheduled time).'
              : 'We\'ve sent a confirmation email to ' + appointment.email + ' with all the details. Our team will review your request and confirm the appointment shortly. Once confirmed, you\'ll receive a video call link that you can use to join your session at the scheduled time.'}
          </p>

          {appointment.status === 'confirmed' && videoRoom && (
            <div className="bg-green-50 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Video Call Information</h2>
              <div className="space-y-3">
                <p>
                  <span className="font-medium">Join Link:</span>{' '}
                  <a
                    href={`/video-call/${videoRoom.roomId}`}
                    className="text-blue-600 hover:text-blue-800 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join Video Call
                  </a>
                </p>
                {videoRoom.passcode && (
                  <p>
                    <span className="font-medium">Passcode:</span> {videoRoom.passcode}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  Note: The video call link will only work within 10 minutes of your scheduled appointment time.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg"
            >
              Return to Home
            </button>
            <button
              onClick={() => navigate('/consultation')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg"
            >
              Explore More Services
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentConfirmed; 