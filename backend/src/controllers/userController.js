const User = require('../models/User');
const Branch = require('../models/Branch');

/**
 * User Controller
 * CRUD completo de usuarios
 */

/**
 * GET /api/users
 * Listar todos los usuarios (solo admin)
 */
exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, branch, isActive } = req.query;

    // Construir filtro
    const filter = {};
    if (role) filter.role = role;
    if (branch) filter.branch = branch;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await User.find(filter)
      .populate('branch', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id
 * Obtener un usuario por ID
 */
exports.getById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('branch', 'name');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users
 * Crear usuario (solo admin)
 */
exports.create = async (req, res, next) => {
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

    // Verificar que la sucursal exista
    if (branch) {
      const branchExists = await Branch.findById(branch);
      if (!branchExists) {
        return res.status(400).json({
          success: false,
          message: 'Sucursal no encontrada'
        });
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'cajero',
      branch
    });

    await user.populate('branch', 'name');

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: user
    });

  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id
 * Actualizar usuario (solo admin)
 */
exports.update = async (req, res, next) => {
  try {
    const { name, email, role, branch, isActive } = req.body;

    // No permitir cambiar password aquí (endpoint separado)
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Actualizar campos
    if (name) user.name = name;
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso'
        });
      }
      user.email = email;
    }
    if (role) user.role = role;
    if (branch) user.branch = branch;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();
    await user.populate('branch', 'name');

    res.json({
      success: true,
      message: 'Usuario actualizado',
      data: user
    });

  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/:id/toggle
 * Activar/desactivar usuario (solo admin)
 */
exports.toggle = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No permitir desactivar al admin principal
    if (user.email === 'admin@panaderia.com') {
      return res.status(400).json({
        success: false,
        message: 'No puedes desactivar al administrador principal'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `Usuario ${user.isActive ? 'activado' : 'desactivado'}`,
      data: user
    });

  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/:id/password
 * Cambiar password del propio usuario
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.params.id).select('+password');

    // Verificar password actual
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Validar nuevo password
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Contraseña actualizada'
    });

  } catch (error) {
    next(error);
  }
};