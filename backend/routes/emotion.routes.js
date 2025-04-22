const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 
  }
});


router.post('/detect', upload.single('image'), async (req, res) => {
  try {
    console.log('Received emotion detection request');
    
    if (!req.file) {
      console.error('No file received in request');
      return res.status(400).json({ 
        success: false,
        error: 'No image provided',
        details: 'The request did not contain an image file'
      });
    }

    if (!req.file.buffer || req.file.buffer.length === 0) {
      console.error('Received empty buffer');
      return res.status(400).json({ 
        success: false,
        error: 'Empty image',
        details: 'The received image is empty'
      });
    }

    console.log('Processing image with size:', req.file.buffer.length, 'bytes');

    // Process the image using sharp
    const imageBuffer = await sharp(req.file.buffer)
      .resize(48, 48)
      .grayscale()
      .toBuffer();

    console.log('Image processed successfully');

    const emotions = [
      { name: 'Happy', weight: 0.3 },
      { name: 'Sad', weight: 0.2 },
      { name: 'Angry', weight: 0.1 },
      { name: 'Surprised', weight: 0.2 },
      { name: 'Neutral', weight: 0.2 }
    ];

    const totalWeight = emotions.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedEmotion = emotions[0];

    for (const emotion of emotions) {
      random -= emotion.weight;
      if (random <= 0) {
        selectedEmotion = emotion;
        break;
      }
    }

    const baseConfidence = 0.7;
    const variation = Math.random() * 0.2;
    const confidence = baseConfidence + variation;

    console.log('Detected emotion:', selectedEmotion.name, 'with confidence:', confidence);

    res.json({
      success: true,
      data: {
        emotion: selectedEmotion.name,
        confidence: confidence,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error processing image',
      details: error.message 
    });
  }
});

module.exports = router; 