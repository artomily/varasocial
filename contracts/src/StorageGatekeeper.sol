// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title StorageGatekeeper
 * @notice On-chain gatekeeper that records and controls access to 0G Storage rootHashes,
 *         with an integrated Escrow + AI Validation subscription flow.
 *
 * Roles:
 *  - contractOwner : deployer; can rotate operator/treasury, set subscription price.
 *  - operator      : server hot wallet; calls setHashFor() and processValidation().
 *  - user          : any wallet; manages their own hash, access list, and subscription.
 *
 * Subscription flow:
 *  1. User calls requestSubscription() with exact ETH → funds locked (PENDING).
 *  2. Off-chain AI agent listens for SubscriptionRequested event, fetches data
 *     via getHash() → downloads from 0G Storage → validates.
 *  3. Operator calls processValidation(user, approved):
 *       true  → funds forwarded to treasury, status = COMPLETED.
 *       false → funds refunded to user,      status = REFUNDED.
 *  4. Safety hatch: if operator never responds within VALIDATION_TIMEOUT (24 h),
 *     user can self-refund via withdrawExpired().
 *
 * Ad placement flow:
 *  1. User uploads ad content to 0G Storage, gets a rootHash.
 *  2. User calls requestAdPlacement(adRootHash) with exact adPrice ETH → locked (PENDING).
 *  3. Off-chain AI agent listens for AdRequested, downloads ad content, validates
 *     for SARA / racist / harmful material.
 *  4. Operator calls processAdValidation(user, approved):
 *       true  → funds to treasury, status = COMPLETED (ad is shown).
 *       false → funds refunded, status = REFUNDED (ad rejected).
 *  5. Safety hatch: withdrawExpiredAd() after VALIDATION_TIMEOUT if no operator response.
 */
