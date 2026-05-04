const appConfig = require('./app.json');

const plugins = appConfig.expo.plugins.filter((plugin) => plugin !== 'expo-notifications');

module.exports = () => ({
  ...appConfig.expo,
  plugins,
  extra: {
    ...appConfig.expo.extra,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://192.168.2.54:8000/api/v1',
  },
});
