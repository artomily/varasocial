#!/usr/bin/env bash
# ============================================================
# cast CLI test script — StorageGatekeeper
# Network : 0G Chain Testnet (Galileo) — Chain ID 16602
# Contract: 0x948F0ea80688E175d85D2B08418190AaB24db38d
# ============================================================

set -euo pipefail

CONTRACT="0x948F0ea80688E175d85D2B08418190AaB24db38d"
RPC="${OG_TESTNET_RPC_URL:-https://evmrpc-testnet.0g.ai}"
CHAIN="16602"

# --- ganti dengan wallet kamu ---
# Gunakan: export PRIVATE_KEY=0x...
USER_ADDR="${USER_ADDR:-0xYourUserWalletAddress}"
OPERATOR_ADDR="${OPERATOR_ADDR:-0xYourOperatorAddress}"
READER_ADDR="${READER_ADDR:-0xReaderAddress}"

echo "==========================================="
echo " StorageGatekeeper — cast test suite"
echo " RPC    : $RPC"
echo " Chain  : $CHAIN"
echo " Contract: $CONTRACT"
echo "==========================================="

# -------------------------------------------------------
# READ — tidak butuh gas / private key
# -------------------------------------------------------

echo ""
echo "--- [READ] State variables ---"

cast call "$CONTRACT" "contractOwner()(address)" \
  --rpc-url "$RPC" --chain "$CHAIN"

cast call "$CONTRACT" "operator()(address)" \
  --rpc-url "$RPC" --chain "$CHAIN"

cast call "$CONTRACT" "treasury()(address)" \
  --rpc-url "$RPC" --chain "$CHAIN"

cast call "$CONTRACT" "subscriptionPrice()(uint256)" \
  --rpc-url "$RPC" --chain "$CHAIN"

cast call "$CONTRACT" "adPrice()(uint256)" \
  --rpc-url "$RPC" --chain "$CHAIN"

# -------------------------------------------------------
# getHash(address user) → bytes32                [line 43-54 GATEKEEPER.md]
# msg.sender harus == user ATAU sudah di-grantAccess
# Gunakan --from user_addr agar bisa baca hash miliknya sendiri
# -------------------------------------------------------
echo ""
echo "--- [READ] getHash — ambil rootHash milik USER_ADDR ---"
echo "  (msg.sender = user, jadi akses diizinkan)"

cast call "$CONTRACT" "getHash(address)(bytes32)" "$USER_ADDR" \
  --from "$USER_ADDR" \
  --rpc-url "$RPC" --chain "$CHAIN"

# hasHash — cek apakah user sudah pernah sync
echo ""
echo "--- [READ] hasHash — cek keberadaan hash untuk USER_ADDR ---"

cast call "$CONTRACT" "hasHash(address)(bool)" "$USER_ADDR" \
  --rpc-url "$RPC" --chain "$CHAIN"

# Cek subscription request status
echo ""
echo "--- [READ] requests — status subscription USER_ADDR ---"

cast call "$CONTRACT" "requests(address)(uint256,uint8,uint256)" "$USER_ADDR" \
  --rpc-url "$RPC" --chain "$CHAIN"

# Cek ad request status
echo ""
echo "--- [READ] adRequests — status ad USER_ADDR ---"

cast call "$CONTRACT" "adRequests(address)(bytes32,uint256,uint8,uint256)" "$USER_ADDR" \
  --rpc-url "$RPC" --chain "$CHAIN"

# -------------------------------------------------------
# WRITE — butuh PRIVATE_KEY dan ETH/A0GI untuk gas
# Uncomment blok yang ingin diuji
# -------------------------------------------------------

# --- setHashFor (Operator) ---
# Contoh rootHash dummy (32 bytes)
# ROOT_HASH="0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
#
# echo ""
# echo "--- [WRITE] setHashFor — set hash untuk USER_ADDR (butuh operator key) ---"
# cast send "$CONTRACT" \
#   "setHashFor(address,bytes32)" "$USER_ADDR" "$ROOT_HASH" \
#   --private-key "$PRIVATE_KEY" \
#   --rpc-url "$RPC" --chain "$CHAIN"

# --- setHash (User self-manage) ---
# echo ""
# echo "--- [WRITE] setHash — user set hash sendiri ---"
# cast send "$CONTRACT" \
#   "setHash(bytes32)" "$ROOT_HASH" \
#   --private-key "$PRIVATE_KEY" \
#   --rpc-url "$RPC" --chain "$CHAIN"

