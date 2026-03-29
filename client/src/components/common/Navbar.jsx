import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const auth = useAuth();
  const user = auth?.user;

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      <div className="flex items-center">
        <h2 className="text-xl font-semibold text-gray-800">Reimbursement System</h2>
      </div>
      <div className="flex items-center gap-4">
        {user && <span className="text-gray-600">{user.name} ({user.role})</span>}
        <button onClick={() => auth?.logout()} className="text-red-600 hover:text-red-800 font-medium">
          Logout
        </button>
      </div>
    </header>
  );
};
export default Navbar;
