const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function(app) {
  ['/api', '/messenger', '/media'].forEach(function(path) {
    app.use(
      path,
      createProxyMiddleware({
        target: 'http://localhost:8000',
      })
    );
  });
};