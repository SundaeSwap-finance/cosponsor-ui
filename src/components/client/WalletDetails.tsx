"use client";

import {
  useWalletLoadingState,
  useWalletObserver,
} from "@sundaeswap/wallet-lite";

export default function WalletDetails() {
  const { ready } = useWalletLoadingState();
  const { adaBalance } = useWalletObserver();

  if (!ready) {
    return null;
  }

  return <p>Your ADA Balance: {adaBalance.value.toString()}</p>;
}
