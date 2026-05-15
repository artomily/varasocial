// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {StorageGatekeeper} from "../src/StorageGatekeeper.sol";

contract StorageGatekeeperTest is Test {
    StorageGatekeeper public gatekeeper;

    address internal deployer  = makeAddr("deployer");
    address internal serverOp  = makeAddr("serverOperator");
    address internal treasury  = makeAddr("treasury");
    address internal alice     = makeAddr("alice");
    address internal bob       = makeAddr("bob");
    address internal carol     = makeAddr("carol");

    bytes32 internal constant HASH_1 = keccak256("rootHash_v1");
    bytes32 internal constant HASH_2 = keccak256("rootHash_v2");
    bytes32 internal constant HASH_3 = keccak256("rootHash_v3");

    function setUp() public {
        vm.prank(deployer);
        gatekeeper = new StorageGatekeeper(serverOp, treasury);
    }

    // -------------------------------------------------------------------------
    // Constructor / initial state
    // -------------------------------------------------------------------------

    function test_initial_state() public view {
        assertEq(gatekeeper.contractOwner(), deployer);
        assertEq(gatekeeper.operator(), serverOp);
        assertEq(gatekeeper.treasury(), treasury);
        assertEq(gatekeeper.subscriptionPrice(), 0.1 ether);
    }

    // -------------------------------------------------------------------------
    // setOperator (admin)
    // -------------------------------------------------------------------------

    function test_setOperator_by_owner() public {
        address newOp = makeAddr("newOp");
        vm.prank(deployer);
        vm.expectEmit(true, true, false, false);
        emit StorageGatekeeper.OperatorChanged(serverOp, newOp);
        gatekeeper.setOperator(newOp);
        assertEq(gatekeeper.operator(), newOp);
    }

    function test_setOperator_reverts_for_non_owner() public {
        vm.prank(alice);
        vm.expectRevert("StorageGatekeeper: not contract owner");
        gatekeeper.setOperator(alice);
    }

    function test_setOperator_reverts_on_zero_address() public {
        vm.prank(deployer);
        vm.expectRevert("StorageGatekeeper: invalid operator");
        gatekeeper.setOperator(address(0));
    }

    // -------------------------------------------------------------------------
    // transferContractOwnership
    // -------------------------------------------------------------------------

    function test_transferContractOwnership() public {
        vm.prank(deployer);
        gatekeeper.transferContractOwnership(alice);
        assertEq(gatekeeper.contractOwner(), alice);
    }

    function test_transferContractOwnership_reverts_for_non_owner() public {
        vm.prank(alice);
        vm.expectRevert("StorageGatekeeper: not contract owner");
        gatekeeper.transferContractOwnership(alice);
    }

    // -------------------------------------------------------------------------
    // setHashFor (operator / server)
    // -------------------------------------------------------------------------

    function test_operator_can_set_hash_for_user() public {
        vm.prank(serverOp);
        vm.expectEmit(true, true, false, true);
        emit StorageGatekeeper.HashUpdated(alice, HASH_1, block.timestamp);
        gatekeeper.setHashFor(alice, HASH_1);

        assertTrue(gatekeeper.hasHash(alice));
    }

    function test_operator_can_update_hash_for_user() public {
        vm.startPrank(serverOp);
        gatekeeper.setHashFor(alice, HASH_1);
        gatekeeper.setHashFor(alice, HASH_2);
        vm.stopPrank();

        vm.prank(alice);
        assertEq(gatekeeper.getHash(alice), HASH_2);
    }

    function test_setHashFor_reverts_for_non_operator() public {
        vm.prank(alice);
        vm.expectRevert("StorageGatekeeper: not operator");
        gatekeeper.setHashFor(alice, HASH_1);
    }

    function test_setHashFor_reverts_on_zero_hash() public {
        vm.prank(serverOp);
        vm.expectRevert("StorageGatekeeper: rootHash cannot be zero");
        gatekeeper.setHashFor(alice, bytes32(0));
    }

    function test_setHashFor_reverts_on_zero_address() public {
        vm.prank(serverOp);
        vm.expectRevert("StorageGatekeeper: invalid user address");
        gatekeeper.setHashFor(address(0), HASH_1);
    }

    function test_setHashFor_reverts_for_self_managed_user() public {
        // Alice claims ownership first
        vm.prank(alice);
        gatekeeper.claimOwnership();

        // Operator can no longer update Alice's hash
        vm.prank(serverOp);
        vm.expectRevert("StorageGatekeeper: user is self-managed");
        gatekeeper.setHashFor(alice, HASH_1);
    }

    // -------------------------------------------------------------------------
    // setHash (user self-write)
    // -------------------------------------------------------------------------

    function test_user_can_set_own_hash() public {
        vm.prank(alice);
        gatekeeper.setHash(HASH_1);
        assertTrue(gatekeeper.hasHash(alice));
    }

    function test_user_can_update_own_hash_even_if_set_by_operator() public {
        vm.prank(serverOp);
        gatekeeper.setHashFor(alice, HASH_1);

        vm.prank(alice);
        gatekeeper.setHash(HASH_2);

        vm.prank(alice);
        assertEq(gatekeeper.getHash(alice), HASH_2);
    }

    function test_user_can_set_hash_after_claiming_ownership() public {
        vm.startPrank(alice);
        gatekeeper.claimOwnership();
        gatekeeper.setHash(HASH_3);
        assertEq(gatekeeper.getHash(alice), HASH_3);
        vm.stopPrank();
    }

    function test_setHash_reverts_on_zero_hash() public {
        vm.prank(alice);
        vm.expectRevert("StorageGatekeeper: rootHash cannot be zero");
        gatekeeper.setHash(bytes32(0));
    }

    // -------------------------------------------------------------------------
    // claimOwnership
    // -------------------------------------------------------------------------

    function test_claimOwnership_emits_event() public {
        vm.prank(alice);
        vm.expectEmit(true, false, false, false);
        emit StorageGatekeeper.OwnershipClaimed(alice);
        gatekeeper.claimOwnership();
    }

    function test_claimOwnership_sets_self_managed_flag() public {
        assertFalse(gatekeeper.isSelfManaged(alice));
        vm.prank(alice);
        gatekeeper.claimOwnership();
        assertTrue(gatekeeper.isSelfManaged(alice));
    }

    function test_claimOwnership_reverts_if_already_claimed() public {
        vm.startPrank(alice);
        gatekeeper.claimOwnership();
        vm.expectRevert("StorageGatekeeper: already self-managed");
        gatekeeper.claimOwnership();
        vm.stopPrank();
    }

    function test_claimOwnership_does_not_affect_other_users() public {
        vm.prank(alice);
        gatekeeper.claimOwnership();

        // Operator can still update Bob (who hasn't claimed)
        vm.prank(serverOp);
        gatekeeper.setHashFor(bob, HASH_1);
        assertTrue(gatekeeper.hasHash(bob));
    }

    // -------------------------------------------------------------------------
    // getHash — access control
    // -------------------------------------------------------------------------

    function test_getHash_owner_can_read_own_hash() public {
        vm.prank(serverOp);
        gatekeeper.setHashFor(alice, HASH_1);

        vm.prank(alice);
        assertEq(gatekeeper.getHash(alice), HASH_1);
    }

    function test_getHash_reverts_when_no_data() public {
        vm.prank(alice);
        vm.expectRevert("StorageGatekeeper: no data recorded for this user");
        gatekeeper.getHash(alice);
    }

    function test_getHash_reverts_for_unauthorized_reader() public {
        vm.prank(serverOp);
        gatekeeper.setHashFor(alice, HASH_1);

        vm.prank(bob);
        vm.expectRevert("StorageGatekeeper: access denied");
        gatekeeper.getHash(alice);
    }

    function test_getHash_allowed_after_grantAccess() public {
        vm.prank(serverOp);
        gatekeeper.setHashFor(alice, HASH_1);

        vm.prank(alice);
        gatekeeper.grantAccess(bob);

        vm.prank(bob);
        assertEq(gatekeeper.getHash(alice), HASH_1);
    }

    function test_getHash_denied_after_revokeAccess() public {
        vm.prank(serverOp);
        gatekeeper.setHashFor(alice, HASH_1);

        vm.startPrank(alice);
        gatekeeper.grantAccess(bob);
        gatekeeper.revokeAccess(bob);
        vm.stopPrank();

        vm.prank(bob);
        vm.expectRevert("StorageGatekeeper: access denied");
        gatekeeper.getHash(alice);
    }

    // -------------------------------------------------------------------------
    // grantAccess / revokeAccess
    // -------------------------------------------------------------------------

    function test_grantAccess_reverts_on_zero_address() public {
        vm.prank(alice);
        vm.expectRevert("StorageGatekeeper: invalid reader address");
        gatekeeper.grantAccess(address(0));
    }

    function test_grantAccess_reverts_on_self() public {
        vm.prank(alice);
        vm.expectRevert("StorageGatekeeper: cannot grant access to yourself");
        gatekeeper.grantAccess(alice);
    }

    function test_revokeAccess_reverts_on_zero_address() public {
        vm.prank(alice);
        vm.expectRevert("StorageGatekeeper: invalid reader address");
        gatekeeper.revokeAccess(address(0));
    }

    // -------------------------------------------------------------------------
    // Isolation & impersonation
    // -------------------------------------------------------------------------

    function test_wallets_are_isolated() public {
        vm.prank(serverOp);
        gatekeeper.setHashFor(alice, HASH_1);
        vm.prank(serverOp);
        gatekeeper.setHashFor(bob, HASH_2);

        vm.prank(alice);
        vm.expectRevert("StorageGatekeeper: access denied");
        gatekeeper.getHash(bob);

        vm.prank(bob);
        vm.expectRevert("StorageGatekeeper: access denied");
        gatekeeper.getHash(alice);
    }

    function test_carol_cannot_impersonate_grant_for_alice() public {
        vm.prank(serverOp);
        gatekeeper.setHashFor(alice, HASH_1);

        // Carol grants Bob access to Carol's own data slot.
        // This only affects Carol's mapping, NOT Alice's whitelist.
        vm.prank(carol);
        gatekeeper.grantAccess(bob);

        // Carol still cannot read Alice's data
        vm.prank(carol);
        vm.expectRevert("StorageGatekeeper: access denied");
        gatekeeper.getHash(alice);

        // Bob, even though whitelisted by Carol, also cannot read Alice's data
        vm.prank(bob);
        vm.expectRevert("StorageGatekeeper: access denied");
        gatekeeper.getHash(alice);
    }

    function test_grant_access_is_unidirectional() public {
        vm.prank(serverOp);
        gatekeeper.setHashFor(alice, HASH_1);
        vm.prank(serverOp);
        gatekeeper.setHashFor(bob, HASH_2);

        vm.prank(alice);
        gatekeeper.grantAccess(bob);

        // Bob can read Alice
        vm.prank(bob);
        assertEq(gatekeeper.getHash(alice), HASH_1);

        // Alice cannot read Bob
        vm.prank(alice);
        vm.expectRevert("StorageGatekeeper: access denied");
        gatekeeper.getHash(bob);
    }

    // =========================================================================
    // Escrow + Subscription
    // =========================================================================

    // -------------------------------------------------------------------------
    // Admin: setTreasury / setSubscriptionPrice
    // -------------------------------------------------------------------------

    function test_setTreasury_by_owner() public {
        address newTreasury = makeAddr("newTreasury");
        vm.prank(deployer);
        vm.expectEmit(true, true, false, false);
        emit StorageGatekeeper.TreasuryChanged(treasury, newTreasury);
        gatekeeper.setTreasury(newTreasury);
        assertEq(gatekeeper.treasury(), newTreasury);
    }

    function test_setTreasury_reverts_for_non_owner() public {
        vm.prank(alice);
        vm.expectRevert("StorageGatekeeper: not contract owner");
        gatekeeper.setTreasury(alice);
    }

    function test_setTreasury_reverts_on_zero_address() public {
        vm.prank(deployer);
        vm.expectRevert("StorageGatekeeper: invalid treasury");
        gatekeeper.setTreasury(address(0));
    }

    function test_setSubscriptionPrice_by_owner() public {
        vm.prank(deployer);
        vm.expectEmit(false, false, false, true);
        emit StorageGatekeeper.SubscriptionPriceChanged(0.1 ether, 0.05 ether);
        gatekeeper.setSubscriptionPrice(0.05 ether);
        assertEq(gatekeeper.subscriptionPrice(), 0.05 ether);
    }

    function test_setSubscriptionPrice_reverts_for_non_owner() public {
        vm.prank(alice);
        vm.expectRevert("StorageGatekeeper: not contract owner");
        gatekeeper.setSubscriptionPrice(1 ether);
    }

    function test_setSubscriptionPrice_reverts_on_zero() public {
        vm.prank(deployer);
        vm.expectRevert("StorageGatekeeper: price must be > 0");
        gatekeeper.setSubscriptionPrice(0);
    }

    // -------------------------------------------------------------------------
    // requestSubscription
    // -------------------------------------------------------------------------

    function test_requestSubscription_creates_pending_request() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        gatekeeper.requestSubscription{value: 0.1 ether}();

        (uint256 amount, StorageGatekeeper.RequestStatus status, ) = gatekeeper.requests(alice);
        assertEq(amount, 0.1 ether);
        assertEq(uint(status), uint(StorageGatekeeper.RequestStatus.PENDING));
        assertEq(address(gatekeeper).balance, 0.1 ether);
    }

    function test_requestSubscription_emits_event() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit StorageGatekeeper.SubscriptionRequested(alice, 0.1 ether);
        gatekeeper.requestSubscription{value: 0.1 ether}();
    }

    function test_requestSubscription_reverts_wrong_amount() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        vm.expectRevert("StorageGatekeeper: incorrect payment amount");
        gatekeeper.requestSubscription{value: 0.05 ether}();
    }

    function test_requestSubscription_reverts_if_already_pending() public {
        vm.deal(alice, 1 ether);
        vm.startPrank(alice);
        gatekeeper.requestSubscription{value: 0.1 ether}();
        vm.expectRevert("StorageGatekeeper: request already pending");
        gatekeeper.requestSubscription{value: 0.1 ether}();
        vm.stopPrank();
    }

    function test_requestSubscription_allowed_after_completed() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        gatekeeper.requestSubscription{value: 0.1 ether}();

        vm.prank(serverOp);
        gatekeeper.processValidation(alice, false); // refund → REFUNDED

        // Alice can submit a new request
        vm.prank(alice);
        gatekeeper.requestSubscription{value: 0.1 ether}();
        (, StorageGatekeeper.RequestStatus status, ) = gatekeeper.requests(alice);
        assertEq(uint(status), uint(StorageGatekeeper.RequestStatus.PENDING));
    }

    // -------------------------------------------------------------------------
    // processValidation
    // -------------------------------------------------------------------------

    function test_processValidation_approved_funds_go_to_treasury() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        gatekeeper.requestSubscription{value: 0.1 ether}();

        uint256 treasuryBefore = treasury.balance;

        vm.prank(serverOp);
        vm.expectEmit(true, false, false, true);
        emit StorageGatekeeper.SubscriptionValidated(alice, true);
        gatekeeper.processValidation(alice, true);

        assertEq(treasury.balance, treasuryBefore + 0.1 ether);
        assertEq(address(gatekeeper).balance, 0);

        (uint256 amount, StorageGatekeeper.RequestStatus status, ) = gatekeeper.requests(alice);
        assertEq(amount, 0);
        assertEq(uint(status), uint(StorageGatekeeper.RequestStatus.COMPLETED));
    }

    function test_processValidation_rejected_refunds_user() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        gatekeeper.requestSubscription{value: 0.1 ether}();

        uint256 aliceBefore = alice.balance;

        vm.prank(serverOp);
        vm.expectEmit(true, false, false, true);
        emit StorageGatekeeper.SubscriptionValidated(alice, false);
        gatekeeper.processValidation(alice, false);

        assertEq(alice.balance, aliceBefore + 0.1 ether);
        assertEq(address(gatekeeper).balance, 0);

        (, StorageGatekeeper.RequestStatus status, ) = gatekeeper.requests(alice);
        assertEq(uint(status), uint(StorageGatekeeper.RequestStatus.REFUNDED));
    }

    function test_processValidation_reverts_no_pending_request() public {
        vm.prank(serverOp);
        vm.expectRevert("StorageGatekeeper: no pending request");
        gatekeeper.processValidation(alice, true);
    }

    function test_processValidation_reverts_non_operator() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        gatekeeper.requestSubscription{value: 0.1 ether}();

        vm.prank(bob);
        vm.expectRevert("StorageGatekeeper: not operator");
        gatekeeper.processValidation(alice, true);
    }

    function test_processValidation_reverts_double_process() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        gatekeeper.requestSubscription{value: 0.1 ether}();

        vm.prank(serverOp);
        gatekeeper.processValidation(alice, true);

        // Cannot process the same request again
        vm.prank(serverOp);
        vm.expectRevert("StorageGatekeeper: no pending request");
        gatekeeper.processValidation(alice, true);
    }

    // -------------------------------------------------------------------------
    // withdrawExpired (timeout safety hatch)
    // -------------------------------------------------------------------------

    function test_withdrawExpired_after_24h() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        gatekeeper.requestSubscription{value: 0.1 ether}();

        uint256 aliceBefore = alice.balance;

        // Fast-forward past the 24h timeout
        vm.warp(block.timestamp + gatekeeper.VALIDATION_TIMEOUT() + 1);

        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit StorageGatekeeper.SubscriptionExpiredWithdrawn(alice, 0.1 ether);
        gatekeeper.withdrawExpired();

        assertEq(alice.balance, aliceBefore + 0.1 ether);
        assertEq(address(gatekeeper).balance, 0);

        (, StorageGatekeeper.RequestStatus status, ) = gatekeeper.requests(alice);
        assertEq(uint(status), uint(StorageGatekeeper.RequestStatus.REFUNDED));
    }

    function test_withdrawExpired_reverts_before_timeout() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        gatekeeper.requestSubscription{value: 0.1 ether}();

        // Only 12h elapsed — not enough
        vm.warp(block.timestamp + 12 hours);

        vm.prank(alice);
        vm.expectRevert("StorageGatekeeper: timeout not reached yet");
        gatekeeper.withdrawExpired();
    }

    function test_withdrawExpired_reverts_no_pending_request() public {
        vm.prank(alice);
        vm.expectRevert("StorageGatekeeper: no pending request");
        gatekeeper.withdrawExpired();
    }

    function test_withdrawExpired_reverts_if_already_processed() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        gatekeeper.requestSubscription{value: 0.1 ether}();

        vm.prank(serverOp);
        gatekeeper.processValidation(alice, true); // COMPLETED

        vm.warp(block.timestamp + gatekeeper.VALIDATION_TIMEOUT() + 1);

        vm.prank(alice);
        vm.expectRevert("StorageGatekeeper: no pending request");
        gatekeeper.withdrawExpired();
    }

    // -------------------------------------------------------------------------
    // Ad placement — setAdPrice
    // -------------------------------------------------------------------------

    function test_setAdPrice_by_owner() public {
        vm.prank(deployer);
        gatekeeper.setAdPrice(0.05 ether);
        assertEq(gatekeeper.adPrice(), 0.05 ether);
    }

    function test_setAdPrice_reverts_for_non_owner() public {
        vm.prank(alice);
        vm.expectRevert("StorageGatekeeper: not contract owner");
        gatekeeper.setAdPrice(0.05 ether);
    }

    function test_setAdPrice_reverts_on_zero() public {
        vm.prank(deployer);
        vm.expectRevert("StorageGatekeeper: ad price must be > 0");
        gatekeeper.setAdPrice(0);
    }

    // -------------------------------------------------------------------------
    // Ad placement — requestAdPlacement
    // -------------------------------------------------------------------------

    bytes32 internal constant AD_HASH = keccak256("ad_content_v1");

    function test_requestAdPlacement_success() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        vm.expectEmit(true, true, false, true);
        emit StorageGatekeeper.AdRequested(alice, AD_HASH, 0.01 ether);
        gatekeeper.requestAdPlacement{value: 0.01 ether}(AD_HASH);

        (bytes32 storedHash, uint256 amount, StorageGatekeeper.RequestStatus status,) = gatekeeper.adRequests(alice);
        assertEq(storedHash, AD_HASH);
        assertEq(amount, 0.01 ether);
        assertEq(uint8(status), 1); // PENDING
        assertEq(address(gatekeeper).balance, 0.01 ether);
    }

    function test_requestAdPlacement_reverts_wrong_amount() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        vm.expectRevert("StorageGatekeeper: incorrect ad payment amount");
        gatekeeper.requestAdPlacement{value: 0.005 ether}(AD_HASH);
    }

    function test_requestAdPlacement_reverts_zero_hash() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        vm.expectRevert("StorageGatekeeper: campaignId cannot be zero");
        gatekeeper.requestAdPlacement{value: 0.01 ether}(bytes32(0));
    }

    function test_requestAdPlacement_reverts_already_pending() public {
        vm.deal(alice, 1 ether);
        vm.startPrank(alice);
        gatekeeper.requestAdPlacement{value: 0.01 ether}(AD_HASH);
        vm.expectRevert("StorageGatekeeper: ad request already pending");
        gatekeeper.requestAdPlacement{value: 0.01 ether}(AD_HASH);
        vm.stopPrank();
    }

    // -------------------------------------------------------------------------
    // Ad placement — processAdValidation
    // -------------------------------------------------------------------------

    function test_processAdValidation_approve() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        gatekeeper.requestAdPlacement{value: 0.01 ether}(AD_HASH);

        uint256 treasuryBefore = treasury.balance;
        vm.prank(serverOp);
        vm.expectEmit(true, false, false, true);
        emit StorageGatekeeper.AdValidated(alice, true);
        gatekeeper.processAdValidation(alice, true);

        (, uint256 amount, StorageGatekeeper.RequestStatus status,) = gatekeeper.adRequests(alice);
        assertEq(amount, 0);
        assertEq(uint8(status), 2); // COMPLETED
        assertEq(treasury.balance, treasuryBefore + 0.01 ether);
    }

    function test_processAdValidation_reject() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        gatekeeper.requestAdPlacement{value: 0.01 ether}(AD_HASH);

        uint256 aliceBefore = alice.balance;
        vm.prank(serverOp);
        vm.expectEmit(true, false, false, true);
        emit StorageGatekeeper.AdValidated(alice, false);
        gatekeeper.processAdValidation(alice, false);

        (, uint256 amount, StorageGatekeeper.RequestStatus status,) = gatekeeper.adRequests(alice);
        assertEq(amount, 0);
        assertEq(uint8(status), 3); // REFUNDED
        assertEq(alice.balance, aliceBefore + 0.01 ether);
    }

    function test_processAdValidation_reverts_no_pending() public {
        vm.prank(serverOp);
        vm.expectRevert("StorageGatekeeper: no pending ad request");
        gatekeeper.processAdValidation(alice, true);
    }

    function test_processAdValidation_reverts_non_operator() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        gatekeeper.requestAdPlacement{value: 0.01 ether}(AD_HASH);

        vm.prank(bob);
        vm.expectRevert("StorageGatekeeper: not operator");
        gatekeeper.processAdValidation(alice, true);
    }

    function test_processAdValidation_reverts_double_process() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        gatekeeper.requestAdPlacement{value: 0.01 ether}(AD_HASH);

        vm.prank(serverOp);
        gatekeeper.processAdValidation(alice, true);

        vm.prank(serverOp);
        vm.expectRevert("StorageGatekeeper: no pending ad request");
        gatekeeper.processAdValidation(alice, true);
    }

    // -------------------------------------------------------------------------
    // Ad placement — withdrawExpiredAd
    // -------------------------------------------------------------------------

    function test_withdrawExpiredAd_after_24h() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        gatekeeper.requestAdPlacement{value: 0.01 ether}(AD_HASH);

        vm.warp(block.timestamp + gatekeeper.VALIDATION_TIMEOUT() + 1);

        uint256 aliceBefore = alice.balance;
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit StorageGatekeeper.AdExpiredWithdrawn(alice, 0.01 ether);
        gatekeeper.withdrawExpiredAd();

        assertEq(alice.balance, aliceBefore + 0.01 ether);
        (, uint256 amount, StorageGatekeeper.RequestStatus status,) = gatekeeper.adRequests(alice);
        assertEq(amount, 0);
        assertEq(uint8(status), 3); // REFUNDED
    }

    function test_withdrawExpiredAd_reverts_before_timeout() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        gatekeeper.requestAdPlacement{value: 0.01 ether}(AD_HASH);

        vm.prank(alice);
        vm.expectRevert("StorageGatekeeper: timeout not reached yet");
        gatekeeper.withdrawExpiredAd();
    }

    function test_withdrawExpiredAd_reverts_no_pending() public {
        vm.prank(alice);
        vm.expectRevert("StorageGatekeeper: no pending ad request");
        gatekeeper.withdrawExpiredAd();
    }

    function test_withdrawExpiredAd_reverts_if_already_processed() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        gatekeeper.requestAdPlacement{value: 0.01 ether}(AD_HASH);

        vm.prank(serverOp);
        gatekeeper.processAdValidation(alice, true); // COMPLETED

        vm.warp(block.timestamp + gatekeeper.VALIDATION_TIMEOUT() + 1);

        vm.prank(alice);
        vm.expectRevert("StorageGatekeeper: no pending ad request");
        gatekeeper.withdrawExpiredAd();
    }

    // -------------------------------------------------------------------------
    // Ad and subscription are independent per user
    // -------------------------------------------------------------------------

    function test_ad_and_subscription_independent() public {
        vm.deal(alice, 1 ether);

        vm.startPrank(alice);
        gatekeeper.requestSubscription{value: 0.1 ether}();
        gatekeeper.requestAdPlacement{value: 0.01 ether}(AD_HASH);
        vm.stopPrank();

        (uint256 subAmount, StorageGatekeeper.RequestStatus subStatus,) = gatekeeper.requests(alice);
        (, uint256 adAmount, StorageGatekeeper.RequestStatus adStatus,) = gatekeeper.adRequests(alice);

        assertEq(uint8(subStatus), 1); // PENDING
        assertEq(uint8(adStatus), 1);  // PENDING
        assertEq(subAmount, 0.1 ether);
        assertEq(adAmount, 0.01 ether);
    }
}
