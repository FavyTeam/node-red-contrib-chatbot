const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist',
    bonjour: true
    //publicPath: './src/images',
    //hot: true,
    /*proxy: {
      '*.png': {
        target: 'http://localhost:[port]/',
        //pathRewrite: { '^/some/sub-path': '' },
      }
    }*/
  }
});