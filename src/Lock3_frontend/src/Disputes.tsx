import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  Scale, 
  FileText, 
  Upload, 
  MessageSquare, 
  Clock,
  CheckCircle,
  XCircle,
  User,
  Bot,
  Brain,
  Gavel
} from 'lucide-react';
import { useWallet } from './contexts/WalletContext';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';

const Disputes: React.FC = () => {
  const { isConnected } = useWallet();
  const navigate = useNavigate();
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      navigate('/');
      return;
    }

    // Animate page on mount
    gsap.fromTo('.dispute-card',
      { y: 50, opacity: 0, rotationX: 15 },
      { y: 0, opacity: 1, rotationX: 0, duration: 0.8, stagger: 0.1, ease: 'power2.out' }
    );
  }, [isConnected, navigate]);

  const disputes = [
    {
      id: 'DIS-001',
      escrowId: 'ESC-003',
      type: 'Payment Dispute',
      status: 'pending',
      amount: '25.5 ICP',
      parties: ['alice-principal', 'bob-principal'],
      created: '2024-01-15T10:30:00Z',
      description: 'Buyer claims NFT was not delivered as described in the original listing',
      evidence: ['screenshot1.png', 'conversation.txt', 'original_listing.pdf'],
      aiScore: 0.78,
      priority: 'high',
      votes: { approve: 12, reject: 3 }
    },
    {
      id: 'DIS-002',
      escrowId: 'ESC-007',
      type: 'Service Dispute',
      status: 'resolved',
      amount: '45.0 ICP',
      parties: ['charlie-principal', 'dave-principal'],
      created: '2024-01-12T14:15:00Z',
      description: 'Incomplete service delivery - only 60% of agreed work completed',
      evidence: ['contract.pdf', 'work_samples.zip', 'communication_log.txt'],
      aiScore: 0.85,
      priority: 'medium',
      votes: { approve: 18, reject: 2 }
    },
    {
      id: 'DIS-003',
      escrowId: 'ESC-012',
      type: 'Quality Dispute',
      status: 'analyzing',
      amount: '12.8 ICP',
      parties: ['eve-principal', 'frank-principal'],
      created: '2024-01-10T09:45:00Z',
      description: 'Product quality significantly below expectations and specifications',
      evidence: ['product_photos.zip', 'quality_report.pdf'],
      aiScore: 0.72,
      priority: 'low',
      votes: { approve: 8, reject: 5 }
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'resolved': return 'text-neon-green bg-neon-green/20 border-neon-green/30';
      case 'analyzing': return 'text-icp-blue bg-icp-blue/20 border-icp-blue/30';
      case 'escalated': return 'text-red-400 bg-red-400/20 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'low': return 'text-green-400 bg-green-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const handleAIAnalysis = async (disputeId: string) => {
    setIsAnalyzing(true);
    setSelectedDispute(disputeId);
    
    // Simulate AI analysis with realistic delay
    setTimeout(() => {
      const analysisText = `
**🤖 AI Dispute Analysis Report**

**Confidence Score:** 78.5%
**Risk Assessment:** MEDIUM
**Fraud Indicators:** None detected

**📊 Evidence Analysis:**
• Document authenticity: ✅ Verified
• Timeline consistency: ⚠️ Minor discrepancies detected
• Communication patterns: ✅ Normal
• Similar case precedents: 87% match (favor buyer)

**🎯 Key Findings:**
• Evidence strongly supports buyer's claim regarding NFT description mismatch
• Seller's response time patterns suggest possible avoidance behavior
• Metadata analysis confirms NFT differs from original listing specifications
• Cross-reference with marketplace data shows 15% price discrepancy

**💡 Recommended Resolution:**
• **Primary:** Partial refund of 65% (16.6 ICP) to buyer
• **Secondary:** Full refund with seller penalty (2 ICP)
• **Rationale:** Seller partially fulfilled obligation but failed to meet specifications

**⚖️ Legal Precedent:**
Based on 247 similar cases in our database:
• 73% resolved in favor of buyer
• Average settlement: 62% refund
• Dispute resolution time: 2.3 days

**🔮 Prediction Model:**
• 82% probability of buyer victory in DAO vote
• Estimated resolution time: 1.8 days
• Recommended arbitrator: dao-arbitrator-001

**📋 Next Steps:**
1. Present findings to both parties
2. Initiate 48-hour mediation window
3. If no agreement, escalate to DAO governance vote
4. Execute smart contract resolution automatically
      `;
      
      setAiAnalysis(analysisText);
      setIsAnalyzing(false);
      toast.success('AI analysis completed', {
        icon: '🤖',
        style: {
          background: 'rgba(4, 152, 236, 0.1)',
          border: '1px solid rgba(4, 152, 236, 0.3)',
        }
      });
    }, 4000);
  };

  const handleVote = (disputeId: string, vote: 'approve' | 'reject') => {
    toast.success(`Vote ${vote}d for dispute ${disputeId}`, {
      icon: vote === 'approve' ? '✅' : '❌',
      style: {
        background: vote === 'approve' 
          ? 'rgba(0, 255, 157, 0.1)' 
          : 'rgba(255, 0, 128, 0.1)',
        border: vote === 'approve' 
          ? '1px solid rgba(0, 255, 157, 0.3)' 
          : '1px solid rgba(255, 0, 128, 0.3)',
      }
    });
  };

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="dispute-card mb-8">
          <h1 className="text-4xl font-space font-bold text-gradient mb-4">
            Dispute Resolution
          </h1>
          <p className="text-gray-300 text-lg">
            AI-powered dispute resolution with community governance and transparent voting
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="dispute-card glass rounded-xl p-6 hover-glow transition-all duration-300 transform-3d">
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
              <span className="text-2xl font-space font-bold text-white">8</span>
            </div>
            <p className="text-gray-400">Active Disputes</p>
            <div className="mt-2 text-xs text-yellow-400">+2 this week</div>
          </div>
          <div className="dispute-card glass rounded-xl p-6 hover-glow transition-all duration-300 transform-3d">
            <div className="flex items-center justify-between mb-4">
              <Scale className="h-8 w-8 text-neon-green" />
              <span className="text-2xl font-space font-bold text-white">156</span>
            </div>
            <p className="text-gray-400">Resolved</p>
            <div className="mt-2 text-xs text-neon-green">+24 this month</div>
          </div>
          <div className="dispute-card glass rounded-xl p-6 hover-glow transition-all duration-300 transform-3d">
            <div className="flex items-center justify-between mb-4">
              <Brain className="h-8 w-8 text-icp-blue" />
              <span className="text-2xl font-space font-bold text-white">94.2%</span>
            </div>
            <p className="text-gray-400">AI Accuracy</p>
            <div className="mt-2 text-xs text-icp-blue">+2.1% improvement</div>
          </div>
          <div className="dispute-card glass rounded-xl p-6 hover-glow transition-all duration-300 transform-3d">
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8 text-icp-purple" />
              <span className="text-2xl font-space font-bold text-white">1.8h</span>
            </div>
            <p className="text-gray-400">Avg Resolution</p>
            <div className="mt-2 text-xs text-icp-purple">-0.6h faster</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Disputes List */}
          <div className="lg:col-span-2 space-y-6">
            {disputes.map((dispute) => (
              <div key={dispute.id} className="dispute-card glass rounded-xl p-6 hover-glow transition-all duration-300 border border-icp-blue/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-6 w-6 text-yellow-400" />
                    <div>
                      <h3 className="font-space font-bold text-white text-lg">{dispute.type}</h3>
                      <p className="text-sm text-gray-400">{dispute.id} • {dispute.escrowId}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(dispute.priority)}`}>
                      {dispute.priority}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(dispute.status)}`}>
                      {dispute.status}
                    </span>
                  </div>
                </div>

                <p className="text-gray-300 mb-4 leading-relaxed">{dispute.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-400">Amount</span>
                    <p className="font-space font-medium text-white">{dispute.amount}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">AI Confidence</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-12 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-icp-blue to-neon-green h-2 rounded-full"
                          style={{ width: `${dispute.aiScore * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-icp-blue">{Math.round(dispute.aiScore * 100)}%</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">DAO Votes</span>
                    <p className="font-medium text-white">
                      <span className="text-neon-green">{dispute.votes.approve}</span>
                      {' / '}
                      <span className="text-red-400">{dispute.votes.reject}</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">Created</span>
                    <p className="font-medium text-white">
                      {new Date(dispute.created).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {dispute.evidence.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 px-3 py-1 rounded-full bg-icp-blue/10 border border-icp-blue/20">
                      <FileText className="h-3 w-3 text-icp-blue" />
                      <span className="text-xs text-icp-blue">{file}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 justify-between items-center">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAIAnalysis(dispute.id)}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-icp-blue to-icp-purple hover-glow transition-all duration-300 flex items-center space-x-2 ripple-effect"
                    >
                      <Brain className="h-4 w-4" />
                      <span>AI Analysis</span>
                    </button>
                    <button className="px-4 py-2 rounded-lg glass hover-glow transition-all duration-300 flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>Mediate</span>
                    </button>
                    <button className="px-4 py-2 rounded-lg glass hover-glow transition-all duration-300 flex items-center space-x-2">
                      <Gavel className="h-4 w-4" />
                      <span>Arbitrate</span>
                    </button>
                  </div>
                  
                  {dispute.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleVote(dispute.id, 'approve')}
                        className="px-4 py-2 rounded-lg bg-neon-green/20 text-neon-green hover:bg-neon-green/30 transition-all duration-300 flex items-center space-x-1 border border-neon-green/30"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleVote(dispute.id, 'reject')}
                        className="px-4 py-2 rounded-lg bg-red-400/20 text-red-400 hover:bg-red-400/30 transition-all duration-300 flex items-center space-x-1 border border-red-400/30"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* AI Analysis Panel */}
          <div className="dispute-card glass rounded-xl p-6 border border-icp-blue/20">
            <h2 className="text-xl font-space font-bold text-white mb-4 flex items-center space-x-2">
              <Brain className="h-6 w-6 text-icp-blue" />
              <span>AI Analysis Engine</span>
            </h2>

            {isAnalyzing ? (
              <div className="text-center py-8">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-icp-blue border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="h-8 w-8 text-icp-blue animate-pulse" />
                  </div>
                </div>
                <p className="text-gray-300 mb-4">Analyzing dispute evidence...</p>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-icp-blue rounded-full animate-pulse" />
                    <span>Processing documents...</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-icp-purple rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <span>Cross-referencing precedents...</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    <span>Generating recommendations...</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
                    <span>Calculating confidence scores...</span>
                  </div>
                </div>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-icp-blue/10 border border-icp-blue/30 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                    {aiAnalysis}
                  </pre>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button className="px-4 py-3 rounded-lg bg-neon-green/20 text-neon-green hover:bg-neon-green/30 transition-all duration-300 border border-neon-green/30">
                    Accept Analysis
                  </button>
                  <button className="px-4 py-3 rounded-lg bg-red-400/20 text-red-400 hover:bg-red-400/30 transition-all duration-300 border border-red-400/30">
                    Request Review
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Bot className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">
                  Select a dispute to start AI analysis
                </p>
                <div className="text-sm text-gray-500 leading-relaxed">
                  Our advanced AI system analyzes evidence, cross-references similar cases, 
                  and provides intelligent resolution recommendations with confidence scoring.
                </div>
              </div>
            )}

            {/* Upload Additional Evidence */}
            <div className="mt-6 p-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-icp-blue/50 transition-colors">
              <div className="text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400 mb-2">Upload additional evidence</p>
                <button className="px-4 py-2 rounded-lg glass hover-glow transition-all duration-300 text-sm">
                  Choose Files
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-icp-blue/5 to-icp-purple/5 border border-icp-blue/20">
              <h3 className="font-space font-medium text-white mb-3">AI Performance</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Accuracy Rate:</span>
                  <span className="text-neon-green">94.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cases Analyzed:</span>
                  <span className="text-white">2,847</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Processing:</span>
                  <span className="text-icp-blue">3.2s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Disputes;