import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Wallet, Mic, MicOff, TrendingUp, Activity } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useVoice } from '../contexts/VoiceContext';
import Logo from './Logo';
import WalletModal from './WalletModal';
import { gsap } from 'gsap';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const { isConnected, principalText, balance, disconnect, icpPrice } = useWallet();
  const { isListening, isSupported, startListening, stopListening } = useVoice();
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Animate navbar on mount
    if (navRef.current) {
      gsap.fromTo(navRef.current, 
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
      );
    }
  }, []);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/create', label: 'Create Escrow' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/disputes', label: 'Disputes' },
  ];

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <>
      <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 glass border-b border-icp-blue/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 hover-glow transition-all duration-300">
              <Logo size="sm" animated={true} />
              <span className="font-space text-2xl font-bold text-gradient">
                Lock3
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ripple-effect ${
                      location.pathname === item.path
                        ? 'text-icp-blue bg-icp-blue/10 border border-icp-blue/30'
                        : 'text-gray-300 hover:text-icp-blue hover:bg-icp-blue/5'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {/* ICP Price Ticker with trend */}
              <div className="glass rounded-lg px-3 py-2 hover-glow transition-all duration-300">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-neon-green" />
                  <div>
                    <div className="text-xs text-gray-400">ICP</div>
                    <div className="text-sm font-bold text-neon-green">${icpPrice.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Network Status */}
              <div className="glass rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                  <div>
                    <div className="text-xs text-gray-400">Network</div>
                    <div className="text-xs font-medium text-neon-green">Online</div>
                  </div>
                </div>
              </div>

              {/* Voice Assistant */}
              {isSupported && (
                <button
                  onClick={handleVoiceToggle}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    isListening 
                      ? 'bg-icp-blue/20 text-icp-blue animate-pulse' 
                      : 'glass hover-glow'
                  }`}
                  title={isListening ? 'Stop listening' : 'Start voice assistant'}
                >
                  {isListening ? (
                    <Mic className="h-5 w-5" />
                  ) : (
                    <MicOff className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              )}

              {/* Wallet Connection */}
              {isConnected ? (
                <div className="flex items-center space-x-2">
                  <div className="glass rounded-lg px-4 py-2 hover-glow transition-all duration-300">
                    <div className="text-xs text-gray-400">Balance</div>
                    <div className="text-sm font-bold text-icp-blue">{balance.icp} ICP</div>
                    <div className="text-xs text-neon-green">{balance.ckbtc} ckBTC</div>
                  </div>
                  <button
                    onClick={disconnect}
                    className="glass rounded-lg px-4 py-2 hover-glow transition-all duration-300"
                  >
                    <div className="text-xs text-gray-400">Connected</div>
                    <div className="text-sm font-bold text-white truncate w-20">
                      {principalText?.slice(0, 8)}...
                    </div>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsWalletModalOpen(true)}
                  className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-gradient-to-r from-icp-blue to-icp-purple hover-glow transition-all duration-300 ripple-effect"
                >
                  <Wallet className="h-4 w-4" />
                  <span className="font-medium">Connect Wallet</span>
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg glass hover-glow transition-all duration-300"
              >
                {isOpen ? (
                  <X className="h-6 w-6 text-white" />
                ) : (
                  <Menu className="h-6 w-6 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden glass-dark border-t border-icp-blue/20">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-300 ${
                    location.pathname === item.path
                      ? 'text-icp-blue bg-icp-blue/10 border border-icp-blue/30'
                      : 'text-gray-300 hover:text-icp-blue hover:bg-icp-blue/5'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Mobile Wallet Button */}
              <button
                onClick={() => {
                  setIsWalletModalOpen(true);
                  setIsOpen(false);
                }}
                className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-gradient-to-r from-icp-blue to-icp-purple hover-glow transition-all duration-300"
              >
                <Wallet className="h-4 w-4" />
                <span className="font-medium">
                  {isConnected ? 'Connected' : 'Connect Wallet'}
                </span>
              </button>
            </div>
          </div>
        )}
      </nav>

      <WalletModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
      />
    </>
  );
};

export default Navbar;