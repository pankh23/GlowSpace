#!/bin/bash

# Create models directory if it doesn't exist
mkdir -p public/models

# Download tiny face detector model
echo "Downloading tiny face detector model..."
curl -o public/models/tiny_face_detector_model-weights_manifest.json https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
curl -o public/models/tiny_face_detector_model-shard1 https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1

# Download face expression model
echo "Downloading face expression model..."
curl -o public/models/face_expression_model-weights_manifest.json https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-weights_manifest.json
curl -o public/models/face_expression_model-shard1 https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard1
curl -o public/models/face_expression_model-shard2 https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard2

echo "Models downloaded successfully!" 