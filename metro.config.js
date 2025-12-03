// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure Metro bundler can be accessed from network devices
config.server = {
  ...config.server,
  // Allow connections from any IP address
  enhanceMiddleware: (middleware) => {
    return middleware;
  },
};

// Enable network access
config.watchFolders = [__dirname];

module.exports = config;

