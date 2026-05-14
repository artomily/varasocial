/**
 * Minimal ABI for StorageGatekeeper — only the events and functions
 * consumed by this validator service. Full ABI lives in contracts/src/.
 */
export const ABI = [
  // ── Events (listener) ───────────────────────────────────────
  "event AdRequested(address indexed user, bytes32 indexed campaignId, uint256 amount)",
  "event SubscriptionRequested(address indexed user, uint256 amount)",

  // ── Operator write functions ─────────────────────────────────
  "function processAdValidation(address user, bool approved) external",
  "function processValidation(address user, bool approved) external",
  "function setHashFor(address user, bytes32 rootHash) external",

  // ── Read functions (used by scheduler) ──────────────────────
  "function isSelfManaged(address user) external view returns (bool)",
];
