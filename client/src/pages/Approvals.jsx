import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/common/Modal';

const Approvals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [comments, setComments] = useState('');

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const res = await api.get('/approvals/pending');
      setApprovals(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    try {
      await api.post(`/approvals/${selectedExpense._id}/${action}`, { comments });
      setSelectedExpense(null);
      setComments('');
      fetchApprovals();
    } catch (err) {
      alert(`Failed to ${action} expense: ` + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div>Loading approvals queue...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Pending Approvals</h1>
      </div>

      <div className="grid gap-6">
        {approvals.map(exp => (
          <div key={exp._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-900 border-b border-gray-300 pb-0.5">{exp.submittedBy.name}</span>
                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{exp.category}</span>
                <span className="text-sm text-gray-500">{new Date(exp.date).toLocaleDateString()}</span>
              </div>
              <p className="mt-2 text-gray-700 text-lg">{exp.description}</p>
              {exp.merchantName && <p className="mt-1 text-sm text-gray-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Merchant: {exp.merchantName}</p>}
            </div>
            
            <div className="flex items-center gap-6 self-start sm:self-auto min-w-max">
              <div className="text-right flex flex-col sm:block">
                <span className="text-2xl font-bold text-gray-900 leading-none">{exp.currency} {exp.amount}</span>
                <span className="block text-sm text-gray-500 font-medium">({exp.convertedAmount.toFixed(2)} Base)</span>
              </div>
              <button
                onClick={() => setSelectedExpense(exp)}
                className="px-6 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap"
              >
                Review Item
              </button>
            </div>
          </div>
        ))}
        {approvals.length === 0 && (
          <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-200">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
            <p className="mt-2 text-gray-500 max-w-sm mx-auto">There are no expenses waiting for your review.</p>
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedExpense} onClose={() => { setSelectedExpense(null); setComments(''); }} title="Review Expense">
        {selectedExpense && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs text-gray-500 font-semibold uppercase tracking-wider">Employee</span>
                <span className="block mt-1 font-medium">{selectedExpense.submittedBy.name}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 font-semibold uppercase tracking-wider">Date</span>
                <span className="block mt-1 font-medium">{new Date(selectedExpense.date).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 font-semibold uppercase tracking-wider">Amount</span>
                <span className="block mt-1 font-medium text-lg">{selectedExpense.currency} {selectedExpense.amount}</span>
              </div>
              <div>
                 <span className="block text-xs text-gray-500 font-semibold uppercase tracking-wider">Base Value</span>
                 <span className="block mt-1 font-medium text-lg text-blue-600">{selectedExpense.convertedAmount.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <span className="block text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Description</span>
              <p className="text-gray-800 bg-white border border-gray-200 rounded-lg p-3 leading-relaxed">{selectedExpense.description}</p>
            </div>

            {selectedExpense.receiptUrl && (
              <div>
                <span className="block text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Receipt</span>
                <a href={`http://localhost:5000${selectedExpense.receiptUrl}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  View Receipt Evidence
                </a>
              </div>
            )}

            <div className="pt-2">
               <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer Comments (Optional)</label>
               <textarea 
                 rows="3" 
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                 placeholder="Leave a note for the employee or next approver..."
                 value={comments}
                 onChange={(e) => setComments(e.target.value)}
               ></textarea>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button 
                onClick={() => handleAction('reject')}
                className="flex-1 px-4 py-2 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 font-medium rounded-lg shadow-sm"
              >
                Reject Request
              </button>
              <button 
                onClick={() => handleAction('approve')}
                className="flex-1 px-4 py-2 border border-transparent text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg shadow-sm"
              >
                Approve Request
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Approvals;
