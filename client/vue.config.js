module.exports = {
  devServer: {
    proxy: {
      '/Auth': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/WishList': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
}
