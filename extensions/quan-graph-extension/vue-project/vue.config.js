
module.exports = {

  publicPath: './',
  // 输出文件目录
  outputDir: '../web-dist',
  lintOnSave: true,
  css: {
    loaderOptions: {
      less: {
        modifyVars: {
          'text-color': '#c9d1d9',
          'text-color-base': '#c9d1d9',
          'component-background': '#151515',
          'text-color-secondary': '#8b949e',
          'border-color-base': '#303030',
          'item-active-bg': '#111b26',
          'app-content-background': 'rgb(255 255 255 / 4%)',
          "black": "#fff",
          "white": "#333",
          "table-header-bg": "rbga(0,0,0,0)"
        },
        javascriptEnabled: true,

      }
    }
  }

  // chainWebpack: (config) => {
  //   //修改文件引入自定义路径
  //   config.resolve.alias
  //     .set('@', resolve('src'))
  //     .set('~assets', resolve('src/assets'))
  //   // .set('ide',resolve('src/ide'))

  // }
}