import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi, setAuthToken } from '../lib/api';
import { UserPlus, LogIn } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin ? { email, password } : { email, username, password };
      
      const data = await fetchApi(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      
      setAuthToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <span className="font-black text-3xl">IG</span>
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-800 tracking-tight">
          Insta Grow <span className="text-purple-600">2026</span>
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          {isLogin ? 'Sign in to your account' : 'Create your account'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}
            
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Username</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Email address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center items-center py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg shadow-purple-200 hover:opacity-90 active:scale-[0.98] transition-all"
              >
                {isLogin ? <LogIn className="w-5 h-5 mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
                {isLogin ? 'Sign in' : 'Sign up'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-purple-600 hover:text-purple-500 font-bold transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
