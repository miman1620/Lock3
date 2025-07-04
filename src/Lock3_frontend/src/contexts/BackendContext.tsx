import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import toast from 'react-hot-toast';
import { UserProfile } from '../types/backend';
import { getLock3Service, initializeLock3Service } from '../services/lock3';

// Mock types for now since we don't have the DFINITY packages installed
interface MockAuthClient {
  isAuthenticated: () => Promise<boolean>;
  login: (options?: any) => Promise<void>;
  logout: () => Promise<void>;
  getIdentity: () => any;
}

interface MockPrincipal {
  toString: () => string;
}

interface MockIdentity {
  getPrincipal: () => MockPrincipal;
}

interface WalletContextType {
  isConnected: boolean;
  principal: MockPrincipal | null;
  principalText: string | null;
  identity: MockIdentity | null;
  authClient: MockAuthClient | null;
  userProfile: UserProfile | null;
  balance: {
    icp: string;
    ckbtc: string;
    icrc1: string;
  };
  connect: (provider?: 'internet-identity' | 'plug' | 'stoic' | 'nfid' | 'bitfinity') => Promise<void>;
  disconnect: () => Promise<void>;
  isLoading: boolean;
  isInitializing: boolean;
  icpPrice: number;
  networkStats: {
    blockHeight: number;
    transactionCount: number;
    activeNodes: number;
  };
  whoami: () => Promise<MockPrincipal>;
  refreshSession: () => Promise<void>;
  sessionTimeRemaining: number | null;
  refreshUserProfile: () => Promise<void>;
  createUserProfile: (username?: string, email?: string) => Promise<void>;
  canisterId: string;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// Mock canister ID - replace with actual canister ID
const CANISTER_ID = 'rdmx6-jaaaa-aaaah-qcaaw-cai';

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [principal, setPrincipal] = useState<MockPrincipal | null>(null);
  const [principalText, setPrincipalText] = useState<string | null>(null);
  const [identity, setIdentity] = useState<MockIdentity | null>(null);
  const [authClient, setAuthClient] = useState<MockAuthClient | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState({ icp: '0.00', ckbtc: '0.00', icrc1: '0.00' });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [icpPrice, setIcpPrice] = useState(12.45);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number | null>(null);
  const [networkStats, setNetworkStats] = useState({
    blockHeight: 1234567,
    transactionCount: 9876543,
    activeNodes: 456
  });

  // Initialize auth client on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsInitializing(true);
        
        // Mock auth client for now
        const mockAuthClient: MockAuthClient = {
          isAuthenticated: async () => false,
          login: async () => {},
          logout: async () => {},
          getIdentity: () => ({
            getPrincipal: () => ({ toString: () => 'mock-principal' })
          })
        };
        
        setAuthClient(mockAuthClient);
        
