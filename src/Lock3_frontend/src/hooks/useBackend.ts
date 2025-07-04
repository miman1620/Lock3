import { useState, useEffect, useCallback } from 'react';
import {
  Escrow,
  Dispute,
  UserProfile,
  EscrowStats,
  CreateEscrowArgs,
  formatEscrowStatus,
  formatAssetType,
  formatAmount,
  formatTimestamp,
  createAssetType,
  createEscrowCondition,
  parseAmount,
} from '../types/backend';

// Mock service for now since we don't have the actual backend integration
class MockLock3Service {
  private mockEscrows: Escrow[] = [];
  private mockDisputes: Dispute[] = [];
  private mockUserProfiles: Map<string, UserProfile> = new Map();
  private mockStats: EscrowStats = {
    totalEscrows: 0n,
    activeEscrows: 0n,
    completedEscrows: 0n,
    totalVolume: 0n,
    averageEscrowValue: 0n,
    totalFees: 0n,
  };

  async createEscrow(args: CreateEscrowArgs): Promise<{ ok: Escrow } | { err: string }> {
    try {
      const escrow: Escrow = {
        id: `ESC-${Date.now()}`,
        buyer: 'current-user-id',
        seller: args.seller,
        arbitrator: args.arbitrator,
        assetType: args.assetType,
        amount: args.amount,
        description: args.description,
        conditions: args.conditions,
        status: { Created: null },
        createdAt: BigInt(Date.now() * 1000000),
        updatedAt: BigInt(Date.now() * 1000000),
        timelockExpiry: null,
        milestones: [],
        metadata: args.metadata,
        disputeId: null,
        feeAmount: args.amount / 100n, // 1% fee
        buyerApproved: false,
        sellerApproved: false,
        arbitratorApproved: false,
      };

      this.mockEscrows.push(escrow);
      this.mockStats.totalEscrows += 1n;
      this.mockStats.activeEscrows += 1n;
      this.mockStats.totalVolume += args.amount;

      return { ok: escrow };
    } catch (error) {
      return { err: 'Failed to create escrow' };
    }
  }

  async getUserEscrows(userId: string): Promise<Escrow[]> {
    return this.mockEscrows.filter(escrow => 
      escrow.buyer === userId || escrow.seller === userId
    );
  }

  async getEscrow(escrowId: string): Promise<Escrow | null> {
    return this.mockEscrows.find(escrow => escrow.id === escrowId) || null;
  }

  async fundEscrow(escrowId: string): Promise<{ ok: Escrow } | { err: string }> {
    const escrow = this.mockEscrows.find(e => e.id === escrowId);
    if (!escrow) {
      return { err: 'Escrow not found' };
    }

    escrow.status = { Funded: null };
    escrow.updatedAt = BigInt(Date.now() * 1000000);

    return { ok: escrow };
  }

  async approveEscrow(escrowId: string): Promise<{ ok: Escrow } | { err: string }> {
    const escrow = this.mockEscrows.find(e => e.id === escrowId);
    if (!escrow) {
      return { err: 'Escrow not found' };
    }

    escrow.buyerApproved = true;
    escrow.sellerApproved = true;
    escrow.updatedAt = BigInt(Date.now() * 1000000);

    return { ok: escrow };
  }

  async releaseEscrow(escrowId: string): Promise<{ ok: Escrow } | { err: string }> {
    const escrow = this.mockEscrows.find(e => e.id === escrowId);
    if (!escrow) {
      return { err: 'Escrow not found' };
    }

    escrow.status = { Completed: null };
    escrow.updatedAt = BigInt(Date.now() * 1000000);
    
    this.mockStats.activeEscrows -= 1n;
    this.mockStats.completedEscrows += 1n;

    return { ok: escrow };
  }

  async cancelEscrow(escrowId: string): Promise<{ ok: Escrow } | { err: string }> {
    const escrow = this.mockEscrows.find(e => e.id === escrowId);
    if (!escrow) {
      return { err: 'Escrow not found' };
    }

    escrow.status = { Cancelled: null };
    escrow.updatedAt = BigInt(Date.now() * 1000000);
    
    this.mockStats.activeEscrows -= 1n;

    return { ok: escrow };
  }

  async createDispute(escrowId: string, reason: string): Promise<{ ok: Dispute } | { err: string }> {
    const escrow = this.mockEscrows.find(e => e.id === escrowId);
    if (!escrow) {
      return { err: 'Escrow not found' };
    }

    const dispute: Dispute = {
      id: `DIS-${Date.now()}`,
      escrowId: escrowId,
      initiator: 'current-user-id',
      reason: reason,
      evidence: [],
      status: { Open: null },
      arbitrator: escrow.arbitrator,
      createdAt: BigInt(Date.now() * 1000000),
      resolvedAt: null,
      resolution: null,
      ruling: null,
    };

    this.mockDisputes.push(dispute);
    escrow.status = { Disputed: null };
    escrow.disputeId = dispute.id;

    return { ok: dispute };
  }

