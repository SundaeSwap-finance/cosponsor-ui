"use client";

import { useWalletObserver } from "@sundaeswap/wallet-lite";

export default function WalletConnectButton() {
  const { connectWallet } = useWalletObserver();

  return (
    <button
      onClick={() => {
        connectWallet("eternl");
      }}
    >
      Connect Eternl
    </button>
  );
}
