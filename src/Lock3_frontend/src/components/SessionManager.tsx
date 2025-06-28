import React, { useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import toast from 'react-hot-toast';

const SessionManager: React.FC = () => {
  const { 
    isConnected, 
    sessionTimeRemaining, 
    isSessionExpiring, 
    refreshSession 
  } = useWallet();

  useEffect(() => {
    if (!isConnected || !sessionTimeRemaining) return;

    const fifteenMinutes = 15 * 60 * 1000;
    const fiveMinutes = 5 * 60 * 1000;
    const oneMinute = 60 * 1000;

    // Show different warnings based on time remaining
    if (sessionTimeRemaining <= oneMinute && sessionTimeRemaining > 0) {
      toast((t) => (
        <div className="flex flex-col gap-2">
          <span className="text-red-400 font-bold">🚨 Session expires in less than 1 minute!</span>
          <div className="flex gap-2">
            <button
              className="bg-red-500 text-white px-3 py-1 rounded text-sm font-medium"
              onClick={() => {
                toast.dismiss(t.id);
                refreshSession();
              }}
            >
              Extend Now
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
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        }
      });
    } else if (sessionTimeRemaining <= fiveMinutes && sessionTimeRemaining > oneMinute) {
      toast((t) => (
        <div className="flex flex-col gap-2">
          <span className="text-orange-400 font-bold">⚠️ Session expires in {Math.round(sessionTimeRemaining / 60000)} minutes</span>
          <div className="flex gap-2">
            <button
              className="bg-orange-500 text-white px-3 py-1 rounded text-sm font-medium"
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
        duration: 15000,
        style: {
          background: 'rgba(249, 115, 22, 0.1)',
          border: '1px solid rgba(249, 115, 22, 0.3)',
        }
      });
    }
  }, [sessionTimeRemaining, isConnected, refreshSession]);

  // Auto-refresh when session is about to expire (optional)
  useEffect(() => {
    if (!isConnected || !sessionTimeRemaining) return;

    const autoRefreshThreshold = 5 * 60 * 1000; // 5 minutes

    if (sessionTimeRemaining <= autoRefreshThreshold && sessionTimeRemaining > 0) {
      // Could implement auto-refresh here if desired
      // For now, we'll just rely on user interaction
    }
  }, [sessionTimeRemaining, isConnected, refreshSession]);

  return null; // This is a logic-only component
};

export default SessionManager;
