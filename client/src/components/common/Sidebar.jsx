import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = () => {
  const auth = useAuth();
  const user = auth?.user;

  return (
    <div className="flex flex-col w-64 h-full bg-gray-900 border-r border-gray-800 text-gray-300">
      <div className="flex items-center justify-center h-16 border-b border-gray-800">
        <span className="text-white font-bold uppercase tracking-wider text-xl">App Menu</span>
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto">
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link to="/" className="block px-4 py-2 hover:bg-gray-800 rounded-md hover:text-white transition-colors">Dashboard</Link>
          <Link to="/expenses" className="block px-4 py-2 hover:bg-gray-800 rounded-md hover:text-white transition-colors">Expenses</Link>
          
          {(user?.role === 'manager' || user?.role === 'admin') && (
            <Link to="/approvals" className="block px-4 py-2 hover:bg-gray-800 rounded-md hover:text-white transition-colors">Approvals</Link>
          )}
          
          {user?.role === 'admin' && (
            <Link to="/users" className="block px-4 py-2 hover:bg-gray-800 rounded-md hover:text-white transition-colors">Users</Link>
          )}
        </nav>
      </div>
    </div>
  );
};
export default Sidebar;
