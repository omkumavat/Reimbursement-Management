import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';

// Common
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Approvals from './pages/Approvals';
import Users from './pages/Users';
import ApprovalRules from './pages/ApprovalRules';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          
          <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          
          <Route path="/approvals" element={
            <ProtectedRoute roles={['manager', 'admin', 'finance', 'director']}>
              <Approvals />
            </ProtectedRoute>
          } />
          
          <Route path="/users" element={
            <ProtectedRoute roles={['admin']}>
              <Users />
            </ProtectedRoute>
          } />
          <Route path="/rules" element={
            <ProtectedRoute roles={['admin']}>
              <ApprovalRules />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
