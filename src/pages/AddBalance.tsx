import React, { useState } from 'react';
import { getAuthToken, API_URL } from '../lib/api';
import { UploadCloud, CheckCircle } from 'lucide-react';

export default function AddBalance() {
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError('Please upload a screenshot of your payment');
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return setError('Please enter a valid amount');

    setError('');
    setSuccess('');
    setLoading(true);

    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('screenshot', file);

    try {
      const response = await fetch(`${API_URL}/payments/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: formData
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        throw new Error('Server returned an unexpected response. File might be too large.');
      }

      if (!response.ok) throw new Error(data.error || 'Failed to upload');

      setSuccess(data.message || 'Payment verified and balance added successfully!');
      setAmount('');
      setFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 text-xl">Add Balance</h3>
      </div>
      
      <p className="text-slate-500 mb-6 text-sm">Follow the instructions below to add funds to your account.</p>

      <div className="bg-slate-900 rounded-xl p-5 text-white mb-6">
        <div className="text-[10px] uppercase text-slate-400 font-bold mb-1">UPI ID For Payment</div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-mono tracking-wider">8898132749@fam</span>
          <button onClick={() => navigator.clipboard.writeText('8898132749@fam')} type="button" className="text-xs text-purple-400 border border-purple-800 px-2 py-1 rounded hover:bg-purple-900/50 transition-colors">Copy</button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
      {success && (
        <div className="mb-4 p-4 bg-emerald-50 text-emerald-700 rounded-lg flex items-center text-sm">
          <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="number"
            required
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            placeholder="Enter Amount Paid (₹)"
          />
        </div>

        <div>
          <label className="relative border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer">
            <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-xs font-bold text-slate-500">{file ? file.name : "UPLOAD SCREENSHOT"}</span>
            <span className="text-[10px] text-slate-400 mt-1">Security: Single-use verification active</span>
            <input
              type="file"
              className="sr-only"
              accept="image/*"
              required
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 transition-colors disabled:opacity-70 mt-2"
        >
          {loading ? 'Uploading...' : 'Verify & Add'}
        </button>
      </form>
    </div>
  );
}
