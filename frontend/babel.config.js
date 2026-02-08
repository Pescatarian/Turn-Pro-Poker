module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Note: Decorator and class property plugins removed.
    // Models now use manual getters instead of decorators,
    // so these plugins are no longer needed and were causing
    // conflicts with Hermes/react-native-gesture-handler.
  };
};
