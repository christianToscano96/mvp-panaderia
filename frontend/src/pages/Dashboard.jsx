import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Dashboard
      </h1>

      {/* Welcome card */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800">
          Bienvenido, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-gray-500 mt-1">
          Rol: <span className="capitalize font-medium">{user?.role}</span>
        </p>
      </div>

      {/* Quick stats placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Ventas hoy</p>
          <p className="text-2xl font-bold text-gray-800">$0.00</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Ventas mes</p>
          <p className="text-2xl font-bold text-gray-800">$0.00</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Productos</p>
          <p className="text-2xl font-bold text-gray-800">0</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">_stock bajo</p>
          <p className="text-2xl font-bold text-red-600">0</p>
        </div>
      </div>
    </div>
  );
}