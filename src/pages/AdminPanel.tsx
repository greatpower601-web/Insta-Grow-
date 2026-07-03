import React, { useState, useEffect } from 'react';
import { fetchApi, removeAuthToken } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'admin') {
      setIsAdmin(true);
      loadAdminData();
    }
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'instagrow444') {
      try {
        await fetchApi('/admin/promote', {
          method: 'POST',
          body: JSON.stringify({ secret: password })
        });
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.role = 'admin';
        localStorage.setItem('user', JSON.stringify(user));
        setIsAdmin(true);
        loadAdminData();
      } catch (err: any) {
        alert(err.message);
      }
    } else {
      alert('Incorrect admin password');
    }
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [ordersData, paymentsData] = await Promise.all([
        fetchApi('/admin/orders'),
        fetchApi('/admin/payments')
      ]);
      setOrders(ordersData);
      setPayments(paymentsData);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (id: number, status: string) => {
    try {
      await fetchApi(`/admin/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      loadAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mt-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Admin Access</h2>
        <form onSubmit={handleAdminLogin}>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter Admin Password"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 mb-4"
          />
          <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white p-3 rounded-lg font-bold transition-colors">
            Access Panel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-4 text-center font-bold text-sm ${activeTab === 'orders' ? 'text-purple-700 border-b-2 border-purple-500 bg-purple-50' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Manage Orders
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex-1 py-4 text-center font-bold text-sm ${activeTab === 'payments' ? 'text-purple-700 border-b-2 border-purple-500 bg-purple-50' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Payment History
        </button>
      </div>

      <div className="p-4">
        {loading ? <p className="text-slate-500 font-bold p-4">Loading...</p> : (
          <>
            {activeTab === 'orders' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Details</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-bold text-slate-600">#{o.id}</td>
                        <td className="px-4 py-3 text-sm font-bold text-slate-800">{o.username}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {o.quantity} <span className="capitalize">{o.service}</span> <br/>
                          <a href={o.link} target="_blank" className="text-purple-600 hover:underline font-medium">Link</a>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${o.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{o.status}</span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <select 
                            value={o.status} 
                            onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                            className="border border-slate-200 rounded p-1.5 text-sm bg-slate-50 font-semibold focus:outline-none focus:border-purple-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Screenshot</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-bold text-slate-600">#{p.id}</td>
                        <td className="px-4 py-3 text-sm font-bold text-slate-800">{p.username}</td>
                        <td className="px-4 py-3 text-sm font-bold text-emerald-600">₹{p.amount.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm">
                          <a href={p.screenshot_url} target="_blank" className="text-purple-600 hover:underline inline-flex items-center font-medium">
                            View Image
                          </a>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${p.status === 'pending' ? 'bg-amber-50 text-amber-600' : p.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
