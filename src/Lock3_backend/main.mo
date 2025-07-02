import Principal "mo:base/Principal";
import Trie "mo:base/Trie";
import Nat "mo:base/Nat";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Error "mo:base/Error";
import Text "mo:base/Text";
import Buffer "mo:base/Buffer";
import Array "mo:base/Array";

actor Lock3Backend {

    // ==================================================================================================
    // === Types ===
    // ==================================================================================================

    public type EscrowStatus = {
        #pending;
        #funded;
        #in_dispute;
        #released;
        #cancelled;
    };

    public type Escrow = {
        id: Nat;
        buyer: Principal;
        seller: Principal;
        amount: Nat;
        status: EscrowStatus;
        created_at: Time.Time;
    };

    public type DisputeStatus = {
        #open;
        #resolved;
    };

    public type Dispute = {
        id: Nat;
        escrow_id: Nat;
        opened_by: Principal;
        reason: Text;
        status: DisputeStatus;
        created_at: Time.Time;
    };

    public type AppError = {
        #unauthorized;
        #not_found: Text;
        #invalid_state: Text;
        #bad_request: Text;
        #already_exists;
    };

    // ==================================================================================================
    // === State ===
    // ==================================================================================================

    stable var owner: Principal;
    stable var arbitrators: Trie.Trie<Principal, Bool>;
    stable var escrows: Trie.Trie<Nat, Escrow>;
    stable var disputes: Trie.Trie<Nat, Dispute>;
    stable var next_escrow_id: Nat;
    stable var next_dispute_id: Nat;

    // ==================================================================================================
    // === Initialization ===
    // ==================================================================================================

    public func init() {
        owner := msg.caller;
        arbitrators := Trie.empty<Principal, Bool>();
        arbitrators.put(msg.caller, true);
        escrows := Trie.empty<Nat, Escrow>();
        disputes := Trie.empty<Nat, Dispute>();
        next_escrow_id := 0;
        next_dispute_id := 0;
    };

    // ==================================================================================================
    // === Authorization Helpers ===
    // ==================================================================================================

    func is_owner(caller: Principal) : Bool {
        return caller == owner;
    };

    func is_arbitrator(caller: Principal) : Bool {
        return arbitrators.get(caller) != null;
    };

    // ==================================================================================================
    // === Arbitrator Management (Owner Only) ===
    // ==================================================================================================

    public shared(msg) func add_arbitrator(principal: Principal) : async Result.Result<Null, AppError> {
        if (not is_owner(msg.caller)) { return #err(#unauthorized); };
        arbitrators.put(principal, true);
        return #ok(null);
    };

    public shared(msg) func remove_arbitrator(principal: Principal) : async Result.Result<Null, AppError> {
        if (not is_owner(msg.caller)) { return #err(#unauthorized); };
        if (principal == owner) { return #err(#bad_request("Owner cannot be removed as an arbitrator.")); };
        arbitrators.delete(principal);
        return #ok(null);
    };

    public query func get_arbitrators() : async [Principal] {
        let buffer = Buffer.Buffer<Principal>(0);
        for ((k, _) in arbitrators.entries()) {
            Buffer.add(buffer, k);
        };
        return Buffer.toArray(buffer);
    };

    // ==================================================================================================
    // === Escrow Management ===
    // ==================================================================================================

    public shared(msg) func create_escrow(seller: Principal, amount: Nat) : async Result.Result<Escrow, AppError> {
        if (amount == 0) { return #err(#bad_request("Escrow amount cannot be zero.")); };

        let escrow: Escrow = {
            id = next_escrow_id;
            buyer = msg.caller;
            seller = seller;
            amount = amount;
            status = #pending;
            created_at = Time.now();
        };

        escrows.put(escrow.id, escrow);
        next_escrow_id += 1;

        return #ok(escrow);
    };

    public shared(msg) func fund_escrow(escrow_id: Nat) : async Result.Result<Escrow, AppError> {
        switch (escrows.get(escrow_id)) {
            case (null) { return #err(#not_found("Escrow not found.")); };
            case (?escrow) {
                if (escrow.buyer != msg.caller) { return #err(#unauthorized); };
                if (escrow.status != #pending) { return #err(#invalid_state("Escrow is not in a pending state.")); };

                let updated_escrow = { escrow with status = #funded };
                escrows.put(escrow_id, updated_escrow);
                return #ok(updated_escrow);
            };
        };
    };

    public shared(msg) func release_escrow(escrow_id: Nat) : async Result.Result<Escrow, AppError> {
        switch (escrows.get(escrow_id)) {
            case (null) { return #err(#not_found("Escrow not found.")); };
            case (?escrow) {
                if (escrow.buyer != msg.caller) { return #err(#unauthorized); };
                if (escrow.status != #funded) { return #err(#invalid_state("Escrow must be in funded state to be released.")); };

                let updated_escrow = { escrow with status = #released };
                escrows.put(escrow_id, updated_escrow);
                return #ok(updated_escrow);
            };
        };
    };

    public shared(msg) func cancel_escrow(escrow_id: Nat) : async Result.Result<Escrow, AppError> {
        switch (escrows.get(escrow_id)) {
            case (null) { return #err(#not_found("Escrow not found.")); };
            case (?escrow) {
                if (escrow.buyer != msg.caller and escrow.seller != msg.caller) { return #err(#unauthorized); };
                if (escrow.status != #pending and escrow.status != #funded) { return #err(#invalid_state("Escrow must be in pending or funded state to be cancelled.")); };

                let updated_escrow = { escrow with status = #cancelled };
                escrows.put(escrow_id, updated_escrow);
                return #ok(updated_escrow);
            };
        };
    };

    // ==================================================================================================
    // === Dispute Management ===
    // ==================================================================================================

    public shared(msg) func open_dispute(escrow_id: Nat, reason: Text) : async Result.Result<Dispute, AppError> {
        if (Text.size(reason) == 0) { return #err(#bad_request("A reason must be provided for the dispute.")); };

        switch (escrows.get(escrow_id)) {
            case (null) { return #err(#not_found("Escrow not found.")); };
            case (?escrow) {
                if (escrow.buyer != msg.caller and escrow.seller != msg.caller) { return #err(#unauthorized); };
                if (escrow.status != #funded) { return #err(#invalid_state("Disputes can only be opened for funded escrows.")); };

                let dispute: Dispute = {
                    id = next_dispute_id;
                    escrow_id = escrow_id;
                    opened_by = msg.caller;
                    reason = reason;
                    status = #open;
                    created_at = Time.now();
                };

                let updated_escrow = { escrow with status = #in_dispute };
                escrows.put(escrow_id, updated_escrow);

                disputes.put(dispute.id, dispute);
                next_dispute_id += 1;

                return #ok(dispute);
            };
        };
    };

    public shared(msg) func resolve_dispute(dispute_id: Nat, release_to_seller: Bool) : async Result.Result<Escrow, AppError> {
        if (not is_arbitrator(msg.caller)) { return #err(#unauthorized); };

        switch (disputes.get(dispute_id)) {
            case (null) { return #err(#not_found("Dispute not found.")); };
            case (?dispute) {
                if (dispute.status != #open) { return #err(#invalid_state("Dispute is already resolved.")); };

                switch (escrows.get(dispute.escrow_id)) {
                    case (null) { return #err(#not_found("FATAL: Escrow associated with dispute not found.")); };
                    case (?escrow) {
                        var final_status: EscrowStatus;
                        if (release_to_seller) {
                            final_status := #released;
                        } else {
                            final_status := #cancelled;
                        };

                        let updated_escrow = { escrow with status = final_status };
                        let updated_dispute = { dispute with status = #resolved };

                        escrows.put(escrow.id, updated_escrow);
                        disputes.put(dispute.id, updated_dispute);

                        return #ok(updated_escrow);
                    };
                };
            };
        };
    };

    // ==================================================================================================
    // === Data Queries ===
    // ==================================================================================================

    public query func get_escrow(id: Nat) : async Result.Result<Escrow, AppError> {
        switch (escrows.get(id)) {
            case (null) { return #err(#not_found("Escrow not found.")); };
            case (?escrow) { return #ok(escrow); };
        };
    };

    public query func get_dispute(id: Nat) : async Result.Result<Dispute, AppError> {
        switch (disputes.get(id)) {
            case (null) { return #err(#not_found("Dispute not found.")); };
            case (?dispute) { return #ok(dispute); };
        };
    };

    public query func get_user_escrows(principal: Principal) : async [Escrow] {
        let buffer = Buffer.Buffer<Escrow>(0);
        for ((_, escrow) in escrows.entries()) {
            if (escrow.buyer == principal or escrow.seller == principal) {
                Buffer.add(buffer, escrow);
            };
        };
        return Buffer.toArray(buffer);
    };

    public query func get_open_disputes() : async [Dispute] {
        let buffer = Buffer.Buffer<Dispute>(0);
        for ((_, dispute) in disputes.entries()) {
            if (dispute.status == #open) {
                Buffer.add(buffer, dispute);
            };
        };
        return Buffer.toArray(buffer);
    };

    public query func greet(name : Text) : async Text {
        return "Hello, " # name # "!";
    };
};
