import { createConfig, http } from "wagmi";
import { mainnet, arbitrum, polygon, optimism, base } from "wagmi/chains";
import { defineChain } from "viem";

export const zeroGGalileo = defineChain({
  id: 16602,
  name: "0G Galileo Testnet",
  nativeCurrency: { name: "OG", symbol: "OG", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://evmrpc-testnet.0g.ai"] },
  },
  blockExplorers: {
    default: {
      name: "0G Explorer",
      url: "https://chainscan-galileo.0g.ai",
    },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [zeroGGalileo, mainnet, arbitrum, polygon, optimism, base],
  transports: {
    [zeroGGalileo.id]: http("https://evmrpc-testnet.0g.ai"),
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
  },
});
