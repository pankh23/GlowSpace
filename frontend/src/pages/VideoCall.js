import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import io from 'socket.io-client';
import './VideoCall.css';

const VideoCall = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isDoctor, setIsDoctor] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const [emotion, setEmotion] = useState('');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState('Loading models...');

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    validateRoom();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setDetectionStatus('Loading face detection models...');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models')
        ]);
        console.log('Face detection models loaded successfully');
        setIsModelLoaded(true);
        setDetectionStatus('Models loaded successfully');
      } catch (error) {
        console.error('Error loading models:', error);
        setDetectionStatus('Error loading models');
      }
    };

    loadModels();
  }, []);

  const validateRoom = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/appointments/validate/${roomId}`);
      if (response.data.success) {
        setAppointment(response.data.appointment);
        setLoading(false);
        const userEmail = localStorage.getItem('userEmail');
        setIsDoctor(userEmail === response.data.appointment.counselor.email);
      } else {
        setError(response.data.message || 'Invalid room ID');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error validating room:', error);
      setError(error.response?.data?.message || 'Error validating room. Please try again later.');
      setLoading(false);
    }
  };

  const initializeSocket = () => {
    socketRef.current = io('http://localhost:5001', {
      path: '/socket.io',
      query: {
        roomId,
        isDoctor
      }
    });
    
    socketRef.current.on('connect', () => {
      console.log('Socket.IO connection established');
      socketRef.current.emit('joinVideoRoom', { roomId, isDoctor });
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket.IO connection closed');
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket.IO error:', error);
    });

    socketRef.current.on('offer', async (offer) => {
      await handleOffer(offer);
    });

    socketRef.current.on('answer', async (answer) => {
      await handleAnswer(answer);
    });

    socketRef.current.on('candidate', async (candidate) => {
      await handleCandidate(candidate);
    });

    socketRef.current.on('user-joined', (data) => {
      addNotification(`${data.isDoctor ? 'Doctor' : 'Patient'} has joined the call`);
    });
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      initializeSocket();
      initializeWebRTC(stream);
      createAndSendOffer();

      const video = localVideoRef.current;
      const canvas = canvasRef.current;
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      setInterval(async () => {
        try {
          const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();
          
          if (detections.length > 0) {
            const expressions = detections[0].expressions;
            const maxEmotion = Object.entries(expressions).reduce((a, b) => a[1] > b[1] ? a : b);
            setEmotion(maxEmotion[0]);
            
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
          }
        } catch (error) {
          console.error('Error in emotion detection:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setError('Error accessing camera. Please ensure camera permissions are granted.');
    }
  };

  const initializeWebRTC = (stream) => {
    try {
      console.log('Initializing WebRTC connection');
      peerConnectionRef.current = new RTCPeerConnection(configuration);

      stream.getTracks().forEach(track => {
        console.log('Adding local track:', track.kind);
        peerConnectionRef.current.addTrack(track, stream);
      });

      peerConnectionRef.current.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        if (remoteVideoRef.current) {
          console.log('Setting remote video source');
          remoteVideoRef.current.srcObject = event.streams[0];
          setIsConnected(true);
          addNotification('Remote stream connected');
        }
      };

      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('New ICE candidate:', event.candidate);
          socketRef.current.emit('candidate', {
            candidate: event.candidate,
            isDoctor: isDoctor
          });
        }
      };

      peerConnectionRef.current.onconnectionstatechange = () => {
        console.log('Connection state changed:', peerConnectionRef.current.connectionState);
        if (peerConnectionRef.current.connectionState === 'connected') {
          setIsConnected(true);
          addNotification('WebRTC connection established');
        } else if (peerConnectionRef.current.connectionState === 'failed') {
          console.error('WebRTC connection failed');
          addNotification('Connection failed. Please try again.');
        }
      };

      peerConnectionRef.current.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnectionRef.current.iceConnectionState);
      };

      peerConnectionRef.current.onnegotiationneeded = async () => {
        console.log('Negotiation needed');
        try {
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          socketRef.current.emit('offer', {
            offer: offer,
            isDoctor: isDoctor
          });
        } catch (error) {
          console.error('Error during negotiation:', error);
        }
      };
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      addNotification('Error setting up video call');
    }
  };

  const createAndSendOffer = async () => {
    try {
      console.log('Creating and sending offer');
      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await peerConnectionRef.current.setLocalDescription(offer);
      
      socketRef.current.emit('offer', {
        offer: offer,
        isDoctor: isDoctor
      });
    } catch (error) {
      console.error('Error creating offer:', error);
      addNotification('Error creating video call offer');
    }
  };

  const handleOffer = async (offer) => {
    try {
      console.log('Handling offer');
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await peerConnectionRef.current.setLocalDescription(answer);
      
      socketRef.current.emit('answer', {
        answer: answer,
        isDoctor: isDoctor
      });
    } catch (error) {
      console.error('Error handling offer:', error);
      addNotification('Error handling video call offer');
    }
  };

  const handleAnswer = async (answer) => {
    try {
      console.log('Handling answer');
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
      addNotification('Error handling video call answer');
    }
  };

  const handleCandidate = async (candidate) => {
    try {
      console.log('Handling ICE candidate');
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const addNotification = (message) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(msg => msg !== message));
    }, 5000);
  };

  const handlePasscodeSubmit = (e) => {
    e.preventDefault();
    if (passcode === appointment.passcode) {
      setIsAuthenticated(true);
      setError('');
      startVideo();
    } else {
      setError('Invalid passcode. Please try again.');
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    navigate('/');
  };

  if (loading) {
    return (
      <div className="video-call-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading video call...</p>
        </div>
      </div>
    );
  }

  if (error && !isAuthenticated) {
    return (
      <div className="video-call-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="return-button">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="video-call-container">
        <div className="passcode-form">
          <h2>Enter Passcode</h2>
          <form onSubmit={handlePasscodeSubmit}>
            <input
              type="text"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter your passcode"
              required
            />
            <button type="submit">Join Call</button>
          </form>
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="video-call-container">
      <div className="video-grid">
        <div className="video-wrapper">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            className="video-element"
          />
          <canvas
            ref={canvasRef}
            className="overlay"
          />
        </div>
        <video
          ref={remoteVideoRef}
          autoPlay
          className="video-element"
        />
      </div>
      
      <div className="emotion-display">
        {detectionStatus && <p>Status: {detectionStatus}</p>}
        {emotion && <p>Current Emotion: {emotion}</p>}
      </div>

      <div className="controls">
        <button 
          onClick={toggleMute} 
          className={`control-button ${isMuted ? 'muted' : ''}`}
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
        <button 
          onClick={toggleVideo} 
          className={`control-button ${isVideoOff ? 'video-off' : ''}`}
        >
          {isVideoOff ? 'Turn On Video' : 'Turn Off Video'}
        </button>
        <button onClick={endCall} className="end-call-button">
          End Call
        </button>
      </div>

      <div className="notifications">
        {notifications.map((notification, index) => (
          <div key={index} className="notification">
            {notification}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoCall; 