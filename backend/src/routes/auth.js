const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

/**
 * Rutas públicas
 */

// POST /api/auth/login - Iniciar sesión
router.post('/login', authController.login);

// POST /api/auth/register - Registrar usuario
router.post('/register', authController.register);

// GET /api/health - Test
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Rutas protegidas
 */
router.get('/me', protect, authController.me);

module.exports = router;