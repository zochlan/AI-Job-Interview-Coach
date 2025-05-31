const path = require('path');

module.exports = {
  // Your webpack configuration
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      // Your middleware setup
      return middlewares;
    },
  },
};
