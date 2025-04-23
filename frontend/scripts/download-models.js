const fs = require('fs');
const path = require('path');
const https = require('https');

const models = [
  {
    name: 'tiny_face_detector_model-weights_manifest.json',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json'
  },
  {
    name: 'tiny_face_detector_model-shard1',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1'
  },
  {
    name: 'face_expression_model-weights_manifest.json',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-weights_manifest.json'
  },
  {
    name: 'face_expression_model-shard1',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard1'
  },
  {
    name: 'face_landmark_68_model-weights_manifest.json',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json'
  },
  {
    name: 'face_landmark_68_model-shard1',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1'
  }
];

const modelsDir = path.join(__dirname, '../public/models');

if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(modelsDir, filename);
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${filename}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function downloadModels() {
  console.log('Downloading face-api.js models...');
  
  for (const model of models) {
    try {
      console.log(`Downloading ${model.name}...`);
      await downloadFile(model.url, model.name);
    } catch (err) {
      console.error(`Error downloading ${model.name}:`, err);
    }
  }
  
  console.log('All models downloaded successfully!');
}

const MODEL_URL = 'https://storage.googleapis.com/tfjs-models/tfjs/emotion_recognition/model.json';
const MODEL_DIR = path.join(process.cwd(), 'public', 'models', 'emotion_model');

// Create directory if it doesn't exist
if (!fs.existsSync(MODEL_DIR)) {
  fs.mkdirSync(MODEL_DIR, { recursive: true });
}

// Download model files
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
}

async function downloadModel() {
  try {
    console.log('Downloading emotion recognition model...');
    
    // Download model.json
    await downloadFile(
      MODEL_URL,
      path.join(MODEL_DIR, 'model.json')
    );

    // Download weights
    const modelJson = JSON.parse(fs.readFileSync(path.join(MODEL_DIR, 'model.json')));
    const weightsManifest = modelJson.weightsManifest;
    
    for (const manifest of weightsManifest) {
      for (const path of manifest.paths) {
        const weightUrl = new URL(path, MODEL_URL).toString();
        await downloadFile(
          weightUrl,
          path.join(MODEL_DIR, path)
        );
      }
    }

    console.log('Model downloaded successfully!');
  } catch (error) {
    console.error('Error downloading model:', error);
    process.exit(1);
  }
}

downloadModels().catch(console.error);
downloadModel(); 