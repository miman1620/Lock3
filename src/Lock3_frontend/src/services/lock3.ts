import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';
import { IDL } from '@dfinity/candid';
import {
  Escrow,
  EscrowId,
  UserId,
  DisputeId,
  TransactionId,
  Dispute,
  UserProfile,
  Transaction,
  EscrowStats,
  CreateEscrowArgs,
  ApiResult,
} from '../types/backend';

// IDL factory for the Lock3 backend
const idlFactory = ({ IDL }: { IDL: any }) => {
  const UserId = IDL.Principal;
  const EscrowId = IDL.Text;
  const DisputeId = IDL.Text;
  const TransactionId = IDL.Text;
  
  const AssetType = IDL.Variant({
    'ICP': IDL.Null,
    'ckBTC': IDL.Null,
    'ICRC1': IDL.Text,
    'NFT': IDL.Text,
  });
  
  const EscrowStatus = IDL.Variant({
    'Created': IDL.Null,
    'Funded': IDL.Null,
    'Active': IDL.Null,
    'Completed': IDL.Null,
    'Cancelled': IDL.Null,
    'Disputed': IDL.Null,
    'Resolved': IDL.Null,
  });
  
  const DisputeStatus = IDL.Variant({
    'Open': IDL.Null,
    'InProgress': IDL.Null,
    'Resolved': IDL.Null,
    'Closed': IDL.Null,
  });
  
  const EscrowCondition = IDL.Variant({
    'Manual': IDL.Null,
    'Timelock': IDL.Int,
    'Milestone': IDL.Vec(IDL.Text),
    'Oracle': IDL.Text,
  });
  
  const Milestone = IDL.Record({
    'id': IDL.Text,
    'description': IDL.Text,
    'completed': IDL.Bool,
    'completedAt': IDL.Opt(IDL.Int),
    'approvedBy': IDL.Opt(UserId),
  });
  
  const Escrow = IDL.Record({
    'id': EscrowId,
    'buyer': UserId,
    'seller': UserId,
    'arbitrator': IDL.Opt(UserId),
    'assetType': AssetType,
    'amount': IDL.Nat64,
    'description': IDL.Text,
    'conditions': EscrowCondition,
    'status': EscrowStatus,
    'createdAt': IDL.Int,
    'updatedAt': IDL.Int,
    'timelockExpiry': IDL.Opt(IDL.Int),
    'milestones': IDL.Vec(Milestone),
    'metadata': IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'disputeId': IDL.Opt(DisputeId),
    'feeAmount': IDL.Nat64,
    'buyerApproved': IDL.Bool,
    'sellerApproved': IDL.Bool,
    'arbitratorApproved': IDL.Bool,
  });
  
  const Evidence = IDL.Record({
    'id': IDL.Text,
    'submittedBy': UserId,
    'content': IDL.Text,
    'fileHash': IDL.Opt(IDL.Text),
    'timestamp': IDL.Int,
  });
  
  const DisputeRuling = IDL.Record({
    'winner': UserId,
    'refundAmount': IDL.Nat64,
    'penaltyAmount': IDL.Nat64,
    'reasoning': IDL.Text,
  });
  
  const Dispute = IDL.Record({
    'id': DisputeId,
    'escrowId': EscrowId,
    'initiator': UserId,
    'reason': IDL.Text,
    'evidence': IDL.Vec(Evidence),
    'status': DisputeStatus,
    'arbitrator': IDL.Opt(UserId),
    'createdAt': IDL.Int,
    'resolvedAt': IDL.Opt(IDL.Int),
    'resolution': IDL.Opt(IDL.Text),
    'ruling': IDL.Opt(DisputeRuling),
  });
  
  const UserProfile = IDL.Record({
    'id': UserId,
    'username': IDL.Opt(IDL.Text),
    'email': IDL.Opt(IDL.Text),
    'reputation': IDL.Float64,
    'totalEscrows': IDL.Nat,
    'completedEscrows': IDL.Nat,
    'disputesWon': IDL.Nat,
    'disputesLost': IDL.Nat,
    'totalVolume': IDL.Nat64,
    'createdAt': IDL.Int,
    'isArbitrator': IDL.Bool,
    'isActive': IDL.Bool,
  });
  
  const TransactionType = IDL.Variant({
    'Deposit': IDL.Null,
    'Release': IDL.Null,
    'Refund': IDL.Null,
    'Fee': IDL.Null,
    'Penalty': IDL.Null,
  });
  
  const TransactionStatus = IDL.Variant({
    'Pending': IDL.Null,
    'Confirmed': IDL.Null,
    'Failed': IDL.Null,
  });
  
  const Transaction = IDL.Record({
    'id': TransactionId,
    'escrowId': EscrowId,
    'from': UserId,
    'to': UserId,
    'amount': IDL.Nat64,
    'assetType': AssetType,
    'transactionType': TransactionType,
    'timestamp': IDL.Int,
    'blockHeight': IDL.Opt(IDL.Nat64),
    'status': TransactionStatus,
  });
  
  const CreateEscrowArgs = IDL.Record({
    'seller': UserId,
    'arbitrator': IDL.Opt(UserId),
    'assetType': AssetType,
    'amount': IDL.Nat64,
    'description': IDL.Text,
    'conditions': EscrowCondition,
    'metadata': IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
  });
  
  const EscrowStats = IDL.Record({
    'totalEscrows': IDL.Nat,
    'activeEscrows': IDL.Nat,
    'completedEscrows': IDL.Nat,
    'totalVolume': IDL.Nat64,
    'averageEscrowValue': IDL.Nat64,
    'totalFees': IDL.Nat64,
  });
  
  const Result = (T: any, E: any) => IDL.Variant({
    'ok': T,
    'err': E,
  });
  
  return IDL.Service({
    // User Management
    'createUserProfile': IDL.Func([IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)], [Result(UserProfile, IDL.Text)], []),
    'getUserProfile': IDL.Func([UserId], [IDL.Opt(UserProfile)], ['query']),
    'updateUserProfile': IDL.Func([IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)], [Result(UserProfile, IDL.Text)], []),
    
    // Escrow Management
    'createEscrow': IDL.Func([CreateEscrowArgs], [Result(Escrow, IDL.Text)], []),
    'fundEscrow': IDL.Func([EscrowId], [Result(Escrow, IDL.Text)], []),
    'approveEscrow': IDL.Func([EscrowId], [Result(Escrow, IDL.Text)], []),
    'releaseEscrow': IDL.Func([EscrowId], [Result(Escrow, IDL.Text)], []),
    'cancelEscrow': IDL.Func([EscrowId], [Result(Escrow, IDL.Text)], []),
    'completeMilestone': IDL.Func([EscrowId, IDL.Text], [Result(Escrow, IDL.Text)], []),
    
    // Dispute Management
    'createDispute': IDL.Func([EscrowId, IDL.Text], [Result(Dispute, IDL.Text)], []),
    'submitEvidence': IDL.Func([DisputeId, IDL.Text, IDL.Opt(IDL.Text)], [Result(Dispute, IDL.Text)], []),
    'resolveDispute': IDL.Func([DisputeId, UserId, IDL.Nat64, IDL.Nat64, IDL.Text], [Result(Dispute, IDL.Text)], []),
    
    // Query Functions
    'getEscrow': IDL.Func([EscrowId], [IDL.Opt(Escrow)], ['query']),
    'getUserEscrows': IDL.Func([UserId], [IDL.Vec(Escrow)], ['query']),
    'getDispute': IDL.Func([DisputeId], [IDL.Opt(Dispute)], ['query']),
    'getUserDisputes': IDL.Func([UserId], [IDL.Vec(Dispute)], ['query']),
    'getTransaction': IDL.Func([TransactionId], [IDL.Opt(Transaction)], ['query']),
    'getEscrowTransactions': IDL.Func([EscrowId], [IDL.Vec(Transaction)], ['query']),
    'getPlatformStats': IDL.Func([], [EscrowStats], ['query']),
    'getAllEscrows': IDL.Func([], [IDL.Vec(Escrow)], ['query']),
    'getAllUsers': IDL.Func([], [IDL.Vec(UserProfile)], ['query']),
    
    // Admin Functions
    'setPlatformFeeRate': IDL.Func([IDL.Float64], [Result(IDL.Float64, IDL.Text)], []),
    'setArbitrationFeeRate': IDL.Func([IDL.Float64], [Result(IDL.Float64, IDL.Text)], []),
    'promoteToArbitrator': IDL.Func([UserId], [Result(UserProfile, IDL.Text)], []),
    'getPlatformFeeRate': IDL.Func([], [IDL.Float64], ['query']),
    'getArbitrationFeeRate': IDL.Func([], [IDL.Float64], ['query']),
    
    // Health check
    'healthCheck': IDL.Func([], [IDL.Text], ['query']),
  });
};

