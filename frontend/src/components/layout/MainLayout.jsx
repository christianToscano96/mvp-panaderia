import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiMenuAlt2, HiX, HiLogout } from 'react-icons/hi';
import { useState } from 'react';
import { cn } from '../../utils/cn';

/**
 * MainLayout
 * Layout base con sidebar para la app
 */
export default function MainLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: 'HiHome', roles: ['admin', 'manager', 'cajero', 'panadero'] },
    { label: 'Sucursales', path: '/branches', icon: 'HiOfficeBuilding', roles: ['admin', 'manager'] },
    { label: 'Ventas', path: '/sales', icon: 'HiCurrencyDollar', roles: ['admin', 'manager', 'cajero'] },
    { label: 'Producción', path: '/production', icon: 'HiCube', roles: ['admin', 'manager', 'panadero'] },
    { label: 'Stock', path: '/stock', icon: 'HiDatabase', roles: ['admin', 'manager'] },
    { label: 'Caja', path: '/cash-register', icon: 'HiCalculator', roles: ['admin', 'manager', 'cajero'] },
    { label: 'Gastos', path: '/expenses', icon: 'HiCreditCard', roles: ['admin', 'manager'] },
    { label: 'Reportes', path: '/reports', icon: 'HiChartBar', roles: ['admin', 'manager'] },
    { label: 'Usuarios', path: '/users', icon: 'HiUsers', roles: ['admin'] },
  ];

  // Map de iconos
  const icons = {
    HiHome: '📊',
    HiOfficeBuilding: '🏪',
    HiCurrencyDollar: '💰',
    HiCube: '🍞',
    HiDatabase: '📦',
    HiCalculator: '💵',
    HiCreditCard: '💳',
    HiChartBar: '📈',
    HiUsers: '👥'
  };

  const filteredNav = navItems.filter(
    item => item.roles.includes(user?.role)
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <span className="text-lg font-bold text-primary">Panadería</span>
          <button 
            className="lg:hidden p-2"
            onClick={() => setSidebarOpen(false)}
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-gray-200">
          <p className="font-medium text-gray-800">{user?.name}</p>
          <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-1">
          {filteredNav.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                location.pathname === item.path
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <span>{icons[item.icon]}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
          >
            <span>🚪</span>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header mobile */}
        <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2"
          >
            <HiMenuAlt2 className="w-6 h-6" />
          </button>
          <span className="ml-2 font-semibold text-gray-800">Panadería</span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}