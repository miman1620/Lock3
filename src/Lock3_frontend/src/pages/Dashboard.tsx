import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Plus,
  Eye,
  MoreHorizontal,
  Download,
  Filter
} from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { gsap } from 'gsap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const { isConnected, balance, icpPrice } = useWallet();
  const navigate = useNavigate();
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isConnected) {
      navigate('/');
      return;
    }

    // Animate dashboard on mount
    gsap.fromTo('.dashboard-card',
      { y: 50, opacity: 0, rotationX: 15 },
      { y: 0, opacity: 1, rotationX: 0, duration: 0.8, stagger: 0.1, ease: 'power2.out' }
    );
  }, [isConnected, navigate]);

  // Mock data
  const stats = [
    {
      title: 'Total Escrows',
      value: '47',
      change: '+23%',
      icon: <Shield className="h-6 w-6" />,
      color: 'from-icp-blue to-cyan-400',
      trend: 'up'
    },
    {
      title: 'Active Escrows',
      value: '12',
      change: '+5',
      icon: <Clock className="h-6 w-6" />,
      color: 'from-icp-purple to-pink-400',
      trend: 'up'
    },
    {
      title: 'Completed',
      value: '35',
      change: '+18',
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'from-neon-green to-teal-400',
      trend: 'up'
    },
    {
      title: 'Total Value',
      value: `${(parseFloat(balance.icp) * icpPrice).toFixed(2)} USD`,
      change: '+28%',
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'from-orange-400 to-red-400',
      trend: 'up'
    }
  ];

  const escrows = [
    {
      id: 'ESC-001',
      type: 'ICP',
      amount: '25.5 ICP',
      status: 'active',
      counterparty: 'alice-principal-id',
      created: '2024-01-15',
      description: 'NFT Marketplace Purchase',
      progress: 75,
      timeRemaining: '2 days'
    },
    {
      id: 'ESC-002',
      type: 'ckBTC',
      amount: '0.025 ckBTC',
      status: 'completed',
      counterparty: 'bob-principal-id',
      created: '2024-01-12',
      description: 'Freelance Development',
      progress: 100,
      timeRemaining: 'Completed'
    },
    {
      id: 'ESC-003',
      type: 'NFT',
      amount: '1 NFT',
      status: 'disputed',
      counterparty: 'charlie-principal-id',
      created: '2024-01-10',
      description: 'Digital Art Collection',
      progress: 50,
      timeRemaining: 'In dispute'
    },
    {
      id: 'ESC-004',
      type: 'ICP',
      amount: '15.0 ICP',
      status: 'pending',
      counterparty: 'dave-principal-id',
      created: '2024-01-08',
      description: 'Service Agreement',
      progress: 25,
      timeRemaining: '5 days'
    }
  ];

  const chartData = [
    { name: 'Jan', value: 2400, volume: 12 },
    { name: 'Feb', value: 1398, volume: 8 },
    { name: 'Mar', value: 9800, volume: 25 },
    { name: 'Apr', value: 3908, volume: 18 },
    { name: 'May', value: 4800, volume: 32 },
    { name: 'Jun', value: 3800, volume: 28 },
  ];

  const pieData = [
    { name: 'Active', value: 12, color: '#0498EC' },
    { name: 'Completed', value: 35, color: '#00FF9D' },
    { name: 'Disputed', value: 2, color: '#FF0080' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-icp-blue bg-icp-blue/20 border-icp-blue/30';
      case 'completed': return 'text-neon-green bg-neon-green/20 border-neon-green/30';
      case 'disputed': return 'text-red-400 bg-red-400/20 border-red-400/30';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const downloadReport = () => {
    // Mock PDF generation
    const link = document.createElement('a');
    link.href = '#';
    link.download = 'lock3-escrow-report.pdf';
    link.click();
  };

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="dashboard-card flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-space font-bold text-gradient mb-2">
              Dashboard
            </h1>
            <p className="text-gray-300 text-lg">
              Manage your escrow transactions and monitor activity
            </p>
          </div>
          <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row gap-4">
            <button
              onClick={downloadReport}
              className="px-6 py-3 rounded-xl glass hover-glow transition-all duration-300 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </button>
            <button
              onClick={() => navigate('/create')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-icp-blue to-icp-purple hover-glow transition-all duration-300 flex items-center space-x-2 ripple-effect"
            >
              <Plus className="h-4 w-4" />
              <span className="font-medium">New Escrow</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="dashboard-card glass rounded-xl p-6 hover-glow transition-all duration-300 transform-3d card-3d">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                  {stat.icon}
                </div>
                <div className="text-right">
                  <span className={`text-sm font-medium ${
                    stat.trend === 'up' ? 'text-neon-green' : 'text-red-400'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <h3 className="text-2xl font-space font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-gray-400">{stat.title}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Escrow Activity Chart */}
          <div className="dashboard-card lg:col-span-2 glass rounded-xl p-6 border border-icp-blue/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-space font-bold text-white">Escrow Activity</h2>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select className="bg-transparent text-gray-400 text-sm border-none outline-none">
                  <option>Last 6 months</option>
                  <option>Last year</option>
                </select>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1E1E3F', 
                      border: '1px solid #0498EC',
                      borderRadius: '12px',
                      color: '#fff'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#0498EC" 
                    strokeWidth={3}
                    dot={{ fill: '#0498EC', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#9440FF', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="dashboard-card glass rounded-xl p-6 border border-icp-blue/20">
            <h2 className="text-xl font-space font-bold text-white mb-6">Status Distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1E1E3F', 
                      border: '1px solid #0498EC',
                      borderRadius: '8px',
                      color: '#fff'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-300">{item.name}</span>
                  </div>
                  <span className="text-white font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Escrows Table */}
        <div className="dashboard-card glass rounded-xl p-6 border border-icp-blue/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-space font-bold text-white">Recent Escrows</h2>
            <button className="text-icp-blue hover:text-icp-purple transition-colors flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>View All</span>
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-4 px-4 text-gray-400 font-space font-medium">ID</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-space font-medium">Type</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-space font-medium">Amount</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-space font-medium">Status</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-space font-medium">Progress</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-space font-medium">Counterparty</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-space font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {escrows.map((escrow) => (
                  <tr key={escrow.id} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-mono text-sm text-icp-blue font-medium">{escrow.id}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-white font-medium">{escrow.type}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-white font-medium">{escrow.amount}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(escrow.status)}`}>
                        {escrow.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-icp-blue to-neon-green h-2 rounded-full transition-all duration-300"
                            style={{ width: `${escrow.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{escrow.progress}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-300 font-mono text-sm">
                        {escrow.counterparty.slice(0, 12)}...
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button className="p-2 rounded-lg glass hover-glow transition-all duration-300">
                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;