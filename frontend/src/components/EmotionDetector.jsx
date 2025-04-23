import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import './EmotionDetector.css';

const EmotionDetector = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [emotion, setEmotion] = useState('');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState('Loading models...');
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [confidence, setConfidence] = useState(0);

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

  useEffect(() => {
    if (!isModelLoaded) return;

    const detectFace = async () => {
      if (
        webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.readyState === 4
      ) {
        const video = webcamRef.current.video;
        const canvas = canvasRef.current;
        const displaySize = { width: video.videoWidth, height: video.videoHeight };

        faceapi.matchDimensions(canvas, displaySize);

        try {
          const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();
          
          if (detections.length > 0) {
            const expressions = detections[0].expressions;
            const maxEmotion = Object.entries(expressions).reduce((a, b) => a[1] > b[1] ? a : b);
            setEmotion(maxEmotion[0]);
            setConfidence(maxEmotion[1]);
            setIsAnalyzing(false);
            
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
          } else {
            setIsAnalyzing(true);
          }
        } catch (error) {
          console.error('Error in emotion detection:', error);
        }
      }
    };

    const interval = setInterval(detectFace, 1000);
    return () => clearInterval(interval);
  }, [isModelLoaded]);

  return (
    <div className="emotion-detector">
      <div className="camera-container">
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="webcam"
          videoConstraints={{ 
            facingMode: "user",
            width: 640,
            height: 480
          }}
        />
        <canvas
          ref={canvasRef}
          className="overlay"
        />
      </div>

      <div className="result-box">
        <h2>Emotion Analysis</h2>
        <div className={`emotion-result ${isAnalyzing ? 'analyzing' : ''}`}>
          {isAnalyzing ? (
            <>
              <div className="analyzing-spinner"></div>
              <span>Analyzing expression...</span>
            </>
          ) : (
            <div className="emotion-details">
              <span className={`emotion-text ${emotion?.toLowerCase()}`}>
                {emotion || 'Neutral'}
              </span>
              <div className="confidence">
                {(confidence * 100).toFixed(1)}% confident
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="status">
        <p>{detectionStatus}</p>
      </div>

      {!isAnalyzing && (
        <div className="emotion-display">
          <p>Confidence: {(confidence * 100).toFixed(1)}%</p>
          <div className="emotion-visualization">
            <div 
              className="emotion-bar" 
              style={{ 
                width: `${confidence * 100}%`,
                backgroundColor: getEmotionColor(emotion)
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

const getEmotionColor = (emotion) => {
  const colors = {
    'happy': '#4CAF50',
    'sad': '#2196F3',
    'angry': '#F44336',
    'neutral': '#9E9E9E',
    'surprised': '#FFC107',
    'disgusted': '#795548',
    'fearful': '#9C27B0'
  };
  return colors[emotion?.toLowerCase()] || '#9E9E9E';
};

export default EmotionDetector; 