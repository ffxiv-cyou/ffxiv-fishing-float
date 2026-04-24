export default {
  plugins: {
    'postcss-preset-env': {
      stage: 4,
      features: {
        'cascade-layers': true,
      },
      autoprefixer: {},
      browsers: 'chrome >= 95, firefox >= 115'
    }
  }
}
