import Time "mo:base/Time";
import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Int "mo:base/Int";
import Float "mo:base/Float";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Buffer "mo:base/Buffer";

// Define the main actor
actor Lock3Backend {
    
    // === Type Definitions ===
    
    public type UserId = Principal;
    public type EscrowId = Text;
    public type DisputeId = Text;
    public type TransactionId = Text;
    
    public type AssetType = {
        #ICP;
        #ckBTC;
        #ICRC1: Text; // Token canister ID
        #NFT: Text;   // NFT canister ID
    };
    
    public type EscrowStatus = {
        #Created;
        #Funded;
        #Active;
        #Completed;
        #Cancelled;
        #Disputed;
        #Resolved;
    };
    
    public type DisputeStatus = {
        #Open;
        #InProgress;
        #Resolved;
        #Closed;
    };
    
    public type UserRole = {
        #Buyer;
        #Seller;
        #Arbitrator;
        #Admin;
    };
    
    public type EscrowCondition = {
        #Manual;
        #Timelock: Int;
        #Milestone: [Text];
        #Oracle: Text;
    };
    
    public type Escrow = {
        id: EscrowId;
        buyer: UserId;
        seller: UserId;
        arbitrator: ?UserId;
        assetType: AssetType;
        amount: Nat64;
        description: Text;
        conditions: EscrowCondition;
        status: EscrowStatus;
        createdAt: Int;
        updatedAt: Int;
        timelockExpiry: ?Int;
        milestones: [Milestone];
        metadata: [(Text, Text)];
        disputeId: ?DisputeId;
        feeAmount: Nat64;
        buyerApproved: Bool;
        sellerApproved: Bool;
        arbitratorApproved: Bool;
    };
    
    public type Milestone = {
        id: Text;
        description: Text;
        completed: Bool;
        completedAt: ?Int;
        approvedBy: ?UserId;
    };
    
    public type Dispute = {
        id: DisputeId;
        escrowId: EscrowId;
        initiator: UserId;
        reason: Text;
        evidence: [Evidence];
        status: DisputeStatus;
        arbitrator: ?UserId;
        createdAt: Int;
        resolvedAt: ?Int;
        resolution: ?Text;
        ruling: ?DisputeRuling;
    };
    
    public type Evidence = {
        id: Text;
        submittedBy: UserId;
        content: Text;
        fileHash: ?Text;
        timestamp: Int;
    };
    
    public type DisputeRuling = {
        winner: UserId;
        refundAmount: Nat64;
        penaltyAmount: Nat64;
        reasoning: Text;
    };
    
    public type UserProfile = {
        id: UserId;
        username: ?Text;
        email: ?Text;
        reputation: Float;
        totalEscrows: Nat;
        completedEscrows: Nat;
        disputesWon: Nat;
        disputesLost: Nat;
        totalVolume: Nat64;
        createdAt: Int;
        isArbitrator: Bool;
        isActive: Bool;
    };
    
    public type Transaction = {
        id: TransactionId;
        escrowId: EscrowId;
        from: UserId;
        to: UserId;
        amount: Nat64;
        assetType: AssetType;
        transactionType: TransactionType;
        timestamp: Int;
        blockHeight: ?Nat64;
        status: TransactionStatus;
    };
    
    public type TransactionType = {
        #Deposit;
        #Release;
        #Refund;
        #Fee;
        #Penalty;
    };
    
    public type TransactionStatus = {
        #Pending;
        #Confirmed;
        #Failed;
    };
    
    public type CreateEscrowArgs = {
        seller: UserId;
        arbitrator: ?UserId;
        assetType: AssetType;
        amount: Nat64;
        description: Text;
        conditions: EscrowCondition;
        metadata: [(Text, Text)];
    };
    
    public type EscrowStats = {
        totalEscrows: Nat;
        activeEscrows: Nat;
        completedEscrows: Nat;
        totalVolume: Nat64;
        averageEscrowValue: Nat64;
        totalFees: Nat64;
    };
    
    // === State Variables ===
    
    private stable var nextEscrowId: Nat = 1;
    private stable var nextDisputeId: Nat = 1;
    private stable var nextTransactionId: Nat = 1;
    private stable var platformFeeRate: Float = 0.01; // 1%
    private stable var arbitrationFeeRate: Float = 0.005; // 0.5%
    private stable var platformAdmin: UserId = Principal.fromText("2vxsx-fae");
    
    // Stable storage for persistence
    private stable var escrowsEntries: [(EscrowId, Escrow)] = [];
    private stable var disputesEntries: [(DisputeId, Dispute)] = [];
    private stable var userProfilesEntries: [(UserId, UserProfile)] = [];
    private stable var transactionsEntries: [(TransactionId, Transaction)] = [];
    
    // Runtime storage
    private var escrows = HashMap.HashMap<EscrowId, Escrow>(0, Text.equal, Text.hash);
    private var disputes = HashMap.HashMap<DisputeId, Dispute>(0, Text.equal, Text.hash);
    private var userProfiles = HashMap.HashMap<UserId, UserProfile>(0, Principal.equal, Principal.hash);
    private var transactions = HashMap.HashMap<TransactionId, Transaction>(0, Text.equal, Text.hash);
    
    // === System Functions ===
    
    system func preupgrade() {
        escrowsEntries := Iter.toArray(escrows.entries());
        disputesEntries := Iter.toArray(disputes.entries());
        userProfilesEntries := Iter.toArray(userProfiles.entries());
        transactionsEntries := Iter.toArray(transactions.entries());
    };
    
    system func postupgrade() {
        escrows := HashMap.fromIter<EscrowId, Escrow>(escrowsEntries.vals(), escrowsEntries.size(), Text.equal, Text.hash);
        disputes := HashMap.fromIter<DisputeId, Dispute>(disputesEntries.vals(), disputesEntries.size(), Text.equal, Text.hash);
        userProfiles := HashMap.fromIter<UserId, UserProfile>(userProfilesEntries.vals(), userProfilesEntries.size(), Principal.equal, Principal.hash);
        transactions := HashMap.fromIter<TransactionId, Transaction>(transactionsEntries.vals(), transactionsEntries.size(), Text.equal, Text.hash);
    };
    
    // === Utility Functions ===
    
    private func generateEscrowId(): EscrowId {
        let id = "ESC-" # Nat.toText(nextEscrowId);
        nextEscrowId += 1;
        id
    };
    
    private func generateDisputeId(): DisputeId {
        let id = "DIS-" # Nat.toText(nextDisputeId);
        nextDisputeId += 1;
        id
    };
    
    private func generateTransactionId(): TransactionId {
        let id = "TXN-" # Nat.toText(nextTransactionId);
        nextTransactionId += 1;
        id
    };
    
    private func calculateFee(amount: Nat64): Nat64 {
        let feeFloat = Float.fromInt(Nat64.toNat(amount)) * platformFeeRate;
        Nat64.fromNat(Int.abs(Float.toInt(feeFloat)))
    };
    
    private func _calculateArbitrationFee(amount: Nat64): Nat64 {
        let feeFloat = Float.fromInt(Nat64.toNat(amount)) * arbitrationFeeRate;
        Nat64.fromNat(Int.abs(Float.toInt(feeFloat)))
    };
    
    private func isAuthorized(caller: UserId, escrowId: EscrowId): Bool {
        switch (escrows.get(escrowId)) {
            case (?escrow) {
                caller == escrow.buyer or caller == escrow.seller or 
                (switch (escrow.arbitrator) { case (?arb) arb == caller; case null false })
            };
            case null false;
        }
    };
    
    private func updateUserProfileInternal(userId: UserId, updateFn: (UserProfile) -> UserProfile) {
        switch (userProfiles.get(userId)) {
            case (?profile) {
                userProfiles.put(userId, updateFn(profile));
            };
            case null {
                let newProfile: UserProfile = {
                    id = userId;
                    username = null;
                    email = null;
                    reputation = 100.0;
                    totalEscrows = 0;
                    completedEscrows = 0;
                    disputesWon = 0;
                    disputesLost = 0;
                    totalVolume = 0;
                    createdAt = Time.now();
                    isArbitrator = false;
                    isActive = true;
                };
                userProfiles.put(userId, updateFn(newProfile));
            };
        }
    };
    
    // === Public Functions ===
    
    // User Management
    public shared(msg) func createUserProfile(username: ?Text, email: ?Text): async Result.Result<UserProfile, Text> {
        let caller = msg.caller;
        
        switch (userProfiles.get(caller)) {
            case (?_) {
                #err("User profile already exists")
            };
            case null {
                let profile: UserProfile = {
                    id = caller;
                    username = username;
                    email = email;
                    reputation = 100.0;
                    totalEscrows = 0;
                    completedEscrows = 0;
                    disputesWon = 0;
                    disputesLost = 0;
                    totalVolume = 0;
                    createdAt = Time.now();
                    isArbitrator = false;
                    isActive = true;
                };
                userProfiles.put(caller, profile);
                #ok(profile)
            };
        }
    };
    
    public query func getUserProfile(userId: UserId): async ?UserProfile {
        userProfiles.get(userId)
    };
    
    public shared(msg) func updateUserProfile(username: ?Text, email: ?Text): async Result.Result<UserProfile, Text> {
        let caller = msg.caller;
        
        switch (userProfiles.get(caller)) {
            case (?profile) {
                let updatedProfile = {
                    profile with
                    username = username;
                    email = email;
                };
                userProfiles.put(caller, updatedProfile);
                #ok(updatedProfile)
            };
            case null {
                #err("User profile not found")
            };
        }
    };
    
    // Escrow Management
    public shared(msg) func createEscrow(args: CreateEscrowArgs): async Result.Result<Escrow, Text> {
        let caller = msg.caller;
        
        if (args.amount == 0) {
            return #err("Amount must be greater than 0");
        };
        
        let escrowId = generateEscrowId();
        let feeAmount = calculateFee(args.amount);
        let now = Time.now();
        
        let timelockExpiry = switch (args.conditions) {
            case (#Timelock(duration)) {
                ?Int.add(now, duration)
            };
            case (_) null;
        };
        
        let milestones = switch (args.conditions) {
            case (#Milestone(descriptions)) {
                Array.map<Text, Milestone>(descriptions, func(desc) {
                    {
                        id = generateTransactionId();
                        description = desc;
                        completed = false;
                        completedAt = null;
                        approvedBy = null;
                    }
                })
            };
            case (_) [];
        };
        
        let escrow: Escrow = {
            id = escrowId;
            buyer = caller;
            seller = args.seller;
            arbitrator = args.arbitrator;
            assetType = args.assetType;
            amount = args.amount;
            description = args.description;
            conditions = args.conditions;
            status = #Created;
            createdAt = now;
            updatedAt = now;
            timelockExpiry = timelockExpiry;
            milestones = milestones;
            metadata = args.metadata;
            disputeId = null;
            feeAmount = feeAmount;
            buyerApproved = false;
            sellerApproved = false;
            arbitratorApproved = false;
        };
        
        escrows.put(escrowId, escrow);
        
        // Update user profiles
        updateUserProfileInternal(caller, func(profile) {
            { profile with totalEscrows = profile.totalEscrows + 1 }
        });
        
        updateUserProfileInternal(args.seller, func(profile) {
            { profile with totalEscrows = profile.totalEscrows + 1 }
        });
        
        #ok(escrow)
    };
    
    public func fundEscrow(escrowId: EscrowId): async Result.Result<Escrow, Text> {
        let caller = Principal.fromText("2vxsx-fae"); // This should be replaced with actual caller
        
        switch (escrows.get(escrowId)) {
            case (?escrow) {
                if (caller != escrow.buyer) {
                    return #err("Only buyer can fund escrow");
                };
                
                if (escrow.status != #Created) {
                    return #err("Escrow is not in Created status");
                };
                
                let updatedEscrow = {
                    escrow with
                    status = #Funded;
                    updatedAt = Time.now();
                };
                
                escrows.put(escrowId, updatedEscrow);
                
                // Record transaction
                let transaction: Transaction = {
                    id = generateTransactionId();
                    escrowId = escrowId;
                    from = caller;
                    to = Principal.fromText("2vxsx-fae"); // Platform principal
                    amount = escrow.amount;
                    assetType = escrow.assetType;
                    transactionType = #Deposit;
                    timestamp = Time.now();
                    blockHeight = null;
                    status = #Confirmed;
                };
                
                transactions.put(transaction.id, transaction);
                
                #ok(updatedEscrow)
            };
            case null {
                #err("Escrow not found")
            };
        }
    };
    
    public func approveEscrow(escrowId: EscrowId): async Result.Result<Escrow, Text> {
        let caller = Principal.fromText("2vxsx-fae"); // This should be replaced with actual caller
        
        switch (escrows.get(escrowId)) {
            case (?escrow) {
                if (not isAuthorized(caller, escrowId)) {
                    return #err("Not authorized to approve this escrow");
                };
                
                let (buyerApproved, sellerApproved, arbitratorApproved) = 
                    if (caller == escrow.buyer) {
                        (true, escrow.sellerApproved, escrow.arbitratorApproved)
                    } else if (caller == escrow.seller) {
                        (escrow.buyerApproved, true, escrow.arbitratorApproved)
                    } else {
                        (escrow.buyerApproved, escrow.sellerApproved, true)
                    };
                
                let updatedEscrow = {
                    escrow with
                    buyerApproved = buyerApproved;
                    sellerApproved = sellerApproved;
                    arbitratorApproved = arbitratorApproved;
                    updatedAt = Time.now();
                };
                
                escrows.put(escrowId, updatedEscrow);
                #ok(updatedEscrow)
            };
            case null {
                #err("Escrow not found")
            };
        }
    };
    
    public func releaseEscrow(escrowId: EscrowId): async Result.Result<Escrow, Text> {
        let caller = Principal.fromText("2vxsx-fae"); // This should be replaced with actual caller
        
        switch (escrows.get(escrowId)) {
            case (?escrow) {
                if (caller != escrow.buyer and caller != escrow.seller) {
                    return #err("Only buyer or seller can release escrow");
                };
                
                if (escrow.status != #Funded and escrow.status != #Active) {
                    return #err("Escrow is not in correct status for release");
                };
                
                // Check conditions
                let conditionsMet = switch (escrow.conditions) {
                    case (#Manual) {
                        escrow.buyerApproved and escrow.sellerApproved
                    };
                    case (#Timelock(_duration)) {
                        switch (escrow.timelockExpiry) {
                            case (?expiry) Time.now() >= expiry;
                            case null false;
                        }
                    };
                    case (#Milestone(_descriptions)) {
                        Array.foldLeft<Milestone, Bool>(escrow.milestones, true, func(acc, milestone) {
                            acc and milestone.completed
                        })
                    };
                    case (#Oracle(_oracleId)) {
                        // Oracle condition checking would be implemented here
                        true
                    };
                };
                
                if (not conditionsMet) {
                    return #err("Escrow conditions not met");
                };
                
                let updatedEscrow = {
                    escrow with
                    status = #Completed;
                    updatedAt = Time.now();
                };
                
                escrows.put(escrowId, updatedEscrow);
                
                // Record release transaction
                let transaction: Transaction = {
                    id = generateTransactionId();
                    escrowId = escrowId;
                    from = Principal.fromText("2vxsx-fae"); // Platform principal
                    to = escrow.seller;
                    amount = escrow.amount - escrow.feeAmount;
                    assetType = escrow.assetType;
                    transactionType = #Release;
                    timestamp = Time.now();
                    blockHeight = null;
                    status = #Confirmed;
                };
                
                transactions.put(transaction.id, transaction);
                
                // Update user profiles
                updateUserProfileInternal(escrow.buyer, func(profile) {
                    { profile with 
                        completedEscrows = profile.completedEscrows + 1;
                        totalVolume = profile.totalVolume + escrow.amount;
                    }
                });
                
                updateUserProfileInternal(escrow.seller, func(profile) {
                    { profile with 
                        completedEscrows = profile.completedEscrows + 1;
                        totalVolume = profile.totalVolume + escrow.amount;
                    }
                });
                
                #ok(updatedEscrow)
            };
            case null {
                #err("Escrow not found")
            };
        }
    };
    
    public func cancelEscrow(escrowId: EscrowId): async Result.Result<Escrow, Text> {
        let caller = Principal.fromText("2vxsx-fae"); // This should be replaced with actual caller
        
        switch (escrows.get(escrowId)) {
            case (?escrow) {
                if (caller != escrow.buyer and caller != escrow.seller) {
                    return #err("Only buyer or seller can cancel escrow");
                };
                
                if (escrow.status != #Created and escrow.status != #Funded) {
                    return #err("Cannot cancel escrow in current status");
                };
                
                let updatedEscrow = {
                    escrow with
                    status = #Cancelled;
                    updatedAt = Time.now();
                };
                
                escrows.put(escrowId, updatedEscrow);
                
                // If escrow was funded, create refund transaction
                if (escrow.status == #Funded) {
                    let transaction: Transaction = {
                        id = generateTransactionId();
                        escrowId = escrowId;
                        from = Principal.fromText("2vxsx-fae"); // Platform principal
                        to = escrow.buyer;
                        amount = escrow.amount;
                        assetType = escrow.assetType;
                        transactionType = #Refund;
                        timestamp = Time.now();
                        blockHeight = null;
                        status = #Confirmed;
                    };
                    
                    transactions.put(transaction.id, transaction);
                };
                
                #ok(updatedEscrow)
            };
            case null {
                #err("Escrow not found")
            };
        }
    };
    
    public func completeMilestone(escrowId: EscrowId, milestoneId: Text): async Result.Result<Escrow, Text> {
        let caller = Principal.fromText("2vxsx-fae"); // This should be replaced with actual caller
        
        switch (escrows.get(escrowId)) {
            case (?escrow) {
                if (caller != escrow.seller) {
                    return #err("Only seller can complete milestones");
                };
                
                let updatedMilestones = Array.map<Milestone, Milestone>(escrow.milestones, func(milestone) {
                    if (milestone.id == milestoneId) {
                        {
                            milestone with
                            completed = true;
                            completedAt = ?Time.now();
                            approvedBy = ?caller;
                        }
                    } else {
                        milestone
                    }
                });
                
                let updatedEscrow = {
                    escrow with
                    milestones = updatedMilestones;
                    updatedAt = Time.now();
                };
                
                escrows.put(escrowId, updatedEscrow);
                #ok(updatedEscrow)
            };
            case null {
                #err("Escrow not found")
            };
        }
    };
    
    // Dispute Management
    public func createDispute(escrowId: EscrowId, reason: Text): async Result.Result<Dispute, Text> {
        let caller = Principal.fromText("2vxsx-fae"); // This should be replaced with actual caller
        
        switch (escrows.get(escrowId)) {
            case (?escrow) {
                if (caller != escrow.buyer and caller != escrow.seller) {
                    return #err("Only buyer or seller can create dispute");
                };
                
                if (escrow.status != #Active and escrow.status != #Funded) {
                    return #err("Cannot create dispute for escrow in current status");
                };
                
                let disputeId = generateDisputeId();
                let dispute: Dispute = {
                    id = disputeId;
                    escrowId = escrowId;
                    initiator = caller;
                    reason = reason;
                    evidence = [];
                    status = #Open;
                    arbitrator = escrow.arbitrator;
                    createdAt = Time.now();
                    resolvedAt = null;
                    resolution = null;
                    ruling = null;
                };
                
                disputes.put(disputeId, dispute);
                
                // Update escrow status
                let updatedEscrow = {
                    escrow with
                    status = #Disputed;
                    disputeId = ?disputeId;
                    updatedAt = Time.now();
                };
                
                escrows.put(escrowId, updatedEscrow);
                
                #ok(dispute)
            };
            case null {
                #err("Escrow not found")
            };
        }
    };
    
    public func submitEvidence(disputeId: DisputeId, content: Text, fileHash: ?Text): async Result.Result<Dispute, Text> {
        let caller = Principal.fromText("2vxsx-fae"); // This should be replaced with actual caller
        
        switch (disputes.get(disputeId)) {
            case (?dispute) {
                switch (escrows.get(dispute.escrowId)) {
                    case (?escrow) {
                        let isAuthorizedUser = caller == escrow.buyer or caller == escrow.seller or 
                            (switch (escrow.arbitrator) { case (?arb) arb == caller; case null false });
                        
                        if (not isAuthorizedUser) {
                            return #err("Not authorized to submit evidence");
                        };
                        
                        let evidence: Evidence = {
                            id = generateTransactionId();
                            submittedBy = caller;
                            content = content;
                            fileHash = fileHash;
                            timestamp = Time.now();
                        };
                        
                        let updatedDispute = {
                            dispute with
                            evidence = Array.append(dispute.evidence, [evidence]);
                        };
                        
                        disputes.put(disputeId, updatedDispute);
                        #ok(updatedDispute)
                    };
                    case null {
                        #err("Associated escrow not found")
                    };
                }
            };
            case null {
                #err("Dispute not found")
            };
        }
    };
    
    public func resolveDispute(disputeId: DisputeId, winner: UserId, refundAmount: Nat64, penaltyAmount: Nat64, reasoning: Text): async Result.Result<Dispute, Text> {
        let caller = Principal.fromText("2vxsx-fae"); // This should be replaced with actual caller
        
        switch (disputes.get(disputeId)) {
            case (?dispute) {
                switch (escrows.get(dispute.escrowId)) {
                    case (?escrow) {
                        // Check if caller is authorized arbitrator
                        let isAuthorizedArbitrator = switch (escrow.arbitrator) {
                            case (?arb) arb == caller;
                            case null false;
                        };
                        
                        if (not isAuthorizedArbitrator and caller != platformAdmin) {
                            return #err("Not authorized to resolve dispute");
                        };
                        
                        let ruling: DisputeRuling = {
                            winner = winner;
                            refundAmount = refundAmount;
                            penaltyAmount = penaltyAmount;
                            reasoning = reasoning;
                        };
                        
                        let updatedDispute = {
                            dispute with
                            status = #Resolved;
                            resolvedAt = ?Time.now();
                            resolution = ?reasoning;
                            ruling = ?ruling;
                        };
                        
                        disputes.put(disputeId, updatedDispute);
                        
                        // Update escrow status
                        let updatedEscrow = {
                            escrow with
                            status = #Resolved;
                            updatedAt = Time.now();
                        };
                        
                        escrows.put(dispute.escrowId, updatedEscrow);
                        
                        // Create refund transaction if needed
                        if (refundAmount > 0) {
                            let transaction: Transaction = {
                                id = generateTransactionId();
                                escrowId = dispute.escrowId;
                                from = Principal.fromText("2vxsx-fae"); // Platform principal
                                to = winner;
                                amount = refundAmount;
                                assetType = escrow.assetType;
                                transactionType = #Refund;
                                timestamp = Time.now();
                                blockHeight = null;
                                status = #Confirmed;
                            };
                            
                            transactions.put(transaction.id, transaction);
                        };
                        
                        // Update user reputation
                        updateUserProfileInternal(winner, func(profile) {
                            { profile with 
                                disputesWon = profile.disputesWon + 1;
                                reputation = Float.min(profile.reputation + 5.0, 100.0);
                            }
                        });
                        
                        let loser = if (winner == escrow.buyer) escrow.seller else escrow.buyer;
                        updateUserProfileInternal(loser, func(profile) {
                            { profile with 
                                disputesLost = profile.disputesLost + 1;
                                reputation = Float.max(profile.reputation - 10.0, 0.0);
                            }
                        });
                        
                        #ok(updatedDispute)
                    };
                    case null {
                        #err("Associated escrow not found")
                    };
                }
            };
            case null {
                #err("Dispute not found")
            };
        }
    };
    
    // Query Functions
    public query func getEscrow(escrowId: EscrowId): async ?Escrow {
        escrows.get(escrowId)
    };
    
    public query func getUserEscrows(userId: UserId): async [Escrow] {
        let userEscrows = Buffer.Buffer<Escrow>(0);
        for ((_, escrow) in escrows.entries()) {
            if (escrow.buyer == userId or escrow.seller == userId) {
                userEscrows.add(escrow);
            };
        };
        Buffer.toArray(userEscrows)
    };
    
    public query func getDispute(disputeId: DisputeId): async ?Dispute {
        disputes.get(disputeId)
    };
    
    public query func getUserDisputes(userId: UserId): async [Dispute] {
        let userDisputes = Buffer.Buffer<Dispute>(0);
        for ((_, dispute) in disputes.entries()) {
            if (dispute.initiator == userId) {
                userDisputes.add(dispute);
            };
        };
        Buffer.toArray(userDisputes)
    };
    
    public query func getTransaction(transactionId: TransactionId): async ?Transaction {
        transactions.get(transactionId)
    };
    
    public query func getEscrowTransactions(escrowId: EscrowId): async [Transaction] {
        let escrowTransactions = Buffer.Buffer<Transaction>(0);
        for ((_, transaction) in transactions.entries()) {
            if (transaction.escrowId == escrowId) {
                escrowTransactions.add(transaction);
            };
        };
        Buffer.toArray(escrowTransactions)
    };
    
    public query func getPlatformStats(): async EscrowStats {
        var totalEscrows = 0;
        var activeEscrows = 0;
        var completedEscrows = 0;
        var totalVolume: Nat64 = 0;
        var totalFees: Nat64 = 0;
        
        for ((_, escrow) in escrows.entries()) {
            totalEscrows += 1;
            totalVolume += escrow.amount;
            totalFees += escrow.feeAmount;
            
            switch (escrow.status) {
                case (#Active or #Funded or #Disputed) {
                    activeEscrows += 1;
                };
                case (#Completed) {
                    completedEscrows += 1;
                };
                case (_) {};
            };
        };
        
        let averageEscrowValue: Nat64 = if (totalEscrows > 0) {
            totalVolume / Nat64.fromNat(totalEscrows)
        } else {
            0
        };
        
        {
            totalEscrows = totalEscrows;
            activeEscrows = activeEscrows;
            completedEscrows = completedEscrows;
            totalVolume = totalVolume;
            averageEscrowValue = averageEscrowValue;
            totalFees = totalFees;
        }
    };
    
    public query func getAllEscrows(): async [Escrow] {
        Iter.toArray(escrows.vals())
    };
    
    public query func getAllUsers(): async [UserProfile] {
        Iter.toArray(userProfiles.vals())
    };
    
    // Admin Functions
    public func setPlatformFeeRate(newRate: Float): async Result.Result<Float, Text> {
        let caller = Principal.fromText("2vxsx-fae"); // This should be replaced with actual caller
        
        if (caller != platformAdmin) {
            return #err("Only platform admin can set fee rate");
        };
        
        if (newRate < 0.0 or newRate > 0.1) {
            return #err("Fee rate must be between 0% and 10%");
        };
        
        platformFeeRate := newRate;
        #ok(newRate)
    };
    
    public func setArbitrationFeeRate(newRate: Float): async Result.Result<Float, Text> {
        let caller = Principal.fromText("2vxsx-fae"); // This should be replaced with actual caller
        
        if (caller != platformAdmin) {
            return #err("Only platform admin can set arbitration fee rate");
        };
        
        if (newRate < 0.0 or newRate > 0.05) {
            return #err("Arbitration fee rate must be between 0% and 5%");
        };
        
        arbitrationFeeRate := newRate;
        #ok(newRate)
    };
    
    public func promoteToArbitrator(userId: UserId): async Result.Result<UserProfile, Text> {
        let caller = Principal.fromText("2vxsx-fae"); // This should be replaced with actual caller
        
        if (caller != platformAdmin) {
            return #err("Only platform admin can promote to arbitrator");
        };
        
        switch (userProfiles.get(userId)) {
            case (?profile) {
                let updatedProfile = {
                    profile with
                    isArbitrator = true;
                };
                userProfiles.put(userId, updatedProfile);
                #ok(updatedProfile)
            };
            case null {
                #err("User profile not found")
            };
        }
    };
    
    public query func getPlatformFeeRate(): async Float {
        platformFeeRate
    };
    
    public query func getArbitrationFeeRate(): async Float {
        arbitrationFeeRate
    };
    
    // Health check
    public query func healthCheck(): async Text {
        "Lock3 Backend is running smoothly!"
    };
}