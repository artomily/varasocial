import { createConfig, http } from "wagmi";
import { mainnet, arbitrum, polygon, optimism, base } from "wagmi/chains";
import { defineChain } from "viem";

export const zeroGTestnet = defineChain({
  id: 16602,
  name: "0G Newton Testnet",
  nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://evmrpc-testnet.0g.ai"] },
  },
  blockExplorers: {
    default: { name: "0G Explorer", url: "https://chainscan-galileo.0g.ai" },
  },
});

export const wagmiConfig = createConfig({
  chains: [mainnet, arbitrum, polygon, optimism, base, zeroGTestnet],
  transports: {
    [zeroGTestnet.id]: http("https://evmrpc-testnet.0g.ai"),
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
  },
});
