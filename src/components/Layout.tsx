import { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, CreditCard, List, Shield, LogOut, MessageCircle } from 'lucide-react';
import { getAuthToken, removeAuthToken } from '../lib/api';

export default function Layout() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = getAuthToken();
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      navigate('/auth');
    } else {
      setUser(JSON.parse(userData));
    }
  }, [navigate]);

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem('user');
    navigate('/auth');
  };

  if (!user) return null;

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Add Balance', path: '/add-balance', icon: CreditCard },
    { name: 'Orders', path: '/orders', icon: List },
    { name: 'Admin Panel', path: '/admin', icon: Shield },
  ];

  return (
    <div className="w-full h-screen bg-slate-100 flex overflow-hidden font-sans text-slate-800">
      {/* Sidebar Navigation - Fixed for Desktop, toggleable for Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 rounded-xl flex items-center justify-center text-white shadow-lg">
              <span className="font-black text-xl">IG</span>
            </div>
            <h1 className="font-bold text-lg tracking-tight">Insta Grow <span className="text-purple-600">2026</span></h1>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-lg font-semibold transition-colors ${
                  isActive 
                    ? 'bg-purple-50 text-purple-700' 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4">
          <button onClick={handleLogout} className="w-full flex items-center justify-between p-3 bg-slate-800 text-white rounded-lg hover:bg-black transition-all">
            <div className="flex items-center gap-3">
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </div>
          </button>
        </div>

        <div className="p-6 border-t border-slate-100 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-600 uppercase">
              {user.username ? user.username.substring(0, 2) : 'US'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 leading-tight">@{user.username || 'User'}</span>
              <span className="text-xs text-slate-500">Balance: ₹{user.balance?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 flex-shrink-0">
          <div className="flex items-center gap-4 sm:gap-8">
            <button onClick={() => setIsOpen(true)} className="md:hidden text-slate-500 hover:text-slate-700">
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:block bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
              Avg. Processing Time: 30 Mins
            </div>
            <div className="text-slate-400 text-sm italic hidden sm:block">Grow your presence instantly</div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Customer Support</span>
              <span className="text-sm font-bold text-slate-700">+91 91369 31343</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </div>

        {/* Bottom Status Bar */}
        <footer className="h-10 bg-slate-800 px-4 sm:px-8 flex items-center justify-between text-[10px] text-slate-400 flex-shrink-0">
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Server Status: Stable</span>
            <span className="hidden sm:inline">System v2.6.1</span>
          </div>
          <div>© 2026 Insta Grow. One-use screenshot verification active.</div>
        </footer>
      </main>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/919136931343"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-14 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-transform hover:scale-110 z-20"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    </div>
  );
}
