import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';
import { Actor, HttpAgent, Identity } from '@dfinity/agent';
import toast from 'react-hot-toast';

interface WalletContextType {
  isConnected: boolean;
  principal: Principal | null;
  principalText: string | null;
  identity: Identity | null;
  authClient: AuthClient | null;
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
  whoami: () => Promise<Principal>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [principalText, setPrincipalText] = useState<string | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [balance, setBalance] = useState({ icp: '0.00', ckbtc: '0.00', icrc1: '0.00' });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [icpPrice, setIcpPrice] = useState(12.45);
  const [networkStats, setNetworkStats] = useState({
    blockHeight: 1234567,
    transactionCount: 9876543,
    activeNodes: 456
  });

  // Internet Identity configuration
  const II_URL = import.meta.env.DFX_NETWORK === "local" 
    ? `http://rdmx6-jaaaa-aaaah-qcaaw-cai.localhost:4943`
    : "https://identity.ic0.app";

  const MAX_TIME_TO_LIVE = BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000); // 7 days in nanoseconds

  // Initialize AuthClient on component mount
  useEffect(() => {
    initAuthClient();
  }, []);

  const initAuthClient = async () => {
    try {
      const client = await AuthClient.create({
        idleOptions: {
          idleTimeout: 1000 * 60 * 30, // 30 minutes
          disableDefaultIdleCallback: true,
        },
      });
      
      setAuthClient(client);

      // Check if user is already authenticated
      const isAuthenticated = await client.isAuthenticated();
      
      if (isAuthenticated) {
        const identity = client.getIdentity();
        const principal = identity.getPrincipal();
        
        if (!principal.isAnonymous()) {
          setIsConnected(true);
          setIdentity(identity);
          setPrincipal(principal);
          setPrincipalText(principal.toString());
          
          // Fetch user balance
          await fetchBalance(principal);
          
          toast.success('Reconnected to Internet Identity', {
            icon: '🔐',
            style: {
              background: 'rgba(4, 152, 236, 0.1)',
              border: '1px solid rgba(4, 152, 236, 0.3)',
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to initialize AuthClient:', error);
      toast.error('Failed to initialize authentication');
    } finally {
      setIsInitializing(false);
    }
  };

  // Real-time session monitoring
  useEffect(() => {
    if (!authClient) return;

    const checkSession = async () => {
      try {
        const isAuthenticated = await authClient.isAuthenticated();
        
        if (isConnected && !isAuthenticated) {
          // Session expired, auto-disconnect
          await disconnect();
          toast.error('Session expired. Please login again.', {
            duration: 5000,
            icon: '⏰',
          });
        }
      } catch (error) {
        console.error('Session check failed:', error);
      }
    };

    // Check session every 5 minutes
    const sessionInterval = setInterval(checkSession, 5 * 60 * 1000);

    return () => clearInterval(sessionInterval);
  }, [authClient, isConnected]);

  const fetchBalance = async (userPrincipal: Principal) => {
    try {
      // In a real implementation, you would call your backend canister
      // For now, we'll simulate fetching balance
      setBalance({ 
        icp: (Math.random() * 100 + 10).toFixed(3),
        ckbtc: (Math.random() * 0.5 + 0.1).toFixed(6),
        icrc1: (Math.random() * 1000 + 100).toFixed(2)
      });
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const whoami = async (): Promise<Principal> => {
    if (!principal) {
      throw new Error('Not authenticated');
    }
    return principal;
  };

  const connect = async (provider: 'internet-identity' | 'plug' | 'stoic' | 'nfid' | 'bitfinity' = 'internet-identity') => {
    if (!authClient) {
      toast.error('Authentication client not initialized');
      return;
    }

    setIsLoading(true);

    try {
      if (provider === 'internet-identity') {
        await new Promise<void>((resolve, reject) => {
          authClient.login({
            identityProvider: II_URL,
            maxTimeToLive: MAX_TIME_TO_LIVE,
            windowOpenerFeatures: 
              `left=${window.screen.width / 2 - 525 / 2}, ` +
              `top=${window.screen.height / 2 - 705 / 2},` +
              `toolbar=0,location=0,menubar=0,width=525,height=705`,
            onSuccess: () => {
              resolve();
            },
            onError: (error) => {
              console.error('Login failed:', error);
              reject(error);
            },
          });
        });

        const identity = authClient.getIdentity();
        const userPrincipal = identity.getPrincipal();

        if (!userPrincipal.isAnonymous()) {
          setIsConnected(true);
          setIdentity(identity);
          setPrincipal(userPrincipal);
          setPrincipalText(userPrincipal.toString());

          // Fetch user balance
          await fetchBalance(userPrincipal);

          toast.success('Successfully connected to Internet Identity', {
            icon: '🔐',
            style: {
              background: 'rgba(4, 152, 236, 0.1)',
              border: '1px solid rgba(4, 152, 236, 0.3)',
            }
          });

          // Store connection timestamp for session management
          localStorage.setItem('ii_connected_at', Date.now().toString());
        } else {
          throw new Error('Authentication failed - anonymous principal');
        }
      } else {
        // For other wallet providers, show coming soon message
        toast.error(`${provider} integration coming soon!`, {
          icon: '🚧',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Connection failed:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    if (!authClient) return;

    try {
      await authClient.logout();
      
      setIsConnected(false);
      setIdentity(null);
      setPrincipal(null);
      setPrincipalText(null);
      setBalance({ icp: '0.00', ckbtc: '0.00', icrc1: '0.00' });

      // Clear local storage
      localStorage.removeItem('ii_connected_at');

      toast.success('Disconnected from Internet Identity', {
        icon: '🔌',
        style: {
          background: 'rgba(148, 64, 255, 0.1)',
          border: '1px solid rgba(148, 64, 255, 0.3)',
        }
      });
    } catch (error) {
      console.error('Disconnect failed:', error);
      toast.error('Failed to disconnect');
    }
  };

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

  return (
    <WalletContext.Provider value={{
      isConnected,
      principal,
      principalText,
      identity,
      authClient,
      balance,
      connect,
      disconnect,
      isLoading,
      isInitializing,
      icpPrice,
      networkStats,
      whoami
    }}>
      {children}
    </WalletContext.Provider>
  );
};