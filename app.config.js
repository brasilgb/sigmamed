const appConfig = require('./app.json');

module.exports = () => ({
  ...appConfig.expo,
  extra: {
    ...appConfig.expo.extra,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://192.168.2.54:8000/api/v1',
  },
});