contract StorageGatekeeper {
    // -------------------------------------------------------------------------
    // Types
    // -------------------------------------------------------------------------

    enum RequestStatus { NONE, PENDING, COMPLETED, REFUNDED }

    struct SubscriptionRequest {
        uint256 amount;
        RequestStatus status;
        uint256 requestedAt; // block.timestamp when request was created
    }

    struct AdRequest {
        bytes32 adRootHash;  // rootHash of ad content stored on 0G Storage
        uint256 amount;
        RequestStatus status;
        uint256 requestedAt;
    }

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    /// @dev How long the operator has to validate before a user can self-refund.
    uint256 public constant VALIDATION_TIMEOUT = 24 hours;

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    /// @dev Contract owner — can rotate operator/treasury and set price. Not a data owner.
    address public contractOwner;

    /// @dev Server hot wallet — can write hashes and process validations.
    address public operator;

    /// @dev Company wallet/multisig that receives approved subscription payments.
    address public treasury;

    /// @dev Required payment for requestSubscription(). Configurable by contractOwner.
    uint256 public subscriptionPrice = 0.1 ether;

    /// @dev Required payment for requestAdPlacement(). Configurable by contractOwner.
    uint256 public adPrice = 0.01 ether;

    /// @dev user wallet => rootHash stored on 0G Storage
    mapping(address => bytes32) private _rootHashes;

    /// @dev user wallet => (reader wallet => allowed)
    mapping(address => mapping(address => bool)) private _readAccess;

    /// @dev user wallet => true once the user has claimed self-management.
    mapping(address => bool) private _selfManaged;

    /// @dev user wallet => latest subscription request
    mapping(address => SubscriptionRequest) public requests;

    /// @dev user wallet => latest ad placement request
    mapping(address => AdRequest) public adRequests;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event HashUpdated(address indexed user, bytes32 indexed newHash, uint256 updatedAt);
    event AccessGranted(address indexed user, address indexed reader);
    event AccessRevoked(address indexed user, address indexed reader);
    event OwnershipClaimed(address indexed user);
    event OperatorChanged(address indexed oldOperator, address indexed newOperator);
    event ContractOwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    /// @dev Emitted when a user locks ETH and requests AI validation.
    event SubscriptionRequested(address indexed user, uint256 amount);

    /// @dev Emitted when the operator approves or rejects a subscription.
    ///      approved=true → funds to treasury; approved=false → refund to user.
    event SubscriptionValidated(address indexed user, bool approved);

    /// @dev Emitted when a user self-refunds after the validation timeout.
    event SubscriptionExpiredWithdrawn(address indexed user, uint256 amount);

    event TreasuryChanged(address indexed oldTreasury, address indexed newTreasury);
    event SubscriptionPriceChanged(uint256 oldPrice, uint256 newPrice);
    event AdPriceChanged(uint256 oldPrice, uint256 newPrice);

    /// @dev Emitted when a user submits an ad and locks payment.
    event AdRequested(address indexed user, bytes32 indexed adRootHash, uint256 amount);

    /// @dev Emitted when the operator approves or rejects an ad after AI content check.
    ///      approved=true → funds to treasury + ad shown; approved=false → refund + ad rejected.
    event AdValidated(address indexed user, bool approved);

    /// @dev Emitted when a user self-refunds an ad payment after timeout.
    event AdExpiredWithdrawn(address indexed user, uint256 amount);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /**
     * @param _operator  The server hot wallet address (rotatable).
     * @param _treasury  The company wallet/multisig that receives approved payments.
     */
    constructor(address _operator, address _treasury) {
        require(_operator != address(0), "StorageGatekeeper: invalid operator");
        require(_treasury != address(0), "StorageGatekeeper: invalid treasury");
        contractOwner = msg.sender;
        operator = _operator;
        treasury = _treasury;
    }

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------

    modifier onlyContractOwner() {
        require(msg.sender == contractOwner, "StorageGatekeeper: not contract owner");
        _;
    }

    modifier onlyOperator() {
        require(msg.sender == operator, "StorageGatekeeper: not operator");
        _;
    }

    // -------------------------------------------------------------------------
    // Admin — contract owner only
    // -------------------------------------------------------------------------

    /**
     * @notice Replace the server hot wallet with a new address.
     */
    function setOperator(address newOperator) external onlyContractOwner {
        require(newOperator != address(0), "StorageGatekeeper: invalid operator");
        emit OperatorChanged(operator, newOperator);
        operator = newOperator;
    }

    /**
     * @notice Replace the treasury address (use a multisig in production).
     */
    function setTreasury(address newTreasury) external onlyContractOwner {
        require(newTreasury != address(0), "StorageGatekeeper: invalid treasury");
        emit TreasuryChanged(treasury, newTreasury);
        treasury = newTreasury;
    }

    /**
     * @notice Update the required subscription payment amount.
     */
    function setSubscriptionPrice(uint256 newPrice) external onlyContractOwner {
        require(newPrice > 0, "StorageGatekeeper: price must be > 0");
        emit SubscriptionPriceChanged(subscriptionPrice, newPrice);
        subscriptionPrice = newPrice;
    }

    /**
     * @notice Update the required ad placement payment amount.
     */
    function setAdPrice(uint256 newPrice) external onlyContractOwner {
        require(newPrice > 0, "StorageGatekeeper: ad price must be > 0");
        emit AdPriceChanged(adPrice, newPrice);
        adPrice = newPrice;
    }

    /**
     * @notice Transfer contract ownership (e.g. to a multisig after setup).
     */
    function transferContractOwnership(address newOwner) external onlyContractOwner {
        require(newOwner != address(0), "StorageGatekeeper: invalid owner");
        emit ContractOwnershipTransferred(contractOwner, newOwner);
        contractOwner = newOwner;
    }

    // -------------------------------------------------------------------------
    // Operator — server hot wallet
    // -------------------------------------------------------------------------

    /**
     * @notice Set or update the rootHash for a user, called by the server after
     *         batch-uploading the user's data to 0G Storage.
     * @dev    Reverts if the user has claimed self-management.
     */
    function setHashFor(address user, bytes32 rootHash) external onlyOperator {
        require(user != address(0), "StorageGatekeeper: invalid user address");
        require(rootHash != bytes32(0), "StorageGatekeeper: rootHash cannot be zero");
        require(!_selfManaged[user], "StorageGatekeeper: user is self-managed");
        _rootHashes[user] = rootHash;
        emit HashUpdated(user, rootHash, block.timestamp);
    }

    /**
     * @notice Called by the operator after the off-chain AI agent completes subscription validation.
     * @dev    Follows Checks-Effects-Interactions: status updated before ETH transfer.
     * @param user     The wallet whose subscription is being decided.
     * @param approved true → forward funds to treasury; false → refund user.
     */
    function processValidation(address user, bool approved) external onlyOperator {
        SubscriptionRequest storage req = requests[user];
        require(req.status == RequestStatus.PENDING, "StorageGatekeeper: no pending request");

        uint256 amount = req.amount;

        if (approved) {
            req.status = RequestStatus.COMPLETED; // effect before interaction
            req.amount = 0;
            (bool success, ) = treasury.call{value: amount}("");
            require(success, "StorageGatekeeper: treasury transfer failed");
        } else {
            req.status = RequestStatus.REFUNDED; // effect before interaction
            req.amount = 0;
            (bool success, ) = user.call{value: amount}("");
            require(success, "StorageGatekeeper: refund failed");
        }

        emit SubscriptionValidated(user, approved);
    }

    /**
     * @notice Called by the operator after off-chain AI content moderation of an ad.
     *         Checks for SARA / racist / harmful material.
     * @dev    Follows Checks-Effects-Interactions: status updated before ETH transfer.
     * @param user     The wallet whose ad is being decided.
     * @param approved true → ad is clean, forward funds to treasury; false → reject + refund.
     */
    function processAdValidation(address user, bool approved) external onlyOperator {
        AdRequest storage req = adRequests[user];
        require(req.status == RequestStatus.PENDING, "StorageGatekeeper: no pending ad request");

        uint256 amount = req.amount;

        if (approved) {
            req.status = RequestStatus.COMPLETED;
            req.amount = 0;
            (bool success, ) = treasury.call{value: amount}("");
            require(success, "StorageGatekeeper: treasury transfer failed");
        } else {
            req.status = RequestStatus.REFUNDED;
            req.amount = 0;
            (bool success, ) = user.call{value: amount}("");
            require(success, "StorageGatekeeper: ad refund failed");
        }

        emit AdValidated(user, approved);
    }

    // -------------------------------------------------------------------------
    // User — individual wallet holders
    // -------------------------------------------------------------------------

    /**
     * @notice Pay the subscription fee and request AI validation (Escrow).
     *         Funds are locked in the contract until processValidation() is called.
     * @dev    Must send exactly `subscriptionPrice` wei.
     */
    function requestSubscription() external payable {
        require(msg.value == subscriptionPrice, "StorageGatekeeper: incorrect payment amount");
        require(
            requests[msg.sender].status != RequestStatus.PENDING,
            "StorageGatekeeper: request already pending"
        );

        requests[msg.sender] = SubscriptionRequest({
            amount: msg.value,
            status: RequestStatus.PENDING,
            requestedAt: block.timestamp
        });

        emit SubscriptionRequested(msg.sender, msg.value);
    }

    /**
     * @notice Submit an ad for placement. Upload ad content to 0G Storage first,
     *         then pass the resulting rootHash. Payment is locked until AI validation.
     * @dev    Must send exactly `adPrice` wei. One pending ad per wallet at a time.
     * @param adRootHash rootHash of the ad content (image/video + caption) on 0G Storage.
     */
    function requestAdPlacement(bytes32 adRootHash) external payable {
        require(adRootHash != bytes32(0), "StorageGatekeeper: adRootHash cannot be zero");
        require(msg.value == adPrice, "StorageGatekeeper: incorrect ad payment amount");
        require(
            adRequests[msg.sender].status != RequestStatus.PENDING,
            "StorageGatekeeper: ad request already pending"
        );

        adRequests[msg.sender] = AdRequest({
            adRootHash: adRootHash,
            amount: msg.value,
            status: RequestStatus.PENDING,
            requestedAt: block.timestamp
        });

        emit AdRequested(msg.sender, adRootHash, msg.value);
    }

    /**
     * @notice Self-refund an ad payment if the operator has not responded within VALIDATION_TIMEOUT.
     */
    function withdrawExpiredAd() external {
        AdRequest storage req = adRequests[msg.sender];
        require(req.status == RequestStatus.PENDING, "StorageGatekeeper: no pending ad request");
        require(
            block.timestamp >= req.requestedAt + VALIDATION_TIMEOUT,
            "StorageGatekeeper: timeout not reached yet"
        );

        uint256 amount = req.amount;
        req.status = RequestStatus.REFUNDED;
        req.amount = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "StorageGatekeeper: ad withdrawal failed");

        emit AdExpiredWithdrawn(msg.sender, amount);
    }

    /**
     * @notice Self-refund if the operator has not responded within VALIDATION_TIMEOUT.
     *         Prevents funds being locked forever if the AI service goes offline.
     */
    function withdrawExpired() external {
        SubscriptionRequest storage req = requests[msg.sender];
        require(req.status == RequestStatus.PENDING, "StorageGatekeeper: no pending request");
        require(
            block.timestamp >= req.requestedAt + VALIDATION_TIMEOUT,
            "StorageGatekeeper: timeout not reached yet"
        );

        uint256 amount = req.amount;
        req.status = RequestStatus.REFUNDED; // effect before interaction
        req.amount = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "StorageGatekeeper: withdrawal failed");

        emit SubscriptionExpiredWithdrawn(msg.sender, amount);
    }

    /**
     * @notice Create or update the caller's own rootHash.
     */
    function setHash(bytes32 rootHash) external {
        require(rootHash != bytes32(0), "StorageGatekeeper: rootHash cannot be zero");
        _rootHashes[msg.sender] = rootHash;
        emit HashUpdated(msg.sender, rootHash, block.timestamp);
    }

    /**
     * @notice Permanently claim full self-management — blocks operator from
     *         calling setHashFor() on this wallet. Irreversible.
     */
    function claimOwnership() external {
        require(!_selfManaged[msg.sender], "StorageGatekeeper: already self-managed");
        _selfManaged[msg.sender] = true;
        emit OwnershipClaimed(msg.sender);
    }

    /**
     * @notice Grant read access to `reader` for the caller's data.
     */
    function grantAccess(address reader) external {
        require(reader != address(0), "StorageGatekeeper: invalid reader address");
        require(reader != msg.sender, "StorageGatekeeper: cannot grant access to yourself");
        _readAccess[msg.sender][reader] = true;
        emit AccessGranted(msg.sender, reader);
    }

    /**
     * @notice Revoke read access from `reader` for the caller's data.
     */
    function revokeAccess(address reader) external {
        require(reader != address(0), "StorageGatekeeper: invalid reader address");
        _readAccess[msg.sender][reader] = false;
        emit AccessRevoked(msg.sender, reader);
    }

    // -------------------------------------------------------------------------
    // Read (free — no gas when called via eth_call off-chain)
    // -------------------------------------------------------------------------

    /**
     * @notice Retrieve the rootHash for `user`.
     * @dev    Reverts if caller is neither the user nor a whitelisted reader.
     */
    function getHash(address user) external view returns (bytes32) {
        require(
            msg.sender == user || _readAccess[user][msg.sender],
            "StorageGatekeeper: access denied"
        );
        bytes32 hash = _rootHashes[user];
        require(hash != bytes32(0), "StorageGatekeeper: no data recorded for this user");
        return hash;
    }

    /**
     * @notice Check whether `user` has ever had a rootHash recorded.
     */
    function hasHash(address user) external view returns (bool) {
        return _rootHashes[user] != bytes32(0);
    }

    /**
     * @notice Check whether `reader` is authorised to call getHash(user).
     */
    function hasReadAccess(address user, address reader) external view returns (bool) {
        return user == reader || _readAccess[user][reader];
    }

    /**
     * @notice Check whether a user has claimed full self-management.
     */
    function isSelfManaged(address user) external view returns (bool) {
        return _selfManaged[user];
    }
}

