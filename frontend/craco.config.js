module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          "path": require.resolve("path-browserify"),
          "fs": false,
          "crypto": false
        }
      },
      ignoreWarnings: [
        {
          module: /node_modules\/face-api\.js/,
          message: /Failed to parse source map/
        }
      ]
    }
  }
}; 