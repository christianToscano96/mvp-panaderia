const cors = require('cors');

// Configuración CORS simple para desarrollo
// Permite cualquier origen localhost
const corsOptions = {
  origin: '*',
  methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: false,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

module.exports = cors(corsOptions);