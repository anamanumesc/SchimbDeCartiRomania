const { defineConfig } = require('@vue/cli-service');
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8085,
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // URL-ul backend-ului
        changeOrigin: true,
      },
    },
  },
  chainWebpack: (config) => {
    config.plugin('html').tap((args) => {
      args[0].template = './public/index.html'; // Specifică template-ul corect
      return args;
    });

    // Exclude index.html from being copied by CopyPlugin
    config.plugin('copy').tap(([options]) => {
      options.patterns[0].globOptions.ignore.push('**/index.html');
      return [options];
    });
  },
});