const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
 entry:'./src/index.tsx',
 output:{path:path.resolve(__dirname,'dist/client'),filename:'app.[contenthash].js',clean:true,publicPath:'/'},
 resolve:{extensions:['.tsx','.ts','.js']},
 module:{rules:[{test:/\.tsx?$/,exclude:/node_modules/,use:{loader:'babel-loader',options:{presets:[['@babel/preset-react',{runtime:'automatic'}],'@babel/preset-typescript']}}},{test:/\.css$/,use:['style-loader','css-loader']},{test:/\.(png|webp)$/,type:'asset/resource',generator:{filename:'[name].[contenthash][ext]'}}]},
 plugins:[new HtmlWebpackPlugin({template:'index.html'})],
 devtool:false
};
