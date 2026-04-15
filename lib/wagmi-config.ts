import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, arbitrum, polygon, optimism, base } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

export const wagmiConfig = projectId
  ? getDefaultConfig({
      appName: "VaraSocial",
      projectId,
      chains: [mainnet, arbitrum, polygon, optimism, base],
      ssr: true,
    })
  : null;
