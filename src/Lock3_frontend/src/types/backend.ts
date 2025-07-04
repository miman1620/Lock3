// Backend type definitions to match the Motoko backend
export type UserId = string;
export type EscrowId = string;
export type DisputeId = string;
export type TransactionId = string;

export type AssetType = 
  | { ICP: null }
  | { ckBTC: null }
  | { ICRC1: string }
  | { NFT: string };

export type EscrowStatus = 
  | { Created: null }
  | { Funded: null }
  | { Active: null }
  | { Completed: null }
  | { Cancelled: null }
  | { Disputed: null }
  | { Resolved: null };

export type DisputeStatus = 
  | { Open: null }
  | { InProgress: null }
  | { Resolved: null }
  | { Closed: null };

export type UserRole = 
  | { Buyer: null }
  | { Seller: null }
  | { Arbitrator: null }
  | { Admin: null };

export type EscrowCondition = 
  | { Manual: null }
  | { Timelock: bigint }
  | { Milestone: string[] }
  | { Oracle: string };

export interface Milestone {
  id: string;
  description: string;
  completed: boolean;
  completedAt: bigint | null;
  approvedBy: UserId | null;
}

export interface Escrow {
  id: EscrowId;
  buyer: UserId;
  seller: UserId;
  arbitrator: UserId | null;
  assetType: AssetType;
  amount: bigint;
  description: string;
  conditions: EscrowCondition;
  status: EscrowStatus;
  createdAt: bigint;
  updatedAt: bigint;
  timelockExpiry: bigint | null;
  milestones: Milestone[];
  metadata: [string, string][];
  disputeId: DisputeId | null;
  feeAmount: bigint;
  buyerApproved: boolean;
  sellerApproved: boolean;
  arbitratorApproved: boolean;
}

export interface Evidence {
  id: string;
  submittedBy: UserId;
  content: string;
  fileHash: string | null;
  timestamp: bigint;
}

export interface DisputeRuling {
  winner: UserId;
  refundAmount: bigint;
  penaltyAmount: bigint;
  reasoning: string;
}

export interface Dispute {
  id: DisputeId;
  escrowId: EscrowId;
  initiator: UserId;
  reason: string;
  evidence: Evidence[];
  status: DisputeStatus;
  arbitrator: UserId | null;
  createdAt: bigint;
  resolvedAt: bigint | null;
  resolution: string | null;
  ruling: DisputeRuling | null;
}

export interface UserProfile {
  id: UserId;
  username: string | null;
  email: string | null;
  reputation: number;
  totalEscrows: bigint;
  completedEscrows: bigint;
  disputesWon: bigint;
  disputesLost: bigint;
  totalVolume: bigint;
  createdAt: bigint;
  isArbitrator: boolean;
  isActive: boolean;
}

export type TransactionType = 
  | { Deposit: null }
  | { Release: null }
  | { Refund: null }
  | { Fee: null }
  | { Penalty: null };

export type TransactionStatus = 
  | { Pending: null }
  | { Confirmed: null }
  | { Failed: null };

export interface Transaction {
  id: TransactionId;
  escrowId: EscrowId;
  from: UserId;
  to: UserId;
  amount: bigint;
  assetType: AssetType;
  transactionType: TransactionType;
  timestamp: bigint;
  blockHeight: bigint | null;
  status: TransactionStatus;
}

export interface CreateEscrowArgs {
  seller: UserId;
  arbitrator: UserId | null;
  assetType: AssetType;
  amount: bigint;
  description: string;
  conditions: EscrowCondition;
  metadata: [string, string][];
}

export interface EscrowStats {
  totalEscrows: bigint;
  activeEscrows: bigint;
  completedEscrows: bigint;
  totalVolume: bigint;
  averageEscrowValue: bigint;
  totalFees: bigint;
}

// Result type for API responses
export type ApiResult<T> = { ok: T } | { err: string };

// Helper functions for working with backend types
export const formatAssetType = (assetType: AssetType): string => {
  if ('ICP' in assetType) return 'ICP';
  if ('ckBTC' in assetType) return 'ckBTC';
  if ('ICRC1' in assetType) return `ICRC1(${assetType.ICRC1})`;
  if ('NFT' in assetType) return `NFT(${assetType.NFT})`;
  return 'Unknown';
};

