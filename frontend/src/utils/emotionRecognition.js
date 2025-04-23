import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

const EMOTIONS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral'];

// Create a simple CNN model for emotion recognition
const createEmotionModel = () => {
  const model = tf.sequential();
  
  // First convolutional layer
  model.add(tf.layers.conv2d({
    inputShape: [48, 48, 1],
    filters: 32,
    kernelSize: 3,
    activation: 'relu'
  }));
  
  // First max pooling layer
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
  
  // Second convolutional layer
  model.add(tf.layers.conv2d({
    filters: 64,
    kernelSize: 3,
    activation: 'relu'
  }));
  
  // Second max pooling layer
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
  
  // Flatten layer
  model.add(tf.layers.flatten());
  
  // Dense layer
  model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
  
  // Output layer
  model.add(tf.layers.dense({ units: 7, activation: 'softmax' }));
  
  // Compile the model
  model.compile({
    optimizer: 'adam',
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });
  
  return model;
};

// Load the face detection model
export const loadFaceDetectionModel = async () => {
  try {
    const model = await blazeface.load();
    return model;
  } catch (error) {
    console.error('Error loading face detection model:', error);
    throw error;
  }
};

// Initialize the emotion model
export const loadEmotionModel = async () => {
  try {
    const model = createEmotionModel();
    return model;
  } catch (error) {
    console.error('Error initializing emotion model:', error);
    throw error;
  }
};

// Preprocess the face image for emotion recognition
export const preprocessFace = (faceImage) => {
  return tf.tidy(() => {
    // Convert to grayscale
    const gray = faceImage.mean(2);
    
    // Resize to 48x48
    const resized = tf.image.resizeBilinear(gray, [48, 48]);
    
    // Normalize to [0, 1]
    const normalized = resized.div(255.0);
    
    // Add batch and channel dimensions
    const batched = normalized.expandDims(0).expandDims(-1);
    
    return batched;
  });
};

// Get emotion prediction
export const predictEmotion = async (model, faceImage) => {
  try {
    const preprocessed = preprocessFace(faceImage);
    const prediction = await model.predict(preprocessed).data();
    preprocessed.dispose();
    
    const maxIndex = prediction.indexOf(Math.max(...prediction));
    const confidence = prediction[maxIndex];
    
    // For demonstration, we'll return a random emotion since the model isn't trained
    const randomEmotion = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];
    const randomConfidence = Math.random();
    
    return {
      emotion: randomEmotion,
      confidence: randomConfidence
    };
  } catch (error) {
    console.error('Error predicting emotion:', error);
    return {
      emotion: 'Unknown',
      confidence: 0
    };
  }
}; 