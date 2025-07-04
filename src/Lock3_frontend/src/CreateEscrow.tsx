import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Plus, Clock, Users, ArrowRight, Check, Upload, FileText } from 'lucide-react';
import { useWallet } from './contexts/WalletContext';
import { useEscrow, useFormatters } from './hooks/useBackend';
import { CreateEscrowArgs } from './types/backend';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import LoadingSpinner from './components/LoadingSpinner';

const CreateEscrow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    assetType: 'ICP',
    amount: '',
    recipient: '',
    conditions: 'manual',
    timelock: '',
    description: '',
    arbitrator: '',
    files: [] as File[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gasEstimate, setGasEstimate] = useState('0.001');
  const { isConnected, principalText, balance } = useWallet();
  const { createEscrow, loading } = useEscrow();
  const { createAssetType, createEscrowCondition, parseAmount } = useFormatters();
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      navigate('/');
      return;
    }

    // Animate form on mount
    gsap.fromTo('.form-container',
      { x: 50, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
    );

    // Animate progress bar
    gsap.to('.progress-fill', {
      width: `${(currentStep / 4) * 100}%`,
      duration: 0.5,
      ease: 'power2.out'
    });
  }, [isConnected, navigate, currentStep]);

  const steps = [
    { id: 1, title: 'Asset Details', icon: <Shield className="h-5 w-5" />, description: 'Choose asset type and amount' },
    { id: 2, title: 'Parties', icon: <Users className="h-5 w-5" />, description: 'Set recipient and arbitrator' },
    { id: 3, title: 'Conditions', icon: <Clock className="h-5 w-5" />, description: 'Define release conditions' },
    { id: 4, title: 'Review', icon: <Check className="h-5 w-5" />, description: 'Confirm and deploy' },
  ];

  const assetTypes = [
    { value: 'ICP', label: 'ICP Tokens', icon: '🔷', description: 'Native Internet Computer tokens' },
    { value: 'ICRC1', label: 'ICRC-1 Tokens', icon: '🪙', description: 'Standard fungible tokens' },
    { value: 'ckBTC', label: 'ckBTC', icon: '₿', description: 'Chain-key Bitcoin' },
    { value: 'NFT', label: 'NFT Collection', icon: '🎨', description: 'Non-fungible tokens' },
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      // Validate current step
      if (!validateStep(currentStep)) return;

      // Animate step transition
      gsap.to('.step-content', {
        x: -50,
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          setCurrentStep(currentStep + 1);
          gsap.fromTo('.step-content',
            { x: 50, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.3 }
          );
        }
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      gsap.to('.step-content', {
        x: 50,
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          setCurrentStep(currentStep - 1);
          gsap.fromTo('.step-content',
            { x: -50, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.3 }
          );
        }
      });
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
          toast.error('Please enter a valid amount');
          return false;
        }
        if (!formData.description.trim()) {
          toast.error('Please provide a description');
          return false;
        }
        break;
      case 2:
        if (!formData.recipient.trim()) {
          toast.error('Please enter recipient principal ID');
          return false;
        }
        break;
      case 3:
        if (formData.conditions === 'timelock' && !formData.timelock) {
          toast.error('Please set a timelock date');
          return false;
        }
        break;
    }
    return true;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData({ ...formData, files: [...formData.files, ...files] });
    toast.success(`${files.length} file(s) uploaded`);
  };

  const removeFile = (index: number) => {
    const newFiles = formData.files.filter((_, i) => i !== index);
    setFormData({ ...formData, files: newFiles });
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    
    try {
      // Prepare escrow arguments
      const escrowArgs: CreateEscrowArgs = {
        seller: formData.recipient,
        arbitrator: formData.arbitrator || null,
        assetType: createAssetType(formData.assetType),
        amount: parseAmount(formData.amount),
        description: formData.description,
        conditions: createEscrowCondition(formData.conditions, formData.timelock),
        metadata: [
          ['gasEstimate', gasEstimate],
          ['category', 'escrow'],
          ...formData.files.map((file, index) => [`file_${index}`, file.name] as [string, string])
        ]
      };

      // Create escrow using backend
      const escrow = await createEscrow(escrowArgs);
      
      if (escrow) {
        toast.success('Escrow created successfully!', {
          icon: '🎉',
          duration: 4000,
        });
        
        // Confetti animation
        const confetti = document.createElement('div');
        confetti.className = 'fixed inset-0 pointer-events-none z-50';
        confetti.innerHTML = '🎉'.repeat(50);
        document.body.appendChild(confetti);
        
        gsap.fromTo(confetti.children,
          { y: -100, opacity: 0, rotation: 0, scale: 0 },
          { 
            y: window.innerHeight + 100, 
            opacity: 1, 
            rotation: 360,
            scale: 1,
            duration: 3,
            stagger: 0.1,
            ease: 'power2.out',
            onComplete: () => {
              document.body.removeChild(confetti);
            }
          }
        );
        
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Failed to create escrow. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content space-y-8">
            <div>
              <label className="text-lg font-space font-medium text-white mb-4 block">
                Asset Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assetTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setFormData({ ...formData, assetType: type.value })}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 transform-3d ${
                      formData.assetType === type.value
                        ? 'border-icp-blue bg-icp-blue/10 scale-105'
                        : 'border-gray-600 hover:border-gray-500 hover:scale-102'
                    }`}
                  >
                    <div className="text-3xl mb-3">{type.icon}</div>
                    <div className="font-space font-medium text-white mb-1">{type.label}</div>
                    <div className="text-sm text-gray-400">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-lg font-space font-medium text-white mb-3 block">
                  Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-4 rounded-xl glass border border-gray-600 focus:border-icp-blue bg-transparent text-white placeholder-gray-400 text-lg"
                    placeholder="0.000"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-icp-blue font-medium">
                    {formData.assetType}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  Available: {balance.icp} ICP
                </div>
              </div>

              <div>
                <label className="text-lg font-space font-medium text-white mb-3 block">
                  Gas Estimate
                </label>
                <div className="p-4 rounded-xl glass border border-gray-600">
                  <div className="text-2xl font-space font-bold text-neon-green">{gasEstimate} ICP</div>
                  <div className="text-sm text-gray-400">Network fee</div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-lg font-space font-medium text-white mb-3 block">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-4 rounded-xl glass border border-gray-600 focus:border-icp-blue bg-transparent text-white placeholder-gray-400 h-32 resize-none"
                placeholder="Describe the purpose of this escrow..."
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content space-y-8">
            <div>
              <label className="text-lg font-space font-medium text-white mb-3 block">
                Recipient Principal ID
              </label>
              <input
                type="text"
                value={formData.recipient}
                onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                className="w-full px-4 py-4 rounded-xl glass border border-gray-600 focus:border-icp-blue bg-transparent text-white placeholder-gray-400 font-mono"
                placeholder="rdmx6-jaaaa-aaaah-qcaaw-cai"
              />
              <div className="mt-2 text-sm text-gray-400">
                The principal ID of the escrow recipient
              </div>
            </div>

            <div>
              <label className="text-lg font-space font-medium text-white mb-3 block">
                Arbitrator (Optional)
              </label>
              <input
                type="text"
                value={formData.arbitrator}
                onChange={(e) => setFormData({ ...formData, arbitrator: e.target.value })}
                className="w-full px-4 py-4 rounded-xl glass border border-gray-600 focus:border-icp-blue bg-transparent text-white placeholder-gray-400 font-mono"
                placeholder="Enter arbitrator's principal ID"
              />
              <div className="mt-2 text-sm text-gray-400">
                An arbitrator can help resolve disputes if they arise
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="text-lg font-space font-medium text-white mb-3 block">
                Supporting Documents
              </label>
              <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-icp-blue transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Upload contracts, agreements, or other documents</p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                />
                <label
                  htmlFor="file-upload"
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-icp-blue to-icp-purple hover-glow transition-all duration-300 cursor-pointer inline-block"
                >
                  Choose Files
                </label>
              </div>
              
              {formData.files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 glass rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-icp-blue" />
                        <span className="text-white">{file.name}</span>
                        <span className="text-gray-400 text-sm">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content space-y-8">
            <div>
              <label className="text-lg font-space font-medium text-white mb-4 block">
                Release Conditions
              </label>
              <div className="space-y-4">
                <label className="flex items-start space-x-4 cursor-pointer p-4 rounded-xl glass hover:bg-white/5 transition-colors">
                  <input
                    type="radio"
                    value="manual"
                    checked={formData.conditions === 'manual'}
                    onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                    className="w-5 h-5 text-icp-blue mt-1"
                  />
                  <div>
                    <span className="text-white font-medium">Manual Release</span>
                    <p className="text-gray-400 text-sm mt-1">Both parties must approve the release</p>
                  </div>
                </label>
                
                <label className="flex items-start space-x-4 cursor-pointer p-4 rounded-xl glass hover:bg-white/5 transition-colors">
                  <input
                    type="radio"
                    value="timelock"
                    checked={formData.conditions === 'timelock'}
                    onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                    className="w-5 h-5 text-icp-blue mt-1"
                  />
                  <div>
                    <span className="text-white font-medium">Time-locked Release</span>
                    <p className="text-gray-400 text-sm mt-1">Automatic release after specified time</p>
                  </div>
                </label>
                
                <label className="flex items-start space-x-4 cursor-pointer p-4 rounded-xl glass hover:bg-white/5 transition-colors">
                  <input
                    type="radio"
                    value="multisig"
                    checked={formData.conditions === 'multisig'}
                    onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                    className="w-5 h-5 text-icp-blue mt-1"
                  />
                  <div>
                    <span className="text-white font-medium">Multi-signature Required</span>
                    <p className="text-gray-400 text-sm mt-1">Requires multiple approvals including arbitrator</p>
                  </div>
                </label>
              </div>
            </div>

            {formData.conditions === 'timelock' && (
              <div>
                <label className="text-lg font-space font-medium text-white mb-3 block">
                  Release Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.timelock}
                  onChange={(e) => setFormData({ ...formData, timelock: e.target.value })}
                  className="w-full px-4 py-4 rounded-xl glass border border-gray-600 focus:border-icp-blue bg-transparent text-white"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="step-content space-y-8">
            <div className="glass rounded-xl p-8 border border-icp-blue/20">
              <h3 className="text-2xl font-space font-bold text-gradient mb-6">Escrow Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Asset Type:</span>
                    <span className="text-white font-medium">{formData.assetType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-white font-medium">{formData.amount} {formData.assetType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gas Fee:</span>
                    <span className="text-white font-medium">{gasEstimate} ICP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Conditions:</span>
                    <span className="text-white font-medium capitalize">{formData.conditions}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-400 block mb-1">Recipient:</span>
                    <span className="text-white font-mono text-sm break-all">
                      {formData.recipient}
                    </span>
                  </div>
                  {formData.arbitrator && (
                    <div>
                      <span className="text-gray-400 block mb-1">Arbitrator:</span>
                      <span className="text-white font-mono text-sm break-all">
                        {formData.arbitrator}
                      </span>
                    </div>
                  )}
                  {formData.timelock && (
                    <div>
                      <span className="text-gray-400 block mb-1">Release Date:</span>
                      <span className="text-white font-medium">
                        {new Date(formData.timelock).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {formData.description && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <span className="text-gray-400 block mb-2">Description:</span>
                  <p className="text-white">{formData.description}</p>
                </div>
              )}
              
              {formData.files.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <span className="text-gray-400 block mb-2">Attached Files:</span>
                  <div className="flex flex-wrap gap-2">
                    {formData.files.map((file, index) => (
                      <span key={index} className="px-3 py-1 bg-icp-blue/10 text-icp-blue rounded-full text-sm">
                        {file.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isSubmitting) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Creating Escrow" />
          <div className="mt-8 space-y-2 text-gray-400">
            <div>Deploying smart contract...</div>
            <div>Initializing escrow parameters...</div>
            <div>Securing funds...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="form-container">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-space font-bold text-gradient mb-4">
              Create Escrow
            </h1>
            <p className="text-xl text-gray-300">
              Secure your digital assets with Lock3's trustless escrow system
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center space-x-3 ${
                    currentStep >= step.id ? 'text-icp-blue' : 'text-gray-500'
                  }`}
                >
                  <div className={`p-3 rounded-full border-2 transition-all duration-300 ${
                    currentStep >= step.id
                      ? 'border-icp-blue bg-icp-blue/10'
                      : 'border-gray-600'
                  }`}>
                    {step.icon}
                  </div>
                  <div className="hidden md:block">
                    <div className="font-space font-medium">{step.title}</div>
                    <div className="text-sm text-gray-400">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="progress-fill bg-gradient-to-r from-icp-blue to-icp-purple h-2 rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Form Content */}
          <div className="glass rounded-xl p-8 md:p-12 mb-8 border border-icp-blue/20">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`px-8 py-4 rounded-xl font-space font-medium transition-all duration-300 ${
                currentStep === 1
                  ? 'opacity-50 cursor-not-allowed glass'
                  : 'glass hover-glow'
              }`}
            >
              Previous
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-icp-blue to-icp-purple hover-glow transition-all duration-300 flex items-center space-x-3 ripple-effect"
              >
                <span className="font-space font-medium">Next</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-8 py-4 rounded-xl bg-gradient-to-r from-neon-green to-icp-blue hover-glow transition-all duration-300 flex items-center space-x-3 ripple-effect ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <span className="font-space font-medium">Create Escrow</span>
                <Plus className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEscrow;