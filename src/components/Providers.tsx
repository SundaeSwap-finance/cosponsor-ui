import { WalletObserverProvider } from '@sundaeswap/wallet-lite'
import { FC, PropsWithChildren } from 'react'

export const Providers: FC<PropsWithChildren> = ({ children }) => {
  return (
    <WalletObserverProvider
      options={{
        observerOptions: {
          persistence: true, // Enable auto-reconnect to previously connected wallet
        },
      }}
    >
      {children}
    </WalletObserverProvider>
  )
}