# --- grantAccess (User) ---
# echo ""
# echo "--- [WRITE] grantAccess — beri akses read ke READER_ADDR ---"
# cast send "$CONTRACT" \
#   "grantAccess(address)" "$READER_ADDR" \
#   --private-key "$PRIVATE_KEY" \
#   --rpc-url "$RPC" --chain "$CHAIN"

# --- revokeAccess (User) ---
# echo ""
# echo "--- [WRITE] revokeAccess — cabut akses read dari READER_ADDR ---"
# cast send "$CONTRACT" \
#   "revokeAccess(address)" "$READER_ADDR" \
#   --private-key "$PRIVATE_KEY" \
#   --rpc-url "$RPC" --chain "$CHAIN"

# --- claimOwnership (User) ---
# echo ""
# echo "--- [WRITE] claimOwnership — switch ke self-managed mode ---"
# cast send "$CONTRACT" \
#   "claimOwnership()" \
#   --private-key "$PRIVATE_KEY" \
#   --rpc-url "$RPC" --chain "$CHAIN"

# --- requestSubscription (User, kirim A0GI) ---
# SUB_PRICE=$(cast call "$CONTRACT" "subscriptionPrice()(uint256)" --rpc-url "$RPC" --chain "$CHAIN")
# echo ""
# echo "--- [WRITE] requestSubscription — kirim $SUB_PRICE wei ---"
# cast send "$CONTRACT" \
#   "requestSubscription()" \
#   --value "$SUB_PRICE" \
#   --private-key "$PRIVATE_KEY" \
#   --rpc-url "$RPC" --chain "$CHAIN"

# --- processValidation — approve (Operator) ---
# echo ""
# echo "--- [WRITE] processValidation approve ---"
# cast send "$CONTRACT" \
#   "processValidation(address,bool)" "$USER_ADDR" true \
#   --private-key "$PRIVATE_KEY" \
#   --rpc-url "$RPC" --chain "$CHAIN"

# --- processValidation — reject (Operator) ---
# echo ""
# echo "--- [WRITE] processValidation reject ---"
# cast send "$CONTRACT" \
#   "processValidation(address,bool)" "$USER_ADDR" false \
#   --private-key "$PRIVATE_KEY" \
#   --rpc-url "$RPC" --chain "$CHAIN"

# --- requestAdPlacement (User) ---
# UUID '550e8400-e29b-41d4-a716-446655440000' → bytes32 (16 bytes UUID + 16 zero bytes)
# CAMPAIGN_ID="0x550e8400e29b41d4a716446655440000000000000000000000000000000000"
# AD_PRICE=$(cast call "$CONTRACT" "adPrice()(uint256)" --rpc-url "$RPC" --chain "$CHAIN")
# echo ""
# echo "--- [WRITE] requestAdPlacement --- "
# cast send "$CONTRACT" \
#   "requestAdPlacement(bytes32)" "$CAMPAIGN_ID" \
#   --value "$AD_PRICE" \
#   --private-key "$PRIVATE_KEY" \
#   --rpc-url "$RPC" --chain "$CHAIN"

# --- processAdValidation (Operator) ---
# echo ""
# echo "--- [WRITE] processAdValidation approve ---"
# cast send "$CONTRACT" \
#   "processAdValidation(address,bool)" "$USER_ADDR" true \
#   --private-key "$PRIVATE_KEY" \
#   --rpc-url "$RPC" --chain "$CHAIN"

# --- withdrawExpired (User, setelah 24h timeout) ---
# echo ""
# echo "--- [WRITE] withdrawExpired ---"
# cast send "$CONTRACT" \
#   "withdrawExpired()" \
#   --private-key "$PRIVATE_KEY" \
#   --rpc-url "$RPC" --chain "$CHAIN"

# --- withdrawExpiredAd (User, setelah 24h timeout) ---
# echo ""
# echo "--- [WRITE] withdrawExpiredAd ---"
# cast send "$CONTRACT" \
#   "withdrawExpiredAd()" \
#   --private-key "$PRIVATE_KEY" \
#   --rpc-url "$RPC" --chain "$CHAIN"

echo ""
echo "==========================================="
echo " Selesai."
echo "==========================================="
