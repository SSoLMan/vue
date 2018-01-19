
const path = require('path')
const HtmlWebpackPlugin =  require('html-webpack-plugin')
function resolve (dir) {
  return path.join(__dirname, dir)
}


module.exports = {

  entry:{
    app:__dirname+"/src/index.js"
  },
  output:{
    path:__dirname+"/dist",
    publicPath:"/",
    filename:"[name].js"
  },
  module:{
    rules:[
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [resolve('src'), resolve('node_modules/webpack-dev-server/client')]
      }
    ]
    
  },
  plugins:[
     new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html',
      inject: true
    })
  ]
}