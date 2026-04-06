require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const corsConfig = require('./src/config/cors');

// Inicializar app
const app = express();

// Conectar a MongoDB
connectDB();

// Middlewares
app.use(corsConfig);
app.use(express.json());
app.use(morgan('dev')); // Logging en desarrollo

// Rutas base
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Panadería API running' });
});

// Rutas de la API
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/branches', require('./src/routes/branches'));

// Middleware de manejo de errores
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

app.use(errorHandler);

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});