import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', companyName: '', country: '', defaultCurrency: '', currencySymbol: ''
  });
  const [countries, setCountries] = useState([]);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch countries from public API for signup
    axios.get('https://restcountries.com/v3.1/all?fields=name,currencies').then(res => {
      const sorted = res.data.sort((a,b) => a.name.common.localeCompare(b.name.common));
      setCountries(sorted);
    }).catch(err => console.error(err));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCountryChange = (e) => {
    const countryName = e.target.value;
    const countryData = countries.find(c => c.name.common === countryName);
    if (countryData && Object.keys(countryData.currencies).length > 0) {
      const code = Object.keys(countryData.currencies)[0];
      const symbol = countryData.currencies[code].symbol;
      setFormData({ 
        ...formData, 
        country: countryName, 
        defaultCurrency: code, 
        currencySymbol: symbol 
      });
    } else {
      setFormData({ ...formData, country: countryName });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 py-12">
      <div className="w-full max-w-lg p-8 bg-white rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">Create Company Account</h2>
        {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Your Name</label>
              <input type="text" name="name" required className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md" onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input type="email" name="email" required className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md" onChange={handleChange} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input type="text" name="companyName" required className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md" onChange={handleChange} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" name="password" required className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md" onChange={handleChange} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Country (sets Base Currency)</label>
              <select required className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md" onChange={handleCountryChange} value={formData.country}>
                <option value="">Select a country</option>
                {countries.map(c => (
                  <option key={c.name.common} value={c.name.common}>{c.name.common}</option>
                ))}
              </select>
            </div>
            {formData.defaultCurrency && (
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Company default currency will be: <span className="font-bold text-gray-900">{formData.defaultCurrency} ({formData.currencySymbol})</span></p>
              </div>
            )}
          </div>
          <button type="submit" className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            Sign Up
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account? <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">Sign in</Link>
        </div>
      </div>
    </div>
  );
};
export default Signup;
