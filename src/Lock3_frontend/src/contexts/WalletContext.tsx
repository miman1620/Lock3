import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  refreshSession: () => Promise<void>;
  sessionTimeRemaining: number | null;
  isSessionExpiring: boolean;
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
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number | null>(null);
  const [isSessionExpiring, setIsSessionExpiring] = useState(false);
  const [networkStats, setNetworkStats] = useState({
    blockHeight: 1234567,
    transactionCount: 9876543,
    activeNodes: 456
  });

  // Internet Identity configuration
  const II_URL = import.meta.env.DFX_NETWORK === "local" 
    ? `http://rdmx6-jaaaa-aaaah-qcaaw-cai.localhost:4943`
    : "https://identity.ic0.app";

  const MAX_TIME_TO_LIVE = BigInt(8 * 60 * 60 * 1000 * 1000 * 1000); // 8 hours in nanoseconds
  const SESSION_WARNING_TIME = 15 * 60 * 1000; // Warn 15 minutes before expiry

  // Initialize AuthClient on component mount
  useEffect(() => {
    initAuthClient();
  }, []);

  const initAuthClient = async () => {
    try {
      const client = await AuthClient.create({
        idleOptions: {
          idleTimeout: 1000 * 60 * 60, // 1 hour idle timeout
          disableDefaultIdleCallback: true, // We'll handle idle callback ourselves
          onIdle: () => {
            handleIdleTimeout();
          },
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
          
          // Check delegation expiry
          await checkDelegationExpiry(identity);
          
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

  const handleIdleTimeout = useCallback(() => {
    toast.error('Session expired due to inactivity. Please login again.', {
      duration: 5000,
      icon: '💤',
    });
    disconnect();
  }, []);

  const checkDelegationExpiry = useCallback(async (currentIdentity: Identity) => {
    try {
      // Get delegation chain from identity
      const delegation = (currentIdentity as any).getDelegation?.();
      if (delegation && delegation.delegations && delegation.delegations.length > 0) {
        const firstDelegation = delegation.delegations[0];
        const expiryTime = firstDelegation.delegation.expiration;
        
        if (expiryTime) {
          const expiryDate = new Date(Number(expiryTime) / 1000000); // Convert from nanoseconds
          const now = new Date();
          const timeRemaining = expiryDate.getTime() - now.getTime();
          
          setSessionTimeRemaining(Math.max(0, timeRemaining));
          
          // Warn if session is expiring soon
          if (timeRemaining <= SESSION_WARNING_TIME && timeRemaining > 0) {
            setIsSessionExpiring(true);
            toast((t) => (
              <div className="flex flex-col gap-2">
                <span>⚠️ Your session expires in {Math.round(timeRemaining / 60000)} minutes</span>
                <div className="flex gap-2">
                  <button
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                    onClick={() => {
                      toast.dismiss(t.id);
                      refreshSession();
                    }}
                  >
                    Extend Session
                  </button>
                  <button
                    className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
                    onClick={() => toast.dismiss(t.id)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ), {
              duration: 30000,
              style: {
                background: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
              }
            });
          } else {
            setIsSessionExpiring(false);
          }
        }
      }
    } catch (error) {
      console.error('Failed to check delegation expiry:', error);
    }
  }, [SESSION_WARNING_TIME]);

  // Real-time session monitoring with more frequent checks
  useEffect(() => {
    if (!authClient || !isConnected) return;

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
        } else if (isAuthenticated && identity) {
          // Check delegation expiry
          await checkDelegationExpiry(identity);
        }
      } catch (error) {
        console.error('Session check failed:', error);
      }
    };

    // Check session every 2 minutes for more real-time monitoring
    const sessionInterval = setInterval(checkSession, 2 * 60 * 1000);

    return () => clearInterval(sessionInterval);
  }, [authClient, isConnected, identity, checkDelegationExpiry]);

  const refreshSession = useCallback(async () => {
    if (!authClient) {
      toast.error('Authentication client not available');
      return;
    }

    try {
      setIsLoading(true);
      setIsSessionExpiring(false);

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
            console.error('Session refresh failed:', error);
            reject(error);
          },
        });
      });

      const identity = authClient.getIdentity();
      const userPrincipal = identity.getPrincipal();

      if (!userPrincipal.isAnonymous()) {
        setIdentity(identity);
        setPrincipal(userPrincipal);
        setPrincipalText(userPrincipal.toString());

        // Check new delegation expiry
        await checkDelegationExpiry(identity);

        toast.success('Session renewed successfully!', {
          icon: '✨',
          style: {
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
          }
        });
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      toast.error('Failed to refresh session. Please login again.');
      await disconnect();
    } finally {
      setIsLoading(false);
    }
  }, [authClient, II_URL, MAX_TIME_TO_LIVE, checkDelegationExpiry]);

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
        // Show connecting toast
        const connectingToast = toast.loading('Connecting to Internet Identity...', {
          style: {
            background: 'rgba(4, 152, 236, 0.1)',
            border: '1px solid rgba(4, 152, 236, 0.3)',
          }
        });

        await new Promise<void>((resolve, reject) => {
          authClient.login({
            identityProvider: II_URL,
            maxTimeToLive: MAX_TIME_TO_LIVE,
            windowOpenerFeatures: 
              `left=${window.screen.width / 2 - 525 / 2}, ` +
              `top=${window.screen.height / 2 - 705 / 2},` +
              `toolbar=0,location=0,menubar=0,width=525,height=705`,
            onSuccess: () => {
              toast.dismiss(connectingToast);
              resolve();
            },
            onError: (error) => {
              toast.dismiss(connectingToast);
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

          // Check delegation expiry
          await checkDelegationExpiry(identity);

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
          localStorage.setItem('ii_principal', userPrincipal.toString());
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
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('UserInterrupt')) {
          toast.error('Authentication was cancelled', {
            icon: '❌',
          });
        } else if (error.message.includes('anonymous principal')) {
          toast.error('Authentication failed - please try again');
        } else {
          toast.error(`Connection failed: ${error.message}`);
        }
      } else {
        toast.error('Failed to connect wallet');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    if (!authClient) return;

    try {
      setIsLoading(true);
      
      await authClient.logout();
      
      setIsConnected(false);
      setIdentity(null);
      setPrincipal(null);
      setPrincipalText(null);
      setBalance({ icp: '0.00', ckbtc: '0.00', icrc1: '0.00' });
      setSessionTimeRemaining(null);
      setIsSessionExpiring(false);

      // Clear all local storage data
      localStorage.removeItem('ii_connected_at');
      localStorage.removeItem('ii_principal');

      toast.success('Disconnected from Internet Identity', {
        icon: '🔌',
        style: {
          background: 'rgba(148, 64, 255, 0.1)',
          border: '1px solid rgba(148, 64, 255, 0.3)',
        }
      });
    } catch (error) {
      console.error('Disconnect failed:', error);
      toast.error('Failed to disconnect properly');
      
      // Force clean disconnect even if logout fails
      setIsConnected(false);
      setIdentity(null);
      setPrincipal(null);
      setPrincipalText(null);
      setBalance({ icp: '0.00', ckbtc: '0.00', icrc1: '0.00' });
      setSessionTimeRemaining(null);
      setIsSessionExpiring(false);
      
      localStorage.removeItem('ii_connected_at');
      localStorage.removeItem('ii_principal');
    } finally {
      setIsLoading(false);
    }
  };

  // Session time countdown effect
  useEffect(() => {
    if (!sessionTimeRemaining || sessionTimeRemaining <= 0) return;

    const countdown = setInterval(() => {
      setSessionTimeRemaining(prev => {
        if (!prev || prev <= 1000) {
          // Session expired
          toast.error('Session has expired. Please login again.', {
            icon: '⏰',
            duration: 5000,
          });
          disconnect();
          return null;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [sessionTimeRemaining]);

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
      whoami,
      refreshSession,
      sessionTimeRemaining,
      isSessionExpiring
    }}>
      {children}
    </WalletContext.Provider>
  );
};