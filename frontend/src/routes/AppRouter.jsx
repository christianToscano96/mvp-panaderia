import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Branches from '../pages/Branches';
import Categories from '../pages/Categories';
import RawMaterials from '../pages/RawMaterials';
import Products from '../pages/Products';
import PrivateRoute from '../components/layout/PrivateRoute';
import MainLayout from '../components/layout/MainLayout';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <PrivateRoute roles={['admin', 'manager', 'cajero', 'panadero']}>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/branches" element={<Branches />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/raw-materials" element={<RawMaterials />} />
                <Route path="/products" element={<Products />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}