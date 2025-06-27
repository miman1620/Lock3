import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Vote, 
  TrendingUp, 
  Shield, 
  Settings,
  BarChart3,
  PieChart,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { useWallet } from './contexts/WalletContext';
import { gsap } from 'gsap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

const Admin: React.FC = () => {
  const { isConnected } = useWallet();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isConnected) {
      navigate('/');
      return;
    }

    // Animate page on mount
    gsap.fromTo('.admin-card',
      { y: 50, opacity: 0, rotationX: 15 },
      { y: 0, opacity: 1, rotationX: 0, duration: 0.8, stagger: 0.1, ease: 'power2.out' }
    );
  }, [isConnected, navigate]);

  // Mock data for admin dashboard
  const daoStats = [
    {
      title: 'Total Proposals',
      value: '127',
      change: '+8',
      icon: <Vote className="h-6 w-6" />,
      color: 'from-icp-blue to-cyan-400'
    },
    {
      title: 'Active Voters',
      value: '2,847',
      change: '+156',
      icon: <Users className="h-6 w-6" />,
      color: 'from-icp-purple to-pink-400'
    },
    {
      title: 'Governance Token',
      value: '45.2M',
      change: '+2.1M',
      icon: <Shield className="h-6 w-6" />,
      color: 'from-neon-green to-teal-400'
    },
    {
      title: 'Treasury Value',
      value: '$2.8M',
      change: '+12%',
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'from-orange-400 to-red-400'
    }
  ];

  const proposals = [
    {
      id: 'PROP-001',
      title: 'Increase Arbitrator Rewards',
      description: 'Proposal to increase arbitrator rewards by 25% to incentivize participation',
      status: 'active',
      votes: { for: 1247, against: 234 },
      timeRemaining: '2 days',
      proposer: 'dao-member-001'
    },
    {
      id: 'PROP-002',
      title: 'New Dispute Resolution Algorithm',
      description: 'Implement ML-based dispute resolution for faster processing',
      status: 'passed',
      votes: { for: 2156, against: 89 },
      timeRemaining: 'Executed',
      proposer: 'dao-member-002'
    },
    {
      id: 'PROP-003',
      title: 'Fee Structure Update',
      description: 'Reduce platform fees for small transactions under 1 ICP',
      status: 'pending',
      votes: { for: 0, against: 0 },
      timeRemaining: '5 days',
      proposer: 'dao-member-003'
    }
  ];

  const volumeData = [
    { name: 'Jan', volume: 2400, transactions: 120 },
    { name: 'Feb', volume: 1398, transactions: 89 },
    { name: 'Mar', volume: 9800, transactions: 245 },
    { name: 'Apr', volume: 3908, transactions: 178 },
    { name: 'May', volume: 4800, transactions: 234 },
    { name: 'Jun', volume: 3800, transactions: 198 },
  ];

  const assetDistribution = [
    { name: 'ICP', value: 45, color: '#0498EC' },
    { name: 'ckBTC', value: 25, color: '#9440FF' },
    { name: 'ICRC-1', value: 20, color: '#00FF9D' },
    { name: 'NFTs', value: 10, color: '#FF0080' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-icp-blue bg-icp-blue/20 border-icp-blue/30';
      case 'passed': return 'text-neon-green bg-neon-green/20 border-neon-green/30';
      case 'rejected': return 'text-red-400 bg-red-400/20 border-red-400/30';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'proposals', label: 'Proposals', icon: <Vote className="h-4 w-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <PieChart className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {daoStats.map((stat, index) => (
                <div key={index} className="admin-card glass rounded-xl p-6 hover-glow transition-all duration-300 transform-3d">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                      {stat.icon}
                    </div>
                    <span className="text-sm font-medium text-neon-green">
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-2xl font-space font-bold text-white mb-1">{stat.value}</h3>
                  <p className="text-gray-400">{stat.title}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="admin-card glass rounded-xl p-6 border border-icp-blue/20">
                <h3 className="text-xl font-space font-bold text-white mb-6">Platform Volume</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volumeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1E1E3F', 
                          border: '1px solid #0498EC',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                      <Bar dataKey="volume" fill="#0498EC" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="admin-card glass rounded-xl p-6 border border-icp-blue/20">
                <h3 className="text-xl font-space font-bold text-white mb-6">Asset Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={assetDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {assetDistribution.map((entry, index) => (
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
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {assetDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-gray-300 text-sm">{item.name}</span>
                      </div>
                      <span className="text-white font-medium text-sm">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'proposals':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-space font-bold text-white">DAO Proposals</h3>
              <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-icp-blue to-icp-purple hover-glow transition-all duration-300">
                Create Proposal
              </button>
            </div>

            {proposals.map((proposal) => (
              <div key={proposal.id} className="admin-card glass rounded-xl p-6 border border-icp-blue/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-space font-bold text-white text-lg mb-2">{proposal.title}</h4>
                    <p className="text-gray-300 mb-2">{proposal.description}</p>
                    <p className="text-sm text-gray-400">Proposed by: {proposal.proposer}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(proposal.status)}`}>
                    {proposal.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-400">Votes For</span>
                    <p className="text-lg font-bold text-neon-green">{proposal.votes.for.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">Votes Against</span>
                    <p className="text-lg font-bold text-red-400">{proposal.votes.against.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">Time Remaining</span>
                    <p className="text-lg font-bold text-white">{proposal.timeRemaining}</p>
                  </div>
                </div>

                {proposal.status === 'active' && (
                  <div className="flex space-x-3">
                    <button className="flex-1 px-4 py-2 rounded-lg bg-neon-green/20 text-neon-green hover:bg-neon-green/30 transition-all duration-300 border border-neon-green/30">
                      Vote For
                    </button>
                    <button className="flex-1 px-4 py-2 rounded-lg bg-red-400/20 text-red-400 hover:bg-red-400/30 transition-all duration-300 border border-red-400/30">
                      Vote Against
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-8">
            <h3 className="text-2xl font-space font-bold text-white">Platform Analytics</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="admin-card glass rounded-xl p-6 border border-icp-blue/20">
                <h4 className="text-lg font-space font-bold text-white mb-4">Transaction Trends</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={volumeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1E1E3F', 
                          border: '1px solid #0498EC',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="transactions" 
                        stroke="#0498EC" 
                        strokeWidth={3}
                        dot={{ fill: '#0498EC', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="admin-card glass rounded-xl p-6 border border-icp-blue/20">
                <h4 className="text-lg font-space font-bold text-white mb-4">System Health</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Uptime</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-neon-green rounded-full animate-pulse" />
                      <span className="text-neon-green font-medium">99.98%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Response Time</span>
                    <span className="text-white font-medium">0.3s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Active Canisters</span>
                    <span className="text-white font-medium">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Cycles Balance</span>
                    <span className="text-white font-medium">2.4T</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-8">
            <h3 className="text-2xl font-space font-bold text-white">Platform Settings</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="admin-card glass rounded-xl p-6 border border-icp-blue/20">
                <h4 className="text-lg font-space font-bold text-white mb-4">Fee Configuration</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Platform Fee (%)</label>
                    <input 
                      type="number" 
                      defaultValue="2.5" 
                      className="w-full px-4 py-2 rounded-lg glass border border-gray-600 focus:border-icp-blue bg-transparent text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Arbitrator Fee (%)</label>
                    <input 
                      type="number" 
                      defaultValue="1.0" 
                      className="w-full px-4 py-2 rounded-lg glass border border-gray-600 focus:border-icp-blue bg-transparent text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Minimum Escrow (ICP)</label>
                    <input 
                      type="number" 
                      defaultValue="0.1" 
                      className="w-full px-4 py-2 rounded-lg glass border border-gray-600 focus:border-icp-blue bg-transparent text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="admin-card glass rounded-xl p-6 border border-icp-blue/20">
                <h4 className="text-lg font-space font-bold text-white mb-4">Security Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Two-Factor Authentication</span>
                    <button className="px-3 py-1 rounded-lg bg-neon-green/20 text-neon-green text-sm">
                      Enabled
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Rate Limiting</span>
                    <button className="px-3 py-1 rounded-lg bg-neon-green/20 text-neon-green text-sm">
                      Active
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Auto-backup</span>
                    <button className="px-3 py-1 rounded-lg bg-neon-green/20 text-neon-green text-sm">
                      Daily
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="admin-card mb-8">
          <h1 className="text-4xl font-space font-bold text-gradient mb-4">
            Admin Dashboard
          </h1>
          <p className="text-gray-300 text-lg">
            DAO governance, platform analytics, and system administration
          </p>
        </div>

        {/* Tabs */}
        <div className="admin-card mb-8">
          <div className="flex space-x-1 bg-gray-800/50 rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-icp-blue to-icp-purple text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Admin;