import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, PieChart, Pie
} from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, Users, Award } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgTicket: 0,
    activeUsers: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

        // Calculations
        let revenue = 0;
        const dailyData: { [key: string]: number } = {};
        const productStats: { [key: string]: { name: string, count: number, revenue: number } } = {};
        const uniqueUsers = new Set();

        orders.forEach(order => {
          if (order.status !== 'cancelled') {
            revenue += order.total;
            uniqueUsers.add(order.userId);

            // Chart data (by date)
            const date = order.createdAt?.toDate 
              ? order.createdAt.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
              : new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            
            dailyData[date] = (dailyData[date] || 0) + order.total;

            // Product stats
            order.items.forEach((item: any) => {
              const pid = item.name; // Using name as key for simplicity if ID is not available
              if (!productStats[pid]) {
                productStats[pid] = { name: item.name, count: 0, revenue: 0 };
              }
              productStats[pid].count += item.quantity;
              productStats[pid].revenue += (item.price * item.quantity);
            });
          }
        });

        const formattedChartData = Object.entries(dailyData)
          .map(([date, total]) => ({ date, total }))
          .reverse()
          .slice(-7); // Last 7 days

        const topProductsData = Object.values(productStats)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setStats({
          totalRevenue: revenue,
          totalOrders: orders.length,
          avgTicket: orders.length > 0 ? revenue / orders.length : 0,
          activeUsers: uniqueUsers.size
        });
        setChartData(formattedChartData);
        setTopProducts(topProductsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="py-20 text-center italic text-gray-400">Gerando relatório de vendas...</div>;

  return (
    <div className="space-y-12">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Receita Total', value: `R$ ${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'bg-green-50 text-green-600' },
          { label: 'Pedidos', value: stats.totalOrders, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
          { label: 'Ticket Médio', value: `R$ ${stats.avgTicket.toFixed(2)}`, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
          { label: 'Clientes Únicos', value: stats.activeUsers, icon: Users, color: 'bg-orange-50 text-orange-600' },
        ].map((item, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100"
          >
            <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center mb-4`}>
              <item.icon className="w-6 h-6" />
            </div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">{item.label}</p>
            <p className="text-3xl font-serif font-bold">{item.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Sales Chart */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
          <h3 className="text-xl font-serif font-bold mb-8">Vendas (Últimos 7 dias)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="total" fill="#f472b6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-8">
            <Award className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-serif font-bold">Mais Vendidos</h3>
          </div>
          <div className="space-y-6">
            {topProducts.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{product.name}</p>
                    <p className="text-xs text-gray-400 italic lowercase">{product.count} vendidos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">R$ {product.revenue.toFixed(2)}</p>
                  <div className="w-32 bg-gray-50 h-1.5 rounded-full overflow-hidden mt-1">
                    <div 
                      className="bg-primary h-full rounded-full" 
                      style={{ width: `${(product.revenue / stats.totalRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
