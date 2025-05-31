module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Update webpack config to use setupMiddlewares instead of deprecated options
      if (webpackConfig.devServer) {
        const devServer = webpackConfig.devServer;
        
        // Store any existing middleware functions
        const beforeSetupMiddleware = devServer.onBeforeSetupMiddleware;
        const afterSetupMiddleware = devServer.onAfterSetupMiddleware;
        
        // Remove deprecated options
        delete devServer.onBeforeSetupMiddleware;
        delete devServer.onAfterSetupMiddleware;
        
        // Add setupMiddlewares function
        devServer.setupMiddlewares = (middlewares, devServer) => {
          if (beforeSetupMiddleware) {
            beforeSetupMiddleware(devServer);
          }
          
          // Return middlewares as is
          
          if (afterSetupMiddleware) {
            afterSetupMiddleware(devServer);
          }
          
          return middlewares;
        };
      }
      
      return webpackConfig;
    },
  },
};
