// Vercel serverless function that wraps the Express app
const app = require('../server/server.js');

module.exports = (req, res) => {
  // Keep /api prefix since Express routes expect it
  return app(req, res);
};
