import { Button, Text } from "@sundaeswap/ui-toolkit";
import { RenderWalletState } from "@sundaeswap/wallet-lite";
import { FC } from "react";

export const App: FC = () => {
  return (
    <RenderWalletState
      render={({ connectWallet, activeWallet, disconnect }) => (
        <>
          {!activeWallet ? (
            <Button
              onClick={() => {
                connectWallet("eternl");
              }}
            >
              Connect Wallet
            </Button>
          ) : (
            <>
              <Text tag="p">{activeWallet}</Text>
              <Button
                onClick={() => {
                  disconnect();
                }}
              >
                Disconnect
              </Button>
            </>
          )}
        </>
      )}
    />
  );
};
