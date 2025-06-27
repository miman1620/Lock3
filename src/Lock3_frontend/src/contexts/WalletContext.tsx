import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';
import toast from 'react-hot-toast';

interface WalletContextType {
  isConnected: boolean;
  principal: string | null;
  balance: {
    icp: string;
    ckbtc: string;
    icrc1: string;
  };
  connect: (provider: 'internet-identity' | 'plug' | 'stoic' | 'nfid' | 'bitfinity') => Promise<void>;
  disconnect: () => void;
  isLoading: boolean;
  icpPrice: number;
  networkStats: {
    blockHeight: number;
    transactionCount: number;
    activeNodes: number;
  };
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [balance, setBalance] = useState({ icp: '0.00', ckbtc: '0.00', icrc1: '0.00' });
  const [isLoading, setIsLoading] = useState(false);
  const [icpPrice, setIcpPrice] = useState(12.45);
  const [networkStats, setNetworkStats] = useState({
    blockHeight: 1234567,
    transactionCount: 9876543,
    activeNodes: 456
  });

  // Fetch ICP price from CoinGecko
  useEffect(() => {
    const fetchICPPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd');
        const data = await response.json();
        setIcpPrice(data['internet-computer']?.usd || 12.45);
      } catch (error) {
        console.error('Failed to fetch ICP price:', error);
      }
    };

    fetchICPPrice();
    const interval = setInterval(fetchICPPrice, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Simulate network stats updates
  useEffect(() => {
    const updateNetworkStats = () => {
      setNetworkStats(prev => ({
        blockHeight: prev.blockHeight + Math.floor(Math.random() * 3) + 1,
        transactionCount: prev.transactionCount + Math.floor(Math.random() * 50) + 10,
        activeNodes: prev.activeNodes + Math.floor(Math.random() * 3) - 1
      }));
    };

    const interval = setInterval(updateNetworkStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const connect = async (provider: 'internet-identity' | 'plug' | 'stoic' | 'nfid' | 'bitfinity') => {
    setIsLoading(true);
    try {
      // Simulate different connection flows based on provider
      const connectionTime = provider === 'internet-identity' ? 3000 : 2000;
      
      setTimeout(() => {
        const mockPrincipal = provider === 'internet-identity' 
          ? 'rdmx6-jaaaa-aaaah-qcaaw-cai'
          : `${provider}-${Math.random().toString(36).substr(2, 9)}`;
          
        setPrincipal(mockPrincipal);
        setIsConnected(true);
        setBalance({ 
          icp: (Math.random() * 100 + 10).toFixed(3),
          ckbtc: (Math.random() * 0.5 + 0.1).toFixed(6),
          icrc1: (Math.random() * 1000 + 100).toFixed(2)
        });
        
        const providerName = provider === 'internet-identity' ? 'Internet Identity' : 
                           provider.charAt(0).toUpperCase() + provider.slice(1);
        
        toast.success(`Connected to ${providerName}`, {
          icon: provider === 'internet-identity' ? '🔐' : '🔗',
          style: {
            background: 'rgba(4, 152, 236, 0.1)',
            border: '1px solid rgba(4, 152, 236, 0.3)',
          }
        });
        setIsLoading(false);
      }, connectionTime);
    } catch (error) {
      toast.error('Failed to connect wallet');
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setPrincipal(null);
    setBalance({ icp: '0.00', ckbtc: '0.00', icrc1: '0.00' });
    toast.success('Wallet disconnected', {
      icon: '🔌',
      style: {
        background: 'rgba(148, 64, 255, 0.1)',
        border: '1px solid rgba(148, 64, 255, 0.3)',
      }
    });
  };

  return (
    <WalletContext.Provider value={{
      isConnected,
      principal,
      balance,
      connect,
      disconnect,
      isLoading,
      icpPrice,
      networkStats
    }}>
      {children}
    </WalletContext.Provider>
  );
};