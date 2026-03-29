import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/common/Modal';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

const Expenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState([]);
  const [convertedPreview, setConvertedPreview] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    amount: '', currency: '', category: 'meals', description: '', date: '', merchantName: ''
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    console.log(user)
    fetchExpenses();
    // Fetch currencies for the dropdown
    axios.get('https://restcountries.com/v3.1/all?fields=name,currencies').then(res => {
      const uniqueCurrencies = new Map();
      res.data.forEach(c => {
        if (c.currencies) {
          Object.keys(c.currencies).forEach(code => {
            uniqueCurrencies.set(code, `${code} - ${c.currencies[code].name}`);
          });
        }
      });
      setCountries(Array.from(uniqueCurrencies.entries()).sort());
    }).catch(err => console.error(err));
  }, []);

  // Effect to calculate live conversion preview
  useEffect(() => {
    const calculateConversion = async () => {
      if (!formData.amount || !formData.currency || isNaN(formData.amount)) {
        setConvertedPreview(null);
        return;
      }
      
      const baseCur = user?.company?.defaultCurrency;
      if (!baseCur) return;

      if (formData.currency === baseCur) {
        setConvertedPreview(Number(formData.amount));
        return;
      }

      try {
        const { data } = await axios.get(`https://api.exchangerate-api.com/v4/latest/${baseCur}`);
        const rate = data.rates[formData.currency];
        if (rate) {
          setConvertedPreview(Number(formData.amount) / rate);
        } else {
          setConvertedPreview(null);
        }
      } catch(err) {
        console.error('Failed to fetch conversion rates', err);
        setConvertedPreview(null);
      }
    };
    
    const timeoutId = setTimeout(calculateConversion, 400); // 400ms debounce
    return () => clearTimeout(timeoutId);
  }, [formData.amount, formData.currency, user?.company?.defaultCurrency]);


  const fetchExpenses = async () => {
    try {
      const res = await api.get('/expenses/my');
      setExpenses(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (file) data.append('receipt', file);

      await api.post('/expenses', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setIsModalOpen(false);
      setFormData({ amount: '', currency: '', category: 'meals', description: '', date: '', merchantName: '' });
      setFile(null);
      setConvertedPreview(null);
      fetchExpenses();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit expense');
    }
  };

  if (loading) return <div>Loading expenses...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">My Expenses</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
        >
          Submit Expense
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.map((e) => (
              <tr key={e._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(e.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{e.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{e.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {e.currency} {e.amount}
                  <div className="text-xs text-gray-400">({e.convertedAmount.toFixed(2)} base)</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${e.status === 'approved' ? 'bg-green-100 text-green-800' : 
                      e.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
                    {e.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">You haven't submitted any expenses yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Submit Expense">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="col-span-2 border-2 border-dashed border-gray-300 p-4 rounded-lg bg-gray-50 text-center">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Receipt (Optional)</label>
            <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Currency</label>
              <select required value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option value="">Select Currency</option>
                {countries.map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
          </div>
          
          {convertedPreview !== null && formData.currency !== user?.company?.defaultCurrency && (
            <div className="col-span-2 bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">Company Base Currency Equivalent:</span>
              <strong className="text-blue-900">{user?.company?.defaultCurrency} {convertedPreview.toFixed(2)}</strong>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option value="meals">Meals</option>
                <option value="travel">Travel</option>
                <option value="accommodation">Accommodation</option>
                <option value="supplies">Supplies</option>
                <option value="entertainment">Entertainment</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea required rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Business lunch, taxi ride, etc." />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md shadow-sm">
              Publish Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Expenses;
