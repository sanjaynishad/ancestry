/* */ 
var webpack = require('webpack'),
    path = require('path'),
    ExtractTextPlugin = require('extract-text-webpack-plugin'),
    HtmlPlugin = require('html-webpack-plugin');
module.exports = {
  entry: {app: ['./src/app']},
  output: {
    path: './build',
    publicPath: '/',
    filename: '[name].js'
  },
  node: {
    __dirname: true,
    __filename: true
  },
  resolve: {
    root: __dirname,
    alias: {'npm': __dirname + '/node_modules'}
  },
  module: {loaders: [{
      test: /\.css$/,
      loader: ExtractTextPlugin.extract('css')
    }, {
      test: /\.scss$/,
      loader: ExtractTextPlugin.extract('css?sourceMap!autoprefixer?browsers=last 2 versions!sass?sourceMap'),
      exclude: /node_modules/
    }, {
      test: /\.js$/,
      loader: 'ng-annotate!babel',
      exclude: /node_modules/
    }, {
      test: /\.html$/,
      loader: 'html',
      exclude: /node_modules/
    }]},
  plugins: [new ExtractTextPlugin('[name].css'), new HtmlPlugin({
    filename: 'index.html',
    template: './src/index.html'
  })]
};
