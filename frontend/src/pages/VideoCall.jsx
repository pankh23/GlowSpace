import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { JitsiMeeting } from '@jitsi/react-sdk';

const VideoCall = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointment, setAppointment] = useState(null);

  useEffect(() => {
    const validateRoom = async () => {
      try {
        const response = await axios.get(`/api/video/validate/${roomId}`);
        if (response.data.success) {
          setIsValid(true);
          setAppointment(response.data.appointment);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error validating room');
      } finally {
        setLoading(false);
      }
    };

    validateRoom();
  }, [roomId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating room access...</p>
        </div>
      </div>
    );
  }

  if (error || !isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error || 'Invalid room or access time'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Video Consultation - {appointment.name}
            </h2>
            <p className="text-gray-600">
              Scheduled for {new Date(appointment.preferredDate).toLocaleString()}
            </p>
          </div>
          
          <div className="h-[600px]">
            <JitsiMeeting
              roomName={roomId}
              configOverwrite={{
                startWithAudioMuted: false,
                startWithVideoMuted: false,
                enableClosePage: true,
                disableDeepLinking: true,
                prejoinPageEnabled: false,
              }}
              interfaceConfigOverwrite={{
                DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                SHOW_CHROME_EXTENSION_BANNER: false,
                TOOLBAR_BUTTONS: [
                  'microphone',
                  'camera',
                  'closedcaptions',
                  'desktop',
                  'fullscreen',
                  'fodeviceselection',
                  'hangup',
                  'profile',
                  'chat',
                  'recording',
                  'livestreaming',
                  'etherpad',
                  'sharedvideo',
                  'settings',
                  'raisehand',
                  'videoquality',
                  'filmstrip',
                  'invite',
                  'feedback',
                  'stats',
                  'shortcuts',
                  'tileview',
                  'select-background',
                  'download',
                  'help',
                  'mute-everyone',
                ],
              }}
              getIFrameRef={(iframeRef) => {
                iframeRef.style.height = '100%';
                iframeRef.style.width = '100%';
              }}
              onApiReady={(externalApi) => {
                // Handle Jitsi API ready
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCall; 