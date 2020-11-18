const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const SRC = path.resolve(__dirname,'node_modules')


module.exports = {
  // モードの設定、v4系以降はmodeを指定しないと、webpack実行時に警告が出る
  mode: 'development',

  // エントリーポイントの設定
  entry: {
    live: './src/js/live.js',
    watch: './src/js/watch.js'
  },

  module: {
    rules: [
      {
        test: /\.html$/,
        use: 'html-loader'
      },
      {
          test: /\.mp3$/,
          loader: 'file-loader',
          options: {
              name: '[path][name].[ext]'
          }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/html/index.html',
      chunks: ['live']
    }),
    new HtmlWebpackPlugin({
      template: './src/html/watch.html',
      filename: 'watch.html',
      chunks: ['watch']
    })
  ],

  // 出力の設定
  output: {
    // 出力するファイル名
    filename: '[name].js',
    // 出力先のパス（絶対パスを指定する必要がある）
    path: path.join(__dirname, 'public/js')
  }
}
