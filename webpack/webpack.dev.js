const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development')
    })
  ],
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