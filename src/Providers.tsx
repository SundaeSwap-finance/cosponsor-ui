import { WalletObserverProvider } from "@sundaeswap/wallet-lite";
import { FC, PropsWithChildren } from "react";

export const Providers: FC<PropsWithChildren> = ({ children }) => {
  return <WalletObserverProvider>{children}</WalletObserverProvider>;
};
