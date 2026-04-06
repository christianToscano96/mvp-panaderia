const User = require('../models/User');
const Branch = require('../models/Branch');
const { generateToken } = require('../middlewares/auth');

/**
 * Auth Controller
 * Maneja login, registro, y obtener usuario actual
 */

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Buscar usuario con password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos'
      });
    }

    // 2. Verificar contraseña
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos'
      });
    }

    // 3. Verificar que esté activo
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuario desactivado'
      });
    }

    // 4. Actualizar último login
    user.lastLogin = new Date();
    await user.save();

    // 5. Generar token
    const token = generateToken(user._id);

    // 6. Responder (sin password gracias to toJSON)
    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Obtener usuario actual (requiere autenticación)
 */
exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('branch', 'name');

    res.json({
      success: true,
      user
    });

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/register
 * Registrar nuevo usuario (solo admin)
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, branch } = req.body;

    // Verificar email único
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Obtener branch por defecto si no se provee
    let userBranch = branch;
    if (!userBranch) {
      const defaultBranch = await Branch.findOne({ name: 'Casa Central' });
      if (defaultBranch) {
        userBranch = defaultBranch._id;
      }
    }

    // Crear usuario
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'cajero',
      branch: userBranch
    });

    // Generar token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch
      }
    });

  } catch (error) {
    next(error);
  }
};