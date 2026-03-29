import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/common/Modal';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit'
  const [editingUserId, setEditingUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', role: 'employee', manager: '', isManagerApprover: false 
  });

  useEffect(() => {
    fetchUsers();
    fetchManagers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const res = await api.get('/users/managers');
      setManagers(res.data.data);
    } catch (err) {
      console.error('Failed to fetch managers', err);
    }
  };

  const openAddModal = (roleType) => {
    setModalMode('add');
    setEditingUserId(null);
    setFormData({ 
      name: '', email: '', password: '', role: roleType, manager: '', isManagerApprover: false 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalMode('edit');
    setEditingUserId(user._id);
    setFormData({ 
      name: user.name, 
      email: user.email, 
      password: '', // blank password unless changing
      role: user.role, 
      manager: user.manager?._id || '', 
      isManagerApprover: user.isManagerApprover 
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/${userId}`);
      fetchUsers();
      fetchManagers(); // In case we deleted a manager
    } catch (err) {
      alert("Failed to delete user: " + (err.response?.data?.error || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // If role is manager/admin, manager assignment must be null
      const finalManager = (formData.role === 'manager' || formData.role === 'admin') 
        ? null 
        : (formData.manager === '' ? null : formData.manager);

      const payload = { ...formData, manager: finalManager };

      if (modalMode === 'add') {
        await api.post('/users', payload);
      } else {
        // If edit mode and password is empty, don't send it to preserve current password
        if (!payload.password) delete payload.password;
        await api.put(`/users/${editingUserId}`, payload);
      }

      setIsModalOpen(false);
      fetchUsers();
      fetchManagers();
    } catch (err) {
      alert((modalMode === 'add' ? 'Failed to create user: ' : 'Failed to update user: ') + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">User Management</h1>
        <div className="flex gap-3">
          <button 
            onClick={() => openAddModal('employee')}
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg font-medium shadow-sm"
          >
            Add Employee
          </button>
          <button 
            onClick={() => openAddModal('manager')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm border border-transparent"
          >
            Add Manager
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    u.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {u.role === 'employee' ? (u.manager?.name || 'Unassigned') : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                 {u.role === 'admin' ? 'N/A' : <>
                  <button onClick={() => openEditModal(u)} className="text-blue-600 hover:text-blue-900 mx-3 font-medium">Edit</button>
                  <button onClick={() => handleDelete(u._id)} className="text-red-600 hover:text-red-900 font-medium">Delete</button>
                 </>}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'add' ? `Add New ${formData.role === 'manager' ? 'Manager' : 'Employee'}` : 'Edit User'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value, manager: (e.target.value === 'manager' || e.target.value === 'admin') ? '' : formData.manager})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="finance">Finance</option>
                <option value="director">Director</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {modalMode === 'add' ? 'Temporary Password' : 'New Password (Optional)'}
              </label>
              <input type={modalMode === 'add' ? 'text' : 'password'} required={modalMode === 'add'} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder={modalMode === 'edit' ? 'Leave blank to keep current' : ''} />
            </div>
          </div>
          
          {formData.role === 'employee' && (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Assign Manager</label>
                <select value={formData.manager} onChange={(e) => setFormData({...formData, manager: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                  <option value="">None (Top Level)</option>
                  {managers.map(mgr => (
                    <option key={mgr._id} value={mgr._id}>{mgr.name} ({mgr.email})</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <input type="checkbox" id="managerApprover" checked={formData.isManagerApprover} onChange={(e) => setFormData({...formData, isManagerApprover: e.target.checked})} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="managerApprover" className="font-medium text-gray-700">Require Direct Manager Approval?</label>
                  <p className="text-gray-500">If checked, expenses must be approved by this specific manager first, regardless of global thresholds.</p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 mt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 shadow-sm">
              {modalMode === 'add' ? 'Create User' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
