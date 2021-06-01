const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

function resolve (dir) {
  return path.join(__dirname, './', dir)
}
module.exports = {
  chainWebpack: config => {
    // svg rule loader
    const svgRule = config.module.rule('svg') // 找到svg-loader
    svgRule.uses.clear() // 清除已有的loader, 如果不这样做会添加在此loader之后
    svgRule.exclude.add(/node_modules/) // 正则匹配排除node_modules目录
    svgRule // 添加svg新的loader处理
      .test(/\.svg$/)
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]',
      })

    // 修改images loader 添加svg处理
    const imagesRule = config.module.rule('images')
    imagesRule.exclude.add(resolve('src/icons'))
    config.module
      .rule('images')
      .test(/\.(png|jpe?g|gif|svg)(\?.*)?$/)
  },

  configureWebpack: {
    target: 'electron-renderer',
    plugins: [
      new CopyWebpackPlugin([{
        from: path.resolve(__dirname, './static'),
        to: path.resolve(__dirname, './dist_electron/bundled/static'),
      }]),
    ],
  },

  pluginOptions: {
    electronBuilder: {
      mainProcessFile: 'src/background.js',
      builderOptions: {
        appId: 'com.example.SHOPEE_ERP',
        productName: 'SHOPEE_ERP 销售系统',
        copyright: 'Copyright © 2021',
        win: {
          //win相关配置          
          target: [
            {
              target: 'nsis', //利用nsis制作安装程序
              arch: [
                'x64', //64位
              ],
            },
          ],
          artifactName: '${productName} Setup ${version}.${ext}',
        }
      }
    }
  }
}