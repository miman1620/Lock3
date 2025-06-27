import React, { useEffect, useRef } from 'react';
import { X, Wallet, Shield, Zap, Key, Globe, Fingerprint } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { gsap } from 'gsap';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { connect, isLoading } = useWallet();
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current && overlayRef.current) {
      // Animate overlay
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      );
      
      // Animate modal
      gsap.fromTo(modalRef.current,
        { scale: 0.8, opacity: 0, y: 50 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)' }
      );
    }
  }, [isOpen]);

  const walletOptions = [
    {
      id: 'internet-identity',
      name: 'Internet Identity',
      description: 'Secure, passwordless authentication with biometrics',
      icon: <Fingerprint className="h-8 w-8" />,
      gradient: 'from-icp-blue to-cyan-400',
      features: ['Passwordless', 'Biometric Auth', 'Privacy First', 'Cross-Device']
    },
    {
      id: 'plug',
      name: 'Plug Wallet',
      description: 'Browser extension wallet for Internet Computer',
      icon: <Zap className="h-8 w-8" />,
      gradient: 'from-yellow-400 to-orange-500',
      features: ['Browser Extension', 'Hardware Support', 'DeFi Ready', 'Multi-Asset']
    },
    {
      id: 'stoic',
      name: 'Stoic Wallet',
      description: 'Multi-platform wallet with hardware support',
      icon: <Shield className="h-8 w-8" />,
      gradient: 'from-green-400 to-blue-500',
      features: ['Multi-Platform', 'Ledger Support', 'Open Source', 'Secure']
    },
    {
      id: 'nfid',
      name: 'NFID',
      description: 'Next-generation identity and wallet solution',
      icon: <Key className="h-8 w-8" />,
      gradient: 'from-purple-400 to-pink-500',
      features: ['Web3 Native', 'Social Recovery', 'Multi-Chain', 'Developer Friendly']
    },
    {
      id: 'bitfinity',
      name: 'Bitfinity Wallet',
      description: 'Advanced wallet with cross-chain capabilities',
      icon: <Globe className="h-8 w-8" />,
      gradient: 'from-indigo-400 to-purple-500',
      features: ['Cross-Chain', 'Advanced Features', 'Institutional Grade', 'API Access']
    },
  ];

  const handleConnect = async (providerId: string) => {
    await connect(providerId as 'internet-identity' | 'plug' | 'stoic' | 'nfid' | 'bitfinity');
    onClose();
  };

  const handleClose = () => {
    if (modalRef.current && overlayRef.current) {
      gsap.to(modalRef.current, {
        scale: 0.8,
        opacity: 0,
        y: 50,
        duration: 0.3,
        ease: 'power2.in'
      });
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.3,
        onComplete: onClose
      });
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          ref={overlayRef}
          className="fixed inset-0 bg-black bg-opacity-75 transition-opacity backdrop-blur-sm"
          onClick={handleClose}
        />

        <div
          ref={modalRef}
          className="inline-block align-bottom glass-dark rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-icp-blue/20"
        >
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-3xl font-space font-bold text-gradient">
                  Connect Your Wallet
                </h3>
                <p className="text-gray-400 mt-2 text-lg">Choose your preferred authentication method to get started</p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg glass hover-glow transition-all duration-300"
              >
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {walletOptions.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => handleConnect(wallet.id)}
                  disabled={isLoading}
                  className={`p-6 rounded-xl glass border border-transparent hover:border-icp-blue/30 transition-all duration-300 group text-left ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : 'hover-glow card-3d'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-4 rounded-xl bg-gradient-to-r ${wallet.gradient} group-hover:scale-110 transition-transform duration-300`}>
                      {wallet.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-space font-semibold text-white text-xl mb-2">{wallet.name}</h4>
                      <p className="text-sm text-gray-400 mb-4 leading-relaxed">{wallet.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {wallet.features.map((feature, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 text-xs bg-icp-blue/10 text-icp-blue rounded-full border border-icp-blue/20"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {isLoading && (
              <div className="mt-8 text-center">
                <div className="inline-flex items-center space-x-3 text-icp-blue">
                  <div className="w-8 h-8 border-2 border-icp-blue border-t-transparent rounded-full animate-spin" />
                  <span className="text-xl font-medium">Connecting wallet...</span>
                </div>
                <p className="text-gray-400 text-sm mt-3">Please approve the connection in your wallet or browser</p>
              </div>
            )}

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-lg bg-icp-blue/5 border border-icp-blue/20">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-icp-blue mt-0.5" />
                  <div>
                    <h5 className="font-medium text-white">Secure Connection</h5>
                    <p className="text-xs text-gray-400 mt-1">
                      Lock3 uses industry-standard security protocols. We never store your private keys or seed phrases.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-neon-green/5 border border-neon-green/20">
                <div className="flex items-start space-x-3">
                  <Zap className="h-5 w-5 text-neon-green mt-0.5" />
                  <div>
                    <h5 className="font-medium text-white">Lightning Fast</h5>
                    <p className="text-xs text-gray-400 mt-1">
                      Experience sub-second transaction finality on the Internet Computer network.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                By connecting your wallet, you agree to our{' '}
                <a href="#" className="text-icp-blue hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-icp-blue hover:underline">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;