  async getUserDisputes(userId: string): Promise<Dispute[]> {
    return this.mockDisputes.filter(dispute => dispute.initiator === userId);
  }

  async getPlatformStats(): Promise<EscrowStats> {
    return this.mockStats;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.mockUserProfiles.get(userId) || null;
  }

  async createUserProfile(username?: string, email?: string): Promise<{ ok: UserProfile } | { err: string }> {
    const profile: UserProfile = {
      id: 'current-user-id',
      username: username || null,
      email: email || null,
      reputation: 100.0,
      totalEscrows: 0n,
      completedEscrows: 0n,
      disputesWon: 0n,
      disputesLost: 0n,
      totalVolume: 0n,
      createdAt: BigInt(Date.now() * 1000000),
      isArbitrator: false,
      isActive: true,
    };

    this.mockUserProfiles.set(profile.id, profile);
    return { ok: profile };
  }
}

// Create singleton instance
const mockService = new MockLock3Service();

// Hook for escrow operations
export const useEscrow = () => {
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEscrow = useCallback(async (args: CreateEscrowArgs) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mockService.createEscrow(args);
      if ('ok' in result) {
        setEscrows(prev => [...prev, result.ok]);
        return result.ok;
      } else {
        setError(result.err);
        return null;
      }
    } catch (err) {
      setError('Failed to create escrow');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserEscrows = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const userEscrows = await mockService.getUserEscrows(userId);
      setEscrows(userEscrows);
    } catch (err) {
      setError('Failed to load escrows');
    } finally {
      setLoading(false);
    }
  }, []);

  const fundEscrow = useCallback(async (escrowId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mockService.fundEscrow(escrowId);
      if ('ok' in result) {
        setEscrows(prev => prev.map(e => e.id === escrowId ? result.ok : e));
        return result.ok;
      } else {
        setError(result.err);
        return null;
      }
    } catch (err) {
      setError('Failed to fund escrow');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveEscrow = useCallback(async (escrowId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mockService.approveEscrow(escrowId);
      if ('ok' in result) {
        setEscrows(prev => prev.map(e => e.id === escrowId ? result.ok : e));
        return result.ok;
      } else {
        setError(result.err);
        return null;
      }
    } catch (err) {
      setError('Failed to approve escrow');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const releaseEscrow = useCallback(async (escrowId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mockService.releaseEscrow(escrowId);
      if ('ok' in result) {
        setEscrows(prev => prev.map(e => e.id === escrowId ? result.ok : e));
        return result.ok;
      } else {
        setError(result.err);
        return null;
      }
    } catch (err) {
      setError('Failed to release escrow');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelEscrow = useCallback(async (escrowId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mockService.cancelEscrow(escrowId);
      if ('ok' in result) {
        setEscrows(prev => prev.map(e => e.id === escrowId ? result.ok : e));
        return result.ok;
      } else {
        setError(result.err);
        return null;
      }
    } catch (err) {
      setError('Failed to cancel escrow');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    escrows,
    loading,
    error,
    createEscrow,
    loadUserEscrows,
    fundEscrow,
    approveEscrow,
    releaseEscrow,
    cancelEscrow,
  };
};

// Hook for dispute operations
export const useDispute = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDispute = useCallback(async (escrowId: string, reason: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mockService.createDispute(escrowId, reason);
      if ('ok' in result) {
        setDisputes(prev => [...prev, result.ok]);
        return result.ok;
      } else {
        setError(result.err);
        return null;
      }
    } catch (err) {
      setError('Failed to create dispute');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserDisputes = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const userDisputes = await mockService.getUserDisputes(userId);
      setDisputes(userDisputes);
    } catch (err) {
      setError('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    disputes,
    loading,
    error,
    createDispute,
    loadUserDisputes,
  };
};

// Hook for platform stats
export const usePlatformStats = () => {
  const [stats, setStats] = useState<EscrowStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const platformStats = await mockService.getPlatformStats();
      setStats(platformStats);
    } catch (err) {
      setError('Failed to load platform stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    loadStats,
  };
};

// Hook for user profile operations
export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const userProfile = await mockService.getUserProfile(userId);
      setProfile(userProfile);
    } catch (err) {
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const createProfile = useCallback(async (username?: string, email?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mockService.createUserProfile(username, email);
      if ('ok' in result) {
        setProfile(result.ok);
        return result.ok;
      } else {
        setError(result.err);
        return null;
      }
    } catch (err) {
      setError('Failed to create user profile');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    profile,
    loading,
    error,
    loadProfile,
    createProfile,
  };
};

// Utility hooks for formatting
export const useFormatters = () => {
  return {
    formatEscrowStatus,
    formatAssetType,
    formatAmount,
    formatTimestamp,
    createAssetType,
    createEscrowCondition,
    parseAmount,
  };
};