        // Check if already authenticated
        const isAuthenticated = await mockAuthClient.isAuthenticated();
        if (isAuthenticated) {
          const mockIdentity = mockAuthClient.getIdentity();
          const mockPrincipal = mockIdentity.getPrincipal();
          
          setIdentity(mockIdentity);
          setPrincipal(mockPrincipal);
          setPrincipalText(mockPrincipal.toString());
          setIsConnected(true);
          
          // Initialize Lock3 service
          await initializeLock3Service(CANISTER_ID);
          
          // Load user profile
          await loadUserProfile(mockPrincipal.toString());
        }
      } catch (error) {
        console.error('Failed to initialize auth client:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, []);

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

  // Session timer
  useEffect(() => {
    if (isConnected && sessionTimeRemaining !== null) {
      const timer = setInterval(() => {
        setSessionTimeRemaining(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(timer);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isConnected, sessionTimeRemaining]);

  const loadUserProfile = async (principalId: string) => {
    try {
      const service = getLock3Service(CANISTER_ID);
      const profile = await service.getUserProfile(principalId);
      setUserProfile(profile);
      
      // Update balance based on profile
      if (profile) {
        setBalance({
          icp: (Math.random() * 100 + 10).toFixed(3),
          ckbtc: (Math.random() * 0.5 + 0.1).toFixed(6),
          icrc1: (Math.random() * 1000 + 100).toFixed(2)
        });
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const refreshUserProfile = async () => {
    if (principalText) {
      await loadUserProfile(principalText);
    }
  };

  const createUserProfile = async (username?: string, email?: string) => {
    try {
      const service = getLock3Service(CANISTER_ID);
      const result = await service.createUserProfile(username, email);
      
      if ('ok' in result) {
        setUserProfile(result.ok);
        toast.success('User profile created successfully!');
      } else {
        toast.error(result.err);
      }
    } catch (error) {
      console.error('Failed to create user profile:', error);
      toast.error('Failed to create user profile');
    }
  };

  const connect = async (provider: 'internet-identity' | 'plug' | 'stoic' | 'nfid' | 'bitfinity' = 'internet-identity') => {
    if (!authClient) {
      toast.error('Auth client not initialized');
      return;
    }

    setIsLoading(true);
    try {
      // Mock different connection flows based on provider
      const connectionTime = provider === 'internet-identity' ? 3000 : 2000;
      
      await new Promise(resolve => setTimeout(resolve, connectionTime));
      
      const mockPrincipal: MockPrincipal = {
        toString: () => provider === 'internet-identity' 
          ? 'rdmx6-jaaaa-aaaah-qcaaw-cai'
          : `${provider}-${Math.random().toString(36).substr(2, 9)}`
      };

      const mockIdentity: MockIdentity = {
        getPrincipal: () => mockPrincipal
      };
      
      setIdentity(mockIdentity);
      setPrincipal(mockPrincipal);
      setPrincipalText(mockPrincipal.toString());
      setIsConnected(true);
      
      // Initialize Lock3 service with authenticated client
      await initializeLock3Service(CANISTER_ID);
      
      // Load user profile
      await loadUserProfile(mockPrincipal.toString());
      
      // Set session timer (8 hours)
      setSessionTimeRemaining(8 * 60 * 60);
      
      const providerName = provider === 'internet-identity' ? 'Internet Identity' : 
                         provider.charAt(0).toUpperCase() + provider.slice(1);
      
      toast.success(`Connected to ${providerName}`, {
        icon: provider === 'internet-identity' ? '🔐' : '🔗',
        style: {
          background: 'rgba(4, 152, 236, 0.1)',
          border: '1px solid rgba(4, 152, 236, 0.3)',
        }
      });
    } catch (error) {
      console.error('Connection failed:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    if (authClient) {
      await authClient.logout();
    }
    
    setIsConnected(false);
    setPrincipal(null);
    setPrincipalText(null);
    setIdentity(null);
    setUserProfile(null);
    setBalance({ icp: '0.00', ckbtc: '0.00', icrc1: '0.00' });
    setSessionTimeRemaining(null);
    
    toast.success('Wallet disconnected', {
      icon: '🔌',
      style: {
        background: 'rgba(148, 64, 255, 0.1)',
        border: '1px solid rgba(148, 64, 255, 0.3)',
      }
    });
  };

  const whoami = async (): Promise<MockPrincipal> => {
    if (!principal) {
      throw new Error('Not connected');
    }
    return principal;
  };

  const refreshSession = async () => {
    if (authClient && isConnected) {
      // Reset session timer
      setSessionTimeRemaining(8 * 60 * 60);
      toast.success('Session refreshed', { icon: '🔄' });
    }
  };

  return (
    <WalletContext.Provider value={{
      isConnected,
      principal,
      principalText,
      identity,
      authClient,
      userProfile,
      balance,
      connect,
      disconnect,
      isLoading,
      isInitializing,
      icpPrice,
      networkStats,
      whoami,
      refreshSession,
      sessionTimeRemaining,
      refreshUserProfile,
      createUserProfile,
      canisterId: CANISTER_ID
    }}>
      {children}
    </WalletContext.Provider>
  );
};
