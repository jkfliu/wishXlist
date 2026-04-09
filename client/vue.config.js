module.exports = {
  devServer: {
    host: 'localhost',
    proxy: {
      '/Auth': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/WishList': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/Groups': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/Admin': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
}
