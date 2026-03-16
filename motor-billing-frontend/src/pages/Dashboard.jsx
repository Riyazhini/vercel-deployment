import { useState, useEffect } from 'react';
import { 
  Users, 
  Package, 
  Receipt, 
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import api from '../services/api';

const LOW_STOCK_THRESHOLD = 5;

const StatCard = ({ item }) => (
  <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 transition-all hover:shadow-md">
    <div className="absolute rounded-md bg-theme-primary/10 p-3">
      <item.icon className="h-6 w-6 text-theme-primary" aria-hidden="true" />
    </div>
    <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
    <div className="ml-16 flex items-baseline pb-1 sm:pb-2">
      <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
      <p className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
        {item.change}
      </p>
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState([
    { name: 'Total Revenue', value: '₹0', change: '+0%', icon: TrendingUp },
    { name: 'Active Customers', value: '0', change: '+0%', icon: Users },
    { name: 'Total Products', value: '0', change: '+0%', icon: Package },
    { name: 'Total Bills', value: '0', change: '+0%', icon: Receipt },
  ]);
  const [chartData, setChartData] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [billsRes, customersRes, productsRes] = await Promise.all([
        api.get('/bills'),
        api.get('/customers'),
        api.get('/products')
      ]);

      const bills = billsRes.data;
      const customers = customersRes.data;
      const products = productsRes.data;

      const totalRevenue = bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
      
      // Calculate low stock items
      const lowStock = products.filter(p => p.stock < LOW_STOCK_THRESHOLD);
      setLowStockProducts(lowStock);

      setStats([
        { 
          name: 'Total Revenue', 
          value: `₹${totalRevenue.toLocaleString('en-IN')}`, 
          change: '+12.5%', 
          icon: TrendingUp 
        },
        { 
          name: 'Active Customers', 
          value: customers.length.toString(), 
          change: '+4.2%', 
          icon: Users 
        },
        { 
          name: 'Total Products', 
          value: products.length.toString(), 
          change: '+1.4%', 
          icon: Package 
        },
        { 
          name: 'Total Bills', 
          value: bills.length.toString(), 
          change: '+8.1%', 
          icon: Receipt 
        },
      ]);

      // Mock chart data for now based on actual monthly sales if we have them
      const salesByMonth = bills.reduce((acc, bill) => {
        const month = new Date(bill.date).toLocaleString('default', { month: 'short' });
        acc[month] = (acc[month] || 0) + bill.totalAmount;
        return acc;
      }, {});

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedChartData = Object.keys(salesByMonth).length > 0
        ? monthNames.map(m => ({ name: m, sales: salesByMonth[m] || 0 })).filter(d => d.sales > 0 || monthNames.indexOf(d.name) <= new Date().getMonth())
        : [
            { name: 'Jan', sales: 4000 },
            { name: 'Feb', sales: 3000 },
            { name: 'Mar', sales: 2000 },
            { name: 'Apr', sales: 2780 },
            { name: 'May', sales: 1890 },
            { name: 'Jun', sales: 2390 },
          ];

      setChartData(formattedChartData);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Dashboard Overview
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Real-time summary of your sales and inventory status.
        </p>
      </div>

      {/* Low Stock Alert Section */}
      {lowStockProducts.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-800">
                Low Stock Alert — {lowStockProducts.length} items need attention
              </h3>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {lowStockProducts.map(product => (
                  <div key={product._id} className="text-xs text-amber-700 flex justify-between bg-amber-100/50 p-2 rounded-md">
                    <span className="font-medium">{product.name}</span>
                    <span className="font-bold underline">{product.stock} left</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.name} item={item} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
          <h3 className="text-base font-semibold leading-6 text-gray-900 mb-6">
            Monthly Performance
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280' }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#F5F3FF' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: '600' }}
                />
                <Bar 
                  dataKey="sales" 
                  fill="#4F46E5" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions or Recent Alerts */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 h-fit">
          <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">
            Inventory Shortlist
          </h3>
          <div className="flow-root">
            <ul role="list" className="-my-5 divide-y divide-gray-200">
              {lowStockProducts.slice(0, 5).map((product) => (
                <li key={product._id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {product.brand}
                      </p>
                    </div>
                    <div>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${product.stock === 0 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                        {product.stock} in stock
                      </span>
                    </div>
                  </div>
                </li>
              ))}
              {lowStockProducts.length === 0 && (
                <p className="py-10 text-center text-sm text-gray-400 italic">No inventory issues found.</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}