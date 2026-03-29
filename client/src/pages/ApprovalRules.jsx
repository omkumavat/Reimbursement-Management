import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/common/Modal';

const ApprovalRules = () => {
  const [rules, setRules] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const roleOptions = [
    { value: 'direct_manager', label: 'Submitter\'s Direct Manager' },
    { value: 'manager', label: 'Any Manager' },
    { value: 'finance', label: 'Finance Department' },
    { value: 'director', label: 'Company Director' },
    { value: 'admin', label: 'Administrator' }
  ];

  const defaultForm = {
    name: '',
    isDefault: true,
    workflowType: 'sequence', // 'sequence' or 'conditional'
    approvers: [], 
    conditionalRules: {
      enabled: false,
      percentageRule: { enabled: false, percentage: 60 },
      specificApproverRule: { enabled: false, role: 'admin', autoApprove: true },
      hybridMode: false
    }
  };

  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await api.get('/approval-rules');
      setRules(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setFormData({ ...defaultForm });
    setIsModalOpen(true);
  };

  const getAvailableRoles = () => {
    // Return rols not already selected in approvers array
    const selectedRoles = formData.approvers.map(a => a.role);
    return roleOptions.filter(ro => !selectedRoles.includes(ro.value));
  };

  const addStep = () => {
    if (formData.approvers.length >= 3) {
      alert("Maximum 3 approvals allowed per sequence.");
      return;
    }
    const available = getAvailableRoles();
    if (available.length === 0) return;

    const newStepNum = formData.approvers.length + 1;
    setFormData({
      ...formData,
      approvers: [...formData.approvers, { step: newStepNum, role: available[0].value }]
    });
  };

  const removeStep = (index) => {
    const newApprovers = [...formData.approvers];
    newApprovers.splice(index, 1);
    newApprovers.forEach((a, i) => a.step = i + 1);
    setFormData({ ...formData, approvers: newApprovers });
  };

  const updateStepRole = (index, newRole) => {
    const newApprovers = [...formData.approvers];
    newApprovers[index].role = newRole;
    setFormData({ ...formData, approvers: newApprovers });
  };

  const handleDelete = async (ruleId) => {
    if (!window.confirm("Delete this rule?")) return;
    try {
      await api.delete(`/approval-rules/${ruleId}`);
      fetchRules();
    } catch(err) {
      alert("Failed to delete rule: " + err.message);
    }
  };

  const handleToggleActive = async (ruleId) => {
    try {
      await api.put(`/approval-rules/${ruleId}`, { isDefault: true });
      fetchRules();
    } catch(err) {
      alert("Failed to activate rule: " + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.approvers.length === 0) {
      alert("You must define at least one approval step.");
      return;
    }

    if (formData.workflowType === 'conditional') {
      formData.conditionalRules.enabled = true;
    } else {
      formData.conditionalRules.enabled = false;
    }

    try {
      await api.post('/approval-rules', formData);
      setIsModalOpen(false);
      fetchRules();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save rule');
    }
  };

  if (loading) return <div>Loading rules...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Approval Workflows</h1>
        <button 
          onClick={openAddModal}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
        >
          Create Workflow Rule
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {rules.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No workflows defined.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rule Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Configuration</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rules.map((rule) => (
                <tr key={rule._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rule.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {rule.isDefault ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Active</span>
                    ) : (
                      <button onClick={() => handleToggleActive(rule._id)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded-full transition-colors">Set Active</button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${rule.workflowType === 'conditional' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                      {rule.workflowType === 'conditional' ? 'Parallel/Conditional' : 'Sequential'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-1 flex-wrap">
                        {rule.approvers.sort((a,b)=>a.step - b.step).map((a, i) => (
                          <div key={i} className="flex items-center">
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs border border-indigo-100">
                              {roleOptions.find(ro => ro.value === a.role)?.label || a.role}
                            </span>
                            {i < rule.approvers.length - 1 && rule.workflowType === 'sequence' && <span className="mx-1 text-gray-400">→</span>}
                            {i < rule.approvers.length - 1 && rule.workflowType === 'conditional' && <span className="mx-1 text-gray-400">&</span>}
                          </div>
                        ))}
                      </div>
                      {rule.workflowType === 'conditional' && rule.conditionalRules?.percentageRule?.enabled && (
                        <div className="text-xs text-amber-700 mt-1">Requires {rule.conditionalRules.percentageRule.percentage}% Approval</div>
                      )}
                      {rule.workflowType === 'conditional' && rule.conditionalRules?.specificApproverRule?.enabled && (
                        <div className="text-xs text-amber-700">Admin Auto-Approve Enabled</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <button onClick={() => handleDelete(rule._id)} className="text-red-600 hover:text-red-900 font-medium text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Configure Workflow Rule">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Workflow Name</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm" placeholder="e.g. Standard Policy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mode</label>
              <select value={formData.workflowType} onChange={(e) => setFormData({...formData, workflowType: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm">
                <option value="sequence">Sequential Processing (Step-by-Step)</option>
                <option value="conditional">Conditional/Parallel (Simultaneous)</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-800">Assigned Roles (Max 3)</h3>
              <button 
                type="button" 
                onClick={addStep} 
                disabled={formData.approvers.length >= 3 || getAvailableRoles().length === 0}
                className="text-xs bg-white border border-gray-300 text-gray-700 font-medium px-2 py-1 rounded shadow-sm hover:bg-gray-100 disabled:opacity-50"
              >
                + Add Role Slot
              </button>
            </div>

            {formData.approvers.length === 0 ? (
               <p className="text-sm text-gray-500 text-center py-4">No roles added yet.</p>
            ) : (
              <div className="space-y-3">
                {formData.approvers.map((appr, index) => {
                  // Re-inject the currently selected role into the available options for this specific dropdown
                  const currentDropdownOptions = [
                    roleOptions.find(ro => ro.value === appr.role),
                    ...getAvailableRoles()
                  ].filter(Boolean);

                  return (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200 shadow-sm relative pl-10">
                    <div className={`absolute left-3 top-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${formData.workflowType === 'sequence' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}`}>
                      {formData.workflowType === 'sequence' ? appr.step : '~'}
                    </div>
                    <div className="flex-1 px-4">
                      <select 
                        value={appr.role} 
                        onChange={(e) => updateStepRole(index, e.target.value)}
                        className="block w-full text-sm border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      >
                        {currentDropdownOptions.map(ro => (
                          <option key={ro.value} value={ro.value}>{ro.label}</option>
                        ))}
                      </select>
                    </div>
                    <button type="button" onClick={() => removeStep(index)} className="text-red-500 hover:text-red-700 font-bold px-2 py-1">
                      &times;
                    </button>
                  </div>
                )})}
              </div>
            )}
          </div>

          {formData.workflowType === 'conditional' && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 space-y-4">
              <h3 className="text-sm font-semibold text-amber-800 mb-2">Conditional Rules</h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input type="checkbox" id="percentRule" checked={formData.conditionalRules.percentageRule.enabled} onChange={(e) => setFormData({...formData, conditionalRules: {...formData.conditionalRules, percentageRule: {...formData.conditionalRules.percentageRule, enabled: e.target.checked}}})} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="percentRule" className="font-medium text-gray-700">Percentage Rule</label>
                    <p className="text-gray-500">Auto-approve if consensus reaches threshold.</p>
                  </div>
                </div>
                {formData.conditionalRules.percentageRule.enabled && (
                  <div className="flex items-center gap-2">
                     <input type="number" min="1" max="100" value={formData.conditionalRules.percentageRule.percentage} onChange={(e) => setFormData({...formData, conditionalRules: {...formData.conditionalRules, percentageRule: {...formData.conditionalRules.percentageRule, percentage: e.target.value}}})} className="block w-20 px-2 py-1 text-sm border-gray-300 rounded-md" />
                     <span className="text-sm font-medium text-gray-600">%</span>
                  </div>
                )}
              </div>

              <div className="flex items-start bg-white p-3 rounded border border-amber-100">
                <div className="flex h-5 items-center">
                  <input type="checkbox" id="adminRule" checked={formData.conditionalRules.specificApproverRule.enabled} onChange={(e) => setFormData({...formData, conditionalRules: {...formData.conditionalRules, specificApproverRule: {...formData.conditionalRules.specificApproverRule, enabled: e.target.checked}}})} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                </div>
                <div className="ml-3 text-sm flex-1">
                  <label htmlFor="adminRule" className="font-medium text-gray-700">Admin Bypass</label>
                  <p className="text-gray-500 text-xs mt-1">If the Administrator approves, instantly fulfill this workflow entirely.</p>
                </div>
              </div>

              {formData.conditionalRules.percentageRule.enabled && formData.conditionalRules.specificApproverRule.enabled && (
                <div className="flex items-start ml-2 mt-2">
                  <div className="flex h-5 items-center">
                    <input type="checkbox" id="hybridMode" checked={formData.conditionalRules.hybridMode} onChange={(e) => setFormData({...formData, conditionalRules: {...formData.conditionalRules, hybridMode: e.target.checked}})} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                  </div>
                  <div className="ml-3 text-sm flex-1">
                    <label htmlFor="hybridMode" className="font-medium text-amber-900 border-b border-dashed border-amber-300">Hybrid Mode</label>
                    <p className="text-amber-700 text-xs mt-1">Combine both rules: Requires the threshold percentage <b>OR</b> an Admin approval.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 mt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 shadow-sm">
              Save Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ApprovalRules;
