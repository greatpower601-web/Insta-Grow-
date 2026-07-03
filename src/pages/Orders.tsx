import { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { PackageOpen } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await fetchApi('/orders');
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) return <div className="text-center py-10">Loading orders...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-800">My Orders</h3>
        <PackageOpen className="text-slate-400 w-5 h-5" />
      </div>
      
      {orders.length === 0 ? (
        <div className="p-10 text-center text-slate-500">
          No orders found.
        </div>
      ) : (
        <div className="overflow-x-auto p-6 flex-1">
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-slate-200 shadow-sm font-bold text-xs text-slate-500">
                  #{order.id}
                </div>
                <div className="flex-1 min-w-0 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-bold text-slate-800 truncate">{order.quantity} <span className="capitalize">{order.service}</span></div>
                    <div className="text-[10px] text-slate-500">
                      <a href={order.link} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline">Link</a>
                      <span className="mx-2">•</span>
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-sm font-bold text-slate-800">₹{order.price.toFixed(2)}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
