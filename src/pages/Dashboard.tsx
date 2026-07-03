import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { User, CreditCard, Package, Wallet, PlusCircle, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const SERVICES = {
  followers: { name: 'Instagram Followers', pricePer1000: 180, min: 50 }, // 50 for 9 rs -> 180 per 1000
  likes: { name: 'Instagram Likes', pricePer1000: 180, min: 50 },     // 50 for 9 rs -> 180 per 1000
  views: { name: 'Instagram Views', pricePer1000: 200, min: 50 },      // 50 for 10 rs -> 200 per 1000
};

export default function Dashboard() {
  const [userData, setUserData] = useState<any>(null);
  const [category, setCategory] = useState('followers');
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await fetchApi('/users/me');
      setUserData(data);
    } catch (err: any) {
      if (err.message.includes('401') || err.message.includes('403')) {
        navigate('/auth');
      }
    }
  };

  useEffect(() => {
    if (quantity && quantity >= SERVICES[category as keyof typeof SERVICES].min) {
      const rate = SERVICES[category as keyof typeof SERVICES].pricePer1000;
      setPrice((quantity / 1000) * rate);
    } else {
      setPrice(0);
    }
  }, [quantity, category]);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!quantity || quantity < SERVICES[category as keyof typeof SERVICES].min) {
      return setError(`Minimum quantity is ${SERVICES[category as keyof typeof SERVICES].min}`);
    }

    setLoading(true);
    try {
      await fetchApi('/orders', {
        method: 'POST',
        body: JSON.stringify({
          category: 'Instagram',
          service: category,
          link,
          quantity: Number(quantity),
          price
        })
      });
      setSuccess('Order placed successfully! Delivery starts in ~30 mins.');
      setLink('');
      setQuantity('');
      loadUserData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!userData) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-6 py-1"><div className="h-2 bg-slate-200 rounded"></div></div></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-full">
      
      {/* Left Column: New Order */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Create New Order</h2>
            <span className="text-xs text-slate-400">Insta Grow 2026</span>
          </div>
          
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
          {success && <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm">{success}</div>}

          <form onSubmit={handleOrder} className="space-y-4 flex-1">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Select Service</label>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(SERVICES).map(([key, svc]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={`p-3 rounded-xl text-left transition-colors border-2 ${
                      category === key 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-transparent border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className={`block font-bold ${category === key ? 'text-purple-900' : 'text-slate-900'}`}>{svc.name.replace('Instagram ', '')}</span>
                    <span className={`text-xs ${category === key ? 'text-purple-600' : 'text-slate-500'}`}>₹{svc.pricePer1000 * 50 / 1000} for 50</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Instagram Link / Username</label>
              <input
                type="url"
                required
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://instagram.com/profile..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-500 mt-2 ml-1 font-semibold flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2 inline-block"></span>
                Average time: 30 min
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Quantity</label>
                <input
                  type="number"
                  required
                  min={SERVICES[category as keyof typeof SERVICES].min}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                  placeholder={`Min: ${SERVICES[category as keyof typeof SERVICES].min}`}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Final Price (₹)</label>
                <div className="px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-900 text-lg flex items-center h-12">
                  ₹{price.toFixed(2)}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg shadow-purple-200 hover:opacity-90 active:scale-[0.98] transition-all mt-6 disabled:opacity-70"
            >
              {loading ? 'Processing...' : 'Confirm Placement'}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Balance & Status */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* User Welcome Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col space-y-4">
           <div className="flex items-center space-x-4">
            <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200">
              <User className="h-8 w-8 text-slate-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                {userData.username} <span className="ml-1 text-purple-500">✓</span>
              </h2>
              <p className="text-slate-500 text-sm">Welcome To Insta Grow 2026</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <p className="text-[10px] uppercase text-slate-400 font-bold">Total Spent</p>
              <h3 className="text-lg font-bold text-slate-800">₹ {userData.total_spent?.toFixed(2) || '0.00'}</h3>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-400 font-bold">Total Orders</p>
              <h3 className="text-lg font-bold text-slate-800">{userData.total_orders || 0}</h3>
            </div>
          </div>
        </div>

        {/* Wallet / Balance Info - styled like theme */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-sm border border-slate-800">
          <div className="flex items-center justify-between mb-4">
             <h3 className="font-bold flex items-center gap-2"><Wallet className="w-5 h-5 text-purple-400"/> Current Balance</h3>
             <span className="text-2xl font-mono text-purple-400">₹{userData.balance?.toFixed(2) || '0.00'}</span>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-4 mt-6">
            <Link to="/add-balance" className="flex-1 bg-white text-slate-900 text-center py-3 rounded-xl font-bold shadow-md hover:bg-slate-100 transition-colors text-sm">
              Add Balance
            </Link>
            <a href="https://wa.me/919136931343" target="_blank" rel="noreferrer" className="flex-1 bg-slate-800 border border-slate-700 text-white text-center py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors flex items-center justify-center text-sm">
              <Users className="w-4 h-4 mr-2"/> Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
