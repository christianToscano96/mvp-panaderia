import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import PrivateRoute from '../components/layout/PrivateRoute';
import MainLayout from '../components/layout/MainLayout';

/**
 * AppRouter
 * Definición de rutas de la aplicación
 */
export default function AppRouter() {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/login" element={<Login />} />

      {/* Rutas protegidas */}
      <Route
        path="/*"
        element={
          <PrivateRoute roles={['admin', 'manager', 'cajero', 'panadero']}>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                {/* Agregar más rutas aquí */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}