import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ expenses: [], pendingApprovals: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const expenseRes = await api.get('/expenses/my');
        let pendingRes = null;
        
        if (user.role === 'manager' || user.role === 'admin') {
          pendingRes = await api.get('/approvals/pending');
        }

        setStats({
          expenses: expenseRes.data.data || [],
          pendingApprovals: pendingRes ? pendingRes.data.data : []
        });
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user.role]);

  if (loading) return <div>Loading dashboard...</div>;

  const totalSubmitted = stats.expenses.reduce((acc, curr) => acc + curr.convertedAmount, 0);
  const pendingCount = stats.expenses.filter(e => e.status === 'pending' || e.status === 'in_review').length;
  const approvedCount = stats.expenses.filter(e => e.status === 'approved').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Submissions</h3>
          <div className="mt-2 text-3xl font-bold text-gray-900">{stats.expenses.length}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Value (Base Cur)</h3>
          <div className="mt-2 text-3xl font-bold text-blue-600">{totalSubmitted.toFixed(2)}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Status Stats</h3>
          <div className="mt-2 flex gap-4">
            <div className="text-center">
              <span className="block text-xl font-bold text-yellow-500">{pendingCount}</span>
              <span className="text-xs text-gray-500">Pending</span>
            </div>
            <div className="text-center">
              <span className="block text-xl font-bold text-green-500">{approvedCount}</span>
              <span className="text-xs text-gray-500">Approved</span>
            </div>
          </div>
        </div>
      </div>

      {(user.role === 'manager' || user.role === 'admin') && (
        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-indigo-900">Pending Approvals</h3>
              <p className="text-indigo-700 mt-1">You have {stats.pendingApprovals.length} expenses waiting for your review.</p>
            </div>
            <button 
              onClick={() => window.location.href='/approvals'}
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm"
            >
              Go to Approvals
            </button>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Submissions</h3>
        {stats.expenses.length > 0 ? (
          <div className="space-y-4">
            {stats.expenses.slice(0, 5).map(exp => (
              <div key={exp._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{exp.description}</p>
                  <p className="text-sm text-gray-500">{new Date(exp.date).toLocaleDateString()} &middot; {exp.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{exp.currency} {exp.amount}</p>
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mt-1
                    ${exp.status === 'approved' ? 'bg-green-100 text-green-800' : 
                      exp.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
                    {exp.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No expenses submitted yet.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
