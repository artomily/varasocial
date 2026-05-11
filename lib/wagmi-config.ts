import { createConfig, http } from "wagmi";
import { mainnet, arbitrum, polygon, optimism, base } from "wagmi/chains";

export const wagmiConfig = createConfig({
  chains: [mainnet, arbitrum, polygon, optimism, base],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
  },
});
