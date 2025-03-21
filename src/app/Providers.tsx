"use client";
import dynamic from "next/dynamic";
const WalletObserverProvider = dynamic(() =>
  import("@sundaeswap/wallet-lite").then(({ WalletObserverProvider }) => ({
    default: WalletObserverProvider,
  })),
);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletObserverProvider
      options={{
        refreshInterval: 10_000,
      }}
    >
      {children}
    </WalletObserverProvider>
  );
}