// Service class for interacting with the Lock3 backend
export class Lock3Service {
  private actor: any;
  private agent: HttpAgent;
  private authClient: AuthClient | null = null;
  private canisterId: string;

  constructor(canisterId: string, agent?: HttpAgent) {
    this.canisterId = canisterId;
    this.agent = agent || new HttpAgent({ 
      host: import.meta.env.PROD ? 'https://icp0.io' : 'http://127.0.0.1:4943' 
    });
    
    // In development, fetch root key
    if (import.meta.env.DEV) {
      this.agent.fetchRootKey().catch(console.error);
    }
    
    this.actor = Actor.createActor(idlFactory, {
      agent: this.agent,
      canisterId: this.canisterId,
    });
  }

  // Initialize with authentication
  async init(authClient?: AuthClient) {
    if (authClient) {
      this.authClient = authClient;
      const identity = authClient.getIdentity();
      this.agent.replaceIdentity(identity);
      
      this.actor = Actor.createActor(idlFactory, {
        agent: this.agent,
        canisterId: this.canisterId,
      });
    }
  }

  // User Management
  async createUserProfile(username?: string, email?: string): Promise<ApiResult<UserProfile>> {
    try {
      const result = await this.actor.createUserProfile(
        username ? [username] : [],
        email ? [email] : []
      );
      return result;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return { err: 'Failed to create user profile' };
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const result = await this.actor.getUserProfile(Principal.fromText(userId));
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  async updateUserProfile(username?: string, email?: string): Promise<ApiResult<UserProfile>> {
    try {
      const result = await this.actor.updateUserProfile(
        username ? [username] : [],
        email ? [email] : []
      );
      return result;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { err: 'Failed to update user profile' };
    }
  }

  // Escrow Management
  async createEscrow(args: CreateEscrowArgs): Promise<ApiResult<Escrow>> {
    try {
      const result = await this.actor.createEscrow({
        ...args,
        seller: Principal.fromText(args.seller),
        arbitrator: args.arbitrator ? [Principal.fromText(args.arbitrator)] : [],
      });
      return result;
    } catch (error) {
      console.error('Error creating escrow:', error);
      return { err: 'Failed to create escrow' };
    }
  }

  async fundEscrow(escrowId: string): Promise<ApiResult<Escrow>> {
    try {
      const result = await this.actor.fundEscrow(escrowId);
      return result;
    } catch (error) {
      console.error('Error funding escrow:', error);
      return { err: 'Failed to fund escrow' };
    }
  }

  async approveEscrow(escrowId: string): Promise<ApiResult<Escrow>> {
    try {
      const result = await this.actor.approveEscrow(escrowId);
      return result;
    } catch (error) {
      console.error('Error approving escrow:', error);
      return { err: 'Failed to approve escrow' };
    }
  }

  async releaseEscrow(escrowId: string): Promise<ApiResult<Escrow>> {
    try {
      const result = await this.actor.releaseEscrow(escrowId);
      return result;
    } catch (error) {
      console.error('Error releasing escrow:', error);
      return { err: 'Failed to release escrow' };
    }
  }

  async cancelEscrow(escrowId: string): Promise<ApiResult<Escrow>> {
    try {
      const result = await this.actor.cancelEscrow(escrowId);
      return result;
    } catch (error) {
      console.error('Error canceling escrow:', error);
      return { err: 'Failed to cancel escrow' };
    }
  }

  async completeMilestone(escrowId: string, milestoneId: string): Promise<ApiResult<Escrow>> {
    try {
      const result = await this.actor.completeMilestone(escrowId, milestoneId);
      return result;
    } catch (error) {
      console.error('Error completing milestone:', error);
      return { err: 'Failed to complete milestone' };
    }
  }

  // Dispute Management
  async createDispute(escrowId: string, reason: string): Promise<ApiResult<Dispute>> {
    try {
      const result = await this.actor.createDispute(escrowId, reason);
      return result;
    } catch (error) {
      console.error('Error creating dispute:', error);
      return { err: 'Failed to create dispute' };
    }
  }

  async submitEvidence(disputeId: string, content: string, fileHash?: string): Promise<ApiResult<Dispute>> {
    try {
      const result = await this.actor.submitEvidence(
        disputeId,
        content,
        fileHash ? [fileHash] : []
      );
      return result;
    } catch (error) {
      console.error('Error submitting evidence:', error);
      return { err: 'Failed to submit evidence' };
    }
  }

  async resolveDispute(
    disputeId: string,
    winner: string,
    refundAmount: bigint,
    penaltyAmount: bigint,
    reasoning: string
  ): Promise<ApiResult<Dispute>> {
    try {
      const result = await this.actor.resolveDispute(
        disputeId,
        Principal.fromText(winner),
        refundAmount,
        penaltyAmount,
        reasoning
      );
      return result;
    } catch (error) {
      console.error('Error resolving dispute:', error);
      return { err: 'Failed to resolve dispute' };
    }
  }

  // Query Functions
  async getEscrow(escrowId: string): Promise<Escrow | null> {
    try {
      const result = await this.actor.getEscrow(escrowId);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting escrow:', error);
      return null;
    }
  }

  async getUserEscrows(userId: string): Promise<Escrow[]> {
    try {
      const result = await this.actor.getUserEscrows(Principal.fromText(userId));
      return result;
    } catch (error) {
      console.error('Error getting user escrows:', error);
      return [];
    }
  }

  async getDispute(disputeId: string): Promise<Dispute | null> {
    try {
      const result = await this.actor.getDispute(disputeId);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting dispute:', error);
      return null;
    }
  }

  async getUserDisputes(userId: string): Promise<Dispute[]> {
    try {
      const result = await this.actor.getUserDisputes(Principal.fromText(userId));
      return result;
    } catch (error) {
      console.error('Error getting user disputes:', error);
      return [];
    }
  }

  async getTransaction(transactionId: string): Promise<Transaction | null> {
    try {
      const result = await this.actor.getTransaction(transactionId);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting transaction:', error);
      return null;
    }
  }

  async getEscrowTransactions(escrowId: string): Promise<Transaction[]> {
    try {
      const result = await this.actor.getEscrowTransactions(escrowId);
      return result;
    } catch (error) {
      console.error('Error getting escrow transactions:', error);
      return [];
    }
  }

  async getPlatformStats(): Promise<EscrowStats | null> {
    try {
      const result = await this.actor.getPlatformStats();
      return result;
    } catch (error) {
      console.error('Error getting platform stats:', error);
      return null;
    }
  }

  async getAllEscrows(): Promise<Escrow[]> {
    try {
      const result = await this.actor.getAllEscrows();
      return result;
    } catch (error) {
      console.error('Error getting all escrows:', error);
      return [];
    }
  }

  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const result = await this.actor.getAllUsers();
      return result;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // Admin Functions
  async setPlatformFeeRate(rate: number): Promise<ApiResult<number>> {
    try {
      const result = await this.actor.setPlatformFeeRate(rate);
      return result;
    } catch (error) {
      console.error('Error setting platform fee rate:', error);
      return { err: 'Failed to set platform fee rate' };
    }
  }

  async setArbitrationFeeRate(rate: number): Promise<ApiResult<number>> {
    try {
      const result = await this.actor.setArbitrationFeeRate(rate);
      return result;
    } catch (error) {
      console.error('Error setting arbitration fee rate:', error);
      return { err: 'Failed to set arbitration fee rate' };
    }
  }

  async promoteToArbitrator(userId: string): Promise<ApiResult<UserProfile>> {
    try {
      const result = await this.actor.promoteToArbitrator(Principal.fromText(userId));
      return result;
    } catch (error) {
      console.error('Error promoting to arbitrator:', error);
      return { err: 'Failed to promote to arbitrator' };
    }
  }

  async getPlatformFeeRate(): Promise<number> {
    try {
      const result = await this.actor.getPlatformFeeRate();
      return result;
    } catch (error) {
      console.error('Error getting platform fee rate:', error);
      return 0;
    }
  }

  async getArbitrationFeeRate(): Promise<number> {
    try {
      const result = await this.actor.getArbitrationFeeRate();
      return result;
    } catch (error) {
      console.error('Error getting arbitration fee rate:', error);
      return 0;
    }
  }

  // Health check
  async healthCheck(): Promise<string> {
    try {
      const result = await this.actor.healthCheck();
      return result;
    } catch (error) {
      console.error('Error performing health check:', error);
      return 'Health check failed';
    }
  }
}

// Export singleton instance
let lock3Service: Lock3Service | null = null;

export const getLock3Service = (canisterId?: string): Lock3Service => {
  if (!lock3Service) {
    if (!canisterId) {
      throw new Error('Canister ID is required for first initialization');
    }
    lock3Service = new Lock3Service(canisterId);
  }
  return lock3Service;
};

export const initializeLock3Service = async (canisterId: string, authClient?: AuthClient) => {
  const service = getLock3Service(canisterId);
  await service.init(authClient);
  return service;
};
