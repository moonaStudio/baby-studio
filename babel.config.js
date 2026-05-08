module.exports = function babelConfig(api) {
  api.cache(true);
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          // Hermes web transforms can leave `import.meta` behind unless this is enabled.
          unstable_transformImportMeta: true,
          web: {
            unstable_transformImportMeta: true
          }
        }
      ]
    ]
  };
};