export const formatEscrowStatus = (status: EscrowStatus): string => {
  if ('Created' in status) return 'Created';
  if ('Funded' in status) return 'Funded';
  if ('Active' in status) return 'Active';
  if ('Completed' in status) return 'Completed';
  if ('Cancelled' in status) return 'Cancelled';
  if ('Disputed' in status) return 'Disputed';
  if ('Resolved' in status) return 'Resolved';
  return 'Unknown';
};

export const formatDisputeStatus = (status: DisputeStatus): string => {
  if ('Open' in status) return 'Open';
  if ('InProgress' in status) return 'In Progress';
  if ('Resolved' in status) return 'Resolved';
  if ('Closed' in status) return 'Closed';
  return 'Unknown';
};

export const formatEscrowCondition = (condition: EscrowCondition): string => {
  if ('Manual' in condition) return 'Manual Approval';
  if ('Timelock' in condition) return `Timelock (${condition.Timelock}ns)`;
  if ('Milestone' in condition) return `Milestones (${condition.Milestone.length})`;
  if ('Oracle' in condition) return `Oracle (${condition.Oracle})`;
  return 'Unknown';
};

export const formatTransactionType = (type: TransactionType): string => {
  if ('Deposit' in type) return 'Deposit';
  if ('Release' in type) return 'Release';
  if ('Refund' in type) return 'Refund';
  if ('Fee' in type) return 'Fee';
  if ('Penalty' in type) return 'Penalty';
  return 'Unknown';
};

export const formatTransactionStatus = (status: TransactionStatus): string => {
  if ('Pending' in status) return 'Pending';
  if ('Confirmed' in status) return 'Confirmed';
  if ('Failed' in status) return 'Failed';
  return 'Unknown';
};

// Helper to convert frontend values to backend types
export const createAssetType = (type: string, canisterId?: string): AssetType => {
  switch (type) {
    case 'ICP':
      return { ICP: null };
    case 'ckBTC':
      return { ckBTC: null };
    case 'ICRC1':
      return { ICRC1: canisterId || '' };
    case 'NFT':
      return { NFT: canisterId || '' };
    default:
      return { ICP: null };
  }
};

export const createEscrowCondition = (type: string, value?: string | string[]): EscrowCondition => {
  switch (type) {
    case 'manual':
      return { Manual: null };
    case 'timelock':
      return { Timelock: BigInt(value as string || '0') };
    case 'milestone':
      return { Milestone: value as string[] || [] };
    case 'oracle':
      return { Oracle: value as string || '' };
    default:
      return { Manual: null };
  }
};

// Helper to convert bigint to number for display
export const formatAmount = (amount: bigint, decimals: number = 8): string => {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  
  if (fraction === 0n) {
    return whole.toString();
  }
  
  const fractionStr = fraction.toString().padStart(decimals, '0');
  const trimmedFraction = fractionStr.replace(/0+$/, '');
  
  return `${whole}.${trimmedFraction}`;
};

// Helper to convert number to bigint for backend
export const parseAmount = (amount: string, decimals: number = 8): bigint => {
  const parts = amount.split('.');
  const whole = BigInt(parts[0] || '0');
  const fraction = (parts[1] || '').padEnd(decimals, '0').substring(0, decimals);
  const fractionBigInt = BigInt(fraction);
  
  return whole * BigInt(10 ** decimals) + fractionBigInt;
};

// Helper to format timestamp
export const formatTimestamp = (timestamp: bigint): string => {
  const date = new Date(Number(timestamp / BigInt(1000000))); // Convert from nanoseconds
  return date.toLocaleString();
};

// Helper to format duration
export const formatDuration = (nanoseconds: bigint): string => {
  const seconds = Number(nanoseconds / BigInt(1000000000));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} days`;
  if (hours > 0) return `${hours} hours`;
  if (minutes > 0) return `${minutes} minutes`;
  return `${seconds} seconds`;
};
